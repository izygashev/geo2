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
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { SovDonutChart, SovBarChart } from "@/components/sov-charts";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { SiteChecklist } from "@/components/site-checklist";
import { CompetitorsTable } from "@/components/competitors-table";
import { ReportPdfButton } from "@/components/report-pdf-button";
import { RerunReportButton } from "@/components/rerun-report-button";
import { ScoreHistoryChart } from "@/components/score-history-chart";
import { ShareReportButton } from "@/components/share-report-button";
import { DeleteButton } from "@/components/delete-button";
import { VisibilityTrendChart } from "@/components/visibility-trend-chart-wrapper";
import { ContentGaps, type ContentGapItem } from "@/components/content-gaps";
import { RagVisualizer } from "@/components/ui/rag-visualizer";
import { LlmsTxtBlock } from "@/components/llms-txt-block";

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

  // История Score по проекту (для тренд-графика)
  const scoreHistory = await prisma.report.findMany({
    where: {
      projectId: report.projectId,
      status: "COMPLETED",
      overallScore: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      overallScore: true,
      createdAt: true,
    },
  });

  const historyData = scoreHistory.map((r) => ({
    date: r.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    score: Math.round(r.overallScore!),
    reportId: r.id,
  }));

  // План пользователя (для paywall)
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const isPro = currentUser?.plan === "PRO" || currentUser?.plan === "AGENCY";

  // Найдём предыдущий отчёт по этому проекту для кнопки "Сравнить"
  const currentIdx = scoreHistory.findIndex((r) => r.id === report.id);
  const prevReport = currentIdx > 0 ? scoreHistory[currentIdx - 1] : null;

  // ─── Extract target brand from URL ────────────────────
  const targetBrand = (() => {
    try {
      const hostname = new URL(report.project.url).hostname.replace(/^www\./, "");
      // "civitai.com" → "civitai", "my-brand.co.uk" → "my-brand"
      return hostname.split(".")[0].toLowerCase();
    } catch {
      return report.project.name.toLowerCase();
    }
  })();

  // Compute metrics
  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  // Collect competitors from SoV — filter out the target brand
  const allCompetitorsRaw = report.shareOfVoices.flatMap((sov) => {
    const comps = sov.competitors as { name: string; url?: string }[];
    return Array.isArray(comps) ? comps : [];
  });

  const allCompetitors = allCompetitorsRaw.filter((c) => {
    const name = c.name.toLowerCase().trim();
    const url = (c.url ?? "").toLowerCase();
    // Filter out the target brand by name or URL match
    return (
      !name.includes(targetBrand) &&
      !targetBrand.includes(name.replace(/\s+/g, "")) &&
      !url.includes(targetBrand)
    );
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
          {/* Action buttons */}
          {report.status === "COMPLETED" && (
            <div className="flex items-center gap-2" data-pdf-hide>
              {prevReport && (
                <Link
                  href={`/dashboard/reports/diff?a=${prevReport.id}&b=${report.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#EAEAEA] bg-white px-3 text-xs font-medium text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Сравнить
                </Link>
              )}
              <ShareReportButton reportId={report.id} existingShareId={report.shareId} />
              <RerunReportButton projectUrl={report.project.url} />
              <ReportPdfButton reportId={report.id} projectName={report.project.name} />
              <DeleteButton
                entityType="report"
                entityId={report.id}
                entityName={report.project.name}
                variant="icon"
                redirectTo="/dashboard/reports"
              />
            </div>
          )}
        </div>
      </div>

      {/* PROCESSING state */}
      {report.status === "PROCESSING" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[#C8E1FE] bg-[#E1F3FE] p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A6FBF]" />
          <p className="text-sm font-medium text-[#1a1a1a]">
            Анализируем ваш сайт…
          </p>
          <p className="text-sm text-[#787774]">
            Проверяем, как нейросети видят и рекомендуют ваш бренд. Обычно 1–2 минуты.
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
          <div className="mt-2 flex items-center gap-2">
            <RerunReportButton projectUrl={report.project.url} />
            <DeleteButton
              entityType="report"
              entityId={report.id}
              entityName={report.project.name}
              variant="icon"
              redirectTo="/dashboard/reports"
            />
          </div>
        </div>
      )}

      {/* COMPLETED state */}
      {report.status === "COMPLETED" && (
        <div id="report-content" className="space-y-8">

          {/* ═══════════════════════════════════════════════════ */}
          {/* HERO: Score Header — centered, prominent           */}
          {/* ═══════════════════════════════════════════════════ */}
          <Card className="border-[#EAEAEA] bg-white shadow-none">
            <CardContent className="px-6 pt-6 pb-8">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774] mb-6">
                  Общая оценка AI-видимости
                </p>
                <ScoreRing score={report.overallScore ?? 0} size={200} strokeWidth={12} />

                {/* Quick metric pills */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3 py-1.5 text-xs text-[#555]">
                    <Search className="h-3 w-3 text-[#787774]" />
                    Узнаваемость: <span className="font-semibold text-[#1a1a1a]">{sovPercent}%</span>
                    <span className="text-[#BBBBBB]">({sovMentioned}/{sovTotal})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3 py-1.5 text-xs text-[#555]">
                    <Lightbulb className="h-3 w-3 text-[#787774]" />
                    Рекомендаций: <span className="font-semibold text-[#1a1a1a]">{report.recommendations.length}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3 py-1.5 text-xs text-[#555]">
                    <Users className="h-3 w-3 text-[#787774]" />
                    Конкурентов: <span className="font-semibold text-[#1a1a1a]">{new Set(allCompetitors.map((c) => c.name.toLowerCase().trim())).size}</span>
                  </span>
                  {report.sentiment && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                      report.sentiment === "positive"
                        ? "border border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                        : report.sentiment === "negative"
                          ? "border border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]"
                          : "border border-[#EAEAEA] bg-[#F7F6F3] text-[#787774]"
                    }`}>
                      {report.sentiment === "positive" ? "👍" : report.sentiment === "negative" ? "👎" : "➖"}
                      {report.sentiment === "positive" ? "Позитивная тональность" : report.sentiment === "negative" ? "Негативная тональность" : "Нейтральная тональность"}
                    </span>
                  )}
                  {report.categorySearched && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3 py-1.5 text-xs text-[#555]">
                      🏷️ {report.categorySearched}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SCORE BREAKDOWN + HISTORY                          */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Score Breakdown */}
            <Card className="border-[#EAEAEA] bg-white shadow-none">
              <CardHeader className="px-6 pt-5 pb-0">
                <CardTitle className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                  Из чего складывается оценка
                </CardTitle>
                <CardDescription className="text-[11px] text-[#BBBBBB]">
                  Каждый фактор влияет на то, рекомендуют ли вас нейросети
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pt-4 pb-6">
                <div className="space-y-4">
                  <ScoreBreakdownBar
                    label="Узнаваемость в ИИ"
                    value={report.scoreSov ?? sovPercent}
                    icon={<Search className="h-3.5 w-3.5" />}
                  />
                  <ScoreBreakdownBar
                    label="Разметка для роботов"
                    value={report.scoreSchema ?? (schemaTypes.length > 0 ? 60 : 0)}
                    icon={<FileText className="h-3.5 w-3.5" />}
                  />
                  <ScoreBreakdownBar
                    label="Визитка для ИИ (llms.txt)"
                    value={report.scoreLlmsTxt ?? (report.hasLlmsTxt ? 80 : 0)}
                    icon={<Zap className="h-3.5 w-3.5" />}
                  />
                  <ScoreBreakdownBar
                    label="Качество контента"
                    value={report.scoreContent ?? 50}
                    icon={<BarChart3 className="h-3.5 w-3.5" />}
                  />
                  <ScoreBreakdownBar
                    label="Репутация бренда"
                    value={report.scoreAuthority ?? 30}
                    icon={<Shield className="h-3.5 w-3.5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Score History OR Visibility Trend */}
            <div className="space-y-4">
              {historyData.length > 1 && (
                <ScoreHistoryChart data={historyData} />
              )}
              <VisibilityTrendChart
                currentScore={report.overallScore ?? 0}
                createdAt={report.createdAt.toISOString()}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Platform Mentions (SoV)                   */}
          {/* ═══════════════════════════════════════════════════ */}
          <div>
            <div className="mb-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                Узнаваемость в ИИ
              </p>
              <p className="mt-1 text-[11px] text-[#BBBBBB]">
                Мы спросили нейросети о вашей нише — вот где вас рекомендуют
              </p>
            </div>

            {sovTotal > 0 ? (
              <Card className="border-[#EAEAEA] bg-white shadow-none">
                <CardContent className="px-6 pt-6 pb-6">
                  {/* Charts row */}
                  <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                    <div className="flex flex-col items-center shrink-0">
                      <SovDonutChart mentioned={sovMentioned} total={sovTotal} />
                    </div>
                    <Separator orientation="vertical" className="hidden lg:block self-stretch bg-[#F0EFEB]" />
                    <div className="flex-1 w-full min-w-0">
                      <SovBarChart
                        items={report.shareOfVoices.map((s) => ({
                          keyword: s.keyword,
                          isMentioned: s.isMentioned,
                        }))}
                      />
                    </div>
                  </div>

                  <Separator className="my-6 bg-[#F0EFEB]" />

                  {/* Detailed keyword results as a clean grid */}
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774] mb-3">
                    Что ответили нейросети
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {report.shareOfVoices.map((sov) => (
                      <div
                        key={sov.id}
                        className={`rounded-xl border px-4 py-3 transition-colors ${
                          sov.isMentioned
                            ? "border-[#D1E7DD]/60 bg-[#FAFCFA] hover:bg-[#F5F9F5]"
                            : "border-[#F5C2C7]/40 bg-[#FEFBFB] hover:bg-[#FDF7F7]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {sov.isMentioned ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B02A37]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#1a1a1a] leading-snug">
                              {sov.keyword}
                            </p>
                            {sov.mentionContext && (
                              <p className="mt-1 text-[11px] text-[#787774] leading-relaxed line-clamp-2">
                                {sov.mentionContext}
                              </p>
                            )}
                            {(() => {
                              const comps = (sov.competitors as { name: string }[])
                                ?.filter((c) => {
                                  const n = c.name.toLowerCase().trim();
                                  return !n.includes(targetBrand) && !targetBrand.includes(n.replace(/\s+/g, ""));
                                });
                              if (!Array.isArray(comps) || comps.length === 0) return null;
                              return (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {comps.slice(0, 3).map((c, ci) => (
                                    <span
                                      key={ci}
                                      className="inline-flex rounded border border-[#EAEAEA] bg-white px-1.5 py-0.5 text-[10px] text-[#787774]"
                                    >
                                      {c.name}
                                    </span>
                                  ))}
                                  {comps.length > 3 && (
                                    <span className="text-[10px] text-[#BBBBBB]">
                                      +{comps.length - 3}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-[#EAEAEA] bg-white shadow-none">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <Search className="h-5 w-5 text-[#BBBBBB]" />
                  <p className="text-[#787774] text-sm">Мы пока не нашли данных об упоминаниях вашего бренда</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Technical Audit                           */}
          {/* ═══════════════════════════════════════════════════ */}
          <div>
            <div className="mb-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                Технический аудит
              </p>
              <p className="mt-1 text-[11px] text-[#BBBBBB]">
                Что нейросети видят (и не видят) на вашем сайте
              </p>
            </div>
            <Card className="border-[#EAEAEA] bg-white shadow-none">
              <CardContent className="px-6 pt-6 pb-6">
                <SiteChecklist
                  hasLlmsTxt={report.hasLlmsTxt}
                  schemaOrgTypes={schemaTypes}
                  contentLength={report.contentLength}
                  siteTitle={report.siteTitle}
                  siteDescription={report.siteDescription}
                  siteH1={report.siteH1}
                  robotsTxtAiFriendly={report.robotsTxtAiFriendly}
                  semanticHtmlValid={report.semanticHtmlValid}
                />
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Competitors                               */}
          {/* ═══════════════════════════════════════════════════ */}
          <div>
            <div className="mb-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                Конкуренты в вашей нише
              </p>
              <p className="mt-1 text-[11px] text-[#BBBBBB]">
                {allCompetitors.length > 0
                  ? "Бренды, которые нейросети рекомендуют чаще всего"
                  : "После следующего анализа здесь появятся бренды-конкуренты"}
              </p>
            </div>
            <Card className="border-[#EAEAEA] bg-white shadow-none">
              <CardContent className="px-6 pt-6 pb-6">
                {allCompetitors.length > 0 ? (
                  <CompetitorsTable competitors={allCompetitors} isPro={isPro} />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Users className="h-5 w-5 text-[#BBBBBB]" />
                    <p className="text-sm text-[#787774]">
                      Нейросети пока не определили прямых конкурентов в этой нише
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Digital PR — упоминания на площадках       */}
          {/* ═══════════════════════════════════════════════════ */}
          {report.digitalPr && Array.isArray(report.digitalPr) && (report.digitalPr as { platform: string; mentioned: boolean; url?: string; context: string; sentiment?: string }[]).length > 0 && (() => {
            const PLATFORM_LABELS: Record<string, string> = {
              "vc.ru": "VC.ru",
              "habr.com": "Хабр",
              "pikabu.ru": "Пикабу",
              "otzovik.com": "Отзовик",
              "yandex.ru/maps": "Яндекс Карты",
              "2gis.ru": "2ГИС",
              // Legacy Western platforms (old reports)
              "reddit.com": "Reddit",
              "quora.com": "Quora",
              "producthunt.com": "Product Hunt",
              "trustpilot.com": "Trustpilot",
            };

            /** Translate English context from legacy reports into Russian */
            function localizeContext(ctx: string, platform: string, mentioned: boolean): string {
              if (!ctx || ctx.trim().length === 0) {
                const platformLabel = PLATFORM_LABELS[platform] ?? platform;
                return mentioned
                  ? `Бренд упоминается на ${platformLabel}`
                  : `Упоминания на ${platformLabel} не найдены`;
              }

              // Check if text is predominantly Russian (>40% Cyrillic letters)
              const cyrillicCount = (ctx.match(/[а-яА-ЯёЁ]/g) || []).length;
              const latinCount = (ctx.match(/[a-zA-Z]/g) || []).length;
              const totalLetters = cyrillicCount + latinCount;
              const isPredominantlyRussian = totalLetters > 0 && (cyrillicCount / totalLetters) > 0.4;

              if (isPredominantlyRussian) return ctx;

              // English text from legacy reports — translate to Russian
              const platformLabel = PLATFORM_LABELS[platform] ?? platform;

              if (!mentioned) {
                return `Органические упоминания на ${platformLabel} не найдены`;
              }

              // Mentioned with English context — provide Russian wrapper
              return `Бренд упоминается на ${platformLabel}`;
            }

            const mentions = report.digitalPr as { platform: string; mentioned: boolean; url?: string; context: string; sentiment?: string }[];
            return (
            <div>
              <div className="mb-4 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                  Digital PR
                </p>
                <p className="mt-1 text-[11px] text-[#BBBBBB]">
                  Где о вас говорят на популярных площадках
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mentions.map((mention) => (
                  <Card key={mention.platform} className={`border shadow-none transition-colors ${
                    mention.mentioned
                      ? "border-[#D1E7DD]/60 bg-[#FAFCFA]"
                      : "border-[#EAEAEA] bg-white"
                  }`}>
                    <CardContent className="px-5 pt-5 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#1a1a1a]">
                          {PLATFORM_LABELS[mention.platform] ?? mention.platform}
                        </span>
                        {mention.mentioned ? (
                          <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[#BBBBBB]" />
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#787774] line-clamp-3">
                        {localizeContext(mention.context, mention.platform, mention.mentioned)}
                      </p>
                      {mention.url && mention.mentioned && (
                        <a
                          href={mention.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex text-[10px] font-medium text-[#555] hover:text-[#1a1a1a] transition-colors"
                        >
                          Открыть →
                        </a>
                      )}
                      {mention.sentiment && (
                        <div className="mt-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            mention.sentiment === "positive"
                              ? "bg-[#EDF3EC] text-[#2D6A4F]"
                              : mention.sentiment === "negative"
                                ? "bg-[#FDEBEC] text-[#B02A37]"
                                : "bg-[#F7F6F3] text-[#787774]"
                          }`}>
                            {mention.sentiment === "positive" ? "Позитивно" : mention.sentiment === "negative" ? "Негативно" : "Нейтрально"}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: RAG Chunk Visualizer                      */}
          {/* ═══════════════════════════════════════════════════ */}
          {report.scrapedBody && (
            <div>
              <Card className="border-[#EAEAEA] bg-white shadow-none">
                <CardContent className="px-6 pt-6 pb-6">
                  <RagVisualizer text={report.scrapedBody} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Content Gaps                              */}
          {/* ═══════════════════════════════════════════════════ */}
          {(() => {
            const existingRecTypes = new Set(report.recommendations.map((r) => r.type));

            const missedKeywords = report.shareOfVoices.filter((s) => !s.isMentioned);
            const topCompetitorNames = Array.from(
              new Set(
                allCompetitors
                  .map((c) => c.name.trim())
                  .filter((n) => n.length > 0)
              )
            ).slice(0, 5);

            const contentGaps: ContentGapItem[] = [];

            if (!existingRecTypes.has("content") && !existingRecTypes.has("rag-content")) {
              if (missedKeywords.length > 0 && topCompetitorNames.length > 0) {
                const kw1 = missedKeywords[0];
                contentGaps.push({
                  topic: `Контент по теме «${kw1.keyword}»`,
                  competitorSource: topCompetitorNames[0],
                  aiInsight: `Когда клиенты спрашивают нейросеть «${kw1.keyword}», она рекомендует ${topCompetitorNames[0]}, а не вас.`,
                  actionText: "Создать контент",
                  actionType: "content",
                });
              }

              if (missedKeywords.length > 1 && topCompetitorNames.length > 0) {
                const kw2 = missedKeywords[1];
                const comp = topCompetitorNames[Math.min(1, topCompetitorNames.length - 1)];
                contentGaps.push({
                  topic: `Экспертная статья: «${kw2.keyword}»`,
                  competitorSource: comp,
                  aiInsight: `По запросу «${kw2.keyword}» ИИ ссылается на ${comp}. Напишите глубокий материал — и нейросети начнут ссылаться на вас.`,
                  actionText: "Создать контент",
                  actionType: "content",
                });
              }
            }

            if (!report.hasLlmsTxt && !existingRecTypes.has("llms-txt")) {
              contentGaps.push({
                topic: "Визитка для нейросетей (llms.txt)",
                competitorSource: topCompetitorNames[0] ?? "лидеры ниши",
                aiInsight: "У лидеров ниши есть специальный файл-визитка. У вас такого файла нет — ИИ вас просто не видит.",
                actionText: "Создать визитку",
                actionType: "llms-txt",
              });
            }

            if (schemaTypes.length === 0 && report.hasLlmsTxt && !existingRecTypes.has("schema-faq")) {
              contentGaps.push({
                topic: "FAQ / глоссарий терминов",
                competitorSource: topCompetitorNames[0] ?? "лидеры ниши",
                aiInsight: "У конкурентов есть FAQ-раздел. Нейросети активно берут из него информацию.",
                actionText: "Создать FAQ",
                actionType: "faq",
              });
            }

            if (contentGaps.length === 0) return null;
            return (
              <ContentGaps
                gaps={contentGaps}
                projectUrl={report.project.url}
                siteTitle={report.siteTitle ?? report.project.name}
              />
            );
          })()}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Generated llms.txt                        */}
          {/* ═══════════════════════════════════════════════════ */}
          {report.generatedLlmsTxt && (
            <div>
              <div className="mb-4 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#787774]">
                  Визитка для нейросетей
                </p>
                <p className="mt-1 text-[11px] text-[#BBBBBB]">
                  Готовый llms.txt — скопируйте и разместите на вашем сайте
                </p>
              </div>
              <LlmsTxtBlock
                content={report.generatedLlmsTxt}
                siteUrl={report.project.url}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION: Recommendations — Action Plan             */}
          {/* ═══════════════════════════════════════════════════ */}
          <RecommendationsPanel
            recommendations={report.recommendations.map((rec) => ({
              id: rec.id,
              type: rec.type,
              title: rec.title,
              description: rec.description,
              generatedCode: rec.generatedCode,
            }))}
            projectUrl={report.project.url}
          />

        </div>
      )}
    </div>
  );
}