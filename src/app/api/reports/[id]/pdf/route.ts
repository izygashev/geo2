import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";

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
      shareId: true,
      project: { select: { name: true, url: true } },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Если нет shareId — создаём временный для рендера
  let shareId = report.shareId;
  let tempShare = false;

  if (!shareId) {
    const { v4: uuidv4 } = await import("uuid");
    shareId = uuidv4();
    await prisma.report.update({
      where: { id: reportId },
      data: { shareId },
    });
    tempShare = true;
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const shareUrl = `${baseUrl}/r/${shareId}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });

    await page.goto(shareUrl, { waitUntil: "networkidle", timeout: 30_000 });

    // Ждём, пока основной контент прогрузится
    await page.waitForSelector('[data-report-ready="true"], .score-ring, main', {
      timeout: 10_000,
    }).catch(() => {});

    // Скрываем элементы, не нужные в PDF
    await page.addStyleTag({
      content: `
        [data-pdf-hide] { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; color:#78776F; width:100%; padding:0 12mm; display:flex; justify-content:space-between;">
          <span>${report.project.name}</span>
          <span>GEO SaaS</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size:7px; color:#BBB; width:100%; text-align:center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    // Если создали временный shareId — удаляем
    if (tempShare) {
      await prisma.report.update({
        where: { id: reportId },
        data: { shareId: null },
      });
    }

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
