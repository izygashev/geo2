"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { ReportProgressBar } from "@/components/report-progress-bar";
import { TypewriterText } from "@/components/typewriter-text";
import {
  AnalysisResult,
  type AnalysisData,
} from "@/components/analysis-result";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

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

  // Обработка отмены — сбрасываем форму для нового ввода
  const handleCancel = useCallback(() => {
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
        // Compute device fingerprint for anti-abuse
        let fingerprintId: string | undefined;
        try {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          fingerprintId = result.visitorId;
        } catch {
          // Fingerprint may fail in some browsers — proceed without it
        }

        const res = await fetch("/api/reports/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), fingerprintId }),
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
        {/* Wide prominent input+button — centered hero style */}
        <div className="relative flex h-14 items-center rounded-xl border border-[#EAEAEA] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all focus-within:border-[#CCCCCC] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:h-16">
          {/* Typewriter placeholder overlay */}
          {showPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center px-5 text-sm text-[#BBBBBB] sm:text-base"
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
            className="h-full w-full bg-transparent pl-5 pr-28 text-sm text-[#1a1a1a] placeholder:text-transparent focus:outline-none disabled:opacity-50 sm:text-base sm:pr-32"
          />

          {/* Submit button — inside the border */}
          <button
            type="submit"
            disabled={isLoading || !url.trim() || !!activeReportId}
            className="btn-tactile absolute right-2 flex h-10 items-center gap-2 rounded-lg bg-[#1a1a1a] px-5 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:bg-[#EAEAEA] disabled:text-[#BBBBBB] sm:h-11 sm:px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Анализ
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 pt-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F0EFEB]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#CCCCCC]" />
            </div>
            <span className="text-xs text-[#BBBBBB]">Анализируем…</span>
          </div>
        )}

        {!isAuthenticated && !isLoading && !analysisResult && (
          <p className="mt-3 text-center text-xs text-[#BBBBBB]">
            Попробуйте бесплатно — регистрация не нужна
          </p>
        )}

        {isAuthenticated && !isLoading && !activeReportId && !analysisResult && (
          <p className="mt-2 text-center text-[11px] text-[#CCCCCC]">
            Анализ может занимать до 10 минут
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
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
