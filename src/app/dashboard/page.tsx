import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  FolderOpen,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reports: true } },
      reports: {
        where: { status: "COMPLETED", overallScore: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          id: true,
          overallScore: true,
          createdAt: true,
        },
      },
    },
  });

  // Общая статистика
  const totalProjects = projects.length;
  const avgScore =
    projects.length > 0
      ? Math.round(
          projects
            .filter((p) => p.reports[0]?.overallScore != null)
            .reduce((sum, p) => sum + (p.reports[0]?.overallScore ?? 0), 0) /
            Math.max(
              projects.filter((p) => p.reports[0]?.overallScore != null).length,
              1
            )
        )
      : 0;
  const totalReports = projects.reduce((sum, p) => sum + p._count.reports, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Проекты</h1>
          <p className="mt-1 text-sm text-[#787774]">
            Управляйте сайтами и запускайте аналитику
          </p>
        </div>
        <Button className="btn-tactile gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]">
          <Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </div>

      {/* Сводная статистика (если есть проекты) */}
      {totalProjects > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Проекты</p>
            <p className="mt-2 text-3xl font-bold tracking-tighter text-[#1a1a1a]">{totalProjects}</p>
          </div>
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Средний Score</p>
            <p className="mt-2 text-3xl font-bold tracking-tighter text-[#1a1a1a]">
              {avgScore > 0 ? (
                <>
                  {avgScore}
                  <span className="text-sm text-[#BBBBBB] ml-1">/100</span>
                </>
              ) : (
                <span className="text-sm text-[#BBBBBB]">—</span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Всего отчётов</p>
            <p className="mt-2 text-3xl font-bold tracking-tighter text-[#1a1a1a]">{totalReports}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#EAEAEA] bg-white py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#FBFBFA]">
            <FolderOpen className="h-5 w-5 text-[#BBBBBB]" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1a1a1a]">
            Нет проектов
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[#787774]">
            Создайте первый проект, чтобы начать отслеживать упоминания вашего
            бренда в ответах ИИ.
          </p>
          <Button className="btn-tactile mt-6 gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]">
            <Plus className="h-4 w-4" />
            Создать проект
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const lastReport = project.reports[0];
            const prevReport = project.reports[1];
            const score = lastReport?.overallScore
              ? Math.round(lastReport.overallScore)
              : null;
            const prevScore = prevReport?.overallScore
              ? Math.round(prevReport.overallScore)
              : null;
            const delta = score != null && prevScore != null ? score - prevScore : null;

            const scoreColor =
              score == null
                ? "text-[#BBBBBB]"
                : score >= 70
                  ? "text-[#2D6A4F]"
                  : score >= 40
                    ? "text-[#B08D19]"
                    : "text-[#B02A37]";

            return (
              <div
                key={project.id}
                className="rounded-xl border border-[#EAEAEA] bg-white p-5 transition-colors hover:bg-[#FBFBFA]"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Project info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-[#BBBBBB] shrink-0" />
                      <h3 className="text-sm font-medium text-[#1a1a1a] truncate">
                        {project.name}
                      </h3>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#BBBBBB] hover:text-[#787774] transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-[#787774]">
                      <span>{project._count.reports} отч.</span>
                      {lastReport && (
                        <span>
                          Последний: {lastReport.createdAt.toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score + Trend */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Delta badge */}
                    {delta != null && delta !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          delta > 0
                            ? "bg-[#EDF3EC] text-[#2D6A4F]"
                            : "bg-[#FDEBEC] text-[#B02A37]"
                        }`}
                      >
                        {delta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    )}
                    {delta === 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-[#F7F6F3] px-2 py-0.5 text-xs text-[#787774]">
                        <Minus className="h-3 w-3" />
                        0
                      </span>
                    )}

                    {/* Score */}
                    <div className="text-right">
                      {score != null ? (
                        <span className={`text-xl font-bold tracking-tighter ${scoreColor}`}>
                          {score}
                          <span className="text-xs text-[#BBBBBB] ml-0.5">/100</span>
                        </span>
                      ) : (
                        <span className="text-sm text-[#BBBBBB]">—</span>
                      )}
                    </div>

                    {/* Link to last report */}
                    {lastReport && (
                      <Link
                        href={`/dashboard/reports/${lastReport.id}`}
                        className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-xs font-medium text-[#787774] hover:bg-[#F7F6F3] transition-colors"
                      >
                        Отчёт →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
