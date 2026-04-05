/**
 * BullMQ Worker — обработчик очереди "report-generation".
 *
 * Запуск: npm run worker
 * Это ОТДЕЛЬНЫЙ Node.js-процесс, работающий параллельно с Next.js сервером.
 *
 * Пайплайн:
 * 1. Playwright парсит сайт → SiteData
 * 2. Claude генерирует ключевые запросы
 * 3. Perplexity Sonar проверяет Share of Voice по каждому запросу
 * 4. Claude анализирует результаты → Score + Recommendations
 * 5. Prisma сохраняет всё в БД + списывает кредиты
 */

import "dotenv/config";
import { Worker, Job } from "bullmq";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrapeSite } from "../services/scraper.js";
import {
  generateKeywords,
  checkShareOfVoice,
  checkShareOfVoiceMultiLlm,
  generateRecommendations,
  type SovCheckResult,
} from "../services/llm.js";
import { sendReportReadyEmail } from "../lib/email.js";

// ─── Типы ────────────────────────────────────────────────
interface ReportJobData {
  reportId: string;
  projectId: string;
  projectUrl: string;
  userId: string;
  multiLlm?: boolean; // Multi-LLM режим (PRO/AGENCY)
}

// ─── Prisma (отдельный инстанс для Worker-процесса) ──────
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Redis connection config ─────────────────────────────
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}

const redisConnection = parseRedisUrl(
  process.env.REDIS_URL ?? "redis://localhost:6379"
);

