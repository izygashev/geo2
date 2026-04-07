/**
 * Cron-скрипт: запускает отложенные отчёты для проектов с расписанием.
 *
 * Вызывать через системный cron каждый час:
 *   node --import tsx scripts/cron-scheduled-reports.ts
 *
 * Логика:
 *  1. Находит проекты, у которых scheduleNextRun <= now.
 *  2. Для каждого проверяет кредиты пользователя и лимиты плана.
 *  3. Если кредитов недостаточно — отключает расписание (scheduleNextRun = null),
 *     чтобы предотвратить «infinite debt» loop.
 *  4. Если всё ОК — создаёт Report, кладёт задачу в BullMQ, сдвигает nextRun.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Queue } from "bullmq";

// ─── Plan limits (inline — скрипт запускается вне Next.js) ───
interface PlanLimits {
  reportCost: number;
  multiLlm: boolean;
  maxScheduledProjects: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE:   { reportCost: 10, multiLlm: false, maxScheduledProjects: 0 },
  PRO:    { reportCost: 10, multiLlm: true,  maxScheduledProjects: 5 },
  AGENCY: { reportCost: 10, multiLlm: true,  maxScheduledProjects: 100 },
};

function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

// ─── Prisma ──────────────────────────────────────────────
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── BullMQ ──────────────────────────────────────────────
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

// ─── Основная логика ─────────────────────────────────────
async function main() {
  const now = new Date();
  console.log(`[Cron] 🕐 Проверяю проекты с расписанием... (${now.toISOString()})`);

  // 1. Находим проекты, у которых scheduleNextRun <= now
  const projects = await prisma.project.findMany({
    where: {
      scheduleFrequency: { not: null },
      scheduleNextRun: { lte: now },
    },
    include: {
      user: {
        select: {
          id: true,
          credits: true,
          plan: true,
          deletedAt: true,
        },
      },
    },
  });

  console.log(`[Cron] Найдено ${projects.length} проектов для повторного анализа`);

  let queued = 0;
  let skipped = 0;

  for (const project of projects) {
    const { user } = project;
    const limits = getPlanLimits(user.plan);

    // ── Soft-deleted user → отключаем расписание ──
    if (user.deletedAt) {
      console.log(`[Cron] 🗑️  ${project.name}: пользователь удалён — отключаю расписание`);
      await prisma.project.update({
        where: { id: project.id },
        data: { scheduleNextRun: null, scheduleFrequency: null },
      });
      skipped++;
      continue;
    }

    // ── Плану не положено расписание → отключаем ──
    if (limits.maxScheduledProjects === 0) {
      console.log(`[Cron] ⛔ ${project.name}: план ${user.plan} не поддерживает расписание — отключаю`);
      await prisma.project.update({
        where: { id: project.id },
        data: { scheduleNextRun: null, scheduleFrequency: null },
      });
      skipped++;
      continue;
    }

    // ── CRITICAL: проверка кредитов ──
    if (user.credits < limits.reportCost) {
      console.log(
        `[Cron] ⚠️  ${project.name}: недостаточно кредитов ` +
        `(${user.credits} < ${limits.reportCost}) — отключаю расписание`
      );
      // Обнуляем scheduleNextRun, чтобы предотвратить infinite debt loop.
      // Пользователь сможет вручную переключить расписание после пополнения.
      await prisma.project.update({
        where: { id: project.id },
        data: { scheduleNextRun: null },
      });
      skipped++;
      continue;
    }

    // ── Создаём отчёт ──
    const report = await prisma.report.create({
      data: {
        projectId: project.id,
        status: "PROCESSING",
      },
    });

    // ── Добавляем задачу в BullMQ ──
    await reportQueue.add(
      "generate-report",
      {
        reportId: report.id,
        projectId: project.id,
        projectUrl: project.url,
        userId: user.id,
        multiLlm: limits.multiLlm,
      },
      { jobId: report.id },
    );

    // ── Сдвигаем scheduleNextRun ──
    const nextMs =
      project.scheduleFrequency === "weekly"
        ? 7 * 24 * 60 * 60 * 1000   // 7 дней
        : 30 * 24 * 60 * 60 * 1000; // 30 дней

    await prisma.project.update({
      where: { id: project.id },
      data: {
        scheduleNextRun: new Date(now.getTime() + nextMs),
      },
    });

    console.log(
      `[Cron] ✅ ${project.name}: отчёт ${report.id} → очередь ` +
      `(multiLlm=${limits.multiLlm}, next=${new Date(now.getTime() + nextMs).toISOString()})`
    );
    queued++;
  }

  console.log(`[Cron] ✅ Готово: ${queued} в очередь, ${skipped} пропущено`);
}

// ─── Entry point ─────────────────────────────────────────
main()
  .catch((err) => {
    console.error("[Cron] ❌ Ошибка:", err);
    process.exit(1);
  })
  .finally(async () => {
    await reportQueue.close();
    await prisma.$disconnect();
  });
