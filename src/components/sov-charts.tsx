"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Donut Chart — общий % упоминаний ───────────────────

interface SovDonutProps {
  mentioned: number;
  total: number;
}

export function SovDonutChart({ mentioned, total }: SovDonutProps) {
  const notMentioned = total - mentioned;
  const data = [
    { name: "Упомянут", value: mentioned },
    { name: "Не упомянут", value: notMentioned },
  ];
  const COLORS = ["#1a1a1a", "#EAEAEA"]; // dark, warm light
  const pct = total > 0 ? Math.round((mentioned / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} strokeWidth={0} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Центральный текст */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">{pct}%</span>
          <span className="text-xs text-[#787774]">Узнаваемость</span>
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-3 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1a1a1a] inline-block" />
          <span className="text-[#787774]">Вас советуют ({mentioned})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#EAEAEA] inline-block" />
          <span className="text-[#787774]">Не советуют ({notMentioned})</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart — SoV по ключевым запросам ───────────────

interface SovBarItem {
  keyword: string;
  isMentioned: boolean;
}

interface SovBarProps {
  items: SovBarItem[];
}

// Кастомный тултип
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SovBarItem }[];
}) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <div className="rounded-lg border border-[#EAEAEA] bg-white px-3 py-2 text-sm shadow-none">
        <p className="text-[#787774] max-w-[220px] whitespace-normal">{item.keyword}</p>
        <p className={`mt-1 text-xs font-medium ${item.isMentioned ? "text-[#1a1a1a]" : "text-[#BBBBBB]"}`}>
          {item.isMentioned ? "✓ Вас рекомендуют" : "✗ Не рекомендуют"}
        </p>
      </div>
    );
  }
  return null;
}

export function SovBarChart({ items }: SovBarProps) {
  const data = items.map((item, i) => ({
    ...item,
    label: `Запрос ${i + 1}`,
    value: item.isMentioned ? 1 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={28}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#787774", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 1]}
          tickFormatter={(v) => (v === 1 ? "Да" : "Нет")}
          tick={{ fill: "#BBBBBB", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isMentioned ? "#1a1a1a" : "#EAEAEA"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
