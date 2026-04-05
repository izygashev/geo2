"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface VisibilityTrendChartProps {
  currentScore: number;
  createdAt: string; // ISO date of the report
}

/**
 * Генерирует 30-дневный мокнутый тренд до текущего score.
 * Полностью детерминистичный — без Math.random(), без Date.now(),
 * чтобы SSR и клиент дали одинаковый результат.
 */
function generateMockTrend(finalScore: number, reportDate: string) {
  const endDate = new Date(reportDate);
  const points: { date: string; score: number; label: string }[] = [];

  // Детерминистичный offset — зависит только от finalScore
  const startScore = Math.max(3, finalScore - (10 + (finalScore % 7)));

  for (let i = 29; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);

    const progress = (29 - i) / 29; // 0 → 1
    // Sigmoid-подобная кривая для естественного роста
    const sigmoid = 1 / (1 + Math.exp(-8 * (progress - 0.45)));
    const baseScore = startScore + (finalScore - startScore) * sigmoid;

    // Детерминистичный шум на основе sin (без рандома)
    const noise = i === 0 ? 0 : (Math.sin(i * 7.3) * 2);
    const score = Math.max(1, Math.min(100, Math.round(baseScore + noise)));

    // Форматируем дату детерминистично (без зависимости от locale runtime)
    const day = date.getDate();
    const monthNames = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    const label = `${day} ${monthNames[date.getMonth()]}`;

    points.push({
      date: date.toISOString(),
      score: i === 0 ? finalScore : score,
      label,
    });
  }

  return points;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] text-[#BBBBBB] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[#1a1a1a]">{point.value}/100</p>
    </div>
  );
}

export function VisibilityTrendChart({
  currentScore,
  createdAt,
}: VisibilityTrendChartProps) {
  const data = generateMockTrend(currentScore, createdAt);

  const firstScore = data[0]?.score ?? 0;
  const delta = currentScore - firstScore;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#787774]" />
          <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
            Динамика AI-видимости (30 дней)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {delta > 0 && (
            <span className="rounded-full bg-[#EDF3EC] px-2.5 py-0.5 text-xs font-medium text-[#2D6A4F]">
              +{delta} за период
            </span>
          )}
          <span className="rounded-full bg-[#F7F6F3] px-2.5 py-0.5 text-xs font-medium text-[#787774]">
            Прогноз
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#1a1a1a" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#BBBBBB" }}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#BBBBBB" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#F0EFEB" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#1a1a1a"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#1a1a1a",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="mt-3 text-center text-[10px] text-[#BBBBBB]">
        * Прогноз на основе текущего score и рыночных трендов · Точные данные доступны после нескольких анализов
      </p>
    </div>
  );
}