// ─── Обработчик задачи ──────────────────────────────────
async function processReport(job: Job<ReportJobData>): Promise<void> {
  const { reportId, projectId, projectUrl, userId, multiLlm } = job.data;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[Worker] 🚀 Начинаю обработку отчёта ${reportId}`);
  console.log(`[Worker]    URL: ${projectUrl}`);
  console.log(`[Worker]    User: ${userId}`);
  console.log(`${"═".repeat(60)}\n`);

  try {
    // ═══════════════════════════════════════════════════════
    // ШАГ 1: Парсинг сайта через Playwright
    // ═══════════════════════════════════════════════════════
    await job.updateProgress(10);
    console.log(`[Worker] ── Шаг 1/4: Парсинг сайта ──`);

    const siteData = await scrapeSite(projectUrl);

    console.log(`[Worker] ✅ Сайт спарсен`);
    await job.updateProgress(25);

    // ═══════════════════════════════════════════════════════
    // ШАГ 2: Генерация ключевых запросов (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 2/4: Генерация ключевых запросов ──`);

    const keywords = await generateKeywords(siteData);

    console.log(
      `[Worker] ✅ Ключевые запросы: ${keywords.map((k) => `"${k.query}"`).join(", ")}`
    );
    await job.updateProgress(40);

    // ═══════════════════════════════════════════════════════
    // ШАГ 3: Проверка Share of Voice (Perplexity Sonar)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 3/4: Проверка Share of Voice${multiLlm ? " (Multi-LLM)" : ""} ──`);

    // Последовательно, чтобы не перегружать API
    const sovResults: SovCheckResult[] = [];
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      console.log(`[Worker]    [${i + 1}/${keywords.length}] "${kw.query}"`);

      if (multiLlm) {
        // Multi-LLM: проверяем через 3 модели
        const multiResults = await checkShareOfVoiceMultiLlm(kw.query, projectUrl);
        sovResults.push(...multiResults);
      } else {
        const result = await checkShareOfVoice(kw.query, projectUrl);
        sovResults.push(result);
      }

      // Прогресс: 40% → 70% распределяем по ключевым запросам
      const progressPerKeyword = 30 / keywords.length;
      await job.updateProgress(Math.round(40 + progressPerKeyword * (i + 1)));

      // Пауза между запросами, чтобы не триггерить rate limit
      if (i < keywords.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const mentionedCount = sovResults.filter((r) => r.isMentioned).length;
    console.log(
      `[Worker] ✅ SoV: упомянут в ${mentionedCount}/${sovResults.length} запросах`
    );
    await job.updateProgress(75);

    // ═══════════════════════════════════════════════════════
    // ШАГ 4: Генерация рекомендаций и Score (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 4/4: Генерация рекомендаций ──`);

    const analysis = await generateRecommendations(siteData, sovResults);

    console.log(`[Worker] ✅ Score: ${analysis.overallScore}, рекомендаций: ${analysis.recommendations.length}`);
    await job.updateProgress(90);

    // ═══════════════════════════════════════════════════════
    // ШАГ 5: Сохранение в БД (транзакция)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Сохранение в БД ──`);
    const REPORT_COST = 10;

    // Проверяем, что отчёт ещё существует в БД
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!existingReport) {
      console.error(`[Worker] ❌ Отчёт ${reportId} не найден в БД — пропускаем сохранение`);
      return; // Job считается завершённым, но данные не сохраняются
    }

    // Если пользователь отменил отчёт — не перезаписываем статус
    if (existingReport.status === "FAILED") {
      console.log(`[Worker] ⚠️ Отчёт ${reportId} уже отменён пользователем — пропускаем сохранение`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Собираем доминирующие sentiment и category из SoV
      const sentiments = sovResults
        .map((r) => r.sentiment)
        .filter((s): s is "positive" | "neutral" | "negative" => !!s);
      const dominantSentiment = sentiments.length > 0
        ? sentiments.sort((a, b) =>
            sentiments.filter(v => v === b).length - sentiments.filter(v => v === a).length
          )[0]
        : null;

      const categories = sovResults
        .map((r) => r.categorySearched)
        .filter((c): c is string => !!c);
      const dominantCategory = categories.length > 0
        ? categories[0] // Первая определённая категория
        : null;

      // Обновляем статус отчёта, score и метаданные сайта
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: "COMPLETED",
          overallScore: analysis.overallScore,
          // Site metadata
          siteTitle: siteData.title,
          siteDescription: siteData.description,
          siteH1: siteData.h1,
          hasLlmsTxt: siteData.hasLlmsTxt,
          schemaOrgTypes: siteData.schemaOrgTypes,
          contentLength: siteData.bodyText.length,
          // Новые технические проверки
          robotsTxtAiFriendly: siteData.robotsTxtAiFriendly,
          semanticHtmlValid: siteData.semanticHtmlValid,
          // Category & Sentiment
          categorySearched: dominantCategory,
          sentiment: dominantSentiment,
          // Score breakdown
          scoreSov: analysis.scoreBreakdown.sov,
          scoreSchema: analysis.scoreBreakdown.schema,
          scoreLlmsTxt: analysis.scoreBreakdown.llmsTxt,
          scoreContent: analysis.scoreBreakdown.content,
          scoreAuthority: analysis.scoreBreakdown.authority,
        },
      });

      // Сохраняем Share of Voice записи
      if (sovResults.length > 0) {
        await tx.shareOfVoice.createMany({
          data: sovResults.map((sov) => ({
            reportId,
            llmProvider: sov.llmProvider,
            keyword: sov.keyword,
            isMentioned: sov.isMentioned,
            mentionContext: sov.mentionContext || "",
            competitors: sov.competitors,
            sentiment: sov.sentiment ?? null,
            categorySearched: sov.categorySearched ?? null,
          })),
        });
      }

      // Сохраняем рекомендации
      if (analysis.recommendations.length > 0) {
        await tx.recommendation.createMany({
          data: analysis.recommendations.map((rec) => ({
            reportId,
            type: rec.type,
            title: rec.title,
            description: rec.description,
            generatedCode: rec.generatedCode,
          })),
        });
      }

      // Списываем кредиты
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: REPORT_COST },
        },
      });
    });

    await job.updateProgress(100);

    // ═══════════════════════════════════════════════════════
    // Email-уведомление
    // ═══════════════════════════════════════════════════════
    try {
      const userWithProject = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      if (userWithProject?.email) {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        await sendReportReadyEmail({
          to: userWithProject.email,
          userName: userWithProject.name ?? "Пользователь",
          projectName: project?.name ?? projectUrl,
          reportUrl: `${baseUrl}/dashboard/reports/${reportId}`,
          score: analysis.overallScore,
          status: "COMPLETED",
        });
      }
    } catch (emailErr) {
      console.error("[Worker] ⚠️ Не удалось отправить email:", emailErr);
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log(`[Worker] ✅ Отчёт ${reportId} ЗАВЕРШЁН`);
    console.log(`[Worker]    Score: ${analysis.overallScore}`);
    console.log(`[Worker]    SoV: ${mentionedCount}/${sovResults.length}`);
    console.log(`[Worker]    Рекомендаций: ${analysis.recommendations.length}`);
    console.log(`${"─".repeat(60)}\n`);
  } catch (error) {
    console.error(`[Worker] ❌ Ошибка обработки отчёта ${reportId}:`, error);

    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalAttempt = job.attemptsMade >= maxAttempts - 1;

    console.log(
      `[Worker]    Попытка ${job.attemptsMade + 1} из ${maxAttempts}` +
        (isFinalAttempt ? " (финальная)" : " — будет retry")
    );

    if (isFinalAttempt) {
      // Финальная попытка — ставим FAILED и шлём email
      // Но только если пользователь не отменил вручную
      try {
        await prisma.report.updateMany({
          where: { id: reportId, status: "PROCESSING" },
          data: { status: "FAILED" },
        });
      } catch (dbError) {
        console.error(`[Worker] ❌ Не удалось обновить статус на FAILED:`, dbError);
      }

      // Email-уведомление об ошибке
      try {
        const userForFail = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        const projectForFail = await prisma.project.findUnique({
          where: { id: projectId },
          select: { name: true },
        });
        if (userForFail?.email) {
          const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
          await sendReportReadyEmail({
            to: userForFail.email,
            userName: userForFail.name ?? "Пользователь",
            projectName: projectForFail?.name ?? projectUrl,
            reportUrl: `${baseUrl}/dashboard/reports/${reportId}`,
            score: null,
            status: "FAILED",
          });
        }
      } catch (emailErr) {
        console.error("[Worker] ⚠️ Не удалось отправить fail-email:", emailErr);
      }
    } else {
      // Не финальная попытка — оставляем PROCESSING, BullMQ сделает retry
      console.log(`[Worker]    Статус остаётся PROCESSING — ждём retry`);
    }

    throw error; // Пробрасываем, чтобы BullMQ сделал retry (или зафиксировал failed)
  }
}

// ─── Создание Worker ─────────────────────────────────────
const worker = new Worker<ReportJobData>(
  "report-generation",
  processReport,
  {
    connection: redisConnection,
    concurrency: 1, // Один отчёт за раз (Playwright + API лимиты)
  }
);

// ─── События ─────────────────────────────────────────────
worker.on("ready", () => {
  console.log("[Worker] ⚡ Worker запущен и слушает очередь 'report-generation'");
});

worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Job ${job.id} завершён успешно`);
});

worker.on("failed", (job, err) => {
  console.log(`[Worker] ❌ Job ${job?.id} упал: ${err.message}`);
  if (job) {
    console.log(`[Worker]    Попытка ${job.attemptsMade} из ${job.opts.attempts}`);
  }
});

worker.on("error", (err) => {
  console.error("[Worker] Ошибка worker:", err);
});

// ─── Graceful Shutdown ───────────────────────────────────
async function shutdown() {
  console.log("\n[Worker] 🛑 Получен сигнал завершения. Останавливаюсь...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[Worker] 🏁 Инициализация завершена");
