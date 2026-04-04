import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Shield } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      plan: true,
      credits: true,
      createdAt: true,
    },
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
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">Настройки</h1>
        <p className="mt-1 text-sm text-[#787774]">
          Управление аккаунтом и подпиской
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Profile */}
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-[#787774]" />
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Профиль</h2>
          </div>
          <Separator className="mb-4 bg-[#EAEAEA]" />
          <ProfileForm currentName={user.name ?? ""} currentEmail={user.email ?? ""} />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[#787774]">Дата регистрации</span>
            <span className="text-sm text-[#1a1a1a]">
              {user.createdAt.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#787774]" />
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Подписка</h2>
          </div>
          <Separator className="mb-4 bg-[#EAEAEA]" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#787774]">Текущий план</span>
              <Badge
                variant="secondary"
                className="border-[#EAEAEA] bg-[#F7F6F3] text-[#787774] hover:bg-[#F7F6F3]"
              >
                {planLabels[user.plan]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#787774]">Кредиты</span>
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-[#787774]" />
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {user.credits}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
