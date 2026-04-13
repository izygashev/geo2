import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Нет активной подписки" },
        { status: 404 }
      );
    }

    // Отменяем подписку — пользователь сохраняет доступ до конца оплаченного периода.
    // Plan НЕ сбрасывается сейчас: User.plan остаётся PRO/AGENCY до currentPeriodEnd.
    // Даунгрейд до FREE произойдёт по cron-задаче, когда currentPeriodEnd наступит.
    // Кредиты не забираем — пользователь может их использовать.
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      activeUntil: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("[billing/cancel] Error:", error);
    return NextResponse.json(
      { error: "Ошибка отмены подписки" },
      { status: 500 }
    );
  }
}
