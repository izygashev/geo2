import { Job } from "bullmq";
import { chromium } from "playwright";
import { prisma } from "@/lib/prisma";

export interface PdfJobData {
  reportId: string;
  projectName: string;
  printUrl: string;
}

/** BullMQ job options — exported so the queue producer can use them */
export const PDF_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { age: 3600 },   // keep completed jobs 1 hour
  removeOnFail: { age: 86_400 },     // keep failed jobs 24 hours
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function processPdf(job: Job<PdfJobData>): Promise<void> {
  const { reportId, projectName, printUrl } = job.data;

  let browser;
  try {
    await job.updateProgress(10);

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
    });

    await page.emulateMedia({ media: "print" });
    await job.updateProgress(20);

    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 60_000 });

    // Wait for the report to be fully rendered
    await page
      .waitForSelector('[data-report-ready="true"]', { timeout: 30_000 })
      .catch(() => {
        console.warn(`[PdfWorker] data-report-ready not found for ${reportId}, proceeding anyway`);
      });

    // Extra settle time for charts/animations
    await page.waitForTimeout(1_500);

    await job.updateProgress(60);

    const safeProjectName = escapeHtml(projectName);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "22mm", bottom: "18mm", left: "10mm", right: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;color:#78776F;width:100%;padding:0 12mm;display:flex;justify-content:space-between;font-family:sans-serif;"><span>${safeProjectName}</span><span>Geo Studio</span></div>`,
      footerTemplate: `<div style="font-size:7px;color:#BBB;width:100%;text-align:center;font-family:sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });

    await job.updateProgress(85);

    await prisma.report.update({
      where: { id: reportId },
      data: { pdfFile: Buffer.from(pdfBuffer) },
    });

    await job.updateProgress(100);
    console.log(`[PdfWorker] ✅ PDF generated for report ${reportId} (${pdfBuffer.length} bytes)`);
  } catch (err) {
    console.error(`[PdfWorker] ❌ Failed to generate PDF for report ${reportId}:`, err);
    // Re-throw so BullMQ marks the job as failed and triggers retry
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
