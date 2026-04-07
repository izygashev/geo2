"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Square,
} from "lucide-react";

interface ReportProgressBarProps {
  reportId: string;
  onDismiss?: () => void;
  onCancel?: () => void;
}

interface StatusResponse {
  id: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  overallScore: number | null;
  projectName: string;
  projectUrl: string;
  progress: number;
  step: string;
}

const LS_KEY = "geo_active_report";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      body.error ?? `HTTP ${res.status}`
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<StatusResponse>;
};

export function ReportProgressBar({
  reportId,
  onDismiss,
  onCancel,
}: ReportProgressBarProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  // Сглаженный прогресс — плавно догоняет реальный
  const [smoothProgress, setSmoothProgress] = useState(2);

  // Храним финальный результат отдельно — SWR сбрасывает data при key=null
  const [finalResult, setFinalResult] = useState<{
    status: "COMPLETED" | "FAILED";
    overallScore: number | null;
    projectUrl: string;
  } | null>(null);
  const [errorDead, setErrorDead] = useState(false);

  // SWR поллинг — останавливаем когда есть финальный результат
  const shouldPoll = !finalResult && !errorDead;
  const { data, error } = useSWR<StatusResponse>(
    shouldPoll ? `/api/reports/${reportId}/status` : null,
    fetcher,
    {
      refreshInterval: 2000, // Чаще, т.к. реальный прогресс
      revalidateOnFocus: true,
      errorRetryCount: 10,
      errorRetryInterval: 3000,
    }
  );

  // Реальный прогресс и шаг от сервера
  const realProgress = data?.progress ?? 0;
  const stepText = data?.step ?? "Ожидание в очереди...";

  // Когда получаем финальный статус — сохраняем его
  useEffect(() => {
    if (!data) return;

    if (data.status === "COMPLETED" || data.status === "FAILED") {
      setFinalResult({
        status: data.status,
        overallScore: data.overallScore,
        projectUrl: data.projectUrl,
      });
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
    }
  }, [data]);

  // Обработка мёртвых ошибок (404/403)
  useEffect(() => {
    if (error && (error.status === 404 || error.status === 403)) {
      setErrorDead(true);
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
    }
  }, [error]);

  const isCompleted = finalResult?.status === "COMPLETED";
  const isFailed = finalResult?.status === "FAILED";
  const isDone = isCompleted || isFailed || errorDead;

  // Сглаживание прогресса — плавно подтягивается к реальному значению
  useEffect(() => {
    if (isDone) {
      if (isCompleted) {
        setSmoothProgress(100);
      }
      return;
    }

    const interval = setInterval(() => {
      setSmoothProgress((prev) => {
        if (prev >= realProgress) return prev;
        // Быстро догоняем реальный прогресс
        const diff = realProgress - prev;
        const increment = Math.max(0.5, diff * 0.15);
        return Math.min(realProgress, prev + increment);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isDone, isCompleted, realProgress]);

  // URL проекта
  const displayUrl = data?.projectUrl ?? finalResult?.projectUrl ?? "Обработка...";

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
          relative overflow-hidden rounded-xl border p-4 transition-all
          ${
            isCompleted
              ? "cursor-pointer border-emerald-200 bg-emerald-50 hover:border-emerald-300"
              : isFailed || errorDead
                ? "border-red-200 bg-red-50"
                : "border-zinc-200 bg-white shadow-sm"
          }
        `}
      >
        {/* Прогресс-бар */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`
              h-full rounded-full transition-all duration-300 ease-out
              ${
                isCompleted
                  ? "bg-emerald-500"
                  : isFailed || errorDead
                    ? "bg-red-500"
                    : "bg-zinc-900"
              }
            `}
            style={{
              width: `${isDone ? (isCompleted ? 100 : smoothProgress) : smoothProgress}%`,
            }}
          />
        </div>

        {/* Контент */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : isFailed || errorDead ? (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-zinc-400" />
            )}

            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-emerald-700"
                    : isFailed || errorDead
                      ? "text-red-700"
                      : "text-zinc-800"
                }`}
              >
                {isCompleted
                  ? `Отчёт готов — Score: ${finalResult?.overallScore ?? "—"}/100`
                  : isFailed || errorDead
                    ? "Ошибка генерации отчёта"
                    : stepText}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {displayUrl}
              </p>
            </div>
          </div>

          {/* Действия */}
          <div className="ml-4 flex shrink-0 items-center gap-2">
            {isCompleted && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                Открыть
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
            {(isFailed || errorDead) && onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                Закрыть
              </button>
            )}
            {!isDone && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsCancelling(true);
                    try {
                      const res = await fetch(`/api/reports/${reportId}/cancel`, {
                        method: "POST",
                      });
                      if (res.ok) {
                        setFinalResult({
                          status: "FAILED",
                          overallScore: null,
                          projectUrl: displayUrl,
                        });
                        try {
                          localStorage.removeItem(LS_KEY);
                        } catch {
                          // ignore
                        }
                        onCancel?.();
                      }
                    } catch {
                      // ignore — polling подхватит FAILED
                    } finally {
                      setIsCancelling(false);
                    }
                  }}
                  disabled={isCancelling}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title="Отменить анализ"
                >
                  {isCancelling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Square className="h-3 w-3 fill-current" />
                  )}
                </button>
                <span className="text-xs tabular-nums text-zinc-400">
                  {Math.round(smoothProgress)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && !isDone && (
        <p className="mt-2 text-center text-xs text-red-500/70">
          Не удалось проверить статус. Повторяем...
        </p>
      )}
    </div>
  );
}
