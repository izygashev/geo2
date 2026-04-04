"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RerunReportButtonProps {
  projectUrl: string;
}

export function RerunReportButton({ projectUrl }: RerunReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRerun() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: projectUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка при запуске анализа");
        return;
      }

      // Переходим на страницу нового отчёта
      router.push(`/dashboard/reports/${data.reportId}`);
    } catch (err) {
      console.error("Rerun error:", err);
      alert("Не удалось запустить анализ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleRerun}
      disabled={loading}
      data-pdf-hide
      className="gap-2 rounded-md border border-[#EAEAEA] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#FBFBFA] shadow-none"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {loading ? "Запуск…" : "Обновить анализ"}
    </Button>
  );
}
