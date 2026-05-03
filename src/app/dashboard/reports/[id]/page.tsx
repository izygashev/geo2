import { Suspense } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { ReportPdfButton } from "@/components/report-pdf-button";
import { RerunReportButton } from "@/components/rerun-report-button";
import { ShareReportButton } from "@/components/share-report-button";
import { DeleteButton } from "@/components/delete-button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ScoreHistorySection,
  CompetitorsSection,
  ContentGapsSection,
  SovTabSection,
  PlanTabSection,
} from "./async-sections";

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function CardSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#EAEAEA] bg-white p-6 space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-4 rounded ${i === 0 ? "w-1/3" : "w-full"}`} />
      ))}
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <CardSkeleton rows={5} />
      <CardSkeleton rows={3} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { id } = await params;

  // ── CRITICAL DATA ONLY — render shell immediately ──────────────────────────
  // Fetch the smallest possible payload: header fields + scores + status.
  // Heavy data (shareOfVoices JSON, recommendations, scrapedBody) is
  // delegated to async child components wrapped in <Suspense>.
  const [report, currentUser] = await Promise.all([
    prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        projectId: true,
        shareId: true,
        overallScore: true,
        scoreSov: true,
        scoreSchema: true,
        scoreLlmsTxt: true,
        scoreContent: true,
        scoreAuthority: true,
        sentiment: true,
        categorySearched: true,
        hasLlmsTxt: true,
        schemaOrgTypes: true,
        project: { select: { name: true, url: true, userId: true } },
        // lightweight counts only — no heavy JSON blobs
        shareOfVoices: { select: { isMentioned: true } },
        recommendations: { select: { id: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    }),
  ]);

  if (!report || report.project.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const isPro = currentUser?.plan === "PRO" || currentUser?.plan === "AGENCY";

  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

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

  // Previous report for "Сравнить" — tiny query, only needed when COMPLETED
  const prevReport =
    report.status === "COMPLETED"
      ? await prisma.report.findFirst({
          where: {
            projectId: report.projectId,
            status: "COMPLETED",
            overallScore: { not: null },
            createdAt: { lt: report.createdAt },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        })
      : null;

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

      {/* ── Header — renders instantly ─────────────────────────────────────── */}
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
        <div id="report-content">
          <Tabs defaultValue="summary" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-[#F7F6F3] border border-[#EAEAEA] rounded-xl h-auto p-1">
              <TabsTrigger value="summary" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Сводка
              </TabsTrigger>
              <TabsTrigger value="sov" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Где вас ищут
              </TabsTrigger>
              <TabsTrigger value="plan" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                План работ
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Сводка ───────────────────────────────────────────── */}
            <TabsContent value="summary" className="space-y-6 mt-0">

              {/* HERO — renders instantly */}
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-8">
                <div className="flex flex-col items-center text-center gap-6">
                  <ScoreRing score={report.overallScore ?? 0} size={180} strokeWidth={10} />

                  <div>
                    {(() => {
                      const s = report.overallScore ?? 0;
                      const [status, hint] =
                        s >= 75 ? ["Отличная видимость 🎉", "Нейросети хорошо знают ваш бренд. Поддерживайте темп."]
                        : s >= 50 ? ["Средняя видимость 📈", "Есть потенциал для роста. Несколько шагов — и нейросети будут рекомендовать вас чаще."]
                        : s >= 25 ? ["Низкая видимость ⚠️", "Нейросети редко называют ваш бренд. Хорошая новость — это легко исправить."]
                        :           ["Почти не видны 🔴", "Нейросети пока не знают о вас. Начните с задач в «Плане работ»."];
                      return (
                        <>
                          <p className="text-[17px] font-semibold text-[#1a1a1a]">{status}</p>
                          <p className="mt-1.5 max-w-sm text-[13px] text-[#787774] leading-relaxed">{hint}</p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3.5 py-2 text-[12px] text-[#555]">
                      <Search className="h-3.5 w-3.5 text-[#787774]" />
                      Узнаваемость — <strong className="text-[#1a1a1a] ml-0.5">{sovPercent}%</strong>
                      <span className="text-[#BBBBBB] ml-0.5">({sovMentioned}/{sovTotal})</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3.5 py-2 text-[12px] text-[#555]">
                      <Lightbulb className="h-3.5 w-3.5 text-[#787774]" />
                      Задач в плане — <strong className="text-[#1a1a1a] ml-0.5">{report.recommendations.length}</strong>
                    </span>
                    {report.sentiment && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium ${
                        report.sentiment === "positive"  ? "border border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                        : report.sentiment === "negative" ? "border border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]"
                        :                                   "border border-[#EAEAEA] bg-[#F7F6F3] text-[#787774]"
                      }`}>
                        {report.sentiment === "positive" ? "👍 Позитивный тон" : report.sentiment === "negative" ? "👎 Негативный тон" : "➖ Нейтральный тон"}
                      </span>
                    )}
                    {report.categorySearched && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3.5 py-2 text-[12px] text-[#555]">
                        🏷️ {report.categorySearched}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score breakdown (instant) + history charts (async) */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">Из чего складывается оценка</p>
                  <p className="text-[11px] text-[#BBBBBB] mb-5">Каждый фактор влияет на то, рекомендуют ли вас нейросети</p>
                  <div className="space-y-4">
                    <ScoreBreakdownBar label="Узнаваемость в АИ"         value={report.scoreSov ?? sovPercent}                              icon={<Search    className="h-3.5 w-3.5" />} />
                    <ScoreBreakdownBar label="Разметка для роботов"       value={report.scoreSchema ?? (schemaTypes.length > 0 ? 60 : 0)}   icon={<FileText  className="h-3.5 w-3.5" />} />
                    <ScoreBreakdownBar label="Визитка для АИ (llms.txt)"  value={report.scoreLlmsTxt ?? (report.hasLlmsTxt ? 80 : 0)}       icon={<Zap       className="h-3.5 w-3.5" />} />
                    <ScoreBreakdownBar label="Качество контента"          value={report.scoreContent ?? 50}                                 icon={<BarChart3 className="h-3.5 w-3.5" />} />
                    <ScoreBreakdownBar label="Репутация бренда"           value={report.scoreAuthority ?? 30}                               icon={<Shield    className="h-3.5 w-3.5" />} />
                  </div>
                </div>

                {/* ⬇ async: fetches score history for this project */}
                <Suspense fallback={<CardSkeleton rows={6} />}>
                  <ScoreHistorySection
                    projectId={report.projectId}
                    reportId={report.id}
                    overallScore={report.overallScore ?? 0}
                    createdAt={report.createdAt.toISOString()}
                  />
                </Suspense>
              </div>

              {/* ⬇ async: fetches & filters competitors */}
              <Suspense fallback={<CardSkeleton rows={5} />}>
                <CompetitorsSection
                  reportId={report.id}
                  projectUrl={report.project.url}
                  projectName={report.project.name}
                  isPro={isPro}
                />
              </Suspense>

              {/* ⬇ async: fetches gaps logic (renders nothing if no gaps) */}
              <Suspense fallback={null}>
                <ContentGapsSection
                  reportId={report.id}
                  projectUrl={report.project.url}
                  projectName={report.project.name}
                />
              </Suspense>

            </TabsContent>

            {/* ── TAB 2: Где вас ищут — entire tab async ──────────────────── */}
            <TabsContent value="sov" className="space-y-6 mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <SovTabSection
                  reportId={report.id}
                  projectUrl={report.project.url}
                  projectName={report.project.name}
                />
              </Suspense>
            </TabsContent>

            {/* ── TAB 3: План работ — entire tab async ────────────────────── */}
            <TabsContent value="plan" className="space-y-6 mt-0">
              <Suspense fallback={<TabSkeleton />}>
                <PlanTabSection reportId={report.id} />
              </Suspense>
            </TabsContent>

          </Tabs>
        </div>
      )}
    </div>
  );
}
