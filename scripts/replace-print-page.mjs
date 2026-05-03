import { writeFileSync } from "fs";

const content = `import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Globe,
  Shield,
  Search,
  Bot,
  BarChart3,
  Code2,
  FileText
} from "lucide-react";
import { ScoreRing, ScoreBreakdownBar } from "@/components/score-ring";
import { SiteChecklist } from "@/components/site-checklist";
import { CompetitorsTable } from "@/components/competitors-table";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { LlmsTxtBlock } from "@/components/llms-txt-block";
import { RagVisualizer } from "@/components/ui/rag-visualizer";
import { ContentGaps } from "@/components/content-gaps";
import { VisibilityTrendChartWrapper } from "@/components/visibility-trend-chart-wrapper";
import type { DigitalPrMention } from "@/services/llm";

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      project: true,
      shareOfVoices: true,
      recommendations: true,
    },
  });

  if (!report) notFound();

  const sovTotal = report.shareOfVoices.length;
  const sovMentioned = report.shareOfVoices.filter((s) => s.isMentioned).length;
  const sovPercent = sovTotal > 0 ? Math.round((sovMentioned / sovTotal) * 100) : 0;

  const allCompetitors = report.shareOfVoices.flatMap((s) =>
    Array.isArray(s.competitors) ? s.competitors : []
  ) as { name: string; url?: string }[];

  const schemaTypes = Array.isArray(report.schemaOrgTypes)
    ? (report.schemaOrgTypes as string[])
    : [];

  const digitalPr = Array.isArray(report.digitalPr)
    ? (report.digitalPr as DigitalPrMention[])
    : [];

  const recommendedSov = report.shareOfVoices.filter((s) => s.isMentioned);
  const ignoredSov = report.shareOfVoices.filter((s) => !s.isMentioned);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] print:bg-white print:p-0 p-8 max-w-4xl mx-auto" data-report-ready="true">

      <header className="mb-8 border-b border-[#EAEAEA] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter">Отчёт AI-видимости</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#787774]">
              <Globe className="h-4 w-4" />
              <span className="font-medium text-[#1a1a1a]">{report.project.url}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#787774]">
              {report.createdAt.toLocaleDateString("ru-RU", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <p className="text-xs font-semibold text-[#1a1a1a] mt-1">Geo Studio</p>
          </div>
        </div>
      </header>

      <main className="space-y-12">
        <section className="print-section">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[#EAEAEA] pb-2">
            <BarChart3 className="h-5 w-5 text-[#787774]" /> Сводка
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6 flex flex-col items-center justify-center">
              <ScoreRing score={report.overallScore ?? 0} size={120} />
              <p className="mt-4 text-sm font-medium text-[#1a1a1a]">Общая AI-видимость</p>
            </div>
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6 space-y-4">
              <ScoreBreakdownBar label="Share of Voice" value={report.scoreSov ?? sovPercent} icon={<Search className="h-3.5 w-3.5" />} />
              <ScoreBreakdownBar label="Schema.org" value={report.scoreSchema ?? 0} icon={<Code2 className="h-3.5 w-3.5" />} />
              <ScoreBreakdownBar label="llms.txt" value={report.scoreLlmsTxt ?? (report.hasLlmsTxt ? 100 : 0)} icon={<FileText className="h-3.5 w-3.5" />} />
              <ScoreBreakdownBar label="Контент" value={report.scoreContent ?? 0} icon={<BarChart3 className="h-3.5 w-3.5" />} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6">
              <h3 className="text-sm font-semibold mb-4">Динамика видимости</h3>
              <VisibilityTrendChartWrapper currentScore={report.overallScore ?? 0} createdAt={report.createdAt.toISOString()} />
            </div>
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6">
              <h3 className="text-sm font-semibold mb-4">Главные конкуренты</h3>
              <CompetitorsTable competitors={allCompetitors} isPdf={true} />
            </div>
          </div>
          <div className="avoid-break">
            <ContentGaps gaps={[]} projectUrl={report.project.url} siteTitle={report.siteTitle ?? report.project.name} />
          </div>
        </section>

        <section className="print-section break-before-page">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[#EAEAEA] pb-2">
            <Search className="h-5 w-5 text-[#787774]" /> Где вас ищут
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6 bg-[#F0FDF4]/30">
              <h3 className="text-sm font-semibold text-[#15803D] mb-4">Вас рекомендуют ({recommendedSov.length})</h3>
              <ul className="space-y-3">
                {recommendedSov.map((s, i) => (
                  <li key={i} className="text-sm text-[#1a1a1a] flex items-start gap-2">
                    <span className="text-[#15803D] font-bold mt-0.5">✓</span>
                    <span className="leading-snug">{s.keyword}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6 bg-[#FEF2F2]/30">
              <h3 className="text-sm font-semibold text-[#B02A37] mb-4">Вас игнорируют ({ignoredSov.length})</h3>
              <ul className="space-y-3">
                {ignoredSov.map((s, i) => (
                  <li key={i} className="text-sm text-[#1a1a1a] flex items-start gap-2">
                    <span className="text-[#B02A37] font-bold mt-0.5">✗</span>
                    <span className="leading-snug">{s.keyword}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {digitalPr.length > 0 && (
            <div className="avoid-break rounded-xl border border-[#EAEAEA] p-6">
              <h3 className="text-sm font-semibold mb-4">Digital PR (Упоминания бренда)</h3>
              <div className="grid grid-cols-2 gap-4">
                {digitalPr.map((pr, i) => (
                  <div key={i} className="p-4 border border-[#F0EFEB] rounded-xl bg-[#FAFAF9]">
                    <p className="font-semibold text-sm text-[#1a1a1a]">{pr.platform}</p>
                    <p className="text-xs text-[#555] mt-2 leading-relaxed">{pr.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="print-section break-before-page">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[#EAEAEA] pb-2">
            <Shield className="h-5 w-5 text-[#787774]" /> План работ
          </h2>
          <div className="avoid-break mb-6">
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
          <div className="avoid-break mb-6">
            <RecommendationsPanel
              recommendations={report.recommendations.map(r => ({
                id: r.id, type: r.type, title: r.title, description: r.description, generatedCode: r.generatedCode
              }))}
              projectUrl={report.project.url}
              generatedLlmsTxt={report.generatedLlmsTxt ?? undefined}
              isPdf={true}
            />
          </div>
          {report.generatedLlmsTxt && !report.recommendations.some(r => r.type === "llms-txt") && (
            <div className="avoid-break mb-6">
              <LlmsTxtBlock content={report.generatedLlmsTxt} siteUrl={report.project.url} />
            </div>
          )}
          {report.scrapedBody && (
            <div className="avoid-break mt-6 rounded-xl border border-[#EAEAEA] overflow-hidden">
              <div className="bg-[#FAFAF9] px-6 py-4 border-b border-[#EAEAEA]">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Bot className="w-4 h-4"/> Рентген контента</h3>
              </div>
              <div className="p-6">
                <RagVisualizer text={report.scrapedBody} />
              </div>
            </div>
          )}
        </section>
      </main>

      <style dangerouslySetInnerHTML={{__html: \`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-section { margin-bottom: 2rem; }
          .break-before-page { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          [data-state="closed"] { display: block !important; height: auto !important; overflow: visible !important; }
        }
      \`}} />
    </div>
  );
}
`;

writeFileSync("src/app/print/report/[id]/page.tsx", content, "utf8");
console.log("OK, lines:", content.split("\n").length);
