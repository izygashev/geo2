"use client";

import { useState } from "react";
import { Share2, Loader2, Check, Copy, LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareReportButtonProps {
  reportId: string;
  existingShareId?: string | null;
}

export function ShareReportButton({ reportId, existingShareId }: ShareReportButtonProps) {
  const [shareId, setShareId] = useState<string | null>(existingShareId ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function getShareUrl() {
    if (!shareId) return null;
    return typeof window !== "undefined"
      ? `${window.location.origin}/r/${shareId}`
      : `/r/${shareId}`;
  }

  async function handleCreateShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setShareId(data.shareId);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveShare() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShareId(null);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const url = getShareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!shareId) {
    return (
      <Button
        onClick={handleCreateShare}
        disabled={loading}
        variant="outline"
        className="gap-2 text-sm"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Поделиться
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border border-[#EAEAEA] bg-[#F7F6F3] px-3 py-1.5">
        <LinkIcon className="h-3 w-3 text-[#787774]" />
        <span className="max-w-[200px] truncate text-xs text-[#787774]">
          {getShareUrl()}
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="rounded-md border border-[#EAEAEA] p-1.5 text-[#787774] transition-colors hover:bg-[#F7F6F3]"
        title="Копировать ссылку"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[#2D6A4F]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        onClick={handleRemoveShare}
        disabled={loading}
        className="rounded-md border border-[#EAEAEA] p-1.5 text-[#BBBBBB] transition-colors hover:bg-[#FDEBEC] hover:text-[#B02A37]"
        title="Отключить публичную ссылку"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
