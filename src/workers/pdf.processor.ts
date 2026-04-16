import { Job } from "bullmq";
import { chromium } from "playwright";
import { prisma } from "@/lib/prisma";

export interface PdfJobData {
  reportId: string;
  projectName: string;
  printUrl: string;
}

export async function processPdf(job: Job<PdfJobData>): Promise<void> {
  const { reportId, projectName, printUrl } = job.data;

  let browser;
  try {
    await job.updateProgress(10);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
    });

    await page.emulateMedia({ media: "print" });
    await job.updateProgress(20);

    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await page
      .waitForSelector('[data-report-ready="true"]', { timeout: 10_000 })
      .catch(() => {});

    await job.updateProgress(60);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "16mm", left: "10mm", right: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; color:#78776F; width:100%; padding:0 12mm; display:flex; justify-content:space-between;">
          <span>${projectName}</span>
          <span>Geo Studio</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size:7px; color:#BBB; width:100%; text-align:center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    await job.updateProgress(90);

    // Сохраняем PDF в БД
    await prisma.report.update({
      where: { id: reportId },
      data: { pdfFile: Buffer.from(pdfBuffer) },
    });

    await job.updateProgress(100);
    console.log(`[PdfWorker] ✅ PDF generated for report ${reportId}`);
  } finally {
    if (browser) await browser.close();
  }
}
