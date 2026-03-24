"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileBarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Проекты",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Отчёты",
    href: "/dashboard/reports",
    icon: FileBarChart,
  },
  {
    label: "Настройки",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
