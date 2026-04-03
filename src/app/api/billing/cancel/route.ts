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

    // Отменяем подписку — она будет активна до конца оплаченного периода
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Сбрасываем план пользователя на FREE (в конце периода)
    // Кредиты не забираем — пользователь может их использовать
    await prisma.user.update({
      where: { id: session.user.id },
      data: { plan: "FREE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[billing/cancel] Error:", error);
    return NextResponse.json(
      { error: "Ошибка отмены подписки" },
      { status: 500 }
    );
  }
}
