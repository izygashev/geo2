import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { yookassa, PLANS, type PlanKey } from "@/services/yookassa";
import { v4 as uuidv4 } from "uuid";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit: 3 subscription attempts per 10 minutes
const SUBSCRIBE_RATE_LIMIT = { maxRequests: 3, windowSeconds: 600 };

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit payment creation
    const rl = checkRateLimit(`subscribe:${session.user.id}`, SUBSCRIBE_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток. Подождите 10 минут." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as { plan?: string };
    const planKey = body.plan?.toUpperCase() as PlanKey | undefined;

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json(
        { error: "Invalid plan. Use PRO or AGENCY." },
        { status: 400 }
      );
    }

    const planConfig = PLANS[planKey];

    // Проверяем, нет ли уже активной или ожидающей оплаты подписки
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PENDING", "PAST_DUE"] },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "У вас уже есть активная или ожидающая оплаты подписка. Отмените её перед оформлением новой." },
        { status: 409 }
      );
    }

    // Рассчитываем конец периода (30 дней)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Создаём подписку в БД со статусом PENDING (активируется ТОЛЬКО через webhook после payment.succeeded)
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan: planConfig.plan,
        status: "PENDING",
        creditsPerMonth: planConfig.credits,
        priceKopecks: planConfig.priceKopecks,
        currentPeriodEnd: periodEnd,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const idempotenceKey = uuidv4();

    // Создаём платёж в ЮKassa с сохранением платёжного метода для рекуррентов
    const response = await yookassa.payments.paymentsPost(
      idempotenceKey,
      {
        amount: {
          value: String((planConfig.priceKopecks / 100).toFixed(2)),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: `${appUrl}/dashboard/billing?success=true`,
        },
        capture: true,
        save_payment_method: true,
        description: planConfig.description,
        metadata: {
          userId: session.user.id,
          subscriptionId: subscription.id,
          planKey: planKey,
        },
      }
    );

    const payment = response.data;

    // Сохраняем платёж в БД
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        yookassaPaymentId: payment.id,
        amount: planConfig.priceKopecks,
        credits: planConfig.credits,
        status: "PENDING",
        description: planConfig.description,
      },
    });

    // Возвращаем URL для редиректа на оплату
    const confirmationUrl =
      payment.confirmation &&
      "confirmation_url" in payment.confirmation
        ? payment.confirmation.confirmation_url
        : null;

    if (!confirmationUrl) {
      return NextResponse.json(
        { error: "Failed to get confirmation URL from YooKassa" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: confirmationUrl });
  } catch (error) {
    console.error("[billing/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Ошибка создания платежа" },
      { status: 500 }
    );
  }
}
