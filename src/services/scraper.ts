/**
 * Playwright Scraper — парсит сайт и извлекает данные для GEO-анализа.
 *
 * Извлекает: title, description, h1, основной текст (до 3000 символов),
 * наличие /llms.txt, Schema.org (JSON-LD) данные.
 */

import { chromium, type Browser } from "playwright";

// ─── Типы ────────────────────────────────────────────────
export interface SiteData {
  url: string;
  title: string;
  description: string;
  h1: string;
  bodyText: string;
  hasLlmsTxt: boolean;
  llmsTxtContent: string;
  schemaOrgTypes: string[];
  schemaOrgData: Record<string, unknown>[];
}

// ─── Основная функция ───────────────────────────────────
export async function scrapeSite(url: string): Promise<SiteData> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Блокируем тяжёлые ресурсы для ускорения
    await page.route("**/*.{png,jpg,jpeg,gif,svg,webp,mp4,webm,woff,woff2,ttf}", (route) =>
      route.abort()
    );

    console.log(`[Scraper] 🌐 Загружаю ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    // Ждём немного для SPA-рендеринга
    await page.waitForTimeout(2000);

    // ─── Извлечение данных ─────────────────────────────
    const title = await page.title();

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => "");

    const h1 = await page
      .locator("h1")
      .first()
      .textContent()
      .catch(() => "");

    // Основной текст страницы (до 3000 символов)
    const bodyText = await page.evaluate(() => {
      const selectors = ["main", "article", '[role="main"]', "#content", ".content", "body"];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.trim().length > 100) {
          return el.textContent
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 3000);
        }
      }
      return (document.body?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
    });

    // ─── Schema.org (JSON-LD) ──────────────────────────
    const jsonLdBlocks = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const results: string[] = [];
      scripts.forEach((s) => {
        if (s.textContent) results.push(s.textContent);
      });
      return results;
    });

    const schemaOrgData: Record<string, unknown>[] = [];
    const schemaOrgTypes: string[] = [];

    for (const raw of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item["@type"]) {
            schemaOrgTypes.push(String(item["@type"]));
            schemaOrgData.push(item as Record<string, unknown>);
          }
        }
      } catch {
        // Невалидный JSON-LD — пропускаем
      }
    }

    // ─── Проверка /llms.txt ────────────────────────────
    let hasLlmsTxt = false;
    let llmsTxtContent = "";

    try {
      const baseUrl = new URL(url);
      const llmsTxtUrl = `${baseUrl.origin}/llms.txt`;

      const llmsPage = await context.newPage();
      const llmsResponse = await llmsPage.goto(llmsTxtUrl, {
        waitUntil: "domcontentloaded",
        timeout: 8000,
      });

      if (llmsResponse && llmsResponse.ok()) {
        const contentType = llmsResponse.headers()["content-type"] ?? "";
        // Принимаем только текстовые ответы (не HTML-ошибки)
        if (contentType.includes("text/plain") || !contentType.includes("text/html")) {
          const text = await llmsPage.evaluate(() => document.body?.innerText ?? "");
          if (text.length > 10 && text.length < 50000) {
            hasLlmsTxt = true;
            llmsTxtContent = text.slice(0, 5000);
          }
        }
      }
      await llmsPage.close();
    } catch {
      // /llms.txt не найден или ошибка — это нормально
    }

    console.log(`[Scraper] ✅ Спарсил: title="${title}", h1="${h1?.slice(0, 50)}..."`);
    console.log(
      `[Scraper]    Schema.org types: [${schemaOrgTypes.join(", ")}], llms.txt: ${hasLlmsTxt}`
    );

    return {
      url,
      title: title ?? "",
      description: description ?? "",
      h1: h1?.trim() ?? "",
      bodyText,
      hasLlmsTxt,
      llmsTxtContent,
      schemaOrgTypes,
      schemaOrgData,
    };
  } catch (error) {
    console.error(`[Scraper] ❌ Ошибка парсинга ${url}:`, error);
    throw new Error(
      `Не удалось спарсить сайт ${url}: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
