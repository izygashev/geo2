import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";
import crypto from "crypto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reportId } = await params;

  // Проверяем доступ: отчёт принадлежит пользователю и завершён
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "COMPLETED",
      project: { userId: session.user.id },
    },
    select: {
      id: true,
      project: { select: { name: true, url: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // ── Формируем URL к внутренней print-странице ──
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  // Генерируем одноразовый токен, если PRINT_SECRET не задан
  const printSecret =
    process.env.PRINT_SECRET ?? crypto.randomBytes(32).toString("hex");
  // Если PRINT_SECRET не задан — временно устанавливаем для этого запроса
  if (!process.env.PRINT_SECRET) {
    process.env.PRINT_SECRET = printSecret;
  }
  const printUrl = `${baseUrl}/print/report/${reportId}?token=${encodeURIComponent(printSecret)}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
    });

    // Emulate print media so CSS @media print rules are applied
    await page.emulateMedia({ media: "print" });

    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 30_000 });

    // Ждём, пока основной контент прогрузится
    await page
      .waitForSelector('[data-report-ready="true"]', { timeout: 10_000 })
      .catch(() => {});

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "16mm", left: "10mm", right: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; color:#78776F; width:100%; padding:0 12mm; display:flex; justify-content:space-between;">
          <span>${report.project.name}</span>
          <span>Geo Studio</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size:7px; color:#BBB; width:100%; text-align:center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    const safeName = report.project.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_${date}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[PDF] Generation error:", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
