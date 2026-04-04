"use client";

import { ExternalLink } from "lucide-react";

interface Competitor {
  name: string;
  url?: string;
}

interface CompetitorsTableProps {
  competitors: Competitor[];
}

export function CompetitorsTable({ competitors }: CompetitorsTableProps) {
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

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          {/* Rank */}
          <span className="w-5 shrink-0 text-right font-mono text-xs text-[#BBBBBB]">
            {i + 1}
          </span>

          {/* Name + bar */}
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
                  className="shrink-0 text-[#BBBBBB] hover:text-[#787774] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {/* Mini bar */}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F0EFEB]">
              <div
                className="h-full rounded-full bg-[#787774] transition-all duration-500"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Count */}
          <span className="shrink-0 text-xs tabular-nums text-[#787774]">
            {item.count}×
          </span>
        </div>
      ))}
    </div>
  );
}
