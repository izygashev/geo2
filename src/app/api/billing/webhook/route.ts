import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, type PlanKey } from "@/services/yookassa";
import { createHmac } from "crypto";

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

/** Convert IPv4 to 32-bit number */
function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/** Proper CIDR matching for IPv4 */
function ipInCidr(ip: string, cidr: string): boolean {
  // Skip IPv6 CIDR for IPv4 addresses
  if (cidr.includes(":")) return false;

  if (!cidr.includes("/")) {
    return ip === cidr;
  }

  const [subnet, bits] = cidr.split("/");
  const mask = (~0 << (32 - parseInt(bits, 10))) >>> 0;
  return (ipToLong(ip) & mask) === (ipToLong(subnet) & mask);
}

function isYookassaIp(ip: string): boolean {
  // В тестовом режиме пропускаем все
  if (process.env.YOOKASSA_TEST_MODE === "true") return true;

  return YOOKASSA_IPS.some((allowed) => ipInCidr(ip, allowed));
}

/**
 * Verify webhook body integrity via HMAC-SHA256.
 * YooKassa sends notification_secret in shop settings.
 * If YOOKASSA_WEBHOOK_SECRET is set, we verify; otherwise skip (backward compat).
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const secret = process.env.YOOKASSA_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured — skip verification

  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
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

    // Read raw body for signature verification, then parse
    const rawBody = await req.text();

    // HMAC signature verification (if YOOKASSA_WEBHOOK_SECRET is configured)
    const signature = req.headers.get("x-yookassa-signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn(`[webhook] Invalid signature from IP: ${ip}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = JSON.parse(rawBody) as YookassaWebhookBody;
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

  // Guard: subscription must exist and be in PENDING state to activate
  const subscription = await prisma.subscription.findUnique({
    where: { id: metadata.subscriptionId },
  });

  if (!subscription) {
    console.error(`[webhook] Subscription ${metadata.subscriptionId} not found for payment ${yookassaPaymentId}`);
    return;
  }

  if (subscription.status !== "PENDING" && subscription.status !== "PAST_DUE") {
    console.warn(`[webhook] Subscription ${metadata.subscriptionId} status is ${subscription.status}, expected PENDING. Skipping activation.`);
    // Still mark payment as SUCCEEDED for bookkeeping, but don't double-credit
    if (existingPayment) {
      await prisma.payment.update({
        where: { yookassaPaymentId },
        data: { status: "SUCCEEDED" },
      });
    }
    return;
  }

  const planKey = metadata.planKey as PlanKey | undefined;
  const planConfig = planKey ? PLANS[planKey] : null;
  const creditsToAdd = planConfig?.credits ?? 0;

  // Атомарная транзакция: платёж + подписка PENDING→ACTIVE + кредиты + план
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

    // 2. PENDING → ACTIVE: обновляем подписку + сохраняем payment_method для рекуррентов
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
    `[webhook] ✅ Payment ${yookassaPaymentId} succeeded: PENDING→ACTIVE, +${creditsToAdd} credits for user ${metadata.userId}`
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
  // Для PENDING подписок: пользователь так и не заплатил, безопасно удалить
  if (metadata?.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: metadata.subscriptionId },
    });

    if (subscription) {
      if (subscription.status === "PENDING") {
        // Подписка никогда не активировалась — удаляем полностью
        await prisma.subscription.delete({
          where: { id: metadata.subscriptionId },
        });
        console.log(`[webhook] 🗑️ Deleted PENDING subscription ${metadata.subscriptionId}`);
      } else {
        // Подписка была ACTIVE/PAST_DUE — помечаем CANCELLED
        await prisma.subscription.update({
          where: { id: metadata.subscriptionId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
      }
    }
  }

  console.log(
    `[webhook] ❌ Payment ${yookassaPaymentId} cancelled for user ${metadata?.userId}`
  );
}
