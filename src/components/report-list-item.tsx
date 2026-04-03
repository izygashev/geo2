"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface ReportListItemProps {
  reportId: string;
  projectName: string;
  projectUrl: string;
  createdAt: string;
}

interface StatusResponse {
  id: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  overallScore: number | null;
  projectName: string;
  projectUrl: string;
}

const PROGRESS_STEPS = [
  "Сканируем структуру…",
  "Проверяем разметку…",
  "Анализируем AI-видимость…",
  "Сравниваем с конкурентами…",
  "Генерируем стратегию…",
];

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

export function ReportListItemProcessing({
  reportId,
  projectName,
  projectUrl,
  createdAt,
}: ReportListItemProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(5);

  // Храним финальный результат — SWR может сбросить data при остановке
  const [finalResult, setFinalResult] = useState<{
    status: "COMPLETED" | "FAILED";
    overallScore: number | null;
  } | null>(null);

  const shouldPoll = !finalResult;
  const { data } = useSWR<StatusResponse>(
    shouldPoll ? `/api/reports/${reportId}/status` : null,
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
      errorRetryCount: 5,
      errorRetryInterval: 3000,
    }
  );

  // Сохраняем финальный статус
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current) return;
    if (data?.status === "COMPLETED" || data?.status === "FAILED") {
      savedRef.current = true;
      setFinalResult({
        status: data.status,
        overallScore: data.overallScore,
      });
      try {
        localStorage.removeItem("geo_active_report");
      } catch {
        // ignore
      }
    }
  }, [data]);

  const isCompleted = finalResult?.status === "COMPLETED";
  const isFailed = finalResult?.status === "FAILED";
  const isDone = isCompleted || isFailed;

  // Фейковый прогресс
  useEffect(() => {
    if (isDone) {
      if (isCompleted) setFakeProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setFakeProgress((prev) => {
        if (prev >= 90) return prev;
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

  // При завершении — перезагружаем страницу для обновления серверных данных
  useEffect(() => {
    if (isCompleted) {
      const timeout = setTimeout(() => {
        router.refresh();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isCompleted, router]);

  return (
    <div
      onClick={isCompleted ? () => router.push(`/dashboard/reports/${reportId}`) : undefined}
      className={`
        relative overflow-hidden rounded-xl border p-4 transition-all
        ${
          isCompleted
            ? "cursor-pointer border-emerald-200 bg-emerald-50 hover:border-emerald-300"
            : isFailed
              ? "border-red-200 bg-red-50"
              : "border-[#EAEAEA] bg-white"
        }
      `}
    >
      {/* Progress bar */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isCompleted
              ? "bg-emerald-500"
              : isFailed
                ? "bg-red-500"
                : "bg-zinc-900"
          }`}
          style={{ width: `${isDone ? (isCompleted ? 100 : fakeProgress) : fakeProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4 shrink-0 text-red-400" />
          ) : (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#BBBBBB]" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-[#1a1a1a]">
              {projectName}
            </h3>
            <p className="text-xs text-[#787774]">
              {isDone
                ? projectUrl
                : PROGRESS_STEPS[stepIndex]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isCompleted && finalResult?.overallScore !== null && (
            <span className="text-base font-bold tracking-tighter text-[#1a1a1a]">
              {finalResult?.overallScore}
              <span className="text-sm text-[#BBBBBB]">/100</span>
            </span>
          )}
          <span
            className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${
              isCompleted
                ? "border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                : isFailed
                  ? "border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]"
                  : "border-[#FBE5A8] bg-[#FBF3DB] text-[#B08D19]"
            }`}
          >
            {isCompleted ? "Готов" : isFailed ? "Ошибка" : `${Math.round(fakeProgress)}%`}
          </span>
          {isCompleted && (
            <ArrowRight className="h-4 w-4 text-emerald-500" />
          )}
          <span className="text-xs text-[#BBBBBB]">{createdAt}</span>
        </div>
      </div>
    </div>
  );
}
