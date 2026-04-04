"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ChecklistItem {
  label: string;
  status: "pass" | "fail" | "warn";
  detail: string;
}

interface SiteChecklistProps {
  hasLlmsTxt: boolean;
  schemaOrgTypes: string[];
  contentLength: number;
  siteTitle: string | null;
  siteDescription: string | null;
  siteH1: string | null;
}

export function SiteChecklist({
  hasLlmsTxt,
  schemaOrgTypes,
  contentLength,
  siteTitle,
  siteDescription,
  siteH1,
}: SiteChecklistProps) {
  const items: ChecklistItem[] = [
    {
      label: "/llms.txt",
      status: hasLlmsTxt ? "pass" : "fail",
      detail: hasLlmsTxt
        ? "Файл обнаружен — AI-системы могут считывать информацию о бренде"
        : "Файл не найден — создайте /llms.txt для AI-поисковиков",
    },
    {
      label: "Schema.org разметка",
      status:
        schemaOrgTypes.length >= 3
          ? "pass"
          : schemaOrgTypes.length > 0
            ? "warn"
            : "fail",
      detail:
        schemaOrgTypes.length > 0
          ? `Найдено: ${schemaOrgTypes.join(", ")}`
          : "Структурированные данные JSON-LD не обнаружены",
    },
    {
      label: "Мета-заголовок (Title)",
      status: siteTitle && siteTitle.length > 10 ? "pass" : siteTitle ? "warn" : "fail",
      detail: siteTitle
        ? `«${siteTitle.slice(0, 60)}${siteTitle.length > 60 ? "…" : ""}»`
        : "Title не задан",
    },
    {
      label: "Мета-описание (Description)",
      status:
        siteDescription && siteDescription.length > 50
          ? "pass"
          : siteDescription
            ? "warn"
            : "fail",
      detail: siteDescription
        ? `${siteDescription.length} симв. — ${siteDescription.length >= 120 ? "оптимально" : "слишком коротко"}`
        : "Description не задан",
    },
    {
      label: "Заголовок H1",
      status: siteH1 && siteH1.length > 3 ? "pass" : "fail",
      detail: siteH1
        ? `«${siteH1.slice(0, 60)}${siteH1.length > 60 ? "…" : ""}»`
        : "H1 не найден на странице",
    },
    {
      label: "Объём контента",
      status:
        contentLength >= 1500
          ? "pass"
          : contentLength >= 500
            ? "warn"
            : "fail",
      detail: `${contentLength.toLocaleString("ru-RU")} символов — ${
        contentLength >= 1500
          ? "достаточно для AI-индексации"
          : contentLength >= 500
            ? "минимально, рекомендуется расширить"
            : "слишком мало контента для AI-анализа"
      }`,
    },
  ];

  const passCount = items.filter((i) => i.status === "pass").length;

  return (
    <div className="space-y-4">
      {/* Header с общим числом */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Технический чеклист
        </h3>
        <span className="text-xs text-[#787774]">
          <span className="font-bold text-[#1a1a1a]">{passCount}</span>/{items.length} пройдено
        </span>
      </div>

      {/* Элементы */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#FBFBFA]"
          >
            {item.status === "pass" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
            ) : item.status === "warn" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B08D19]" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B02A37]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1a1a1a]">{item.label}</p>
              <p className="mt-0.5 text-xs text-[#787774] leading-relaxed">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
