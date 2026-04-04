import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ScheduleSchema = z.object({
  frequency: z.enum(["weekly", "monthly"]).nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }
  if (project.userId !== session.user.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидные данные" },
      { status: 400 }
    );
  }

  const { frequency } = parsed.data;

  let scheduleNextRun: Date | null = null;
  if (frequency === "weekly") {
    scheduleNextRun = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else if (frequency === "monthly") {
    scheduleNextRun = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  await prisma.project.update({
    where: { id },
    data: {
      scheduleFrequency: frequency,
      scheduleNextRun,
    },
  });

  return NextResponse.json({ success: true, frequency, scheduleNextRun });
}
