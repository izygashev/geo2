"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportPdfButtonProps {
  reportId: string;
  projectName: string;
}

export function ReportPdfButton({ reportId, projectName }: ReportPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("Генерация PDF…");

  async function handleExport() {
    setLoading(true);
    setProgress("Генерация PDF…");
    try {
      // 1. Запускаем генерацию
      const startRes = await fetch(`/api/reports/${reportId}/pdf`, {
        method: "POST",
      });
      if (!startRes.ok) throw new Error(`HTTP ${startRes.status}`);

      const { jobId, ready } = await startRes.json();

      // 2. Если PDF уже кеширован — сразу скачиваем
      if (ready) {
        downloadPdf();
        return;
      }

      // 3. Поллим статус
      setProgress("Генерация PDF…");
      await pollUntilDone(jobId);

      // 4. Скачиваем
      downloadPdf();
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Ошибка при создании PDF. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function pollUntilDone(jobId: string): Promise<void> {
    const maxAttempts = 60; // 2 минуты макс
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(`/api/reports/${reportId}/pdf?jobId=${jobId}`);
      if (!res.ok) throw new Error(`Poll failed: HTTP ${res.status}`);

      const data = await res.json();

      if (data.status === "completed") return;
      if (data.status === "failed") throw new Error(data.error || "PDF generation failed");

      // Обновляем прогресс
      if (typeof data.progress === "number" && data.progress > 0) {
        setProgress(`Генерация PDF… ${data.progress}%`);
      }
    }
    throw new Error("PDF generation timeout");
  }

  function downloadPdf() {
    const a = document.createElement("a");
    a.href = `/api/reports/${reportId}/pdf`;
    a.download = `${projectName.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      data-pdf-hide
      className="gap-2 rounded-md border border-[#EAEAEA] bg-white text-sm font-medium text-[#1a1a1a] hover:bg-[#FBFBFA] shadow-none"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? progress : "Скачать PDF"}
    </Button>
  );
}
