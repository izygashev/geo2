/**
 * Report Processor — логика обработки отчёта.
 *
 * Выделена из report.worker.ts чтобы работать и в standalone worker,
 * и в inline worker внутри Next.js (через worker-manager.ts).
 */

import { Job } from "bullmq";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrapeSite } from "@/services/scraper";
import {
  generateKeywords,
  checkShareOfVoice,
  checkShareOfVoiceMultiLlm,
  generateRecommendations,
  type SovCheckResult,
} from "@/services/llm";
import { sendReportReadyEmail } from "@/lib/email";

// ─── Типы ────────────────────────────────────────────────
interface ReportJobData {
  reportId: string;
  projectId: string;
  projectUrl: string;
  userId: string;
  multiLlm?: boolean;
}

// ─── Progress helper ─────────────────────────────────────
interface ProgressData {
  percent: number;
  step: string;
}

async function progress(job: Job, data: ProgressData) {
  await job.updateProgress(data);
}

// ─── Prisma (ленивая инициализация — один инстанс) ──────
let prisma: PrismaClient;

function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// ─── Основная функция обработки ──────────────────────────
export async function processReport(job: Job<ReportJobData>): Promise<void> {
  const db = getPrisma();
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
    await progress(job, { percent: 5, step: "Подключаемся к сайту..." });
    console.log(`[Worker] ── Шаг 1/4: Парсинг сайта ──`);

    const siteData = await scrapeSite(projectUrl);

    console.log(`[Worker] ✅ Сайт спарсен`);
    await progress(job, { percent: 20, step: "Сайт просканирован. Анализируем контент..." });

    // ═══════════════════════════════════════════════════════
    // ШАГ 2: Генерация ключевых запросов (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 2/4: Генерация ключевых запросов ──`);
    await progress(job, { percent: 25, step: "Генерируем ключевые запросы..." });

    const keywords = await generateKeywords(siteData);

    console.log(
      `[Worker] ✅ Ключевые запросы: ${keywords.map((k) => `"${k.query}"`).join(", ")}`
    );
    await progress(job, { percent: 35, step: `Найдено ${keywords.length} ключевых запросов. Проверяем AI-видимость...` });

    // ═══════════════════════════════════════════════════════
    // ШАГ 3: Проверка Share of Voice (Perplexity Sonar)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 3/4: Проверка Share of Voice${multiLlm ? " (Multi-LLM)" : ""} ──`);

    // Проверяем, не отменён ли отчёт перед дорогими API-вызовами
    const checkBeforeSov = await db.report.findUnique({ where: { id: reportId }, select: { status: true } });
    if (!checkBeforeSov || checkBeforeSov.status === "FAILED") {
      console.log(`[Worker] 🛑 Отчёт ${reportId} отменён или удалён. Прерываю работу.`);
      return;
    }

    const sovResults: SovCheckResult[] = [];
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      console.log(`[Worker]    [${i + 1}/${keywords.length}] "${kw.query}"`);

      await progress(job, {
        percent: Math.round(35 + (40 / keywords.length) * i),
        step: `Проверяем запрос ${i + 1} из ${keywords.length}: «${kw.query}»`,
      });

      if (multiLlm) {
        const multiResults = await checkShareOfVoiceMultiLlm(kw.query, projectUrl);
        sovResults.push(...multiResults);
      } else {
        const result = await checkShareOfVoice(kw.query, projectUrl);
        sovResults.push(result);
      }

      // Пауза между запросами
      if (i < keywords.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const mentionedCount = sovResults.filter((r) => r.isMentioned).length;
    console.log(
      `[Worker] ✅ SoV: упомянут в ${mentionedCount}/${sovResults.length} запросах`
    );
    await progress(job, {
      percent: 75,
      step: `AI-видимость: ${mentionedCount} из ${sovResults.length}. Генерируем рекомендации...`,
    });

    // ═══════════════════════════════════════════════════════
    // ШАГ 4: Генерация рекомендаций и Score (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 4/4: Генерация рекомендаций ──`);

    // Проверяем ещё раз перед дорогим вызовом Claude
    const checkBeforeRec = await db.report.findUnique({ where: { id: reportId }, select: { status: true } });
    if (!checkBeforeRec || checkBeforeRec.status === "FAILED") {
      console.log(`[Worker] 🛑 Отчёт ${reportId} отменён или удалён. Прерываю работу.`);
      return;
    }

    const analysis = await generateRecommendations(siteData, sovResults);

    console.log(`[Worker] ✅ Score: ${analysis.overallScore}, рекомендаций: ${analysis.recommendations.length}`);
    await progress(job, { percent: 90, step: "Сохраняем результаты..." });

    // ═══════════════════════════════════════════════════════
    // ШАГ 5: Сохранение в БД (транзакция)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Сохранение в БД ──`);
    const REPORT_COST = 10;

    const existingReport = await db.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!existingReport) {
      console.error(`[Worker] ❌ Отчёт ${reportId} не найден в БД — пропускаем сохранение`);
      return;
    }

    if (existingReport.status === "FAILED") {
      console.log(`[Worker] ⚠️ Отчёт ${reportId} уже отменён пользователем — пропускаем сохранение`);
      return;
    }

    await db.$transaction(async (tx) => {
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
      const dominantCategory = categories.length > 0 ? categories[0] : null;

      await tx.report.update({
        where: { id: reportId },
        data: {
          status: "COMPLETED",
          overallScore: analysis.overallScore,
          siteTitle: siteData.title,
          siteDescription: siteData.description,
          siteH1: siteData.h1,
          hasLlmsTxt: siteData.hasLlmsTxt,
          schemaOrgTypes: siteData.schemaOrgTypes,
          contentLength: siteData.bodyText.length,
          scrapedBody: siteData.bodyText.slice(0, 100_000), // RAG-визуализация (до 100k символов)
          robotsTxtAiFriendly: siteData.robotsTxtAiFriendly,
          semanticHtmlValid: siteData.semanticHtmlValid,
          categorySearched: dominantCategory,
          sentiment: dominantSentiment,
          scoreSov: analysis.scoreBreakdown.sov,
          scoreSchema: analysis.scoreBreakdown.schema,
          scoreLlmsTxt: analysis.scoreBreakdown.llmsTxt,
          scoreContent: analysis.scoreBreakdown.content,
          scoreAuthority: analysis.scoreBreakdown.authority,
        },
      });

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

      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: REPORT_COST } },
      });
    });

    await progress(job, { percent: 100, step: "Отчёт готов!" });

    // ═══════════════════════════════════════════════════════
    // Email-уведомление
    // ═══════════════════════════════════════════════════════
    try {
      const userWithProject = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      const project = await db.project.findUnique({
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
      try {
        await db.report.updateMany({
          where: { id: reportId, status: "PROCESSING" },
          data: { status: "FAILED" },
        });
      } catch (dbError) {
        console.error(`[Worker] ❌ Не удалось обновить статус на FAILED:`, dbError);
      }

      try {
        const userForFail = await db.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        const projectForFail = await db.project.findUnique({
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
      console.log(`[Worker]    Статус остаётся PROCESSING — ждём retry`);
    }

    throw error;
  }
}
