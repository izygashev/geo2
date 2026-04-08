import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="flex min-h-screen bg-[#F7F6F3]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-[#EAEAEA] bg-[#FBFBFA]">
        {/* Logo */}
        <Link href="/" className="flex h-14 items-center gap-2 border-b border-[#EAEAEA] px-5 transition-colors hover:bg-[#F7F6F3]">
          <Globe className="h-4 w-4 text-[#787774]" />
          <span className="text-sm font-semibold tracking-tight text-[#1a1a1a]">Geo Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <SidebarNav />
        </nav>

        {/* User section */}
        <div className="border-t border-[#EAEAEA] p-4">
          {/* Credits */}
          <div className="mb-3 rounded-lg border border-[#EAEAEA] bg-white p-3">
            <div className="flex items-center justify-between text-xs text-[#787774]">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Кредиты
              </span>
              <Badge
                variant="secondary"
                className="border-[#EAEAEA] bg-[#F7F6F3] text-[#787774] hover:bg-[#F7F6F3]"
              >
                {planLabels[user.plan]}
              </Badge>
            </div>
            <p className="mt-1 text-xl font-bold tracking-tighter text-[#1a1a1a]">{user.credits}</p>
          </div>

          <Separator className="my-3 bg-[#EAEAEA]" />

          {/* User info */}
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAEAEA] bg-[#F7F6F3] text-xs font-medium text-[#787774]">
              {user.name?.charAt(0).toUpperCase() ?? <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1a1a1a]">
                {user.name}
              </p>
              <p className="truncate text-xs text-[#787774]">{user.email}</p>
            </div>
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}
