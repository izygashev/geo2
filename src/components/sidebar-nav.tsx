"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileBarChart,
  TrendingUp,
  CreditCard,
  Settings,
  Target,
  Highlighter,
  Terminal,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Отчёты", href: "/dashboard", icon: FileBarChart },
  { label: "Тренды", href: "/dashboard/trends", icon: TrendingUp },
];

const toolsNav = [
  { label: "Реверс-промпты", href: "/dashboard/prompts", icon: Target },
  { label: "RAG-Редактор", href: "/dashboard/rag-editor", icon: Highlighter },
  { label: "AI-Рентген", href: "/dashboard/x-ray", icon: Terminal },
  { label: "Citation Hunter", href: "/dashboard/citations", icon: Globe },
];

const bottomNav = [
  { label: "Биллинг", href: "/dashboard/billing", icon: CreditCard },
  { label: "Настройки", href: "/dashboard/settings", icon: Settings },
];

function NavLink({ item }: { item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> } }) {
  const pathname = usePathname();
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[#F7F6F3] text-[#1a1a1a]"
          : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#1a1a1a]"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function SidebarNav() {
  return (
    <div className="flex flex-col gap-6">
      {/* Main */}
      <div className="space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* AI Tools */}
      <div>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#BBBBBB]">
          AI Инструменты
        </p>
        <div className="space-y-0.5">
          {toolsNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="space-y-0.5">
        {bottomNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}
