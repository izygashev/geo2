"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProjectSettingsFormProps {
  projectId: string;
  projectName: string;
  competitorUrls: string[];
  brandLogoUrl: string | null;
  brandAccentColor: string | null;
  userPlan: string;
}

export function ProjectSettingsForm({
  projectId,
  projectName,
  competitorUrls: initialCompetitors,
  brandLogoUrl: initialLogo,
  brandAccentColor: initialColor,
  userPlan,
}: ProjectSettingsFormProps) {
  const router = useRouter();
  const isPro = userPlan === "PRO" || userPlan === "AGENCY";

  // Competitors state
  const [competitors, setCompetitors] = useState<string[]>(initialCompetitors);
  const [newUrl, setNewUrl] = useState("");
  const [compSaving, setCompSaving] = useState(false);
  const [compSuccess, setCompSuccess] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);

  // Brand state
  const [logoUrl, setLogoUrl] = useState(initialLogo ?? "");
  const [accentColor, setAccentColor] = useState(initialColor ?? "#1a1a1a");
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandSuccess, setBrandSuccess] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

  async function handleAddCompetitor() {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    if (competitors.length >= 3) {
      setCompError("Максимум 3 конкурента");
      return;
    }

    const updated = [...competitors, url];
    setCompetitors(updated);
    setNewUrl("");
    await saveCompetitors(updated);
  }

  async function handleRemoveCompetitor(index: number) {
    const updated = competitors.filter((_, i) => i !== index);
    setCompetitors(updated);
    await saveCompetitors(updated);
  }

  async function saveCompetitors(urls: string[]) {
    setCompSaving(true);
    setCompError(null);
    setCompSuccess(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/competitors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrls: urls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompError(data.error ?? "Ошибка сохранения");
      } else {
        setCompSuccess(true);
        setTimeout(() => setCompSuccess(false), 2000);
      }
    } catch {
      setCompError("Ошибка сети");
    } finally {
      setCompSaving(false);
    }
  }

  async function handleBrandSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBrandSaving(true);
    setBrandError(null);
    setBrandSuccess(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/brand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandLogoUrl: logoUrl.trim() || null,
          brandAccentColor: accentColor || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBrandError(data.error ?? "Ошибка сохранения");
      } else {
        setBrandSuccess(true);
        router.refresh();
        setTimeout(() => setBrandSuccess(false), 2000);
      }
    } catch {
      setBrandError("Ошибка сети");
    } finally {
      setBrandSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Конкуренты */}
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          Конкурентный бенчмарк
        </h2>
        <p className="mb-4 text-xs text-[#BBBBBB]">
          Добавьте URL конкурентов для сравнения AI Visibility Score
        </p>

        {!isPro ? (
          <div className="rounded-lg border border-dashed border-[#EAEAEA] bg-[#FBFBFA] p-6 text-center">
            <p className="text-sm text-[#787774]">
              Доступно на тарифах Pro и Agency
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {competitors.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-[#F0EFEB] px-3 py-2"
                >
                  <span className="flex-1 text-sm text-[#1a1a1a] truncate">
                    {url}
                  </span>
                  <button
                    onClick={() => handleRemoveCompetitor(i)}
                    className="rounded p-1 text-[#BBBBBB] hover:bg-[#FDEBEC] hover:text-[#B02A37] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {competitors.length < 3 && (
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://competitor.com"
                  className="h-8 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCompetitor())}
                />
                <Button
                  type="button"
                  onClick={handleAddCompetitor}
                  disabled={compSaving || !newUrl.trim()}
                  className="h-8 gap-1 rounded-md bg-[#111] px-3 text-xs font-medium text-white hover:bg-[#333]"
                >
                  {compSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : compSuccess ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <>
                      <Plus className="h-3 w-3" /> Добавить
                    </>
                  )}
                </Button>
              </div>
            )}

            {compError && (
              <p className="mt-2 text-xs text-[#B02A37]">{compError}</p>
            )}

            <p className="mt-3 text-xs text-[#BBBBBB]">
              Следующий отчёт автоматически сравнит ваш score с конкурентами. Стоимость: 25 кредитов.
            </p>
          </>
        )}
      </div>

      {/* White-label */}
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          White-label PDF
        </h2>
        <p className="mb-4 text-xs text-[#BBBBBB]">
          Настройте брендинг для PDF-отчётов этого проекта
        </p>

        {!isPro ? (
          <div className="rounded-lg border border-dashed border-[#EAEAEA] bg-[#FBFBFA] p-6 text-center">
            <p className="text-sm text-[#787774]">
              Доступно на тарифах Pro и Agency
            </p>
          </div>
        ) : (
          <form onSubmit={handleBrandSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#787774]">URL логотипа</span>
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="h-8 w-72 text-sm"
                maxLength={5000}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#787774]">Цвет акцента</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-[#EAEAEA]"
                />
                <Input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#1a1a1a"
                  className="h-8 w-28 text-sm font-mono"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Preview */}
            {logoUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-[#F0EFEB] bg-[#FBFBFA] p-3">
                <img
                  src={logoUrl}
                  alt="Preview"
                  className="h-8 max-w-[120px] object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="text-xs text-[#787774]">Предпросмотр лого</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={brandSaving}
                className="h-8 gap-1 rounded-md bg-[#111] px-3 text-xs font-medium text-white hover:bg-[#333]"
              >
                {brandSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : brandSuccess ? (
                  <>
                    <Check className="h-3 w-3" /> Сохранено
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>

            {brandError && (
              <p className="text-right text-xs text-[#B02A37]">{brandError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
