/**
 * Async Server Components for the report dashboard.
 * Each component fetches ONLY the data it needs and renders independently.
 * They are wrapped in <Suspense> in the main page so the shell renders immediately.
 */

import { prisma } from "@/lib/prisma";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Megaphone,
  Shield,
  Bot,
} from "lucide-react";
import { ScoreHistoryChart } from "@/components/score-history-chart";
import { VisibilityTrendChart } from "@/components/visibility-trend-chart-wrapper";
import { CompetitorsTable } from "@/components/competitors-table";
import { ContentGaps, type ContentGapItem } from "@/components/content-gaps";
import { SiteChecklist } from "@/components/site-checklist";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { LlmsTxtBlock } from "@/components/llms-txt-block";
import { RagVisualizer } from "@/components/ui/rag-visualizer";

// ─── helpers ────────────────────────────────────────────────────────────────

function extractTargetBrand(url: string, fallbackName: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.split(".")[0].toLowerCase();
  } catch {
    return fallbackName.toLowerCase();
  }
}

function filterCompetitors(
  raw: { name: string; url?: string }[],
  targetBrand: string
) {
  return raw.filter((c) => {
    const name = c.name.toLowerCase().trim();
    const url = (c.url ?? "").toLowerCase();
    return (
      !name.includes(targetBrand) &&
      !targetBrand.includes(name.replace(/\s+/g, "")) &&
      !url.includes(targetBrand)
    );
  });
}

// ─── Score history + trend charts ───────────────────────────────────────────

export async function ScoreHistorySection({
  projectId,
  reportId,
  overallScore,
  createdAt,
}: {
  projectId: string;
  reportId: string;
  overallScore: number;
  createdAt: string;
}) {
  const scoreHistory = await prisma.report.findMany({
    where: {
      projectId,
      status: "COMPLETED",
      overallScore: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, overallScore: true, createdAt: true },
  });

  const historyData = scoreHistory.map((r) => ({
    date: r.createdAt.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    }),
    score: Math.round(r.overallScore!),
    reportId: r.id,
  }));

  return (
    <div className="space-y-4">
      {historyData.length > 1 && <ScoreHistoryChart data={historyData} />}
      <VisibilityTrendChart
        currentScore={overallScore}
        createdAt={createdAt}
      />
    </div>
  );
}

// ─── Competitors table ───────────────────────────────────────────────────────

