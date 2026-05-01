"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Палитра цветов для проектов (до 10)
const COLORS = [
  "#1a1a1a",
  "#2D6A4F",
  "#B08D19",
  "#B02A37",
  "#1A6FBF",
  "#7C3AED",
  "#D97706",
  "#059669",
  "#DB2777",
  "#6366F1",
];

interface TrendsChartProps {
  data: Record<string, string | number>[];
  projectNames: string[];
}

export function TrendsChart({ data, projectNames }: TrendsChartProps) {
  if (data.length < 2 || projectNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
        Динамика Score по проектам
      </h2>
      <div className="h-[280px] min-h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#BBBBBB" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#BBBBBB" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #EAEAEA",
              borderRadius: "8px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            formatter={(value, name) => [`${Number(value)}/100`, String(name)]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "#787774" }}
          />
          {projectNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[i % COLORS.length], stroke: "white", strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
