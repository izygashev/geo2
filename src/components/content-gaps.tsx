"use client";

import { FileSearch, Sparkles, ExternalLink } from "lucide-react";

export interface ContentGapItem {
  topic: string;
  competitorSource: string;
  aiInsight: string;
  actionText: string;
}

interface ContentGapsProps {
  gaps: ContentGapItem[];
}

export function ContentGaps({ gaps }: ContentGapsProps) {
  if (gaps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
          <FileSearch className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Контент-шпион (AI Content Gaps)
        </h2>
      </div>
      <p className="mb-6 text-sm text-[#787774]">
        Темы, которые конкуренты раскрыли, а вы — нет. ИИ-системы ссылаются на их контент.
      </p>

      {/* Gap items */}
      <div className="space-y-3">
        {gaps.map((gap, i) => (
          <div
            key={i}
            className="group rounded-xl border border-[#F0EFEB] bg-[#FAFAF9] p-5 transition-all hover:border-[#E5E5E3] hover:bg-white"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                {/* Topic */}
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-md bg-amber-100/80 text-[10px] font-bold text-amber-700">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">
                    {gap.topic}
                  </h3>
                </div>

                {/* AI Insight — quote style */}
                <div className="mt-3 rounded-lg border-l-2 border-amber-300/60 bg-amber-50/40 py-2.5 pl-3.5 pr-3">
                  <p className="text-xs leading-relaxed text-[#555]">
                    {gap.aiInsight}
                  </p>
                </div>

                {/* Competitor badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#EAEAEA] bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#787774]">
                    <ExternalLink className="h-2.5 w-2.5" />
                    Выигрывает: {gap.competitorSource}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button
                className="shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-white px-3.5 text-xs font-medium text-[#555] transition-all hover:border-[#D5D5D5] hover:bg-[#FAFAF9] hover:text-[#1a1a1a] hover:shadow-sm"
                onClick={() => {
                  // Placeholder — будет генерация ТЗ через AI
                  alert(`🚧 Функция «${gap.actionText}» будет доступна в следующем обновлении.`);
                }}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {gap.actionText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
