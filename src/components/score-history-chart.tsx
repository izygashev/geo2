"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ScoreHistoryItem {
  date: string;
  score: number;
  reportId: string;
}

interface ScoreHistoryChartProps {
  data: ScoreHistoryItem[];
}

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  if (data.length < 2) return null;

  const currentScore = data[data.length - 1].score;
  const prevScore = data[data.length - 2].score;
  const delta = currentScore - prevScore;

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
          История AI Visibility Score
        </h3>
        {delta !== 0 && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              delta > 0
                ? "bg-[#EDF3EC] text-[#2D6A4F]"
                : "bg-[#FDEBEC] text-[#B02A37]"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta} с прошлого раза
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
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
            formatter={(value) => [`${value}/100`, "Score"]}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <ReferenceLine
            y={50}
            stroke="#F0EFEB"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#1a1a1a"
            strokeWidth={2}
            dot={{ r: 4, fill: "#1a1a1a", stroke: "white", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#1a1a1a", stroke: "white", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-3 text-xs text-[#BBBBBB] text-center">
        {data.length} {data.length === 1 ? "отчёт" : data.length < 5 ? "отчёта" : "отчётов"} за всё время
      </p>
    </div>
  );
}
