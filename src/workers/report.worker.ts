/**
 * BullMQ Worker — standalone-режим для запуска отдельным процессом.
 *
 * Запуск: npm run worker
 *
 * В production можно запускать как отдельный процесс.
 * В dev-режиме воркер стартует автоматически внутри Next.js (worker-manager.ts),
 * но standalone тоже работает — BullMQ корректно балансирует между воркерами.
 */

import "dotenv/config";
import { Worker } from "bullmq";
import { processReport } from "./report.processor";
import { sendTelegramAlert, formatJobFailedAlert, formatJobStalledAlert } from "../lib/telegram";

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

// ─── Создание Worker ─────────────────────────────────────
const worker = new Worker(
  "report-generation",
  processReport,
  {
    connection: redisConnection,
    concurrency: 1,
    lockDuration: 600_000,    // 10 min — reports take 2-5 min, must not expire mid-job
    stalledInterval: 120_000, // Check for stalled jobs every 2 min
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
  sendTelegramAlert(
    formatJobFailedAlert(job?.id, job?.name, err, job?.attemptsMade, job?.opts.attempts)
  );
});

worker.on("stalled", (jobId) => {
  console.warn(`[Worker] ⚠️ Job ${jobId} завис (stalled)`);
  sendTelegramAlert(formatJobStalledAlert(jobId));
});

worker.on("error", (err) => {
  console.error("[Worker] Ошибка worker:", err);
});

// ─── Graceful Shutdown ───────────────────────────────────
async function shutdown() {
  console.log("\n[Worker] 🛑 Получен сигнал завершения. Останавливаюсь...");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[Worker] 🏁 Инициализация завершена (standalone)");
