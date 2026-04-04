/**
 * Cron-скрипт: запускает отложенные отчёты для проектов с расписанием.
 *
 * Вызывать через cron каждый час:
 *   node --import tsx scripts/cron-scheduled-reports.ts
 *
 * Или через BullMQ repeatable job.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Queue } from "bullmq";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

const redisConnection = parseRedisUrl(
  process.env.REDIS_URL ?? "redis://localhost:6379"
);

const reportQueue = new Queue("report-generation", {
  connection: redisConnection,
});

async function main() {
  const now = new Date();
  console.log(`[Cron] 🕐 Проверяю проекты с расписанием... (${now.toISOString()})`);

  // Ищем проекты, у которых scheduleNextRun <= now
  const projects = await prisma.project.findMany({
    where: {
      scheduleFrequency: { not: null },
      scheduleNextRun: { lte: now },
    },
    include: {
      user: { select: { id: true, credits: true } },
    },
  });

  console.log(`[Cron] Найдено ${projects.length} проектов для повторного анализа`);

  for (const project of projects) {
    // Проверяем кредиты (нужно 10)
    if (project.user.credits < 10) {
      console.log(`[Cron] ⚠️ ${project.name}: недостаточно кредитов (${project.user.credits})`);
      continue;
    }

    // Создаём новый отчёт
    const report = await prisma.report.create({
      data: {
        projectId: project.id,
        status: "PROCESSING",
      },
    });

    // Добавляем задачу в очередь
    await reportQueue.add("generate-report", {
      reportId: report.id,
      projectId: project.id,
      projectUrl: project.url,
      userId: project.userId,
    });

    // Обновляем scheduleNextRun
    const nextInterval =
      project.scheduleFrequency === "weekly"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    await prisma.project.update({
      where: { id: project.id },
      data: {
        scheduleNextRun: new Date(now.getTime() + nextInterval),
      },
    });

    console.log(`[Cron] ✅ ${project.name}: отчёт ${report.id} создан и отправлен в очередь`);
  }

  console.log(`[Cron] ✅ Готово`);
}

main()
  .catch((err) => {
    console.error("[Cron] ❌ Ошибка:", err);
    process.exit(1);
  })
  .finally(async () => {
    await reportQueue.close();
    await prisma.$disconnect();
  });
