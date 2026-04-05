"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Code2, Sparkles, FileText, Wrench, Bot, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { label: string; color: string; actionLabel?: string; actionIcon?: "code" | "article" | "task" | "file" }> = {
  "schema-org": { label: "Schema.org", color: "bg-[#F3EEFF] text-[#6B46C1] border-[#E2D5F8]", actionLabel: "Сгенерировать код", actionIcon: "code" },
  "content": { label: "Контент", color: "bg-[#E1F3FE] text-[#1A6FBF] border-[#C8E1FE]", actionLabel: "Создать ТЗ для статьи", actionIcon: "article" },
  "technical": { label: "Техническое", color: "bg-[#FBF3DB] text-[#B08D19] border-[#FBE5A8]", actionLabel: "Создать задачу", actionIcon: "task" },
  "llms-txt": { label: "llms.txt", color: "bg-[#EDF3EC] text-[#2D6A4F] border-[#D1E7DD]", actionLabel: "Сгенерировать файл", actionIcon: "file" },
  "authority": { label: "Авторитет", color: "bg-[#FDEBEC] text-[#B02A37] border-[#F5C2C7]", actionLabel: "Составить план", actionIcon: "article" },
  "competitors": { label: "Конкуренты", color: "bg-[#FFF3E6] text-[#B5651D] border-[#FFDDB5]", actionLabel: "Анализировать конкурента", actionIcon: "task" },
  "robots-txt": { label: "Robots.txt", color: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]", actionLabel: "Сгенерировать правила", actionIcon: "code" },
  "semantic-html": { label: "Семантика", color: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]", actionLabel: "Создать шаблон", actionIcon: "code" },
};

const ACTION_ICONS = {
  code: Sparkles,
  article: FileText,
  task: Wrench,
  file: Bot,
};

interface RecommendationCardProps {
  index: number;
  type: string;
  title: string;
  description: string;
  generatedCode: string;
}

export function RecommendationCard({
  index,
  type,
  title,
  description,
  generatedCode,
}: RecommendationCardProps) {
  const [showCode, setShowCode] = useState(false);
  const [actionClicked, setActionClicked] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = TYPE_CONFIG[type] ?? { label: type, color: "bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]" };
  const hasCode = generatedCode && generatedCode.trim().length > 0;
  const ActionIcon = config.actionIcon ? ACTION_ICONS[config.actionIcon] : Sparkles;

  const handleAction = () => {
    setActionClicked(true);
    // Если есть код — показываем его
    if (hasCode) {
      setShowCode(true);
    }
    setTimeout(() => setActionClicked(false), 2000);
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-xl border border-[#EAEAEA] bg-white p-5 transition-all hover:bg-[#FBFBFA] hover:shadow-sm">
      <div className="flex items-start gap-4">
        {/* Номер */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] text-xs font-medium text-[#787774]">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            <h3 className="text-sm font-medium text-[#1a1a1a]">{title}</h3>
          </div>

          <p className="text-sm text-[#787774] leading-relaxed">{description}</p>

          {/* Action buttons row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Actionable AI button */}
            {config.actionLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                className={`h-8 gap-1.5 px-3 text-xs font-medium transition-all ${
                  actionClicked
                    ? "border-[#2D6A4F] bg-[#EDF3EC] text-[#2D6A4F]"
                    : "border-[#EAEAEA] text-[#787774] hover:border-[#1a1a1a] hover:text-[#1a1a1a] hover:bg-[#F7F6F3]"
                }`}
              >
                <ActionIcon className="h-3.5 w-3.5" />
                {actionClicked ? "✓ Готово" : config.actionLabel}
              </Button>
            )}

            {/* Show code toggle */}
            {hasCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode((v) => !v)}
                className="h-8 gap-1.5 px-2 text-xs text-[#787774] hover:text-[#1a1a1a] hover:bg-[#F7F6F3]"
              >
                <Code2 className="h-3.5 w-3.5" />
                {showCode ? "Скрыть код" : "Показать код"}
                {showCode ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>

          {/* Code block */}
          {showCode && hasCode && (
            <div className="mt-3 relative rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] p-4 overflow-x-auto">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-[#EAEAEA] bg-white text-[#787774] transition-all hover:border-[#1a1a1a] hover:text-[#1a1a1a] hover:shadow-sm"
                title="Копировать код"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[#2D6A4F]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <pre className="text-xs text-[#555] whitespace-pre-wrap break-words font-mono leading-relaxed pr-8">
                {generatedCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
