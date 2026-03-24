import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Shield } from "lucide-react";

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
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
        <p className="mt-1 text-sm text-slate-400">
          Управление аккаунтом и подпиской
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-white">Профиль</h2>
          </div>
          <Separator className="mb-4 bg-slate-800/50" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Имя</span>
              <span className="text-sm text-white">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Дата регистрации</span>
              <span className="text-sm text-white">
                {user.createdAt.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-white">Подписка</h2>
          </div>
          <Separator className="mb-4 bg-slate-800/50" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Текущий план</span>
              <Badge
                variant="secondary"
                className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/10"
              >
                {planLabels[user.plan]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Кредиты</span>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-white">
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
