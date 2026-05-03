import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Globe, Calendar, Shield, FileText, Zap, Users, BarChart3,
  Search, Lightbulb, CheckCircle2, XCircle, Megaphone, Bot,
} from "lucide-react";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { SiteChecklist } from "@/components/site-checklist";
import { CompetitorsTable } from "@/components/competitors-table";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { LlmsTxtBlock } from "@/components/llms-txt-block";
import { RagVisualizer } from "@/components/ui/rag-visualizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentGaps, type ContentGapItem } from "@/components/content-gaps";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const report = await prisma.report.findUnique({
    where: { shareId },
    include: {
      project: { select: { name: true, url: true } },
      shareOfVoices: { orderBy: { createdAt: "asc" } },
      recommendations: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!report || report.status !== "COMPLETED") notFound();

  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  const targetBrand = (() => {
    try {
      const hostname = new URL(report.project.url).hostname.replace(/^www\./, "");
      return hostname.split(".")[0].toLowerCase();
    } catch {
      return report.project.name.toLowerCase();
    }
  })();

  const allCompetitors = report.shareOfVoices
    .flatMap((sov) => {
      const comps = sov.competitors as { name: string; url?: string }[];
      return Array.isArray(comps) ? comps : [];
    })
    .filter((c) => {
      const name = c.name.toLowerCase().trim();
      return !name.includes(targetBrand) && !targetBrand.includes(name.replace(/\s+/g, ""));
    });

  const competitorMap = new Map<string, number>();
  for (const c of allCompetitors) {
    competitorMap.set(c.name, (competitorMap.get(c.name) ?? 0) + 1);
  }
  const topCompetitors = [...competitorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      mentions: count,
      percent: sovTotal > 0 ? Math.round((count / sovTotal) * 100) : 0,
    }));

  const topCompetitorNames = topCompetitors.map((c) => c.name).slice(0, 5);
  const schemaTypes = Array.isArray(report.schemaOrgTypes) ? (report.schemaOrgTypes as string[]) : [];
  const score = report.overallScore ? Math.round(report.overallScore) : 0;

  // Digital PR
  type PrMention = { platform: string; mentioned: boolean; url?: string; context: string; sentiment?: string };
  const digitalPrMentions: PrMention[] =
    report.digitalPr && Array.isArray(report.digitalPr) ? (report.digitalPr as PrMention[]) : [];

  const PLATFORM_LABELS: Record<string, string> = {
    "vc.ru": "VC.ru", "habr.com": "Хабр", "pikabu.ru": "Пикабу",
    "otzovik.com": "Отзовик", "yandex.ru/maps": "Яндекс Карты",
    "2gis.ru": "2ГИС", "reddit.com": "Reddit", "quora.com": "Quora",
    "producthunt.com": "Product Hunt", "trustpilot.com": "Trustpilot",
  };

  function localizeContext(ctx: string, platform: string, mentioned: boolean): string {
    if (!ctx?.trim()) {
      const lbl = PLATFORM_LABELS[platform] ?? platform;
      return mentioned ? `Бренд упоминается на ${lbl}` : `Упоминания на ${lbl} не найдены`;
    }
    const cyrillicCount = (ctx.match(/[а-яА-ЯёЁ]/g) || []).length;
    const latinCount = (ctx.match(/[a-zA-Z]/g) || []).length;
    const total = cyrillicCount + latinCount;
    if (total > 0 && cyrillicCount / total > 0.4) return ctx;
    const lbl = PLATFORM_LABELS[platform] ?? platform;
    return mentioned ? `Бренд упоминается на ${lbl}` : `Органические упоминания на ${lbl} не найдены`;
  }

  // Content Gaps
  const existingRecTypes = new Set(report.recommendations.map((r) => r.type));
  const missedKeywords = report.shareOfVoices.filter((s) => !s.isMentioned);
  const contentGaps: ContentGapItem[] = [];
  if (!existingRecTypes.has("content") && !existingRecTypes.has("rag-content")) {
    if (missedKeywords[0] && topCompetitorNames[0]) {
      contentGaps.push({
        topic: `Контент по теме «${missedKeywords[0].keyword}»`,
        competitorSource: topCompetitorNames[0],
        aiInsight: `Когда клиенты спрашивают нейросеть «${missedKeywords[0].keyword}», она рекомендует ${topCompetitorNames[0]}, а не вас.`,
        actionText: "Создать контент",
        actionType: "content",
      });
    }
    if (missedKeywords[1] && topCompetitorNames[0]) {
      const comp = topCompetitorNames[Math.min(1, topCompetitorNames.length - 1)];
      contentGaps.push({
        topic: `Экспертная статья: «${missedKeywords[1].keyword}»`,
        competitorSource: comp,
        aiInsight: `По запросу «${missedKeywords[1].keyword}» АИ ссылается на ${comp}.`,
        actionText: "Создать контент",
        actionType: "content",
      });
    }
  }
  if (!report.hasLlmsTxt && !existingRecTypes.has("llms-txt")) {
    contentGaps.push({
      topic: "Визитка для нейросетей (llms.txt)",
      competitorSource: topCompetitorNames[0] ?? "лидеры ниши",
      aiInsight: "У лидеров ниши есть специальный файл-визитка. У вас такого файла нет — АИ вас просто не видит.",
      actionText: "Создать визитку",
      actionType: "llms-txt",
    });
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Header */}
      <div className="border-b border-[#EAEAEA] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-[#787774]">
            <Globe className="h-4 w-4" />
            <span>Публичный отчёт AI-видимости</span>
          </div>
          <h1 className="mt-2 text-lg font-bold tracking-tight text-[#1a1a1a]">{report.project.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#BBBBBB]">
            <span>{report.project.url}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {report.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <Tabs defaultValue="summary" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#F7F6F3] border border-[#EAEAEA] rounded-xl h-auto p-1">
            <TabsTrigger value="summary" className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Сводка</TabsTrigger>
            <TabsTrigger value="sov"     className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">Где вас ищут</TabsTrigger>
            <TabsTrigger value="plan"    className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">План работ</TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Сводка ── */}
          <TabsContent value="summary" className="space-y-6 mt-0">

            {/* Hero score */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-8">
              <div className="flex flex-col items-center text-center gap-6">
                <ScoreRing score={score} size={180} strokeWidth={10} />
                <div>
                  {(() => {
                    const s = score;
                    const [status, hint] =
                      s >= 75 ? ["Отличная видимость 🎉", "Нейросети хорошо знают ваш бренд."]
                      : s >= 50 ? ["Средняя видимость 📈", "Есть потенциал для роста."]
                      : s >= 25 ? ["Низкая видимость ⚠️", "Нейросети редко называют ваш бренд."]
                      :           ["Почти не видны 🔴", "Нейросети пока не знают о вас."];
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
                    Узнаваемость — <strong className="ml-0.5 text-[#1a1a1a]">{sovPercent}%</strong>
                    <span className="ml-0.5 text-[#BBBBBB]">({sovMentioned}/{sovTotal})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3.5 py-2 text-[12px] text-[#555]">
                    <Lightbulb className="h-3.5 w-3.5 text-[#787774]" />
                    Задач в плане — <strong className="ml-0.5 text-[#1a1a1a]">{report.recommendations.length}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-[#FBFBFA] px-3.5 py-2 text-[12px] text-[#555]">
                    <Users className="h-3.5 w-3.5 text-[#787774]" />
                    Конкурентов — <strong className="ml-0.5 text-[#1a1a1a]">{new Set(allCompetitors.map((c) => c.name.toLowerCase().trim())).size}</strong>
                  </span>
                  {report.sentiment && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium ${
                      report.sentiment === "positive" ? "border border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                      : report.sentiment === "negative" ? "border border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]"
                      : "border border-[#EAEAEA] bg-[#F7F6F3] text-[#787774]"
                    }`}>
                      {report.sentiment === "positive" ? "👍 Позитивный тон" : report.sentiment === "negative" ? "👎 Негативный тон" : "➖ Нейтральный тон"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <p className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">Из чего складывается оценка</p>
              <p className="text-[11px] text-[#BBBBBB] mb-5">Каждый фактор влияет на то, рекомендуют ли вас нейросети</p>
              <div className="space-y-4">
                <ScoreBreakdownBar label="Узнаваемость в АИ"         value={Math.round(report.scoreSov ?? sovPercent)}                            icon={<Search    className="h-3.5 w-3.5" />} />
                <ScoreBreakdownBar label="Разметка для роботов"       value={Math.round(report.scoreSchema ?? (schemaTypes.length > 0 ? 60 : 0))} icon={<FileText  className="h-3.5 w-3.5" />} />
                <ScoreBreakdownBar label="Визитка для АИ (llms.txt)"  value={Math.round(report.scoreLlmsTxt ?? (report.hasLlmsTxt ? 80 : 0))}     icon={<Zap       className="h-3.5 w-3.5" />} />
                <ScoreBreakdownBar label="Качество контента"          value={Math.round(report.scoreContent ?? 50)}                               icon={<BarChart3 className="h-3.5 w-3.5" />} />
                <ScoreBreakdownBar label="Репутация бренда"           value={Math.round(report.scoreAuthority ?? 30)}                             icon={<Shield    className="h-3.5 w-3.5" />} />
              </div>
            </div>

            {/* Competitors */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
              <p className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">Конкуренты в вашей нише</p>
              <p className="text-[11px] text-[#BBBBBB] mb-5">Бренды, которые нейросети рекомендуют в вашей категории</p>
              {topCompetitors.length > 0 ? (
                <CompetitorsTable competitors={topCompetitors} isPdf={true} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Users className="h-5 w-5 text-[#BBBBBB]" />
                  <p className="text-sm text-[#787774]">Нейросети пока не определили прямых конкурентов</p>
                </div>
              )}
            </div>

            {/* Content Gaps */}
            {contentGaps.length > 0 && (
              <ContentGaps
                gaps={contentGaps}
                projectUrl={report.project.url}
                siteTitle={report.siteTitle ?? report.project.name}
              />
            )}
          </TabsContent>

          {/* ── TAB 2: Где вас ищут ── */}
          <TabsContent value="sov" className="space-y-6 mt-0">

            <div className="rounded-xl border border-[#E1F3FE] bg-[#F0F7FF] px-5 py-4">
              <div className="flex items-start gap-3">
                <Search className="mt-0.5 h-5 w-5 shrink-0 text-[#1A6FBF]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">
                    Нейросетям задали {sovTotal} вопрос{sovTotal === 1 ? "" : sovTotal < 5 ? "а" : "ов"} о вашей нише
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#555]">
                    Вас рекомендовали в <strong>{sovMentioned}</strong> из <strong>{sovTotal}</strong> случаев — это {sovPercent}%.
                  </p>
                </div>
              </div>
            </div>

            {sovTotal > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Recommended */}
                <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-5 py-3.5">
                    <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">Вас рекомендуют</span>
                    <span className="ml-auto rounded-full bg-[#EDF3EC] px-2 py-0.5 text-[11px] font-semibold text-[#2D6A4F]">{sovMentioned}</span>
                  </div>
                  <div className="divide-y divide-[#F7F6F3]">
                    {report.shareOfVoices.filter((s) => s.isMentioned).length === 0 ? (
                      <p className="px-5 py-6 text-[12px] text-[#BBBBBB] text-center">Пока нет упоминаний</p>
                    ) : report.shareOfVoices.filter((s) => s.isMentioned).map((sov) => (
                      <div key={sov.id} className="px-5 py-3.5">
                        <p className="text-[13px] font-medium text-[#1a1a1a]">{sov.keyword}</p>
                        {sov.mentionContext && (
                          <p className="mt-0.5 text-[11px] text-[#787774] leading-relaxed line-clamp-2">{sov.mentionContext}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ignored */}
                <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-5 py-3.5">
                    <XCircle className="h-4 w-4 text-[#B02A37]" />
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">Вас игнорируют</span>
                    <span className="ml-auto rounded-full bg-[#FDEBEC] px-2 py-0.5 text-[11px] font-semibold text-[#B02A37]">{sovTotal - sovMentioned}</span>
                  </div>
                  <div className="divide-y divide-[#F7F6F3]">
                    {report.shareOfVoices.filter((s) => !s.isMentioned).length === 0 ? (
                      <p className="px-5 py-6 text-[12px] text-[#BBBBBB] text-center">Отлично — пропущенных нет!</p>
                    ) : report.shareOfVoices.filter((s) => !s.isMentioned).map((sov) => {
                      const comps = ((sov.competitors as { name: string }[]) ?? []).filter((c) => {
                        const n = c.name.toLowerCase().trim();
                        return !n.includes(targetBrand) && !targetBrand.includes(n.replace(/\s+/g, ""));
                      });
                      return (
                        <div key={sov.id} className="px-5 py-3.5">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{sov.keyword}</p>
                          {comps.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <span className="text-[10px] text-[#BBBBBB] mr-0.5">Вместо вас:</span>
                              {comps.slice(0, 3).map((c, ci) => (
                                <span key={ci} className="inline-flex rounded border border-[#EAEAEA] bg-[#FAFAFA] px-1.5 py-0.5 text-[10px] text-[#787774]">{c.name}</span>
                              ))}
                              {comps.length > 3 && <span className="text-[10px] text-[#BBBBBB]">+{comps.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#EAEAEA] bg-white p-12 flex flex-col items-center gap-3 text-center">
                <Search className="h-5 w-5 text-[#BBBBBB]" />
                <p className="text-sm text-[#787774]">Данных об упоминаниях пока нет</p>
              </div>
            )}

            {/* Digital PR */}
            {digitalPrMentions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-[#787774]" />
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">Digital PR — где о вас говорят</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {digitalPrMentions.map((mention) => (
                    <div key={mention.platform} className={`rounded-xl border p-5 ${mention.mentioned ? "border-[#D1E7DD]/60 bg-[#FAFCFA]" : "border-[#EAEAEA] bg-white"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-[#1a1a1a]">{PLATFORM_LABELS[mention.platform] ?? mention.platform}</span>
                        {mention.mentioned ? <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" /> : <XCircle className="h-4 w-4 text-[#BBBBBB]" />}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#787774] line-clamp-3">
                        {localizeContext(mention.context, mention.platform, mention.mentioned)}
                      </p>
                      {mention.url && mention.mentioned && (
                        <a href={mention.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-[10px] font-medium text-[#555] hover:text-[#1a1a1a] transition-colors">
                          Открыть →
                        </a>
                      )}
                      {mention.sentiment && (
                        <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          mention.sentiment === "positive" ? "bg-[#EDF3EC] text-[#2D6A4F]"
                          : mention.sentiment === "negative" ? "bg-[#FDEBEC] text-[#B02A37]"
                          : "bg-[#F7F6F3] text-[#787774]"
                        }`}>
                          {mention.sentiment === "positive" ? "Позитивно" : mention.sentiment === "negative" ? "Негативно" : "Нейтрально"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── TAB 3: План работ ── */}
          <TabsContent value="plan" className="space-y-6 mt-0">

            {/* Checklist */}
            <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-[#EAEAEA] px-6 py-4">
                <Shield className="h-4 w-4 text-[#787774]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">Текущее техническое состояние</p>
                  <p className="text-[11px] text-[#BBBBBB]">Что видят и не видят нейросети на вашем сайте</p>
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

            {/* Recommendations */}
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

            {/* llms.txt standalone */}
            {report.generatedLlmsTxt && !report.recommendations.some((r) => r.type === "llms-txt") && (
              <LlmsTxtBlock content={report.generatedLlmsTxt} siteUrl={report.project.url} />
            )}

            {/* RagVisualizer */}
            {report.scrapedBody && (
              <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-[#EAEAEA] px-6 py-4">
                  <Bot className="h-4 w-4 text-[#787774]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">🤖 Технический лог (для разработчиков)</p>
                    <p className="text-[11px] text-[#BBBBBB]">Подробный разбор того, как парсеры ИИ видят структуру вашего контента.</p>
                  </div>
                </div>
                <div className="p-6">
                  <RagVisualizer text={report.scrapedBody} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-8 text-center text-xs text-[#BBBBBB]">
          Создано с помощью Geo Studio — анализ AI-видимости сайтов
        </p>
      </div>
    </div>
  );
}
