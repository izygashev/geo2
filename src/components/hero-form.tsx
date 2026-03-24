"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportProgressBar } from "@/components/report-progress-bar";

interface HeroFormProps {
  isAuthenticated: boolean;
}

export function HeroForm({ isAuthenticated }: HeroFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      router.push("/sign-up");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reports/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Не удалось запустить анализ");
        setIsLoading(false);
        return;
      }

      // Показываем прогресс-бар
      setActiveReportId(data.reportId);
      setUrl("");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-slate-500" />
          <Input
            type="url"
            placeholder="Введите URL вашего сайта..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading || !!activeReportId}
            className="h-14 rounded-xl border-slate-700/50 bg-slate-900/80 pl-12 pr-36 text-base text-white placeholder:text-slate-500 backdrop-blur-sm focus-visible:ring-blue-500/40"
          />
          <Button
            type="submit"
            disabled={isLoading || !url || !!activeReportId}
            className="absolute right-2 h-10 rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Анализировать
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}

        {!isAuthenticated && !error && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Для запуска анализа необходима{" "}
            <span className="text-blue-400">бесплатная регистрация</span>
          </p>
        )}
      </form>

      {/* Прогресс-бар под инпутом */}
      {activeReportId && (
        <ReportProgressBar
          reportId={activeReportId}
          onDismiss={() => setActiveReportId(null)}
        />
      )}
    </div>
  );
}
