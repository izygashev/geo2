import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditCard, Receipt, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BillingClient } from "@/components/billing-client";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [user, activeSubscription, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, plan: true },
    }),
    prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) redirect("/sign-in");

  const planLabels: Record<string, string> = {
    FREE: "Free",
    PRO: "Pro",
    AGENCY: "Agency",
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Ожидает",
      className: "border-[#FBE5A8] bg-[#FBF3DB] text-[#B08D19]",
    },
    SUCCEEDED: {
      label: "Оплачен",
      className: "border-[#D1E7DD] bg-[#EDF3EC] text-[#2D6A4F]",
    },
    CANCELLED: {
      label: "Отменён",
      className: "border-[#EAEAEA] bg-[#F7F6F3] text-[#787774]",
    },
    REFUNDED: {
      label: "Возврат",
      className: "border-[#F5C2C7] bg-[#FDEBEC] text-[#B02A37]",
    },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-tighter text-[#1a1a1a]">
          Биллинг
        </h1>
        <p className="mt-1 text-sm text-[#787774]">
          Управление подпиской и платежами
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Current balance */}
        <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#787774]" />
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">Текущий баланс</h2>
          </div>
          <Separator className="mb-4 bg-[#EAEAEA]" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                {user.credits}
              </span>
              <span className="ml-2 text-sm text-[#BBBBBB]">кредитов</span>
            </div>
            <Badge
              variant="secondary"
              className="border-[#EAEAEA] bg-[#F7F6F3] text-[#787774] hover:bg-[#F7F6F3]"
            >
              {planLabels[user.plan]}
            </Badge>
          </div>
        </div>

        {/* Subscription plans */}
        <div>
          <div className="mb-6 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#787774]" />
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
              Тарифные планы
            </h2>
          </div>

          <BillingClient
            currentPlan={planLabels[user.plan]}
            hasActiveSubscription={!!activeSubscription}
            subscriptionEndDate={
              activeSubscription?.currentPeriodEnd?.toISOString() ?? null
            }
          />
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="rounded-xl border border-[#EAEAEA] bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#787774]" />
              <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#787774]">
                История платежей
              </h2>
            </div>
            <Separator className="mb-4 bg-[#EAEAEA]" />

            <div className="space-y-3">
              {payments.map((payment) => {
                const st = statusLabels[payment.status] ?? statusLabels.PENDING;
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] px-4 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[#1a1a1a]">
                        {payment.description || "Подписка"}
                      </span>
                      <span className="text-xs text-[#BBBBBB]">
                        {payment.createdAt.toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {(payment.amount / 100).toLocaleString("ru-RU")} ₽
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${st.className}`}
                      >
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
