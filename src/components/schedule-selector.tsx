"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Check } from "lucide-react";

interface ScheduleSelectorProps {
  projectId: string;
  currentFrequency: string | null;
}

const OPTIONS = [
  { value: null, label: "Выкл" },
  { value: "weekly", label: "Раз в неделю" },
  { value: "monthly", label: "Раз в месяц" },
] as const;

export function ScheduleSelector({
  projectId,
  currentFrequency,
}: ScheduleSelectorProps) {
  const router = useRouter();
  const [frequency, setFrequency] = useState<string | null>(currentFrequency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function handleChange(newFreq: string | null) {
    if (newFreq === frequency) return;

    const prevFreq = frequency;
    setFrequency(newFreq);
    setSaving(true);
    setSaved(false);
    setError(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: newFreq }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 1500);
      } else {
        setFrequency(prevFreq);
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setFrequency(prevFreq);
      setError(true);
      setTimeout(() => setError(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-3 w-3 text-[#BBBBBB]" />
      <div className="flex items-center gap-1 rounded-md border border-[#EAEAEA] p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value ?? "off"}
            onClick={() => handleChange(opt.value)}
            disabled={saving}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              frequency === opt.value
                ? "bg-[#111] text-white"
                : "text-[#787774] hover:bg-[#F7F6F3]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {saving && <Loader2 className="h-3 w-3 animate-spin text-[#BBBBBB]" />}
      {saved && <Check className="h-3 w-3 text-[#2D6A4F]" />}
      {error && <span className="text-xs text-[#B02A37]">Ошибка</span>}
    </div>
  );
}
