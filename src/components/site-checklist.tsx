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
  robotsTxtAiFriendly: boolean;
  semanticHtmlValid: boolean;
}

export function SiteChecklist({
  hasLlmsTxt,
  schemaOrgTypes,
  contentLength,
  siteTitle,
  siteDescription,
  siteH1,
  robotsTxtAiFriendly,
  semanticHtmlValid,
}: SiteChecklistProps) {
  const items: ChecklistItem[] = [
    {
      label: "Визитка для нейросетей (llms.txt)",
      status: hasLlmsTxt ? "pass" : "fail",
      detail: hasLlmsTxt
        ? "Файл найден — ИИ-ассистенты могут узнать, кто вы и чем занимаетесь"
        : "ИИ не понимает, кто вы. Добавьте файл-визитку /llms.txt на свой сайт",
    },
    {
      label: "Скрытая разметка для роботов",
      status:
        schemaOrgTypes.length >= 3
          ? "pass"
          : schemaOrgTypes.length > 0
            ? "warn"
            : "fail",
      detail:
        schemaOrgTypes.length > 0
          ? `Нейросети нашли: ${schemaOrgTypes.join(", ")}`
          : "Роботы не могут прочитать информацию о вашей компании — добавьте разметку",
    },
    {
      label: "Доступ для ИИ-ботов (robots.txt)",
      status: robotsTxtAiFriendly ? "pass" : "fail",
      detail: robotsTxtAiFriendly
        ? "Нейросети могут свободно читать ваш сайт"
        : "Вы заблокировали вход для ИИ-ботов — они не могут индексировать ваш сайт",
    },
    {
      label: "Структура страницы",
      status: semanticHtmlValid ? "pass" : "warn",
      detail: semanticHtmlValid
        ? "Страница правильно размечена — нейросети легко извлекают из неё ответы"
        : "Нейросетям сложно разобрать структуру страницы — улучшите разметку заголовков",
    },
    {
      label: "Заголовок страницы (Title)",
      status: siteTitle && siteTitle.length > 10 ? "pass" : siteTitle ? "warn" : "fail",
      detail: siteTitle
        ? `«${siteTitle.slice(0, 60)}${siteTitle.length > 60 ? "…" : ""}»`
        : "Заголовок не задан — нейросети не знают, о чём ваша страница",
    },
    {
      label: "Описание страницы",
      status:
        siteDescription && siteDescription.length > 50
          ? "pass"
          : siteDescription
            ? "warn"
            : "fail",
      detail: siteDescription
        ? `${siteDescription.length} символов — ${siteDescription.length >= 120 ? "отлично" : "маловато, лучше расширить"}`
        : "Описание не задано — нейросети пропустят вашу страницу",
    },
    {
      label: "Главный заголовок (H1)",
      status: siteH1 && siteH1.length > 3 ? "pass" : "fail",
      detail: siteH1
        ? `«${siteH1.slice(0, 60)}${siteH1.length > 60 ? "…" : ""}»`
        : "Главный заголовок не найден — нейросети не понимают тему страницы",
    },
    {
      label: "Объём текста на странице",
      status:
        contentLength >= 1500
          ? "pass"
          : contentLength >= 500
            ? "warn"
            : "fail",
      detail: `${contentLength.toLocaleString("ru-RU")} символов — ${
        contentLength >= 1500
          ? "достаточно для хорошего анализа"
          : contentLength >= 500
            ? "маловато — нейросетям нужно больше информации"
            : "слишком мало — ИИ просто не найдёт, что рекомендовать"
      }`,
    },
  ];

  const passCount = items.filter((i) => i.status === "pass").length;

  return (
    <div className="space-y-4 print-avoid-break">
      {/* Header с общим числом */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Готовность сайта для ИИ
          </h3>
          <p className="mt-0.5 text-[11px] text-[#BBBBBB]">
            Что нейросети видят (и не видят) на вашем сайте
          </p>
        </div>
        <span className="text-xs text-[#787774]">
          <span className="font-bold text-[#1a1a1a]">{passCount}</span>/{items.length} ОК
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
