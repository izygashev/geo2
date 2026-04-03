import { YookassaSdk } from "@yookassa/sdk";

if (!process.env.YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
  console.warn(
    "⚠️ YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY not set — payments disabled"
  );
}

export const yookassa = new YookassaSdk({
  shopId: process.env.YOOKASSA_SHOP_ID ?? "",
  secretKey: process.env.YOOKASSA_SECRET_KEY ?? "",
});

// ─── Тарифные планы ───
export const PLANS = {
  PRO: {
    name: "Pro",
    plan: "PRO" as const,
    priceRub: 1990,
    priceKopecks: 199000,
    credits: 200,
    description: "Pro — 200 кредитов/мес",
  },
  AGENCY: {
    name: "Agency",
    plan: "AGENCY" as const,
    priceRub: 4990,
    priceKopecks: 499000,
    credits: 600,
    description: "Agency — 600 кредитов/мес",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
