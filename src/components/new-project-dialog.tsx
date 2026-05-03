"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewProjectDialogProps {
  /** Вариант кнопки: primary (тёмная) или outline (для пустого состояния с mt-6) */
  variant?: "primary" | "outline";
  /** Текст кнопки */
  label?: string;
}

export function NewProjectDialog({
  variant = "primary",
  label = "Новый проект",
}: NewProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setOpen(false);
    setUrl("");
    setError(null);
  }, [isLoading]);

  // Закрытие по Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Не удалось создать проект");
        setIsLoading(false);
        return;
      }

      setOpen(false);
      setUrl("");
      setError(null);
      router.push(`/dashboard/reports/${data.reportId}`);
      router.refresh();
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={() => setOpen(true)}
        className={
          variant === "outline"
            ? "btn-tactile mt-6 gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]"
            : "btn-tactile gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]"
        }
      >
        <Plus className="h-4 w-4" />
        {label}
      </Button>

      {/* Modal backdrop + dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-[#EAEAEA] bg-white p-6 shadow-diffuse mx-4">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-md p-1 text-[#BBBBBB] transition-colors hover:bg-[#F7F6F3] hover:text-[#787774]"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#787774]" />
                <h2 className="text-sm font-bold tracking-tight text-[#1a1a1a]">
                  Новый проект
                </h2>
              </div>
              <p className="text-sm text-[#787774]">
                Введите URL сайта для анализа AI-видимости
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com"
                    disabled={isLoading}
                    autoFocus
                    className="h-10"
                  />
                  <p className="mt-1.5 text-xs text-[#BBBBBB]">
                    Автоматически добавим https:// если не указано
                  </p>
                </div>

                {error && (
                  <div className="rounded-md border border-[#F5C2C7] bg-[#FDEBEC] px-3 py-2 text-sm text-[#B02A37]">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-md px-4 py-2 text-sm text-[#787774] transition-colors hover:bg-[#F7F6F3]"
                  >
                    Отмена
                  </button>
                  <Button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="btn-tactile gap-2 rounded-md bg-[#111] text-sm font-medium text-white hover:bg-[#333]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Создаём…
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Создать и анализировать
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-[11px] text-[#CCCCCC]">
                  Анализ может занимать до 10 минут
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
