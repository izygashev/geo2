/**
 * LLM Cost Analytics — запросы для анализа unit economics.
 *
 * Использование:
 *   npx tsx src/lib/llm-cost-analytics.ts
 *
 * Или импортируйте функции в API-роут / admin-дашборд.
 */

import { prisma } from "./prisma";

/** Суммарные LLM-расходы по пользователям (топ потребители) */
export async function getCostsByUser(limit = 20) {
  const results = await prisma.report.groupBy({
    by: ["projectId"],
    where: { status: "COMPLETED" },
    _sum: {
      llmCost: true,
      tokensUsed: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: { llmCost: "desc" },
    },
  });

  // Обогащаем userId через project
  const projectIds = results.map((r) => r.projectId);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, userId: true, name: true },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // Группируем по userId
  const userCosts = new Map<
    string,
    { totalCost: number; totalTokens: number; reportCount: number; projects: string[] }
  >();

  for (const r of results) {
    const project = projectMap.get(r.projectId);
    if (!project) continue;

    const existing = userCosts.get(project.userId) ?? {
      totalCost: 0,
      totalTokens: 0,
      reportCount: 0,
      projects: [],
    };

    existing.totalCost += r._sum.llmCost ?? 0;
    existing.totalTokens += r._sum.tokensUsed ?? 0;
    existing.reportCount += r._count.id;
    existing.projects.push(project.name);
    userCosts.set(project.userId, existing);
  }

  // Обогащаем именами пользователей
  const userIds = [...userCosts.keys()];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, plan: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return [...userCosts.entries()]
    .map(([userId, stats]) => {
      const user = userMap.get(userId);
      return {
        userId,
        userName: user?.name ?? "Unknown",
        email: user?.email ?? "Unknown",
        plan: user?.plan ?? "FREE",
        ...stats,
        avgCostPerReport:
          stats.reportCount > 0
            ? Math.round((stats.totalCost / stats.reportCount) * 1_000_000) / 1_000_000
            : 0,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit);
}

/** Общие агрегаты unit economics */
export async function getOverallCostStats() {
  const agg = await prisma.report.aggregate({
    where: { status: "COMPLETED" },
    _sum: {
      llmCost: true,
      tokensUsed: true,
    },
    _avg: {
      llmCost: true,
      tokensUsed: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalReports: agg._count.id,
    totalCostUsd: Math.round((agg._sum.llmCost ?? 0) * 100) / 100,
    totalTokens: agg._sum.tokensUsed ?? 0,
    avgCostPerReport: Math.round((agg._avg.llmCost ?? 0) * 1_000_000) / 1_000_000,
    avgTokensPerReport: Math.round(agg._avg.tokensUsed ?? 0),
  };
}

/** Расходы по дням (для графика) */
export async function getDailyCosts(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const reports = await prisma.report.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      llmCost: true,
      tokensUsed: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, { cost: number; tokens: number; count: number }>();

  for (const r of reports) {
    const day = r.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(day) ?? { cost: 0, tokens: 0, count: 0 };
    existing.cost += r.llmCost;
    existing.tokens += r.tokensUsed;
    existing.count += 1;
    dailyMap.set(day, existing);
  }

  return [...dailyMap.entries()].map(([date, stats]) => ({
    date,
    ...stats,
    cost: Math.round(stats.cost * 1_000_000) / 1_000_000,
  }));
}

// ── CLI runner ───────────────────────────────────────────
if (require.main === module) {
  (async () => {
    console.log("\n═══ LLM Cost Analytics ═══\n");

    const overall = await getOverallCostStats();
    console.log("📊 Общие показатели:");
    console.log(`   Отчётов: ${overall.totalReports}`);
    console.log(`   Суммарные расходы: $${overall.totalCostUsd}`);
    console.log(`   Суммарные токены: ${overall.totalTokens.toLocaleString()}`);
    console.log(`   Средний расход/отчёт: $${overall.avgCostPerReport}`);
    console.log(`   Средние токены/отчёт: ${overall.avgTokensPerReport.toLocaleString()}`);

    console.log("\n👤 Топ пользователей по расходам:");
    const topUsers = await getCostsByUser(10);
    for (const u of topUsers) {
      console.log(
        `   ${u.userName} (${u.email}) [${u.plan}] — $${u.totalCost.toFixed(4)} ` +
          `(${u.reportCount} отчётов, ${u.totalTokens.toLocaleString()} токенов)`
      );
    }

    process.exit(0);
  })();
}
