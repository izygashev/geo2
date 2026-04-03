"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  "schema-org": { label: "Schema.org", color: "bg-[#F3EEFF] text-[#6B46C1] border-[#E2D5F8]" },
  "content": { label: "Контент", color: "bg-[#E1F3FE] text-[#1A6FBF] border-[#C8E1FE]" },
  "technical": { label: "Техническое", color: "bg-[#FBF3DB] text-[#B08D19] border-[#FBE5A8]" },
  "llms-txt": { label: "llms.txt", color: "bg-[#EDF3EC] text-[#2D6A4F] border-[#D1E7DD]" },
  "authority": { label: "Авторитет", color: "bg-[#FDEBEC] text-[#B02A37] border-[#F5C2C7]" },
  "competitors": { label: "Конкуренты", color: "bg-[#FFF3E6] text-[#B5651D] border-[#FFDDB5]" },
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
  const config = TYPE_CONFIG[type] ?? { label: type, color: "bg-[#F7F6F3] text-[#787774] border-[#EAEAEA]" };
  const hasCode = generatedCode && generatedCode.trim().length > 0;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-5 transition-colors hover:bg-[#FBFBFA]">
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

          {/* Кнопка показа кода */}
          {hasCode && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode((v) => !v)}
                className="h-7 gap-1.5 px-2 text-xs text-[#787774] hover:text-[#1a1a1a] hover:bg-[#F7F6F3]"
              >
                <Code2 className="h-3.5 w-3.5" />
                {showCode ? "Скрыть код" : "Показать код"}
                {showCode ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              {showCode && (
                <div className="mt-2 rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] p-4 overflow-x-auto">
                  <pre className="text-xs text-[#555] whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {generatedCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
