"use client";

import dynamic from "next/dynamic";

const VisibilityTrendChart = dynamic(
  () =>
    import("@/components/visibility-trend-chart").then(
      (m) => m.VisibilityTrendChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Динамика AI-видимости (30 дней)
          </span>
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <span className="text-xs text-[#BBBBBB]">Загрузка графика…</span>
        </div>
      </div>
    ),
  }
);

export { VisibilityTrendChart };
