"use client";

import { useState } from "react";
import { Bot, Copy, Check, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LlmsTxtBlockProps {
  content: string;
  siteUrl: string;
}

export function LlmsTxtBlock({ content, siteUrl }: LlmsTxtBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hostname = (() => {
    try {
      return new URL(siteUrl).hostname;
    } catch {
      return siteUrl;
    }
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show preview (first ~15 lines) or full content
  const lines = content.split("\n");
  const previewLines = 15;
  const isLong = lines.length > previewLines;
  const displayContent = expanded || !isLong
    ? content
    : lines.slice(0, previewLines).join("\n") + "\n…";

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden print-avoid-break">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAEAEA] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF3EC]">
            <Bot className="h-4 w-4 text-[#2D6A4F]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">
              Готовая визитка для нейросетей
            </h3>
            <p className="text-[11px] text-[#787774]">
              Разместите этот файл по адресу{" "}
              <code className="rounded bg-[#F7F6F3] px-1 py-0.5 text-[10px] font-mono text-[#555]">
                {hostname}/llms.txt
              </code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print-hide">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-1.5 border-[#EAEAEA] text-xs text-[#555] hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
          >
            <Download className="h-3.5 w-3.5" />
            Скачать
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={`h-8 gap-1.5 text-xs transition-colors ${
              copied
                ? "border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]"
                : "border-[#EAEAEA] text-[#555] hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Копировать
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code block */}
      <div className="relative">
        <pre className="overflow-x-auto bg-[#FAFAFA] px-6 py-4 text-xs leading-relaxed text-[#555] font-mono whitespace-pre-wrap break-words">
          {displayContent}
        </pre>
        {isLong && (
          <div className={`flex justify-center ${!expanded ? "border-t border-[#EAEAEA]" : ""} py-2 print-hide`}>
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#787774] hover:text-[#1a1a1a] transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Показать полностью ({lines.length} строк)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Instruction hint */}
      <div className="border-t border-[#EAEAEA] bg-[#FBFBFA] px-6 py-3 print-hide">
        <p className="text-[11px] leading-relaxed text-[#787774]">
          <strong className="text-[#555]">Как установить:</strong> Скопируйте содержимое и создайте файл{" "}
          <code className="rounded bg-[#F7F6F3] px-1 py-0.5 text-[10px] font-mono">llms.txt</code>{" "}
          в корне вашего сайта (или добавьте роут{" "}
          <code className="rounded bg-[#F7F6F3] px-1 py-0.5 text-[10px] font-mono">/llms.txt</code>{" "}
          в вашем фреймворке). AI-боты автоматически подхватят его при следующем обходе.
        </p>
      </div>
    </div>
  );
}
