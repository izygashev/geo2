"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface ReportProgressBarProps {
  reportId: string;
  onDismiss?: () => void;
}

interface StatusResponse {
  id: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  overallScore: number | null;
  projectName: string;
  projectUrl: string;
}

const PROGRESS_STEPS = [
  "Подключаемся к сайту...",
  "Сканируем структуру и контент...",
  "Проверяем Schema.org разметку...",
  "Ищем llms.txt...",
  "Анализируем AI-видимость...",
  "Сравниваем с конкурентами...",
  "Генерируем стратегию...",
  "Финализируем отчёт...",
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ReportProgressBar({
  reportId,
  onDismiss,
}: ReportProgressBarProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(5);

  // SWR поллинг каждые 3 секунды
  const { data, error } = useSWR<StatusResponse>(
    `/api/reports/${reportId}/status`,
    fetcher,
    {
      refreshInterval: (latestData) =>
        latestData?.status === "PROCESSING" ? 3000 : 0,
      revalidateOnFocus: false,
    }
  );

  const status = data?.status ?? "PROCESSING";
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const isDone = isCompleted || isFailed;

  // Фейковый прогресс-бар (ускоряется замедляясь к 90%)
  useEffect(() => {
    if (isDone) {
      setFakeProgress(isCompleted ? 100 : fakeProgress);
      return;
    }

    const interval = setInterval(() => {
      setFakeProgress((prev) => {
        if (prev >= 90) return prev;
        // Замедляемся по мере приближения к 90
        const increment = Math.max(0.5, (90 - prev) * 0.04);
        return Math.min(90, prev + increment);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isDone, isCompleted]);

  // Меняющийся текст шагов
  useEffect(() => {
    if (isDone) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % PROGRESS_STEPS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isDone]);

  function handleClick() {
    if (isCompleted) {
      router.push(`/dashboard/reports/${reportId}`);
    }
  }

  return (
    <div className="mt-4 w-full max-w-xl animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        onClick={isCompleted ? handleClick : undefined}
        className={`
          relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all
          ${
            isCompleted
              ? "cursor-pointer border-emerald-500/30 bg-emerald-950/30 hover:border-emerald-500/50"
              : isFailed
                ? "border-red-500/30 bg-red-950/30"
                : "border-slate-700/50 bg-slate-900/80"
          }
        `}
      >
        {/* Прогресс-бар */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`
              h-full rounded-full transition-all duration-500 ease-out
              ${
                isCompleted
                  ? "bg-emerald-500"
                  : isFailed
                    ? "bg-red-500"
                    : "bg-blue-500"
              }
            `}
            style={{ width: `${isDone ? (isCompleted ? 100 : fakeProgress) : fakeProgress}%` }}
          />
        </div>

        {/* Контент */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : isFailed ? (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-400" />
            )}

            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-emerald-300"
                    : isFailed
                      ? "text-red-300"
                      : "text-white"
                }`}
              >
                {isCompleted
                  ? `Отчёт готов — Score: ${data?.overallScore ?? "—"}/100`
                  : isFailed
                    ? "Ошибка генерации отчёта"
                    : PROGRESS_STEPS[stepIndex]}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {data?.projectUrl ?? "Обработка..."}
              </p>
            </div>
          </div>

          {/* Действия */}
          <div className="ml-4 flex shrink-0 items-center gap-2">
            {isCompleted && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                Открыть
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
            {isFailed && onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Закрыть
              </button>
            )}
            {!isDone && (
              <span className="text-xs tabular-nums text-slate-500">
                {Math.round(fakeProgress)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {error && !isDone && (
        <p className="mt-2 text-center text-xs text-red-400/70">
          Не удалось проверить статус. Повторяем...
        </p>
      )}
    </div>
  );
}
