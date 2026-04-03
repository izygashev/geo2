"use client";

import { CheckCircle2, AlertTriangle, X, Sparkles } from "lucide-react";

export interface AnalysisData {
  summary: string;
  pros: string[];
  cons: string[];
  score: number;
  url: string;
}

interface AnalysisResultProps {
  data: AnalysisData;
  onDismiss: () => void;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Отлично";
  if (score >= 60) return "Хорошо";
  if (score >= 40) return "Средне";
  if (score >= 20) return "Слабо";
  return "Критично";
}

export function AnalysisResult({ data, onDismiss }: AnalysisResultProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full rounded-xl border border-[#EAEAEA] bg-white duration-500">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b border-[#EAEAEA] px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#787774]" />
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Экспресс-анализ
          </span>
          <span className="rounded-md bg-[#F7F6F3] px-2 py-0.5 text-xs text-[#787774]">
            {data.url}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-[#BBBBBB] transition-colors hover:bg-[#F7F6F3] hover:text-[#787774]"
          aria-label="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5">
        {/* ─── Score + Summary row ─── */}
        <div className="flex gap-5">
          {/* Score circle */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#EAEAEA]">
              <span className={`text-xl font-bold tracking-tighter ${scoreColor(data.score)}`}>
                {data.score}
              </span>
            </div>
            <span className={`text-[10px] font-medium ${scoreColor(data.score)}`}>
              {scoreLabel(data.score)}
            </span>
          </div>

          {/* Summary */}
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-[#555]">{data.summary}</p>

            {/* Score bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#F0EFEB]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreBg(data.score)}`}
                style={{ width: `${data.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Pros & Cons grid ─── */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Pros */}
          <div className="rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Сильные стороны
            </p>
            <ul className="space-y-2">
              {data.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#555]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Зоны роста
            </p>
            <ul className="space-y-2">
              {data.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#555]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── CTA ─── */}
        <div className="mt-4 rounded-lg border border-dashed border-[#EAEAEA] bg-[#F7F6F3] px-4 py-3 text-center">
          <p className="text-xs text-[#787774]">
            Это экспресс-анализ на основе ИИ.{" "}
            <span className="font-medium text-[#1a1a1a]">
              Зарегистрируйтесь
            </span>{" "}
            для полного отчёта с парсингом сайта, Share of Voice и рекомендациями с кодом.
          </p>
        </div>
      </div>
    </div>
  );
}
