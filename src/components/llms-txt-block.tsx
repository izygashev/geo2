"use client";

import { useState } from "react";
import { Bot, Copy, Check, Download, ChevronDown, ChevronUp } from "lucide-react";

interface LlmsTxtBlockProps {
  content: string;
  siteUrl: string;
}

export function LlmsTxtBlock({ content, siteUrl }: LlmsTxtBlockProps) {
  const [showCode, setShowCode] = useState(false);
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

  const lines = content.split("\n");
  const isLong = lines.length > 12;
  const displayContent =
    expanded || !isLong ? content : lines.slice(0, 12).join("\n") + "\n\u2026";

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden shadow-sm print-avoid-break">
      {/* Priority stripe — indigo, matching llms-txt impactWeight=9 → "Очень важно" → but type-specific indigo */}
      <div className="h-[3px] w-full bg-[#4338CA]" />

      <div className="p-5 space-y-4">
        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF]">
            <Bot className="h-4 w-4 text-[#4338CA]" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#4338CA]">
                <span>⚙️</span>
                {"\u0414\u043b\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430"}
              </span>
              <span className="rounded-full bg-[#FDEBEC] px-2.5 py-0.5 text-[11px] font-semibold text-[#B02A37]">
                {"\u041e\u0447\u0435\u043d\u044c \u0432\u0430\u0436\u043d\u043e"}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-snug">
              {"\u0413\u043e\u0442\u043e\u0432\u0430\u044f \u0432\u0438\u0437\u0438\u0442\u043a\u0430 \u0434\u043b\u044f \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0435\u0439 \u2014 \u0444\u0430\u0439\u043b llms.txt"}
            </h3>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="space-y-2 pl-11">
          <div>
            <p className="text-[12px] font-medium text-[#999] mb-0.5">
              {"\u0417\u0430\u0447\u0435\u043c \u044d\u0442\u043e \u043d\u0443\u0436\u043d\u043e"}
            </p>
            <p className="text-[13px] leading-[1.7] text-[#444]">
              {"\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u043d\u0435 \u0437\u043d\u0430\u044e\u0442, \u043a\u0442\u043e \u0432\u044b \u0438 \u0447\u0435\u043c \u0437\u0430\u043d\u0438\u043c\u0430\u0435\u0442\u0435\u0441\u044c. \u0424\u0430\u0439\u043b /llms.txt \u2014 \u044d\u0442\u043e \u0432\u0430\u0448\u0430 \u0432\u0438\u0437\u0438\u0442\u043a\u0430 \u0434\u043b\u044f \u0418\u0418: \u0431\u0435\u0437 \u043d\u0435\u0451 ChatGPT \u0438 \u0434\u0440\u0443\u0433\u0438\u0435 \u043d\u0435 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u044e\u0442 \u0432\u0430\u0441 \u043a\u043b\u0438\u0435\u043d\u0442\u0430\u043c."}
            </p>
          </div>
          <div className="border-t border-[#F0EFEB] pt-2">
            <p className="text-[12px] font-medium text-[#999] mb-0.5">
              {"\u0427\u0442\u043e \u0441\u0434\u0435\u043b\u0430\u0442\u044c"}
            </p>
            <p className="text-[13px] leading-[1.7] text-[#444]">
              {"\u0421\u043a\u0430\u0447\u0430\u0439\u0442\u0435 \u0444\u0430\u0439\u043b \u043d\u0438\u0436\u0435 \u0438 \u0440\u0430\u0437\u043c\u0435\u0441\u0442\u0438\u0442\u0435 \u0435\u0433\u043e \u0432 \u043a\u043e\u0440\u043d\u0435 \u0441\u0430\u0439\u0442\u0430 \u043f\u043e \u0430\u0434\u0440\u0435\u0441\u0443 "}{" "}
              <code className="font-mono text-[11px] text-[#4338CA]">{hostname}/llms.txt</code>
              {". \u0417\u0430\u043d\u0438\u043c\u0430\u0435\u0442 5 \u043c\u0438\u043d\u0443\u0442."}
            </p>
          </div>
        </div>

        {/* ── Code accordion ── */}
        <div className="pl-11 print-hide">
          <button
            onClick={() => setShowCode((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-[12px] font-medium text-[#787774] hover:border-[#D0D0D0] hover:text-[#1a1a1a] transition-all"
          >
            {showCode ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {"\u0424\u0430\u0439\u043b llms.txt \u0434\u043b\u044f \u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f"}
          </button>

          {showCode && (
            <div className="mt-2 rounded-xl overflow-hidden border border-[#C7D2FE]">
              {/* Toolbar */}
              <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#4338CA]/20">
                    <Bot className="h-3 w-3 text-[#818CF8]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#555] tracking-wider uppercase">
                    llms.txt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-all"
                  >
                    <Download className="h-3 w-3" />
                    {"\u0421\u043a\u0430\u0447\u0430\u0442\u044c"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-[#4ADE80]" />
                        {"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        {"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code */}
              <div className="bg-[#1a1a1a] border-t border-[#2a2a2a] overflow-x-auto px-4 py-4">
                <pre className="text-[12px] leading-[1.75] text-[#E0E0E0] font-mono whitespace-pre-wrap break-words">
                  {displayContent}
                </pre>
              </div>

              {/* Expand / collapse */}
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-[#2a2a2a] bg-[#1a1a1a] py-2.5 text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {expanded
                    ? "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c"
                    : `\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e (${lines.length} \u0441\u0442\u0440\u043e\u043a)`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
