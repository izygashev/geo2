"use client";

import { useState } from "react";
import {
  Code2,
  Sparkles,
  FileText,
  Wrench,
  Bot,
  Copy,
  Check,
  Download,
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
  dev: {
    label: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043b\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442\u0430",
    emoji: "\u{1F4BB}",
    color: "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]",
  },
  copywriter: {
    label: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043b\u044f \u043a\u043e\u043f\u0438\u0440\u0430\u0439\u0442\u0435\u0440\u0430",
    emoji: "\u{1F4DD}",
    color: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]",
  },
  marketer: {
    label: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043b\u044f \u043c\u0430\u0440\u043a\u0435\u0442\u043e\u043b\u043e\u0433\u0430",
    emoji: "\u{1F4E3}",
    color: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
  },
  owner: {
    label: "\u0421\u0434\u0435\u043b\u0430\u0442\u044c \u0441\u0430\u043c\u043e\u043c\u0443",
    emoji: "\u2705",
    color: "bg-[#F7F6F3] text-[#555] border-[#E5E4E0]",
  },
};

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    role: Role;
    whyBusiness: string;
    whatToDo: string;
    impactWeight: number;
    typeIcon: React.ComponentType<{ className?: string }>;
  }
> = {
  "schema-org": {
    label: "\u0420\u0430\u0437\u043c\u0435\u0442\u043a\u0430 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u0418\u0418",
    role: "dev",
    whyBusiness:
      "\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u043d\u0435 \u043f\u043e\u043d\u0438\u043c\u0430\u044e\u0442 \u0432\u0430\u0448\u0438 \u0446\u0435\u043d\u044b, \u0443\u0441\u043b\u0443\u0433\u0438 \u0438 \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u2014 \u0438\u0437-\u0437\u0430 \u044d\u0442\u043e\u0433\u043e \u043e\u043d\u0438 \u043d\u0435 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u044e\u0442 \u0432\u0430\u0441, \u043a\u043e\u0433\u0434\u0430 \u043a\u043b\u0438\u0435\u043d\u0442 \u0441\u043f\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442 \u043d\u0435\u0432\u0438\u0434\u0438\u043c\u044b\u0435 \u0442\u0435\u0433\u0438 \u043d\u0430 \u0441\u0430\u0439\u0442. \u0417\u0430\u043d\u0438\u043c\u0430\u0435\u0442 1\u20132 \u0447\u0430\u0441\u0430.",
    impactWeight: 8,
    typeIcon: ShieldCheck,
  },
  "schema-faq": {
    label: "\u0411\u043b\u043e\u043a \u0432\u043e\u043f\u0440\u043e\u0441-\u043e\u0442\u0432\u0435\u0442",
    role: "dev",
    whyBusiness:
      "\u041a\u043e\u0433\u0434\u0430 \u043a\u043b\u0438\u0435\u043d\u0442\u044b \u0437\u0430\u0434\u0430\u044e\u0442 \u0432\u043e\u043f\u0440\u043e\u0441\u044b \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438, \u043e\u043d\u0430 \u0438\u0449\u0435\u0442 \u0433\u043e\u0442\u043e\u0432\u044b\u0435 \u043e\u0442\u0432\u0435\u0442\u044b \u043d\u0430 \u0441\u0430\u0439\u0442\u0430\u0445. \u0411\u0435\u0437 FAQ-\u0431\u043b\u043e\u043a\u0430 \u0432\u0430\u0441 \u0432 \u044d\u0442\u0438\u0445 \u043e\u0442\u0432\u0435\u0442\u0430\u0445 \u043d\u0435\u0442.",
    whatToDo:
      "\u0412\u043e\u043f\u0440\u043e\u0441\u044b \u0438 \u043e\u0442\u0432\u0435\u0442\u044b \u0443\u0436\u0435 \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u044b \u2014 \u0441\u043c\u043e\u0442\u0440\u0438\u0442\u0435 \u0433\u043e\u0442\u043e\u0432\u044b\u0439 \u043a\u043e\u0434 \u043d\u0438\u0436\u0435. \u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u0435\u0442 \u0435\u0433\u043e \u043d\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443. \u0417\u0430\u043d\u0438\u043c\u0430\u0435\u0442 15 \u043c\u0438\u043d\u0443\u0442.",
    impactWeight: 8,
    typeIcon: HelpCircle,
  },
  content: {
    label: "\u041d\u043e\u0432\u044b\u0439 \u043a\u043e\u043d\u0442\u0435\u043d\u0442",
    role: "copywriter",
    whyBusiness:
      "\u041f\u043e \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u043c \u0437\u0430\u043f\u0440\u043e\u0441\u0430\u043c \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u0418\u0418 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442 \u043a\u043e\u043d\u043a\u0443\u0440\u0435\u043d\u0442\u043e\u0432 \u2014 \u043f\u043e\u0442\u043e\u043c\u0443 \u0447\u0442\u043e \u0443 \u043d\u0438\u0445 \u0435\u0441\u0442\u044c \u0441\u0442\u0430\u0442\u044c\u0438, \u0430 \u0443 \u0432\u0430\u0441 \u043d\u0435\u0442.",
    whatToDo:
      "\u041a\u043e\u043f\u0438\u0440\u0430\u0439\u0442\u0435\u0440 \u043f\u0438\u0448\u0435\u0442 \u044d\u043a\u0441\u043f\u0435\u0440\u0442\u043d\u0443\u044e \u0441\u0442\u0430\u0442\u044c\u044e \u0438\u043b\u0438 \u0440\u0430\u0437\u0434\u0435\u043b \u0441\u0430\u0439\u0442\u0430. \u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u043d\u0430\u0447\u043d\u0443\u0442 \u0441\u0441\u044b\u043b\u0430\u0442\u044c\u0441\u044f \u043d\u0430 \u0432\u0430\u0441.",
    impactWeight: 7,
    typeIcon: FileText,
  },
  "rag-content": {
    label: "\u0422\u0435\u043a\u0441\u0442\u044b \u0434\u043b\u044f \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0435\u0439",
    role: "copywriter",
    whyBusiness:
      "\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u0447\u0438\u0442\u0430\u044e\u0442 \u0432\u0430\u0448 \u0441\u0430\u0439\u0442 \u043a\u0430\u043a \u043a\u043d\u0438\u0433\u0443. \u0415\u0441\u043b\u0438 \u0442\u0435\u043a\u0441\u0442 \u043d\u0430\u043f\u0438\u0441\u0430\u043d \u0442\u043e\u043b\u044c\u043a\u043e \u0434\u043b\u044f \u043b\u044e\u0434\u0435\u0439 \u2014 \u043e\u043d\u0438 \u0435\u0433\u043e \u043f\u0440\u043e\u043f\u0443\u0441\u043a\u0430\u044e\u0442 \u043c\u0438\u043c\u043e.",
    whatToDo:
      "\u041f\u0435\u0440\u0435\u043f\u0438\u0441\u0430\u0442\u044c \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u0442\u0435\u043a\u0441\u0442\u044b \u0441\u0430\u0439\u0442\u0430 \u043f\u043e \u0448\u0430\u0431\u043b\u043e\u043d\u0443, \u043f\u043e\u043d\u044f\u0442\u043d\u043e\u043c\u0443 \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u044f\u043c.",
    impactWeight: 9,
    typeIcon: MessageSquare,
  },
  technical: {
    label: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 \u0441\u0430\u0439\u0442\u0430",
    role: "dev",
    whyBusiness:
      "\u0422\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u043c\u0435\u0448\u0430\u0435\u0442 \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u044f\u043c \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e \u0447\u0438\u0442\u0430\u0442\u044c \u0432\u0430\u0448 \u0441\u0430\u0439\u0442.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0443\u0441\u0442\u0440\u0430\u043d\u044f\u0435\u0442 \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u0443. \u041e\u0431\u044b\u0447\u043d\u043e \u044d\u0442\u043e \u0437\u0430\u0434\u0430\u0447\u0430 \u043d\u0430 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0447\u0430\u0441\u043e\u0432.",
    impactWeight: 6,
    typeIcon: Settings,
  },
  "semantic-tables": {
    label: "\u0422\u0430\u0431\u043b\u0438\u0446\u044b \u0441 \u0434\u0430\u043d\u043d\u044b\u043c\u0438",
    role: "dev",
    whyBusiness:
      "\u0422\u0430\u0431\u043b\u0438\u0446\u044b \u2014 \u043b\u044e\u0431\u0438\u043c\u044b\u0439 \u043a\u043e\u043d\u0442\u0435\u043d\u0442 \u0434\u043b\u044f \u0418\u0418. \u0411\u0435\u0437 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u0439 \u0440\u0430\u0437\u043c\u0435\u0442\u043a\u0438 \u043e\u043d\u0438 \u043e\u0441\u0442\u0430\u044e\u0442\u0441\u044f \u043d\u0435\u0432\u0438\u0434\u0438\u043c\u044b\u043c\u0438.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0444\u043e\u0440\u043c\u0430\u0442\u0438\u0440\u0443\u0435\u0442 \u0442\u0430\u0431\u043b\u0438\u0446\u044b \u043f\u043e \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u0443.",
    impactWeight: 7,
    typeIcon: Table,
  },
  "llms-txt": {
    label: "\u0412\u0438\u0437\u0438\u0442\u043a\u0430 \u0434\u043b\u044f \u0418\u0418-\u0431\u043e\u0442\u043e\u0432",
    role: "dev",
    whyBusiness:
      "\u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u0444\u0430\u0439\u043b-\u0432\u0438\u0437\u0438\u0442\u043a\u0430 (llms.txt), \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u0447\u0438\u0442\u0430\u044e\u0442 \u043f\u0435\u0440\u0432\u044b\u043c \u0434\u0435\u043b\u043e\u043c.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0441\u043e\u0437\u0434\u0430\u0435\u0442 \u043e\u0434\u0438\u043d \u0444\u0430\u0439\u043b \u043d\u0430 \u0441\u0430\u0439\u0442\u0435. \u0413\u043e\u0442\u043e\u0432\u044b\u0439 \u0442\u0435\u043a\u0441\u0442 \u0443\u0436\u0435 \u0435\u0441\u0442\u044c \u2014 \u0441\u043c\u043e\u0442\u0440\u0438\u0442\u0435 \u043d\u0438\u0436\u0435 \u043d\u0430 \u044d\u0442\u043e\u0439 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435.",
    impactWeight: 9,
    typeIcon: Bot,
  },
  authority: {
    label: "\u0420\u0435\u043f\u0443\u0442\u0430\u0446\u0438\u044f \u0432 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0435",
    role: "marketer",
    whyBusiness:
      "\u0418\u0418 \u0434\u043e\u0432\u0435\u0440\u044f\u0435\u0442 \u0431\u0440\u0435\u043d\u0434\u0430\u043c, \u043e \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u043f\u0438\u0448\u0443\u0442 \u0434\u0440\u0443\u0433\u0438\u0435 \u0441\u0430\u0439\u0442\u044b.",
    whatToDo:
      "\u041c\u0430\u0440\u043a\u0435\u0442\u043e\u043b\u043e\u0433 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0443\u0435\u0442 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438 \u043e \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430\u0445.",
    impactWeight: 5,
    typeIcon: TrendingUp,
  },
  entity: {
    label: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0431\u0440\u0435\u043d\u0434\u0430",
    role: "marketer",
    whyBusiness:
      "\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u0441\u043e\u0431\u0438\u0440\u0430\u044e\u0442 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044e \u043e \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f\u0445 \u0438\u0437 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0445 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u043e\u0432. \u0415\u0441\u043b\u0438 \u043f\u0440\u043e\u0444\u0438\u043b\u044f \u043d\u0435\u0442 \u2014 \u0432\u0430\u0441 \u043a\u0430\u043a \u0431\u0443\u0434\u0442\u043e \u043d\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
    whatToDo:
      "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u0432 \u042f\u043d\u0434\u0435\u043a\u0441 \u0411\u0438\u0437\u043d\u0435\u0441, Google \u0411\u0438\u0437\u043d\u0435\u0441.",
    impactWeight: 8,
    typeIcon: Database,
  },
  "platform-seeding": {
    label: "\u0423\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430\u0445",
    role: "marketer",
    whyBusiness:
      "\u0418\u0418 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442 \u0442\u0435 \u0431\u0440\u0435\u043d\u0434\u044b, \u043e \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0433\u043e\u0432\u043e\u0440\u044f\u0442 \u043d\u0430 \u0444\u043e\u0440\u0443\u043c\u0430\u0445 \u0438 \u0432 \u043e\u0442\u0437\u044b\u0432\u0430\u0445.",
    whatToDo:
      "\u0420\u0430\u0437\u043c\u0435\u0441\u0442\u0438\u0442\u044c \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044e \u043e \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u043d\u0430 \u043e\u0442\u0437\u043e\u0432\u0438\u043a\u0430\u0445, Q&A \u0441\u0430\u0439\u0442\u0430\u0445.",
    impactWeight: 6,
    typeIcon: Globe,
  },
  sentiment: {
    label: "\u0422\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043e\u0442\u0437\u044b\u0432\u043e\u0432",
    role: "marketer",
    whyBusiness:
      "\u0418\u0418 \u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u0443\u0435\u0442 \u043e\u0442\u0437\u044b\u0432\u044b. \u0415\u0441\u043b\u0438 \u0442\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u043d\u0435\u0433\u0430\u0442\u0438\u0432\u043d\u0430\u044f \u2014 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u044e\u0442 \u0432\u0430\u0441 \u0440\u0435\u0436\u0435.",
    whatToDo:
      "\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c \u043d\u0430 \u043d\u0435\u0433\u0430\u0442\u0438\u0432, \u0441\u043e\u0431\u0440\u0430\u0442\u044c \u043d\u043e\u0432\u044b\u0435 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043e\u0442\u0437\u044b\u0432\u044b.",
    impactWeight: 7,
    typeIcon: ThumbsUp,
  },
  competitors: {
    label: "\u041a\u043e\u043d\u043a\u0443\u0440\u0435\u043d\u0442\u043d\u044b\u0439 \u0430\u043d\u0430\u043b\u0438\u0437",
    role: "marketer",
    whyBusiness:
      "\u041a\u043e\u043d\u043a\u0443\u0440\u0435\u043d\u0442\u044b \u0443\u0436\u0435 \u0434\u0435\u043b\u0430\u044e\u0442 \u0442\u043e, \u0447\u0435\u0433\u043e \u043d\u0435\u0442 \u0443 \u0432\u0430\u0441.",
    whatToDo:
      "\u041c\u0430\u0440\u043a\u0435\u0442\u043e\u043b\u043e\u0433 \u043f\u0440\u043e\u0432\u043e\u0434\u0438\u0442 \u0430\u043d\u0430\u043b\u0438\u0437 \u043a\u043e\u043d\u043a\u0443\u0440\u0435\u043d\u0442\u043e\u0432.",
    impactWeight: 4,
    typeIcon: Wrench,
  },
  "robots-txt": {
    label: "\u0414\u043e\u0441\u0442\u0443\u043f \u0434\u043b\u044f \u0418\u0418-\u0431\u043e\u0442\u043e\u0432",
    role: "dev",
    whyBusiness:
      "\u0424\u0430\u0439\u043b robots.txt \u2014 \u044d\u0442\u043e \u043f\u0440\u043e\u043f\u0443\u0441\u043a\u043d\u043e\u0439 \u043f\u0443\u043d\u043a\u0442 \u0434\u043b\u044f \u0440\u043e\u0431\u043e\u0442\u043e\u0432. \u0415\u0441\u043b\u0438 \u043e\u043d \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d \u043d\u0435\u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e, \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u043d\u0435 \u0441\u043c\u043e\u0433\u0443\u0442 \u0447\u0438\u0442\u0430\u0442\u044c \u0432\u0430\u0448 \u0441\u0430\u0439\u0442.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0438\u0437\u043c\u0435\u043d\u044f\u0435\u0442 \u043e\u0434\u0438\u043d \u0444\u0430\u0439\u043b. \u0417\u0430\u043d\u0438\u043c\u0430\u0435\u0442 15 \u043c\u0438\u043d\u0443\u0442.",
    impactWeight: 10,
    typeIcon: ShieldCheck,
  },
  "semantic-html": {
    label: "\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446",
    role: "dev",
    whyBusiness:
      "\u041d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0438 \u043f\u043e\u043d\u0438\u043c\u0430\u044e\u0442 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u0441 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e\u0439 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u043e\u0439.",
    whatToDo:
      "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442 \u0438\u0441\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u0442 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0443 HTML-\u043a\u043e\u0434\u0430.",
    impactWeight: 7,
    typeIcon: Code2,
  },
};

function getConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      label: type,
      role: "dev" as Role,
      whyBusiness: "\u042d\u0442\u043e \u0443\u043b\u0443\u0447\u0448\u0435\u043d\u0438\u0435 \u043f\u043e\u043c\u043e\u0436\u0435\u0442 \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u044f\u043c \u043b\u0443\u0447\u0448\u0435 \u043f\u043e\u043d\u044f\u0442\u044c \u0432\u0430\u0448 \u0441\u0430\u0439\u0442.",
      whatToDo: "\u041f\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443 \u0441\u0432\u043e\u0435\u043c\u0443 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0443.",
      impactWeight: 5,
      typeIcon: Sparkles,
    }
  );
}

function impactLabel(type: string): { text: string; color: string } {
  const w = getConfig(type).impactWeight;
  if (w >= 9) return { text: "\u041e\u0447\u0435\u043d\u044c \u0432\u0430\u0436\u043d\u043e", color: "text-[#B02A37] bg-[#FDEBEC]" };
  if (w >= 7) return { text: "\u0412\u0430\u0436\u043d\u043e", color: "text-[#B08D19] bg-[#FBF3DB]" };
  if (w >= 5) return { text: "\u041f\u043e\u043b\u0435\u0437\u043d\u043e", color: "text-[#1A6FBF] bg-[#E1F3FE]" };
  return { text: "\u041d\u0430 \u0431\u0443\u0434\u0443\u0449\u0435\u0435", color: "text-[#787774] bg-[#F7F6F3]" };
}

export interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  generatedCode: string;
}

interface RecommendationsPanelProps {
  recommendations: RecommendationItem[];
  projectUrl?: string;
  generatedLlmsTxt?: string;
  isPdf?: boolean;
}

const GEO_FACTORS = [
  { key: "entity",           label: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0431\u0440\u0435\u043d\u0434\u0430 \u0432 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0435" },
  { key: "rag-content",      label: "\u0422\u0435\u043a\u0441\u0442\u044b \u0434\u043b\u044f \u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442\u0435\u0439" },
  { key: "llms-txt",         label: "\u0412\u0438\u0437\u0438\u0442\u043a\u0430 \u0434\u043b\u044f \u0418\u0418 (llms.txt)" },
  { key: "platform-seeding", label: "\u0423\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430\u0445" },
  { key: "semantic-tables",  label: "\u0422\u0430\u0431\u043b\u0438\u0446\u044b \u0441 \u0434\u0430\u043d\u043d\u044b\u043c\u0438" },
  { key: "sentiment",        label: "\u041f\u043e\u0437\u0438\u0442\u0438\u0432\u043d\u044b\u0435 \u043e\u0442\u0437\u044b\u0432\u044b" },
  { key: "schema-faq",       label: "\u0411\u043b\u043e\u043a \u00ab\u0412\u043e\u043f\u0440\u043e\u0441-\u043e\u0442\u0432\u0435\u0442\u00bb" },
] as const;

function AuditProgressCard({ recommendations }: { recommendations: RecommendationItem[] }) {
  const pendingTypes = new Set(recommendations.map((r) => r.type));
  const factors = GEO_FACTORS.map((f) => ({ ...f, done: !pendingTypes.has(f.key) }));
  const completed = factors.filter((f) => f.done).length;
  const total = GEO_FACTORS.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a]">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a]">{"\u0413\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u044c \u043a \u0418\u0418-\u043f\u043e\u0438\u0441\u043a\u0443"}</h3>
            <p className="text-[11px] text-[#BBBBBB]">{"\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u043a\u043b\u044e\u0447\u0435\u0432\u044b\u0445 \u0437\u043e\u043d \u0443\u0436\u0435 \u0437\u0430\u043a\u0440\u044b\u0442\u043e"}</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-[#1a1a1a]">
          {completed}
          <span className="text-sm font-normal text-[#BBBBBB]"> / {total}</span>
        </span>
      </div>
      <Progress value={pct} className="h-2 bg-[#F0EFEB] mb-3" />
      <div className="grid gap-1.5">
        {factors.map((f) => (
          <div
            key={f.key}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${f.done ? "bg-[#EDF3EC]/50" : "bg-[#FAFAFA]"}`}
          >
            {f.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-[#DDDCDA]" />
            )}
            <span className={`text-xs font-medium ${f.done ? "text-[#2D6A4F] line-through decoration-[#2D6A4F]/30" : "text-[#555]"}`}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Inline llms.txt viewer                       */
/* ──────────────────────────────────────────── */

function LlmsTxtInlineBlock({ content }: { content: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lines = content.split("\n");
  const isLong = lines.length > 12;
  const displayed = expanded || !isLong ? content : lines.slice(0, 12).join("\n") + "\n\u2026";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "llms.txt";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-[#E5E4E0]">
      {/* Toolbar — identical to RecCard code accordion */}
      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2.5">
        <span className="text-[10px] font-medium text-[#555] tracking-wider uppercase">
          {"\u0413\u043e\u0442\u043e\u0432\u044b\u0439 \u043a\u043e\u0434"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-all"
          >
            <Download className="h-3 w-3" />
            {"\u0421\u043a\u0430\u0447\u0430\u0442\u044c"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-all"
          >
            {copied ? (
              <><Check className="h-3 w-3 text-[#4ADE80]" />{"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e"}</>
            ) : (
              <><Copy className="h-3 w-3" />{"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c"}</>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="bg-[#1a1a1a] border-t border-[#2a2a2a] overflow-x-auto px-4 py-4">
        <pre className="text-[12px] leading-[1.7] text-[#E0E0E0] font-mono whitespace-pre-wrap break-words">
          {displayed}
        </pre>
      </div>

      {/* Expand / collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-[#2a2a2a] bg-[#1a1a1a] py-2.5 text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c" : `\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e (${lines.length} \u0441\u0442\u0440\u043e\u043a)`}
        </button>
      )}
    </div>
  );
}

function RecCard({
  rec,
  index,
  isPdf,
  projectUrl,
  generatedLlmsTxt,
}: {
  rec: RecommendationItem;
  index: number;
  isPdf?: boolean;
  projectUrl?: string;
  generatedLlmsTxt?: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const [showLlmsTxt, setShowLlmsTxt] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = getConfig(rec.type);
  const role = ROLE_META[config.role];
  const impact = impactLabel(rec.type);

  // For llms-txt cards the generated content is already in LlmsTxtInlineBlock.
  // Never show the generatedCode accordion for that type — it would be a duplicate.
  const isLlmsTxtCard = rec.type === "llms-txt";
  const hasCode =
    !isLlmsTxtCard &&
    rec.generatedCode &&
    rec.generatedCode.trim().length > 0;

  const handleCopy = async () => {
    if (!rec.generatedCode) return;
    await navigator.clipboard.writeText(rec.generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const barColor =
    impact.text === "\u041e\u0447\u0435\u043d\u044c \u0432\u0430\u0436\u043d\u043e"
      ? "bg-[#B02A37]"
      : impact.text === "\u0412\u0430\u0436\u043d\u043e"
      ? "bg-[#E9A800]"
      : impact.text === "\u041f\u043e\u043b\u0435\u0437\u043d\u043e"
      ? "bg-[#1A6FBF]"
      : "bg-[#DDDCDA]";

  return (
    <div className="rounded-xl border border-[#EAEAEA] bg-white overflow-hidden shadow-sm">
      {/* Priority stripe */}
      <div className={`h-[3px] w-full ${barColor}`} />

      <div className="p-5 space-y-4">
        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F7F6F3] text-[13px] font-bold text-[#BBBBBB]">
            {index}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${role.color}`}>
                <span>{role.emoji}</span>
                {role.label}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${impact.color}`}>
                {impact.text}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-snug">
              {rec.title}
            </h3>
          </div>
        </div>

        {/* ── Body — owner-friendly explanation ── */}
        <div className="space-y-2 pl-11">
          <div>
            <p className="text-[12px] font-medium text-[#999] mb-0.5">
              {"\u0417\u0430\u0447\u0435\u043c \u044d\u0442\u043e \u043d\u0443\u0436\u043d\u043e"}
            </p>
            <p className="text-[13px] leading-[1.7] text-[#444]">{config.whyBusiness}</p>
          </div>
          <div className="border-t border-[#F0EFEB] pt-2">
            <p className="text-[12px] font-medium text-[#999] mb-0.5">
              {"\u0427\u0442\u043e \u0441\u0434\u0435\u043b\u0430\u0442\u044c"}
            </p>
            <p className="text-[13px] leading-[1.7] text-[#444]">{config.whatToDo}</p>
          </div>

          {/* LLM description — small, secondary */}
          {rec.description && (
            <p className="border-t border-[#F0EFEB] pt-2 text-[11px] leading-relaxed text-[#BBBBBB]">
              {rec.description}
            </p>
          )}
        </div>

        {/* ── llms.txt content block (replaces generatedCode for this type) ── */}
        {isLlmsTxtCard && generatedLlmsTxt && !isPdf && (
          <div className="pl-11">
            <button
              onClick={() => setShowLlmsTxt((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-[12px] font-medium text-[#787774] hover:border-[#D0D0D0] hover:text-[#1a1a1a] transition-all"
            >
              {showLlmsTxt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {"\u0424\u0430\u0439\u043b llms.txt \u0434\u043b\u044f \u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f"}
            </button>
            {showLlmsTxt && (
              <LlmsTxtInlineBlock content={generatedLlmsTxt} siteUrl={projectUrl ?? ""} />
            )}
          </div>
        )}

        {/* ── Developer code accordion (all OTHER types) ── */}
        {hasCode && !isPdf && (
          <div className="pl-11">
            <button
              onClick={() => setShowCode((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA] px-3 py-2 text-[12px] font-medium text-[#787774] hover:border-[#D0D0D0] hover:text-[#1a1a1a] transition-all"
            >
              {showCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {"\u041a\u043e\u0434 \u0434\u043b\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430"}
            </button>
            {showCode && (
              <div className="mt-2 rounded-xl overflow-hidden border border-[#E5E4E0]">
                <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2.5">
                  <span className="text-[10px] font-medium text-[#555] tracking-wider uppercase">
                    {"\u0413\u043e\u0442\u043e\u0432\u044b\u0439 \u043a\u043e\u0434"}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[#888] hover:bg-[#2a2a2a] hover:text-white transition-all"
                  >
                    {copied ? (
                      <><Check className="h-3 w-3 text-[#4ADE80]" />{"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e"}</>
                    ) : (
                      <><Copy className="h-3 w-3" />{"\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c"}</>
                    )}
                  </button>
                </div>
                <div className="bg-[#1a1a1a] border-t border-[#2a2a2a] overflow-x-auto px-4 py-4">
                  <pre className="text-[12px] leading-[1.7] text-[#E0E0E0] font-mono whitespace-pre-wrap break-words">
                    {rec.generatedCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PDF: code always visible ── */}
        {hasCode && isPdf && (
          <div className="pl-11 mt-1 rounded-lg border border-[#EAEAEA] bg-[#F7F6F3] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#787774] mb-2">
              {"\u041a\u043e\u0434 \u0434\u043b\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0441\u0442\u0430"}
            </p>
            <pre className="text-[11px] leading-[1.7] text-[#333] font-mono whitespace-pre-wrap break-words">
              {rec.generatedCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecommendationsPanel({
  recommendations,
  projectUrl,
  generatedLlmsTxt,
  isPdf = false,
}: RecommendationsPanelProps) {
  const sorted = [...recommendations].sort(
    (a, b) => getConfig(b.type).impactWeight - getConfig(a.type).impactWeight
  );

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white px-8 py-16 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#2D6A4F] mb-4" />
        <p className="text-sm font-semibold text-[#1a1a1a]">{"\u041e\u0442\u043b\u0438\u0447\u043d\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430!"}</p>
        <p className="mt-1 text-xs text-[#787774]">{"\u0412\u0441\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u044b."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E1F3FE] bg-[#F0F7FF] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🧭</span>
          <div>
            <p className="text-sm font-semibold text-[#1A6FBF] mb-1">
              {"\u0412\u0430\u0448 \u043f\u043e\u0448\u0430\u0433\u043e\u0432\u044b\u0439 \u043f\u043b\u0430\u043d"}
            </p>
            <p className="text-[13px] leading-[1.7] text-[#555]">
              {"\u0417\u0434\u0435\u0441\u044c \u0441\u043e\u0431\u0440\u0430\u043d\u044b \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u2014 \u043e\u0442 \u0441\u0430\u043c\u044b\u0445 \u0432\u0430\u0436\u043d\u044b\u0445 \u043a \u043f\u043e\u043b\u0435\u0437\u043d\u044b\u043c. \u0412\u0430\u043c "}
              <strong>{"\u043d\u0435 \u043d\u0443\u0436\u043d\u043e \u0440\u0430\u0437\u0431\u0438\u0440\u0430\u0442\u044c\u0441\u044f \u0432 \u043a\u043e\u0434\u0435"}</strong>
              {" \u2014 \u043f\u0440\u043e\u0441\u0442\u043e \u043f\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u043a\u0430\u0436\u0434\u0443\u044e \u0437\u0430\u0434\u0430\u0447\u0443 \u043d\u0443\u0436\u043d\u043e\u043c\u0443 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0443."}
            </p>
          </div>
        </div>
      </div>

      <AuditProgressCard recommendations={recommendations} />

      <div className="space-y-4">
        {sorted.map((rec, i) => (
          <RecCard
            key={rec.id}
            rec={rec}
            index={i + 1}
            isPdf={isPdf}
            projectUrl={projectUrl}
            generatedLlmsTxt={generatedLlmsTxt}
          />
        ))}
      </div>
    </div>
  );
}
