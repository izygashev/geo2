import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Globe, Calendar, Shield, FileText, Zap, Users, BarChart3 } from "lucide-react";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { SiteChecklist } from "@/components/site-checklist";
import { SovDonutChart, SovBarChart } from "@/components/sov-charts";
import { CompetitorsTable } from "@/components/competitors-table";
import { RecommendationsPanel } from "@/components/recommendations-panel";

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

  if (!report || report.status !== "COMPLETED") {
    notFound();
  }

  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  // Extract target brand from URL for filtering
  const targetBrand = (() => {
    try {
      const hostname = new URL(report.project.url).hostname.replace(/^www\./, "");
      return hostname.split(".")[0].toLowerCase();
    } catch {
      return report.project.name.toLowerCase();
    }
  })();

  const competitors = new Map<string, number>();
  for (const sov of report.shareOfVoices) {
    const comps = (sov.competitors as string[]) ?? [];
    for (const c of comps) {
      // Filter out the target brand
      const cLower = c.toLowerCase().trim();
      if (cLower.includes(targetBrand) || targetBrand.includes(cLower.replace(/\s+/g, ""))) continue;
      competitors.set(c, (competitors.get(c) ?? 0) + 1);
    }
  }
  const topCompetitors = [...competitors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      mentions: count,
      percent: sovTotal > 0 ? Math.round((count / sovTotal) * 100) : 0,
    }));

  const score = report.overallScore ? Math.round(report.overallScore) : 0;

  const breakdownItems = [
    { label: "Share of Voice", value: report.scoreSov ?? 0, max: 30, icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { label: "Schema.org", value: report.scoreSchema ?? 0, max: 20, icon: <Shield className="h-3.5 w-3.5" /> },
    { label: "llms.txt", value: report.scoreLlmsTxt ?? 0, max: 15, icon: <FileText className="h-3.5 w-3.5" /> },
    { label: "Контент", value: report.scoreContent ?? 0, max: 20, icon: <Zap className="h-3.5 w-3.5" /> },
    { label: "Авторитет", value: report.scoreAuthority ?? 0, max: 15, icon: <Users className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      {/* Header */}
      <div className="border-b border-[#EAEAEA] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-[#787774]">
            <Globe className="h-4 w-4" />
            <span>Публичный отчёт AI-видимости</span>
          </div>
          <h1 className="mt-2 text-lg font-bold tracking-tight text-[#1a1a1a]">
            {report.project.name}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#BBBBBB]">
            <span>{report.project.url}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {report.createdAt.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Score */}
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ScoreRing score={score} size={120} />
            <div className="flex-1 space-y-2">
              {breakdownItems.map((item) => (
                <ScoreBreakdownBar
                  key={item.label}
                  label={item.label}
                  value={Math.round(item.value)}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <SiteChecklist
          hasLlmsTxt={report.hasLlmsTxt}
          schemaOrgTypes={report.schemaOrgTypes as string[]}
          siteTitle={report.siteTitle}
          siteDescription={report.siteDescription}
          siteH1={report.siteH1}
          contentLength={report.contentLength}
          robotsTxtAiFriendly={report.robotsTxtAiFriendly}
          semanticHtmlValid={report.semanticHtmlValid}
        />

        {/* SoV */}
        {sovTotal > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <SovDonutChart mentioned={sovMentioned} total={sovTotal} />
            <SovBarChart
              items={report.shareOfVoices.map((s) => ({
                keyword: s.keyword,
                isMentioned: s.isMentioned,
              }))}
            />
          </div>
        )}

        {/* Competitors — всегда показываем */}
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Топ AI-рекомендаций в нише
          </h2>
          {topCompetitors.length > 0 ? (
            <CompetitorsTable competitors={topCompetitors} />
          ) : (
            <p className="py-4 text-center text-sm text-[#787774]">
              AI-системы пока не определили конкурентов
            </p>
          )}
        </div>

        {/* Recommendations — Premium Panel */}
        {report.recommendations.length > 0 && (
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
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#BBBBBB]">
          Создано с помощью GEO SaaS — анализ AI-видимости сайтов
        </p>
      </div>
    </div>
  );
}
