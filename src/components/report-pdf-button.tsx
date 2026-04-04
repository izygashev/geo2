"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportPdfButtonProps {
  reportId: string;
  projectName: string;
  /** White-label: если передан, будет отображаться вместо GEO SaaS */
  brandName?: string;
  brandLogoUrl?: string;
}

export function ReportPdfButton({
  reportId,
  projectName,
  brandName,
  brandLogoUrl,
}: ReportPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    try {
      // Динамический импорт — не грузим тяжёлые либы при старте
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas-pro"),
      ]);

      const content = document.getElementById("report-content");
      if (!content) {
        alert("Не удалось найти содержимое отчёта");
        return;
      }

      // Скрываем кнопки перед рендером
      const buttons = content.querySelectorAll("[data-pdf-hide]");
      buttons.forEach((el) => ((el as HTMLElement).style.display = "none"));

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F7F6F3",
        logging: false,
      });

      // Восстанавливаем кнопки
      buttons.forEach((el) => ((el as HTMLElement).style.display = ""));

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;

      // ─── White-label шапка ────────────────────
      const headerBrand = brandName || "GEO SaaS";
      pdf.setFontSize(8);
      pdf.setTextColor(120, 119, 116);
      pdf.text(headerBrand, margin, 8);
      pdf.text(
        `Отчёт: ${projectName} • ${new Date().toLocaleDateString("ru-RU")}`,
        pageWidth - margin,
        8,
        { align: "right" }
      );
      pdf.setDrawColor(234, 234, 234);
      pdf.line(margin, 10, pageWidth - margin, 10);

      // ─── Контент ──────────────────────────────
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const startY = 14;

      let y = startY;
      let remainingHeight = imgHeight;
      const contentAreaHeight = pageHeight - startY - 12; // footer margin

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, contentAreaHeight);
        const sy = imgHeight - remainingHeight;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          y - sy * (imgWidth / canvas.width),
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );

        remainingHeight -= sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          // Повторяем шапку на каждой странице
          pdf.setFontSize(8);
          pdf.setTextColor(120, 119, 116);
          pdf.text(headerBrand, margin, 8);
          pdf.line(margin, 10, pageWidth - margin, 10);
          y = startY;
        }
      }

      // ─── Footer ───────────────────────────────
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(187, 187, 187);
        pdf.text(
          `Стр. ${i}/${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      const fileName = `${projectName.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Ошибка при создании PDF. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
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
      {loading ? "Генерация PDF…" : "Скачать PDF"}
    </Button>
  );
}
