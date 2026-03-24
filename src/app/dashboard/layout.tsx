import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Globe,
  CreditCard,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, plan: true, email: true, name: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const planLabels: Record<string, string> = {
    FREE: "Free",
    PRO: "Pro",
    AGENCY: "Agency",
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-800/50 px-6">
          <Globe className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-bold text-white">GEO SaaS</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <SidebarNav />
        </nav>

        {/* User section */}
        <div className="border-t border-slate-800/50 p-4">
          {/* Credits */}
          <div className="mb-3 rounded-lg border border-slate-800/50 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Кредиты
              </span>
              <Badge
                variant="secondary"
                className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/10"
              >
                {planLabels[user.plan]}
              </Badge>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{user.credits}</p>
          </div>

          <Separator className="my-3 bg-slate-800/50" />

          {/* User info */}
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
              {user.name?.charAt(0).toUpperCase() ?? <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
