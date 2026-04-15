"use client";

import { ExternalLink, Lock } from "lucide-react";
import Link from "next/link";

interface Competitor {
  name: string;
  url?: string;
}

interface CompetitorsTableProps {
  competitors: Competitor[];
  isPro?: boolean; // true если пользователь на PRO/AGENCY плане
  isPdf?: boolean; // true в print/export — показывает полный список без paywall
}

export function CompetitorsTable({ competitors, isPro = false, isPdf = false }: CompetitorsTableProps) {
  if (competitors.length === 0) return null;

  // Считаем сколько раз каждый конкурент упоминался
  const countMap = new Map<string, { count: number; url?: string }>();
  for (const c of competitors) {
    const key = c.name.toLowerCase().trim();
    const existing = countMap.get(key);
    if (existing) {
      existing.count++;
      if (!existing.url && c.url) existing.url = c.url;
    } else {
      countMap.set(key, { count: 1, url: c.url });
    }
  }

  const sorted = Array.from(countMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxCount = sorted[0]?.count ?? 1;

  // FREE: показываем 3 чётко, остальные blur
  // isPdf / isPro: показываем весь список без blur
  const FREE_VISIBLE_COUNT = 3;
  const showAll = isPro || isPdf;
  const visibleItems = showAll ? sorted : sorted.slice(0, FREE_VISIBLE_COUNT);
  const blurredItems = showAll ? [] : sorted.slice(FREE_VISIBLE_COUNT);

  return (
    <div className="space-y-3">
      {/* Видимые конкуренты */}
      {visibleItems.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-[#BBBBBB]">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#1a1a1a] truncate capitalize">
                {item.name}
              </span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#BBBBBB] hover:text-[#787774] transition-colors print-hide"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F0EFEB]">
              <div
                className="h-full rounded-full bg-[#787774] transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-[#787774]">
            {item.count}×
          </span>
        </div>
      ))}

      {/* Blurred paywall section */}
      {blurredItems.length > 0 && (
        <div className="relative mt-2">
          {/* Blurred content */}
          <div className="select-none pointer-events-none" aria-hidden="true">
            {blurredItems.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-3 py-1.5"
                style={{
                  filter: `blur(${4 + i * 1}px)`,
                  opacity: Math.max(0.15, 0.5 - i * 0.1),
                }}
              >
                <span className="w-5 shrink-0 text-right font-mono text-xs text-[#BBBBBB]">
                  {FREE_VISIBLE_COUNT + i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a1a1a] truncate capitalize">
                      {item.name}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F0EFEB]">
                    <div
                      className="h-full rounded-full bg-[#787774]"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[#787774]">
                  {item.count}×
                </span>
              </div>
            ))}
          </div>

          {/* CTA overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/dashboard/billing"
              className="group flex items-center gap-2 rounded-lg border border-[#1a1a1a] bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#333] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lock className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              Разблокировать полный список (PRO)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
