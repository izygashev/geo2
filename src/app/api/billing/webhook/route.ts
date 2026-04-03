import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/services/yookassa";

// ЮKassa отправляет вебхуки с этих IP-адресов
const YOOKASSA_IPS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11",
  "77.75.156.35",
  "77.75.154.128/25",
  "2a02:5180::/32",
];

// Простая проверка IP (для production рекомендуется полноценная проверка CIDR)
function isYookassaIp(ip: string): boolean {
  // В тестовом режиме пропускаем все
  if (process.env.YOOKASSA_TEST_MODE === "true") return true;

  return YOOKASSA_IPS.some((allowed) => {
    if (allowed.includes("/")) {
      // Упрощённая проверка подсети — первые октеты
      const prefix = allowed.split("/")[0].split(".").slice(0, 3).join(".");
      return ip.startsWith(prefix);
    }
    return ip === allowed;
  });
}

interface YookassaWebhookBody {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: { value: string; currency: string };
    payment_method?: {
      id: string;
      saved: boolean;
      type: string;
    };
    metadata?: {
      userId?: string;
      subscriptionId?: string;
      planKey?: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // Проверка IP отправителя
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";

    if (!isYookassaIp(ip)) {
      console.warn(`[webhook] Rejected request from IP: ${ip}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as YookassaWebhookBody;
    const { event, object: paymentObject } = body;

    console.log(`[webhook] Event: ${event}, PaymentID: ${paymentObject.id}, Status: ${paymentObject.status}`);

    // Обрабатываем только payment.succeeded и payment.canceled
    if (event === "payment.succeeded") {
      await handlePaymentSucceeded(paymentObject);
    } else if (event === "payment.canceled") {
      await handlePaymentCancelled(paymentObject);
    }

    // ЮKassa ожидает 200 OK
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[webhook] Error:", error);
    // Возвращаем 200, чтобы ЮKassa не повторяла запрос при наших внутренних ошибках
    // (после логирования в Sentry/etc.)
    return NextResponse.json({ status: "ok" });
  }
}

async function handlePaymentSucceeded(
  paymentObject: YookassaWebhookBody["object"]
) {
  const { id: yookassaPaymentId, metadata, payment_method } = paymentObject;

  // Идемпотентность — проверяем, не обработан ли уже этот платёж
  const existingPayment = await prisma.payment.findUnique({
    where: { yookassaPaymentId },
  });

  if (existingPayment?.status === "SUCCEEDED") {
    console.log(`[webhook] Payment ${yookassaPaymentId} already processed, skipping`);
    return;
  }

  if (!metadata?.userId || !metadata?.subscriptionId) {
    console.error(`[webhook] Missing metadata in payment ${yookassaPaymentId}`);
    return;
  }

  const planKey = metadata.planKey as PlanKey | undefined;
  const planConfig = planKey ? PLANS[planKey] : null;
  const creditsToAdd = planConfig?.credits ?? 0;

  // Транзакция: обновляем платёж + подписку + начисляем кредиты + обновляем план
  await prisma.$transaction(async (tx) => {
    // 1. Обновляем статус платежа
    await tx.payment.upsert({
      where: { yookassaPaymentId },
      create: {
        userId: metadata.userId!,
        subscriptionId: metadata.subscriptionId,
        yookassaPaymentId,
        amount: Math.round(parseFloat(paymentObject.amount.value) * 100),
        credits: creditsToAdd,
        status: "SUCCEEDED",
        description: planConfig?.description ?? "Подписка",
      },
      update: {
        status: "SUCCEEDED",
      },
    });

    // 2. Обновляем подписку: сохраняем payment_method_id для рекуррентных списаний
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    await tx.subscription.update({
      where: { id: metadata.subscriptionId },
      data: {
        status: "ACTIVE",
        paymentMethodId: payment_method?.saved ? payment_method.id : null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });

    // 3. Начисляем кредиты и обновляем план пользователя
    await tx.user.update({
      where: { id: metadata.userId },
      data: {
        credits: { increment: creditsToAdd },
        plan: planConfig?.plan ?? "PRO",
      },
    });
  });

  console.log(
    `[webhook] ✅ Payment ${yookassaPaymentId} succeeded: +${creditsToAdd} credits for user ${metadata.userId}`
  );
}

async function handlePaymentCancelled(
  paymentObject: YookassaWebhookBody["object"]
) {
  const { id: yookassaPaymentId, metadata } = paymentObject;

  // Обновляем статус платежа
  await prisma.payment.updateMany({
    where: { yookassaPaymentId },
    data: { status: "CANCELLED" },
  });

  // Если подписка была создана для этого платежа — отменяем её
  if (metadata?.subscriptionId) {
    await prisma.subscription.update({
      where: { id: metadata.subscriptionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }

  console.log(
    `[webhook] ❌ Payment ${yookassaPaymentId} cancelled for user ${metadata?.userId}`
  );
}
