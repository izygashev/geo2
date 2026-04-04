"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  /** Тип удаляемой сущности */
  entityType: "project" | "report";
  /** ID сущности */
  entityId: string;
  /** Название для подтверждения */
  entityName?: string;
  /** Куда перенаправить после удаления (по умолчанию — refresh) */
  redirectTo?: string;
  /** Вариант отображения */
  variant?: "icon" | "full";
}

export function DeleteButton({
  entityType,
  entityId,
  entityName,
  redirectTo,
  variant = "icon",
}: DeleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const label = entityType === "project" ? "проект" : "отчёт";
  const endpoint =
    entityType === "project"
      ? `/api/projects/${entityId}`
      : `/api/reports/${entityId}`;

  async function handleDelete() {
    const confirmMessage = entityName
      ? `Удалить ${label} "${entityName}"? Это действие нельзя отменить.`
      : `Удалить ${label}? Это действие нельзя отменить.`;

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);

    try {
      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? `Не удалось удалить ${label}`);
        setIsLoading(false);
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      alert("Ошибка сети");
      setIsLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="rounded-md p-1.5 text-[#BBBBBB] transition-colors hover:bg-[#FDEBEC] hover:text-[#B02A37] disabled:opacity-50"
        title={`Удалить ${label}`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleDelete}
      disabled={isLoading}
      variant="outline"
      className="gap-2 border-[#F5C2C7] text-[#B02A37] hover:bg-[#FDEBEC]"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Удалить {label}
    </Button>
  );
}
