/**
 * Worker Manager — автозапуск BullMQ-воркера внутри процесса Next.js.
 *
 * Вместо отдельного `npm run worker` воркер стартует лениво при первом
 * вызове `ensureWorkerRunning()` из API-роута /reports/start.
 *
 * Singleton: воркер создаётся один раз и переживает все запросы.
 * В dev-режиме используем globalThis, чтобы hot-reload не плодил
 * дублирующих воркеров.
 */

import { Worker, Job } from "bullmq";
import { redisConnection } from "@/lib/redis";
import { processReport } from "../workers/report.processor";

let workerInstance: Worker | null = null;

// В dev-режиме hot-reload пересоздаёт модули → храним в globalThis
const globalKey = Symbol.for("geo_worker_instance");
const g = globalThis as unknown as Record<symbol, Worker | null>;

/**
 * Гарантирует, что воркер запущен.
 * Если уже бежит — ничего не делает (идемпотентно).
 */
export function ensureWorkerRunning(): void {
  // Проверяем globalThis (dev hot-reload) и module scope
  if (g[globalKey]) {
    workerInstance = g[globalKey];
    return;
  }
  if (workerInstance) return;

  console.log("[WorkerManager] 🚀 Запускаю inline BullMQ worker...");

  const worker = new Worker(
    "report-generation",
    async (job: Job) => {
      return processReport(job);
    },
    {
      connection: redisConnection,
      concurrency: 1, // Один отчёт за раз (Playwright + API лимиты)
    }
  );

  worker.on("ready", () => {
    console.log("[WorkerManager] ⚡ Worker запущен и слушает очередь 'report-generation'");
  });

  worker.on("completed", (job) => {
    console.log(`[WorkerManager] ✅ Job ${job.id} завершён успешно`);
  });

  worker.on("failed", (job, err) => {
    console.log(`[WorkerManager] ❌ Job ${job?.id} упал: ${err.message}`);
    if (job) {
      console.log(`[WorkerManager]    Попытка ${job.attemptsMade} из ${job.opts.attempts}`);
    }
  });

  worker.on("error", (err) => {
    console.error("[WorkerManager] Ошибка worker:", err);
  });

  workerInstance = worker;
  g[globalKey] = worker;
}
