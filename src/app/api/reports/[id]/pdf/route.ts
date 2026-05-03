import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pdfQueue } from "@/lib/queue";
import { ensurePdfWorkerRunning } from "@/lib/worker-manager";
import { PDF_JOB_OPTIONS } from "@/workers/pdf.processor";
import crypto from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "COMPLETED",
      project: { userId: session.user.id },
    },
    select: {
      id: true,
      pdfFile: true,
      project: { select: { name: true, url: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Если PDF уже есть в кеше — сразу отдаём «готово»
  if (report.pdfFile) {
    return NextResponse.json({ jobId: null, ready: true });
  }

  // Формируем print URL
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const printSecret =
    process.env.PRINT_SECRET ?? crypto.randomBytes(32).toString("hex");
  if (!process.env.PRINT_SECRET) {
    process.env.PRINT_SECRET = printSecret;
  }
  const printUrl = `${baseUrl}/print/report/${reportId}?token=${encodeURIComponent(printSecret)}`;

  ensurePdfWorkerRunning();

  const job = await pdfQueue.add(`pdf-${reportId}`, {
    reportId,
    projectName: report.project.name,
    printUrl,
  }, PDF_JOB_OPTIONS);

  return NextResponse.json({ jobId: job.id, ready: false }, { status: 202 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;
  const jobId = req.nextUrl.searchParams.get("jobId");

  // ── Polling mode ──
  if (jobId) {
    const job = await pdfQueue.getJob(jobId);
    if (!job) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === "completed") {
      return NextResponse.json({ status: "completed", progress: 100 });
    }
    if (state === "failed") {
      return NextResponse.json(
        { status: "failed", error: job.failedReason },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: state, progress });
  }

  // ── Download mode (no jobId) ──
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "COMPLETED",
      project: { userId: session.user.id },
    },
    select: {
      pdfFile: true,
      project: { select: { name: true } },
    },
  });

  if (!report?.pdfFile) {
    return NextResponse.json({ error: "PDF not ready" }, { status: 404 });
  }

  const safeName = report.project.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(report.pdfFile, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_${date}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
