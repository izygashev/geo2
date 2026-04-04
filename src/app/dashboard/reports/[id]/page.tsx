import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Calendar,
  Lightbulb,
  Search,
  AlertTriangle,
  Loader2,
  Shield,
  FileText,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RecommendationCard } from "@/components/recommendation-card";
import { SovDonutChart, SovBarChart } from "@/components/sov-charts";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { SiteChecklist } from "@/components/site-checklist";
import { CompetitorsTable } from "@/components/competitors-table";

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

  // Compute metrics
  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  // Collect competitors from SoV
  const allCompetitors = report.shareOfVoices.flatMap((sov) => {
    const comps = sov.competitors as { name: string; url?: string }[];
    return Array.isArray(comps) ? comps : [];
  });

  // Schema.org types
  const schemaTypes = Array.isArray(report.schemaOrgTypes)
    ? (report.schemaOrgTypes as string[])
    : [];

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

  return (
    <div className="pb-12">
      {/* Back navigation */}
      <Link
        href="/dashboard/reports"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#787774] transition-colors hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Все отчёты
      </Link>

      {/* Header */}
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

      {/* PROCESSING state */}
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

      {/* FAILED state */}
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
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#F5C2C7] bg-[#FDEBEC] px-4 py-2 text-sm font-medium text-[#B02A37] hover:bg-[#FBD5D8] transition-colors"
          >
            Запустить заново
          </Link>
        </div>
      )}

      {/* COMPLETED state */}
      {report.status === "COMPLETED" && (
        <div className="space-y-6">

          {/* ROW 1: Score Ring + Score Breakdown + Quick Stats */}
          <div className="grid gap-4 lg:grid-cols-12">

            {/* Score Ring */}
            <div className="lg:col-span-4 rounded-xl border border-[#EAEAEA] bg-white p-6 flex flex-col items-center justify-center">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-4">
                AI Visibility Score
              </p>
              <ScoreRing score={report.overallScore ?? 0} />
            </div>

            {/* Score Breakdown bars */}
            <div className="lg:col-span-4 rounded-xl border border-[#EAEAEA] bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-5">
                Детализация Score
              </p>
              <div className="space-y-4">
                <ScoreBreakdownBar
                  label="Share of Voice"
                  value={report.scoreSov ?? sovPercent}
                  icon={<Search className="h-3.5 w-3.5" />}
                />
                <ScoreBreakdownBar
                  label="Schema.org"
                  value={report.scoreSchema ?? (schemaTypes.length > 0 ? 60 : 0)}
                  icon={<FileText className="h-3.5 w-3.5" />}
                />
                <ScoreBreakdownBar
                  label="llms.txt"
                  value={report.scoreLlmsTxt ?? (report.hasLlmsTxt ? 80 : 0)}
                  icon={<Zap className="h-3.5 w-3.5" />}
                />
                <ScoreBreakdownBar
                  label="Контент"
                  value={report.scoreContent ?? 50}
                  icon={<BarChart3 className="h-3.5 w-3.5" />}
                />
                <ScoreBreakdownBar
                  label="Авторитет"
                  value={report.scoreAuthority ?? 30}
                  icon={<Shield className="h-3.5 w-3.5" />}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-4 space-y-4">
              {/* SoV mini */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-2">
                  <Search className="h-3.5 w-3.5" />
                  Share of Voice
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {sovPercent}%
                  </span>
                  <span className="text-sm text-[#BBBBBB]">
                    ({sovMentioned} из {sovTotal})
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#787774]">запросов с упоминанием бренда</p>
              </div>

              {/* Recommendations count */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-2">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Рекомендации
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {report.recommendations.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#787774]">точек роста найдено</p>
              </div>

              {/* Competitors count */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-2">
                  <Users className="h-3.5 w-3.5" />
                  Конкуренты
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {new Set(allCompetitors.map((c) => c.name.toLowerCase().trim())).size}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#787774]">уникальных конкурентов найдено</p>
              </div>
            </div>
          </div>

          {/* ROW 2: SoV Charts + Checklist */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* SoV visualization */}
            <div className="lg:col-span-7 rounded-xl border border-[#EAEAEA] bg-white p-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-6">
                Share of Voice — детальный анализ
              </h2>

              {sovTotal > 0 ? (
                <>
                  <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                    <div className="flex flex-col items-center">
                      <SovDonutChart mentioned={sovMentioned} total={sovTotal} />
                    </div>
                    <div className="hidden lg:block w-px bg-[#EAEAEA] self-stretch" />
                    <div className="flex-1 w-full min-w-0">
                      <SovBarChart
                        items={report.shareOfVoices.map((s) => ({
                          keyword: s.keyword,
                          isMentioned: s.isMentioned,
                        }))}
                      />
                    </div>
                  </div>

                  {/* Detailed SoV table */}
                  <div className="mt-6 border-t border-[#F0EFEB] pt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-3">
                      Результаты по запросам
                    </p>
                    <div className="space-y-2">
                      {report.shareOfVoices.map((sov, i) => (
                        <div
                          key={sov.id}
                          className="group rounded-lg border border-[#F0EFEB] px-4 py-3 transition-colors hover:bg-[#FBFBFA]"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                sov.isMentioned
                                  ? "bg-[#EDF3EC] text-[#2D6A4F]"
                                  : "bg-[#FDEBEC] text-[#B02A37]"
                              }`}
                            >
                              {sov.isMentioned ? "\u2713" : "\u2717"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1a1a1a]">
                                {sov.keyword}
                              </p>
                              {sov.mentionContext && (
                                <p className="mt-1 text-xs text-[#787774] leading-relaxed line-clamp-2">
                                  {sov.mentionContext}
                                </p>
                              )}
                              {(() => {
                                const comps = sov.competitors as { name: string }[];
                                if (!Array.isArray(comps) || comps.length === 0) return null;
                                return (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {comps.slice(0, 4).map((c, ci) => (
                                      <span
                                        key={ci}
                                        className="inline-flex rounded border border-[#EAEAEA] bg-[#FBFBFA] px-1.5 py-0.5 text-[10px] text-[#787774]"
                                      >
                                        {c.name}
                                      </span>
                                    ))}
                                    {comps.length > 4 && (
                                      <span className="text-[10px] text-[#BBBBBB]">
                                        +{comps.length - 4}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <span className="shrink-0 font-mono text-[10px] text-[#BBBBBB]">
                              #{i + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Search className="h-5 w-5 text-[#BBBBBB]" />
                  <p className="text-[#787774] text-sm">Данные Share of Voice отсутствуют</p>
                </div>
              )}
            </div>

            {/* Technical checklist */}
            <div className="lg:col-span-5 rounded-xl border border-[#EAEAEA] bg-white p-6">
              <SiteChecklist
                hasLlmsTxt={report.hasLlmsTxt}
                schemaOrgTypes={schemaTypes}
                contentLength={report.contentLength}
                siteTitle={report.siteTitle}
                siteDescription={report.siteDescription}
                siteH1={report.siteH1}
              />
            </div>
          </div>

          {/* ROW 3: Competitors */}
          {allCompetitors.length > 0 && (
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-5">
                <Users className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                Конкуренты в AI-поисковиках
              </h2>
              <p className="text-sm text-[#787774] mb-5">
                Бренды, которые AI-системы упоминают вместе с вами или вместо вас
              </p>
              <CompetitorsTable competitors={allCompetitors} />
            </div>
          )}

          {/* ROW 4: Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
                <Lightbulb className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
                Рекомендации по GEO-оптимизации
              </h2>
              {report.recommendations.length > 0 && (
                <span className="rounded-full bg-[#F7F6F3] px-2.5 py-0.5 text-xs text-[#787774]">
                  {report.recommendations.length} шт.
                </span>
              )}
            </div>
            {report.recommendations.length > 0 ? (
              <div className="space-y-3">
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