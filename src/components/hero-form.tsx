"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { ReportProgressBar } from "@/components/report-progress-bar";
import { TypewriterText } from "@/components/typewriter-text";
import {
  AnalysisResult,
  type AnalysisData,
} from "@/components/analysis-result";

const LS_KEY = "geo_active_report";

interface HeroFormProps {
  isAuthenticated: boolean;
}

export function HeroForm({ isAuthenticated }: HeroFormProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Восстанавливаем activeReportId из localStorage при монтировании
  // Проверяем, не завершён ли уже отчёт — если да, очищаем LS
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return;

      // Проверяем статус отчёта на сервере
      fetch(`/api/reports/${saved}/status`)
        .then((res) => {
          if (!res.ok) {
            // Отчёт не найден или нет доступа — убираем из LS
            localStorage.removeItem(LS_KEY);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          if (data.status === "PROCESSING") {
            // Ещё в процессе — показываем прогресс-бар
            setActiveReportId(saved);
          } else {
            // Уже завершён (COMPLETED/FAILED) — очищаем LS
            localStorage.removeItem(LS_KEY);
          }
        })
        .catch(() => {
          // При ошибке сети — всё равно показываем прогресс
          // SWR внутри прогресс-бара повторит запрос
          setActiveReportId(saved);
        });
    } catch {
      // localStorage может быть недоступен
    }
  }, [isAuthenticated]);

  // Очистка localStorage при dismiss (завершён/ошибка)
  const handleDismiss = useCallback(() => {
    setActiveReportId(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!url.trim()) return;

    setIsLoading(true);
    setAnalysisResult(null);

    // ── Авторизованный пользователь: полный отчёт через BullMQ ──
    if (isAuthenticated) {
      try {
        const res = await fetch("/api/reports/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Не удалось запустить анализ");
          setIsLoading(false);
          return;
        }

        setActiveReportId(data.reportId);
        try {
          localStorage.setItem(LS_KEY, data.reportId);
        } catch {
          // ignore
        }
        setUrl("");
      } catch {
        setError("Ошибка сети. Попробуйте ещё раз.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Неавторизованный: быстрый экспресс-анализ через AI ──
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Не удалось выполнить анализ");
        setIsLoading(false);
        return;
      }

      setAnalysisResult(data as AnalysisData);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  const showPlaceholder = url.length === 0;

  return (
    <div className="flex w-full flex-col gap-4">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Compact monolithic input+button — taste-skill: single border, h-12, no shadows */}
        <div className="relative flex h-12 items-center rounded-lg border border-[#EAEAEA] bg-white transition-colors focus-within:border-[#CCCCCC]">
          {/* Typewriter placeholder overlay */}
          {showPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center px-4 text-sm"
              aria-hidden="true"
            >
              <TypewriterText />
            </div>
          )}

          {/* Actual input */}
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading || !!activeReportId}
            className="h-full w-full bg-transparent pl-4 pr-24 text-sm text-[#1a1a1a] placeholder:text-transparent focus:outline-none disabled:opacity-50"
          />

          {/* Submit button — inside the border */}
          <button
            type="submit"
            disabled={isLoading || !url.trim() || !!activeReportId}
            className="btn-tactile absolute right-1.5 flex h-8 items-center gap-1.5 rounded-md bg-[#111] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#333] disabled:bg-[#EAEAEA] disabled:text-[#BBBBBB]"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                Анализ
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F0EFEB]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#CCCCCC]" />
            </div>
            <span className="text-[10px] text-[#BBBBBB]">Анализируем…</span>
          </div>
        )}

        {!isAuthenticated && !isLoading && !analysisResult && (
          <p className="mt-2 text-xs text-[#BBBBBB]">
            Попробуйте бесплатно — регистрация не нужна
          </p>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500/80">{error}</p>
        )}
      </form>

      {/* Экспресс-результат (для неавторизованных) */}
      {analysisResult && (
        <AnalysisResult
          data={analysisResult}
          onDismiss={() => setAnalysisResult(null)}
        />
      )}

      {/* Прогресс полного отчёта (для авторизованных) */}
      {activeReportId && (
        <ReportProgressBar
          reportId={activeReportId}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
