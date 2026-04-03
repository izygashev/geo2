"use client";

import { useState } from "react";
import { Loader2, Check, ArrowRight } from "lucide-react";

interface Plan {
  key: string;
  name: string;
  price: string;
  credits: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    key: "PRO",
    name: "Pro",
    price: "1 990",
    credits: "200 кредитов/мес",
    popular: true,
    features: [
      "20 отчётов в месяц",
      "Все AI-провайдеры",
      "Анализ конкурентов",
      "До 10 проектов",
      "Приоритетная генерация",
    ],
  },
  {
    key: "AGENCY",
    name: "Agency",
    price: "4 990",
    credits: "600 кредитов/мес",
    features: [
      "60 отчётов в месяц",
      "Все AI-провайдеры",
      "API-доступ",
      "Безлимитные проекты",
      "White-label отчёты",
    ],
  },
];

interface BillingClientProps {
  currentPlan: string;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string | null;
}

export function BillingClient({
  currentPlan,
  hasActiveSubscription,
  subscriptionEndDate,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    setLoading(planKey);
    setError(null);

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка создания платежа");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Вы уверены, что хотите отменить подписку?")) return;

    setCancelLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка отмены подписки");
        return;
      }

      window.location.reload();
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-[#F5C2C7] bg-[#FDEBEC] px-4 py-3 text-sm text-[#B02A37]">
          {error}
        </div>
      )}

      {/* Subscription status */}
      {hasActiveSubscription && (
        <div className="mb-8 rounded-lg border border-[#D1E7DD] bg-[#EDF3EC] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#2D6A4F]">
                Активная подписка: {currentPlan}
              </p>
              {subscriptionEndDate && (
                <p className="mt-0.5 text-xs text-[#40916C]">
                  Следующее продление:{" "}
                  {new Date(subscriptionEndDate).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="btn-tactile rounded-md border border-[#D1E7DD] px-3 py-1.5 text-xs font-medium text-[#2D6A4F] transition-colors hover:bg-[#D1E7DD] disabled:opacity-50"
            >
              {cancelLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Отменить"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-[#EAEAEA] bg-[#EAEAEA] md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrentPlan =
            hasActiveSubscription &&
            currentPlan.toUpperCase() === plan.key;

          return (
            <div
              key={plan.key}
              className="relative flex flex-col bg-white p-6"
            >
              {plan.popular && (
                <div className="absolute -top-px left-0 right-0 h-[2px] bg-[#111]" />
              )}

              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#787774]">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tighter text-[#1a1a1a]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[#BBBBBB]">₽/мес</span>
                </div>
                <p className="mt-1 text-xs text-[#BBBBBB]">{plan.credits}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-[#555]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#CCCCCC]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="flex h-9 items-center justify-center rounded-md border border-[#D1E7DD] bg-[#EDF3EC] text-sm font-medium text-[#2D6A4F]">
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Текущий план
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loading !== null || hasActiveSubscription}
                  className="btn-tactile flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#111] text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50"
                >
                  {loading === plan.key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      Подписаться
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
