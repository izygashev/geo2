import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Calendar,
  TrendingUp,
  Lightbulb,
  Search,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RecommendationCard } from "@/components/recommendation-card";
import { SovDonutChart, SovBarChart } from "@/components/sov-charts";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, url: true, userId: true } },
      shareOfVoices: {
        orderBy: { createdAt: "asc" },
      },
      recommendations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report || report.project.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // ─── Вычисляем метрики ────────────────────────────────
  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;

  const statusConfig = {
    COMPLETED: {
      label: "Завершён",
      className: "border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F] hover:bg-[#EDF3EC]",
    },
    PROCESSING: {
      label: "В обработке",
      className: "border-[#C8E1FE] bg-[#E1F3FE] text-[#1A6FBF] hover:bg-[#E1F3FE]",
    },
    FAILED: {
      label: "Ошибка",
      className: "border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37] hover:bg-[#FDEBEC]",
    },
  };

  const sc = statusConfig[report.status];

  // ─── Цвет Score ───────────────────────────────────────
  const scoreColor =
    !report.overallScore
      ? "text-[#BBBBBB]"
      : report.overallScore >= 70
      ? "text-[#2D6A4F]"
      : report.overallScore >= 40
      ? "text-[#B08D19]"
      : "text-[#B02A37]";

  return (
    <div className="pb-12">
      {/* Навигация назад */}
      <Link
        href="/dashboard/reports"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все отчёты
      </Link>

      {/* ─── Шапка ─────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-[#EAEAEA] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">
                {report.project.name}
              </h1>
              <Badge className={sc.className}>{sc.label}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#787774]">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <a
                  href={report.project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  {report.project.url}
                </a>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {report.createdAt.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROCESSING ─────────────────────────────────── */}
      {report.status === "PROCESSING" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[#C8E1FE] bg-[#E1F3FE] p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A6FBF]" />
          <p className="text-sm font-medium text-[#1a1a1a]">
            Отчёт обрабатывается…
          </p>
          <p className="text-sm text-[#787774]">
            Playwright анализирует сайт, AI проверяет упоминания. Обычно 1–2 минуты.
          </p>
        </div>
      )}

      {/* ─── FAILED ─────────────────────────────────────── */}
      {report.status === "FAILED" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#F5C2C7] bg-[#FDEBEC] p-16 text-center">
          <AlertTriangle className="h-8 w-8 text-[#B02A37]" />
          <p className="text-sm font-medium text-[#1a1a1a]">
            Ошибка при генерации отчёта
          </p>
          <p className="text-sm text-[#787774]">
            Кредиты не списаны. Попробуйте запустить анализ ещё раз.
          </p>
          <Link
            href="/"
            className="btn-tactile mt-2 inline-flex items-center gap-2 rounded-md border border-[#F5C2C7] bg-[#FDEBEC] px-4 py-2 text-sm font-medium text-[#B02A37] hover:bg-[#FBD5D8] transition-colors"
          >
            Запустить заново
          </Link>
        </div>
      )}

      {/* ─── COMPLETED ──────────────────────────────────── */}
      {report.status === "COMPLETED" && (
        <div className="space-y-6">

          {/* Stat-карточки */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Score */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-3">
                <TrendingUp className="h-4 w-4" />
                AI Visibility Score
              </div>
              {report.overallScore !== null ? (
                <p className={`text-3xl font-bold tracking-tighter ${scoreColor}`}>
                  {Math.round(report.overallScore)}
                  <span className="text-sm text-[#BBBBBB] ml-1">/100</span>
                </p>
              ) : (
                <p className="text-[#BBBBBB] text-sm">Нет данных</p>
              )}
            </div>

            {/* Share of Voice */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-3">
                <Search className="h-4 w-4" />
                Share of Voice
              </div>
              {sovTotal > 0 ? (
                <>
                  <p className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {sovMentioned}
                    <span className="text-sm text-[#BBBBBB] ml-1">/ {sovTotal}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#787774]">запросов с упоминанием</p>
                </>
              ) : (
                <p className="text-[#BBBBBB] text-sm">Нет данных</p>
              )}
            </div>

            {/* Рекомендации */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-3">
                <Lightbulb className="h-4 w-4" />
                Рекомендации
              </div>
              {report.recommendations.length > 0 ? (
                <>
                  <p className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {report.recommendations.length}
                  </p>
                  <p className="mt-1 text-xs text-[#787774]">точек роста найдено</p>
                </>
              ) : (
                <p className="text-[#BBBBBB] text-sm">Нет данных</p>
              )}
            </div>
          </div>

          {/* ─── Графики Share of Voice ─────────────────── */}
          {sovTotal > 0 ? (
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-6">
                Share of Voice по запросам
              </h2>
              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                {/* Donut */}
                <div className="flex flex-col items-center">
                  <p className="text-xs text-[#787774] uppercase tracking-wide mb-4">
                    Общий процент
                  </p>
                  <SovDonutChart mentioned={sovMentioned} total={sovTotal} />
                </div>

                {/* Separator */}
                <div className="hidden lg:block w-px bg-[#EAEAEA] self-stretch" />

                {/* Bar */}
                <div className="flex-1 w-full min-w-0">
                  <p className="text-xs text-[#787774] uppercase tracking-wide mb-4">
                    По каждому запросу
                  </p>
                  <SovBarChart
                    items={report.shareOfVoices.map((s) => ({
                      keyword: s.keyword,
                      isMentioned: s.isMentioned,
                    }))}
                  />
                  {/* Список запросов */}
                  <div className="mt-4 space-y-2">
                    {report.shareOfVoices.map((sov, i) => (
                      <div
                        key={sov.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="shrink-0 mt-0.5 font-mono text-xs text-[#BBBBBB]">
                          {i + 1}.
                        </span>
                        <span className="text-[#787774] flex-1">{sov.keyword}</span>
                        <span
                          className={`shrink-0 text-xs font-medium ${
                            sov.isMentioned ? "text-[#2D6A4F]" : "text-[#B02A37]"
                          }`}
                        >
                          {sov.isMentioned ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-10 text-center">
              <Search className="mx-auto h-5 w-5 text-[#BBBBBB] mb-3" />
              <p className="text-[#787774] text-sm">Данные Share of Voice отсутствуют</p>
            </div>
          )}

          {/* ─── Рекомендации ──────────────────────────── */}
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-4">
              Рекомендации по GEO-оптимизации
            </h2>
            {report.recommendations.length > 0 ? (
              <div className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <RecommendationCard
                    key={rec.id}
                    index={i}
                    type={rec.type}
                    title={rec.title}
                    description={rec.description}
                    generatedCode={rec.generatedCode}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-10 text-center">
                <Lightbulb className="mx-auto h-5 w-5 text-[#BBBBBB] mb-3" />
                <p className="text-[#787774] text-sm">Рекомендации не сформированы</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
