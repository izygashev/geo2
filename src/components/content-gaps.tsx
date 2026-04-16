"use client";

import { useState } from "react";
import {
  FileSearch,
  Sparkles,
  ExternalLink,
  X,
  Copy,
  Check,
  Loader2,
  Download,
  Info,
} from "lucide-react";

export interface ContentGapItem {
  topic: string;
  competitorSource: string;
  aiInsight: string;
  actionText: string;
  /** "content" | "llms-txt" | "faq" */
  actionType: "content" | "llms-txt" | "faq";
}

interface ContentGapsProps {
  gaps: ContentGapItem[];
  projectUrl: string;
  siteTitle?: string;
}

export function ContentGaps({ gaps, projectUrl, siteTitle }: ContentGapsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [currentActionType, setCurrentActionType] = useState<"content" | "llms-txt" | "faq">("content");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (gaps.length === 0) return null;

  async function handleGenerate(gap: ContentGapItem) {
    setModalOpen(true);
    setGenerating(true);
    setGeneratedContent("");
    setError("");
    setModalTitle(gap.topic);
    setCurrentActionType(gap.actionType);
    setCopied(false);

    try {
      const res = await fetch("/api/reports/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: gap.actionType,
          topic: gap.topic,
          projectUrl,
          competitor: gap.competitorSource,
          siteTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Stream the response text chunk-by-chunk
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setGeneratedContent(accumulated);
      }

      if (!accumulated) {
        setGeneratedContent("Контент не был сгенерирован.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError(
        err instanceof Error ? err.message : "Не удалось сгенерировать контент"
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const isLlmsTxt = modalTitle.toLowerCase().includes("llms.txt") || modalTitle.toLowerCase().includes("визитка");
    a.download = isLlmsTxt ? "llms.txt" : "content.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        {/* Header */}
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
            <FileSearch className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Упущенные темы
          </h2>
        </div>
        <p className="mb-6 text-sm text-[#787774]">
          Темы, про которые нейросети часто рассказывают вашим клиентам, но на
          вашем сайте нет ответов. Конкуренты уже заняли эти позиции.
        </p>

        {/* Gap items */}
        <div className="space-y-3">
          {gaps.map((gap, i) => (
            <div
              key={i}
              className="group rounded-xl border border-[#F0EFEB] bg-[#FAFAF9] p-5 transition-all hover:border-[#E5E5E3] hover:bg-white"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Topic */}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100/80 text-[10px] font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-[#1a1a1a]">
                      {gap.topic}
                    </h3>
                  </div>

                  {/* AI Insight — quote style */}
                  <div className="mt-3 rounded-lg border-l-2 border-amber-300/60 bg-amber-50/40 py-2.5 pl-3.5 pr-3">
                    <p className="text-xs leading-relaxed text-[#555]">
                      {gap.aiInsight}
                    </p>
                  </div>

                  {/* Competitor badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#EAEAEA] bg-white px-2.5 py-0.5 text-[10px] font-medium text-[#787774]">
                      <ExternalLink className="h-2.5 w-2.5" />
                      Опережает: {gap.competitorSource}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-white px-3.5 text-xs font-medium text-[#555] transition-all hover:border-[#D5D5D5] hover:bg-[#FAFAF9] hover:text-[#1a1a1a] hover:shadow-sm"
                  onClick={() => handleGenerate(gap)}
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {gap.actionText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[#EAEAEA] bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">
                    {modalTitle}
                  </h3>
                  <p className="text-[11px] text-[#787774]">
                    {generating
                      ? "Генерируем с помощью ИИ..."
                      : "Готово — можете скопировать или скачать"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#787774] transition-colors hover:bg-[#F5F5F5] hover:text-[#1a1a1a]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {generating && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <p className="text-sm text-[#787774]">
                    ИИ пишет контент... Это займёт 15–30 секунд
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!generating && !error && generatedContent && (
                <>
                  {/* Info banner */}
                  <div className="mb-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <p className="text-xs leading-relaxed text-blue-800">
                      {currentActionType === "content" && (
                        <>Мы сгенерировали идеальную структуру статьи (в формате Markdown), которая нравится RAG-алгоритмам. Передайте этот черновик вашему копирайтеру или вставьте в ChatGPT для написания полного текста.</>
                      )}
                      {currentActionType === "llms-txt" && (
                        <>Это готовый файл-визитка вашего сайта для нейросетей. Сохраните его как <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px]">llms.txt</code> и загрузите в корневую папку сайта, чтобы он открывался по адресу <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px]">ваш-сайт.com/llms.txt</code>.</>
                      )}
                      {currentActionType === "faq" && (
                        <>Мы сгенерировали FAQ со встроенной Schema.org разметкой (FAQPage). Добавьте эти вопросы-ответы на ваш сайт — нейросети активно используют структурированные FAQ для своих ответов.</>
                      )}
                    </p>
                  </div>

                  {/* Content area — document preview */}
                  <div className="rounded-xl border border-[#E5E5E3] bg-zinc-50 p-5">
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[#333]">
                      {generatedContent}
                    </pre>
                  </div>
                </>
              )}
            </div>

            {/* Modal footer */}
            {!generating && generatedContent && (
              <div className="flex items-center justify-end gap-2 border-t border-[#EAEAEA] px-6 py-3.5">
                <button
                  onClick={handleDownload}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-white px-3.5 text-xs font-medium text-[#555] transition-all hover:border-[#D5D5D5] hover:bg-[#FAFAF9]"
                >
                  <Download className="h-3 w-3" />
                  {currentActionType === "llms-txt" ? "Скачать llms.txt" : currentActionType === "faq" ? "Скачать FAQ" : "Скачать .md файл"}
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3.5 text-xs font-medium text-white transition-all hover:bg-[#333]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      {currentActionType === "content" ? "Скопировать структуру" : "Скопировать код"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
