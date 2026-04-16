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
  checkDigitalPr,
  generateLlmsTxt,
  LlmUsageAccumulator,
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
  reportCost: number;
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
  const { reportId, projectId, projectUrl, userId, multiLlm, reportCost } = job.data;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[Worker] 🚀 Начинаю обработку отчёта ${reportId}`);
  console.log(`[Worker]    URL: ${projectUrl}`);
  console.log(`[Worker]    User: ${userId}`);
  console.log(`${"═".repeat(60)}\n`);

  try {
    // ── LLM Usage Accumulator (unit economics) ──
    const usageAccumulator = new LlmUsageAccumulator();

    // ═══════════════════════════════════════════════════════
    // ШАГ 1: Парсинг сайта через Playwright
    // ═══════════════════════════════════════════════════════
    await progress(job, { percent: 5, step: "Подключаемся к сайту..." });
    console.log(`[Worker] ── Шаг 1/5: Парсинг сайта ──`);

    const siteData = await scrapeSite(projectUrl);

    console.log(`[Worker] ✅ Сайт спарсен`);
    await progress(job, { percent: 20, step: "Сайт просканирован. Анализируем контент..." });

    // ═══════════════════════════════════════════════════════
    // ШАГ 2: Генерация ключевых запросов (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 2/5: Генерация ключевых запросов ──`);
    await progress(job, { percent: 25, step: "Генерируем ключевые запросы..." });

    const keywords = await generateKeywords(siteData, usageAccumulator);

    console.log(
      `[Worker] ✅ Ключевые запросы: ${keywords.map((k) => `"${k.query}"`).join(", ")}`
    );
    await progress(job, { percent: 35, step: `Найдено ${keywords.length} ключевых запросов. Проверяем AI-видимость...` });

    // ═══════════════════════════════════════════════════════
    // ШАГ 3: Проверка Share of Voice (Perplexity Sonar)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 3/5: Проверка Share of Voice${multiLlm ? " (Multi-LLM)" : ""} ──`);

    // Проверяем, не отменён ли отчёт перед дорогими API-вызовами
    const checkBeforeSov = await db.report.findUnique({ where: { id: reportId }, select: { status: true } });
    if (!checkBeforeSov || checkBeforeSov.status === "FAILED") {
      console.log(`[Worker] 🛑 Отчёт ${reportId} отменён или удалён. Прерываю работу.`);
      return;
    }

    const SOV_BATCH_SIZE = 3;
    const sovResults: SovCheckResult[] = [];

    for (let batchStart = 0; batchStart < keywords.length; batchStart += SOV_BATCH_SIZE) {
      const batch = keywords.slice(batchStart, batchStart + SOV_BATCH_SIZE);

      // Логируем + обновляем прогресс для первого элемента батча
      batch.forEach((kw, j) => {
        const idx = batchStart + j;
        console.log(`[Worker]    [${idx + 1}/${keywords.length}] "${kw.query}"`);
      });

      await progress(job, {
        percent: Math.round(35 + (40 / keywords.length) * batchStart),
        step: `Проверяем запросы ${batchStart + 1}–${Math.min(batchStart + SOV_BATCH_SIZE, keywords.length)} из ${keywords.length}`,
      });

      const batchResults = await Promise.all(
        batch.map(async (kw) => {
          if (multiLlm) {
            return checkShareOfVoiceMultiLlm(kw.query, projectUrl, usageAccumulator);
          } else {
            const result = await checkShareOfVoice(kw.query, projectUrl, usageAccumulator);
            return [result];
          }
        })
      );

      for (const results of batchResults) {
        sovResults.push(...results);
      }

      // Пауза между батчами (не после последнего)
      if (batchStart + SOV_BATCH_SIZE < keywords.length) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    const mentionedCount = sovResults.filter((r) => r.isMentioned).length;
    console.log(
      `[Worker] ✅ SoV: упомянут в ${mentionedCount}/${sovResults.length} запросах`
    );
    await progress(job, {
      percent: 70,
      step: `AI-видимость: ${mentionedCount} из ${sovResults.length}. Проверяем Digital PR...`,
    });

    // ═══════════════════════════════════════════════════════
    // ШАГ 4 + 4.5: Digital PR + llms.txt (параллельно)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 4/5: Digital PR + llms.txt (параллельно) ──`);

    const brandName = siteData.title || new URL(projectUrl).hostname.replace("www.", "");

    const [digitalPrResults, generatedLlmsTxt] = await Promise.all([
      checkDigitalPr(projectUrl, brandName, usageAccumulator),
      generateLlmsTxt(siteData, sovResults, usageAccumulator),
    ]);

    const prMentioned = digitalPrResults.filter((m) => m.mentioned).length;
    console.log(`[Worker] ✅ Digital PR: ${prMentioned}/${digitalPrResults.length} площадок`);
    console.log(`[Worker] ✅ llms.txt сгенерирован (${generatedLlmsTxt.length} символов)`);
    await progress(job, {
      percent: 80,
      step: `Digital PR: ${prMentioned} площадок, llms.txt готов. Генерируем рекомендации...`,
    });

    // ═══════════════════════════════════════════════════════
    // ШАГ 5: Генерация рекомендаций и Score (Claude)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Шаг 5/5: Генерация рекомендаций ──`);

    // Проверяем ещё раз перед дорогим вызовом Claude
    const checkBeforeRec = await db.report.findUnique({ where: { id: reportId }, select: { status: true } });
    if (!checkBeforeRec || checkBeforeRec.status === "FAILED") {
      console.log(`[Worker] 🛑 Отчёт ${reportId} отменён или удалён. Прерываю работу.`);
      return;
    }

    const analysis = await generateRecommendations(siteData, sovResults, usageAccumulator);

    console.log(`[Worker] ✅ Score: ${analysis.overallScore}, рекомендаций: ${analysis.recommendations.length}`);
    await progress(job, { percent: 90, step: "Сохраняем результаты..." });

    // ═══════════════════════════════════════════════════════
    // ШАГ 6: Сохранение в БД (транзакция)
    // ═══════════════════════════════════════════════════════
    console.log(`[Worker] ── Сохранение в БД ──`);
    // Кредиты уже списаны оптимистично в /reports/start — здесь НЕ декрементируем.

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
          digitalPr: JSON.parse(JSON.stringify(digitalPrResults)),
          generatedLlmsTxt: generatedLlmsTxt,
          // ── Unit Economics ──
          tokensUsed: usageAccumulator.totalTokens,
          llmCost: usageAccumulator.toJSON().estimatedCostUsd,
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

      // Кредиты уже списаны оптимистично при постановке в очередь — здесь не трогаем.
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
    console.log(`[Worker]    llms.txt: ${generatedLlmsTxt.length} символов`);
    const usage = usageAccumulator.toJSON();
    console.log(`[Worker]    Токены: ${usage.totalTokens} (prompt: ${usage.promptTokens}, completion: ${usage.completionTokens})`);
    console.log(`[Worker]    LLM-стоимость: $${usage.estimatedCostUsd.toFixed(4)}`);
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
      // Refund: кредиты были списаны оптимистично при постановке в очередь.
      // Раз отчёт окончательно провалился — возвращаем их пользователю.
      try {
        await db.$transaction([
          db.report.updateMany({
            where: { id: reportId, status: "PROCESSING" },
            data: { status: "FAILED" },
          }),
          db.user.update({
            where: { id: userId },
            data: { credits: { increment: reportCost } },
          }),
        ]);
        console.log(`[Worker] 💰 Refunded ${reportCost} credits to user ${userId}`);
      } catch (dbError) {
        console.error(`[Worker] ❌ Не удалось обновить статус на FAILED / refund credits:`, dbError);
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