export async function CompetitorsSection({
  reportId,
  projectUrl,
  projectName,
  isPro,
}: {
  reportId: string;
  projectUrl: string;
  projectName: string;
  isPro: boolean;
}) {
  const sovRows = await prisma.shareOfVoice.findMany({
    where: { reportId },
    select: { competitors: true },
  });

  const targetBrand = extractTargetBrand(projectUrl, projectName);

  const raw = sovRows.flatMap((s) =>
    Array.isArray(s.competitors)
      ? (s.competitors as { name: string; url?: string }[])
      : []
  );
  const competitors = filterCompetitors(raw, targetBrand);
  const uniqueCount = new Set(competitors.map((c) => c.name.toLowerCase().trim())).size;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      <p className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">
        Конкуренты в вашей нише
      </p>
      <p className="text-[11px] text-[#BBBBBB] mb-5">
        {competitors.length > 0
          ? "Бренды, которые нейросети рекомендуют вместо вас"
          : "После следующего анализа здесь появятся бренды-конкуренты"}
      </p>
      {competitors.length > 0 ? (
        <CompetitorsTable competitors={competitors} isPro={isPro} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Users className="h-5 w-5 text-[#BBBBBB]" />
          <p className="text-sm text-[#787774]">
            Нейросети пока не определили прямых конкурентов
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Content Gaps insights ───────────────────────────────────────────────────

export async function ContentGapsSection({
  reportId,
  projectUrl,
  projectName,
}: {
  reportId: string;
  projectUrl: string;
  projectName: string;
}) {
  const [sovRows, recTypes, report] = await Promise.all([
    prisma.shareOfVoice.findMany({
      where: { reportId },
      select: { isMentioned: true, keyword: true, competitors: true },
    }),
    prisma.recommendation.findMany({
      where: { reportId },
      select: { type: true },
    }),
    prisma.report.findUnique({
      where: { id: reportId },
      select: { hasLlmsTxt: true, schemaOrgTypes: true, siteTitle: true },
    }),
  ]);

  if (!report) return null;

  const targetBrand = extractTargetBrand(projectUrl, projectName);
  const existingRecTypes = new Set(recTypes.map((r) => r.type));
  const missedKeywords = sovRows.filter((s) => !s.isMentioned);
  const schemaTypes = Array.isArray(report.schemaOrgTypes)
    ? (report.schemaOrgTypes as string[])
    : [];

  const raw = sovRows.flatMap((s) =>
    Array.isArray(s.competitors)
      ? (s.competitors as { name: string; url?: string }[])
      : []
  );
  const topCompetitorNames = Array.from(
    new Set(
      filterCompetitors(raw, targetBrand)
        .map((c) => c.name.trim())
        .filter((n) => n.length > 0)
    )
  ).slice(0, 5);

  const contentGaps: ContentGapItem[] = [];

  if (!existingRecTypes.has("content") && !existingRecTypes.has("rag-content")) {
    if (missedKeywords.length > 0 && topCompetitorNames.length > 0) {
      contentGaps.push({
        topic: `Контент по теме «${missedKeywords[0].keyword}»`,
        competitorSource: topCompetitorNames[0],
        aiInsight: `Когда клиенты спрашивают нейросеть «${missedKeywords[0].keyword}», она рекомендует ${topCompetitorNames[0]}, а не вас.`,
        actionText: "Создать контент",
        actionType: "content",
      });
    }
    if (missedKeywords.length > 1 && topCompetitorNames.length > 0) {
      const comp = topCompetitorNames[Math.min(1, topCompetitorNames.length - 1)];
      contentGaps.push({
        topic: `Экспертная статья: «${missedKeywords[1].keyword}»`,
        competitorSource: comp,
        aiInsight: `По запросу «${missedKeywords[1].keyword}» АИ ссылается на ${comp}. Напишите глубокий материал — и нейросети начнут ссылаться на вас.`,
        actionText: "Создать контент",
        actionType: "content",
      });
    }
  }

  if (!report.hasLlmsTxt && !existingRecTypes.has("llms-txt")) {
    contentGaps.push({
      topic: "Визитка для нейросетей (llms.txt)",
      competitorSource: topCompetitorNames[0] ?? "лидеры ниши",
      aiInsight:
        "У лидеров ниши есть специальный файл-визитка. У вас такого файла нет — АИ вас просто не видит.",
      actionText: "Создать визитку",
      actionType: "llms-txt",
    });
  }

  if (
    schemaTypes.length === 0 &&
    report.hasLlmsTxt &&
    !existingRecTypes.has("schema-faq")
  ) {
    contentGaps.push({
      topic: "FAQ / глоссарий терминов",
      competitorSource: topCompetitorNames[0] ?? "лидеры ниши",
      aiInsight:
        "У конкурентов есть FAQ-раздел. Нейросети активно берут из него информацию.",
      actionText: "Создать FAQ",
      actionType: "faq",
    });
  }

  if (contentGaps.length === 0) return null;

  return (
    <ContentGaps
      gaps={contentGaps}
      projectUrl={projectUrl}
      siteTitle={report.siteTitle ?? projectName}
    />
  );
}

// ─── "Где вас ищут" tab ──────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  "vc.ru": "VC.ru",
  "habr.com": "Хабр",
  "pikabu.ru": "Пикабу",
  "otzovik.com": "Отзовик",
  "yandex.ru/maps": "Яндекс Карты",
  "2gis.ru": "2ГИС",
  "reddit.com": "Reddit",
  "quora.com": "Quora",
  "producthunt.com": "Product Hunt",
  "trustpilot.com": "Trustpilot",
};

function localizeContext(ctx: string, platform: string, mentioned: boolean): string {
  if (!ctx || ctx.trim().length === 0) {
    const lbl = PLATFORM_LABELS[platform] ?? platform;
    return mentioned
      ? `Бренд упоминается на ${lbl}`
      : `Упоминания на ${lbl} не найдены`;
  }
  const cyrillicCount = (ctx.match(/[а-яА-ЯёЁ]/g) || []).length;
  const latinCount = (ctx.match(/[a-zA-Z]/g) || []).length;
  const total = cyrillicCount + latinCount;
  if (total > 0 && cyrillicCount / total > 0.4) return ctx;
  const lbl = PLATFORM_LABELS[platform] ?? platform;
  return mentioned
    ? `Бренд упоминается на ${lbl}`
    : `Органические упоминания на ${lbl} не найдены`;
}

export async function SovTabSection({
  reportId,
  projectUrl,
  projectName,
}: {
  reportId: string;
  projectUrl: string;
  projectName: string;
}) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      digitalPr: true,
      shareOfVoices: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          keyword: true,
          isMentioned: true,
          mentionContext: true,
          competitors: true,
        },
      },
    },
  });

  if (!report) return null;

  const targetBrand = extractTargetBrand(projectUrl, projectName);
  const sovList = report.shareOfVoices;
  const sovTotal = sovList.length;
  const sovMentioned = sovList.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  const digitalPr =
    Array.isArray(report.digitalPr) && report.digitalPr.length > 0
      ? (report.digitalPr as {
          platform: string;
          mentioned: boolean;
          url?: string;
          context: string;
          sentiment?: string;
        }[])
      : null;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-xl border border-[#E1F3FE] bg-[#F0F7FF] px-5 py-4">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-[#1A6FBF]" />
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">
              Мы задали нейросетям {sovTotal} вопрос
              {sovTotal === 1 ? "" : sovTotal < 5 ? "а" : "ов"} о вашей нише
            </p>
            <p className="mt-0.5 text-[12px] text-[#555]">
              Вас рекомендовали в <strong>{sovMentioned}</strong> из{" "}
              <strong>{sovTotal}</strong> случаев — это {sovPercent}%.
            </p>
          </div>
        </div>
      </div>

      {sovTotal > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Рекомендуют */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-5 py-3.5">
              <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
              <span className="text-[13px] font-semibold text-[#1a1a1a]">
                Вас рекомендуют
              </span>
              <span className="ml-auto rounded-full bg-[#EDF3EC] px-2 py-0.5 text-[11px] font-semibold text-[#2D6A4F]">
                {sovMentioned}
              </span>
            </div>
            <div className="divide-y divide-[#F7F6F3]">
              {sovMentioned === 0 ? (
                <p className="px-5 py-6 text-[12px] text-[#BBBBBB] text-center">
                  Пока нет упоминаний
                </p>
              ) : (
                sovList
                  .filter((s) => s.isMentioned)
                  .map((sov) => (
                    <div key={sov.id} className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-[#1a1a1a]">
                        {sov.keyword}
                      </p>
                      {sov.mentionContext && (
                        <p className="mt-0.5 text-[11px] text-[#787774] leading-relaxed line-clamp-2">
                          {sov.mentionContext}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Игнорируют */}
          <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-5 py-3.5">
              <XCircle className="h-4 w-4 text-[#B02A37]" />
              <span className="text-[13px] font-semibold text-[#1a1a1a]">
                Вас игнорируют
              </span>
              <span className="ml-auto rounded-full bg-[#FDEBEC] px-2 py-0.5 text-[11px] font-semibold text-[#B02A37]">
                {sovTotal - sovMentioned}
              </span>
            </div>
            <div className="divide-y divide-[#F7F6F3]">
              {sovTotal - sovMentioned === 0 ? (
                <p className="px-5 py-6 text-[12px] text-[#BBBBBB] text-center">
                  Отлично — пропущенных нет!
                </p>
              ) : (
                sovList
                  .filter((s) => !s.isMentioned)
                  .map((sov) => {
                    const comps = (
                      sov.competitors as { name: string }[]
                    )?.filter((c) => {
                      const n = c.name.toLowerCase().trim();
                      return (
                        !n.includes(targetBrand) &&
                        !targetBrand.includes(n.replace(/\s+/g, ""))
                      );
                    }) ?? [];
                    return (
                      <div key={sov.id} className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-[#1a1a1a]">
                          {sov.keyword}
                        </p>
                        {comps.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="text-[10px] text-[#BBBBBB] mr-0.5">
                              Вместо вас:
                            </span>
                            {comps.slice(0, 3).map((c, ci) => (
                              <span
                                key={ci}
                                className="inline-flex rounded border border-[#EAEAEA] bg-[#FAFAFA] px-1.5 py-0.5 text-[10px] text-[#787774]"
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
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-12 flex flex-col items-center gap-3 text-center">
          <Search className="h-5 w-5 text-[#BBBBBB]" />
          <p className="text-sm text-[#787774]">
            Данных об упоминаниях пока нет
          </p>
        </div>
      )}

      {/* Digital PR */}
      {digitalPr && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[#787774]" />
            <p className="text-[13px] font-semibold text-[#1a1a1a]">
              Digital PR — где о вас говорят
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {digitalPr.map((mention) => (
              <div
                key={mention.platform}
                className={`rounded-xl border p-5 ${
                  mention.mentioned
                    ? "border-[#D1E7DD]/60 bg-[#FAFCFA]"
                    : "border-[#EAEAEA] bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">
                    {PLATFORM_LABELS[mention.platform] ?? mention.platform}
                  </span>
                  {mention.mentioned ? (
                    <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#BBBBBB]" />
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-[#787774] line-clamp-3">
                  {localizeContext(
                    mention.context,
                    mention.platform,
                    mention.mentioned
                  )}
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
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      mention.sentiment === "positive"
                        ? "bg-[#EDF3EC] text-[#2D6A4F]"
                        : mention.sentiment === "negative"
                        ? "bg-[#FDEBEC] text-[#B02A37]"
                        : "bg-[#F7F6F3] text-[#787774]"
                    }`}
                  >
                    {mention.sentiment === "positive"
                      ? "Позитивно"
                      : mention.sentiment === "negative"
                      ? "Негативно"
                      : "Нейтрально"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── "План работ" tab ────────────────────────────────────────────────────────

export async function PlanTabSection({ reportId }: { reportId: string }) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      hasLlmsTxt: true,
      schemaOrgTypes: true,
      contentLength: true,
      siteTitle: true,
      siteDescription: true,
      siteH1: true,
      robotsTxtAiFriendly: true,
      semanticHtmlValid: true,
      generatedLlmsTxt: true,
      scrapedBody: true,
      project: { select: { url: true } },
      recommendations: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          generatedCode: true,
        },
      },
    },
  });

  if (!report) return null;

  const schemaTypes = Array.isArray(report.schemaOrgTypes)
    ? (report.schemaOrgTypes as string[])
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Диагностика */}
      <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-[#EAEAEA] px-6 py-4">
          <Shield className="h-4 w-4 text-[#787774]" />
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">
              Текущее техническое состояние
            </p>
            <p className="text-[11px] text-[#BBBBBB]">
              Что видят и не видят нейросети на вашем сайте
            </p>
          </div>
        </div>
        <div className="p-6">
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
        </div>
      </div>

      {/* 2. Задачи */}
      <RecommendationsPanel
        recommendations={report.recommendations.map((rec) => ({
          id: rec.id,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          generatedCode: rec.generatedCode,
        }))}
        projectUrl={report.project.url}
        generatedLlmsTxt={report.generatedLlmsTxt ?? undefined}
      />

      {/* llms.txt block — only if not inside RecommendationsPanel */}
      {report.generatedLlmsTxt &&
        !report.recommendations.some((r) => r.type === "llms-txt") && (
          <LlmsTxtBlock
            content={report.generatedLlmsTxt}
            siteUrl={report.project.url}
          />
        )}

      {/* 3. Технический лог */}
      {report.scrapedBody && (
        <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-[#EAEAEA] px-6 py-4">
            <Bot className="h-4 w-4 text-[#787774]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">
                🤖 Технический лог (для разработчиков)
              </p>
              <p className="text-[11px] text-[#BBBBBB]">
                Подробный разбор того, как парсеры ИИ видят структуру вашего
                контента.
              </p>
            </div>
          </div>
          <div className="p-6">
            <RagVisualizer text={report.scrapedBody} />
          </div>
        </div>
      )}
    </div>
  );
}
