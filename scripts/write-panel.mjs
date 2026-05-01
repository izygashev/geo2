import { writeFileSync } from 'fs';

const content = `"use client";

import { useState } from "react";
import {
  Code2,
  Sparkles,
  FileText,
  Wrench,
  Bot,
  Copy,
  Check,
  Settings,
  TrendingUp,
  Database,
  MessageSquare,
  Globe,
  Table,
  ThumbsUp,
  HelpCircle,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Role = "dev" | "copywriter" | "marketer" | "owner";

const ROLE_META: Record<Role, { label: string; emoji: string; color: string }> = {
  dev:        { label: "Zadacha dlya programmista", emoji: "💻", color: "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]" },
  copywriter: { label: "Zadacha dlya kopirajtora",  emoji: "📝", color: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]" },
  marketer:   { label: "Zadacha dlya marketologa",  emoji: "📣", color: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]" },
  owner:      { label: "Sdelat samomu",              emoji: "✅", color: "bg-[#F7F6F3] text-[#555]   border-[#E5E4E0]" },
};

export { ROLE_META };
`;

writeFileSync('d:/saastest/GEO/src/components/recommendations-panel.tsx', content, 'utf8');
console.log('written', content.length);
