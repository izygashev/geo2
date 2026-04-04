import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import Link from "next/link";
import { TrendsChart } from "@/components/trends-chart";

export default async function TrendsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // Все проекты с последними 10 completed-отчётами каждый
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      url: true,
      reports: {
        where: { status: "COMPLETED", overallScore: { not: null } },
        orderBy: { createdAt: "asc" },
        take: 20,
        select: {
          id: true,
          overallScore: true,
          createdAt: true,
        },
      },
    },
  });

  // Проекты с хотя бы 1 отчётом
  const activeProjects = projects.filter((p) => p.reports.length > 0);

  // Статистика по каждому проекту
  const projectStats = activeProjects.map((project) => {
    const reports = project.reports;
    const latest = reports[reports.length - 1];
    const prev = reports.length > 1 ? reports[reports.length - 2] : null;
    const currentScore = latest ? Math.round(latest.overallScore!) : 0;
    const prevScore = prev ? Math.round(prev.overallScore!) : null;
    const delta = prevScore != null ? currentScore - prevScore : null;

    // Тренд за неделю (если есть отчёты за последние 7 дней)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekReports = reports.filter((r) => r.createdAt >= weekAgo);
    const weekDelta =
      weekReports.length > 1
        ? Math.round(weekReports[weekReports.length - 1].overallScore!) -
          Math.round(weekReports[0].overallScore!)
        : null;

    return {
      id: project.id,
      name: project.name,
      url: project.url,
      currentScore,
      delta,
      weekDelta,
      reportsCount: reports.length,
      lastReportId: latest?.id,
    };
  });

  // Данные для мульти-проектного графика
  const chartData: { date: string; [key: string]: string | number }[] = [];
  const allDates = new Set<string>();

  for (const project of activeProjects) {
    for (const report of project.reports) {
      const dateStr = report.createdAt.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
      allDates.add(dateStr);
    }
  }

  const sortedDates = [...allDates]; // Уже отсортированы по createdAt из запроса
  for (const dateStr of sortedDates) {
    const entry: { date: string; [key: string]: string | number } = { date: dateStr };
    for (const project of activeProjects) {
      const reportOnDate = project.reports.find(
        (r) =>
          r.createdAt.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          }) === dateStr
      );
      if (reportOnDate) {
        entry[project.name] = Math.round(reportOnDate.overallScore!);
      }
    }
    chartData.push(entry);
  }

  const projectNames = activeProjects.map((p) => p.name);

  // Средний score по портфелю
  const avgScore =
    projectStats.length > 0
      ? Math.round(
          projectStats.reduce((sum, p) => sum + p.currentScore, 0) / projectStats.length
        )
      : 0;

  const improving = projectStats.filter((p) => p.delta != null && p.delta > 0).length;
  const declining = projectStats.filter((p) => p.delta != null && p.delta < 0).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Тренды</h1>
        <p className="mt-1 text-sm text-[#787774]">
          AI Visibility Score по всем проектам
        </p>
      </div>

      {activeProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#EAEAEA] bg-white py-20">
          <BarChart3 className="h-8 w-8 text-[#BBBBBB] mb-3" />
          <p className="text-sm text-[#787774]">
            Нет данных для отображения. Запустите хотя бы один отчёт.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 text-sm text-[#1a1a1a] underline"
          >
            ← К проектам
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Сводка */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
                Средний Score
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                {avgScore}
                <span className="text-sm text-[#BBBBBB] ml-1">/100</span>
              </p>
            </div>
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#2D6A4F]">
                <TrendingUp className="inline h-3 w-3 mr-1 -mt-0.5" />
                Растут
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tighter text-[#2D6A4F]">
                {improving}
              </p>
            </div>
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#B02A37]">
                <TrendingDown className="inline h-3 w-3 mr-1 -mt-0.5" />
                Падают
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tighter text-[#B02A37]">
                {declining}
              </p>
            </div>
          </div>

          {/* Мульти-проектный график */}
          {chartData.length > 1 && (
            <TrendsChart data={chartData} projectNames={projectNames} />
          )}

          {/* Таблица проектов */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
              Все проекты
            </h2>
            <div className="space-y-2">
              {projectStats
                .sort((a, b) => b.currentScore - a.currentScore)
                .map((project) => {
                  const scoreColor =
                    project.currentScore >= 70
                      ? "text-[#2D6A4F]"
                      : project.currentScore >= 40
                        ? "text-[#B08D19]"
                        : "text-[#B02A37]";

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border border-[#F0EFEB] px-4 py-3 transition-colors hover:bg-[#FBFBFA]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-[#BBBBBB]">
                          {project.reportsCount} отчёт(ов)
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Delta */}
                        {project.delta != null && project.delta !== 0 && (
                          <span
                            className={`flex items-center gap-0.5 text-xs font-medium ${
                              project.delta > 0
                                ? "text-[#2D6A4F]"
                                : "text-[#B02A37]"
                            }`}
                          >
                            {project.delta > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {project.delta > 0 ? "+" : ""}
                            {project.delta}
                          </span>
                        )}
                        {project.delta === 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-[#787774]">
                            <Minus className="h-3 w-3" /> 0
                          </span>
                        )}

                        {/* Score */}
                        <span
                          className={`text-xl font-bold tracking-tighter ${scoreColor}`}
                        >
                          {project.currentScore}
                        </span>

                        {/* Link */}
                        {project.lastReportId && (
                          <Link
                            href={`/dashboard/reports/${project.lastReportId}`}
                            className="rounded-md border border-[#EAEAEA] px-2.5 py-1 text-xs font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3]"
                          >
                            Отчёт →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
