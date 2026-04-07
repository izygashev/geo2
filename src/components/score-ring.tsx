"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#2D6A4F";
  if (score >= 50) return "#B08D19";
  return "#B02A37";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "ИИ вас отлично знает";
  if (score >= 60) return "Хороший старт";
  if (score >= 50) return "Есть над чем работать";
  if (score >= 20) return "ИИ вас почти не знает";
  return "ИИ вас не видит";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-[#EDF3EC]";
  if (score >= 50) return "bg-[#FBF3DB]";
  return "bg-[#FDEBEC]";
}

export function ScoreRing({ score, size = 180, strokeWidth = 10 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const bg = getScoreBg(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F0EFEB"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold tracking-tighter"
            style={{ color }}
          >
            {Math.round(score)}
          </span>
          <span className="text-xs text-[#BBBBBB]">из 100</span>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${bg}`}
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Маленькое кольцо для breakdown-карточек ────────────

interface MiniScoreBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export function ScoreBreakdownBar({ label, value, icon }: MiniScoreBarProps) {
  const color = getScoreColor(value);
  const bgColor =
    value >= 80 ? "bg-[#2D6A4F]" : value >= 50 ? "bg-[#B08D19]" : "bg-[#B02A37]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#787774]">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EFEB]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${bgColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
