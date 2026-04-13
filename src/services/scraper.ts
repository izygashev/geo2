/**
 * Playwright Scraper — парсит сайт и извлекает данные для GEO-анализа.
 *
 * Использует @mozilla/readability (тот же алгоритм, что в Firefox Reader Mode)
 * для CMS-агностичной экстракции чистого текста. Работает с любым CMS:
 * Tilda, Wix, WordPress, Bitrix, React SPA, и т.д.
 *
 * Извлекает: title, description, h1, основной текст (до 15000 символов),
 * наличие /llms.txt, Schema.org (JSON-LD) данные.
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { type Browser } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// Apply stealth plugin — patches dozens of headless-detection vectors
// (navigator.webdriver, chrome.runtime, WebGL vendor, etc.)
chromium.use(StealthPlugin());

// ─── Universal content extraction via Readability ───────
/**
 * Extracts clean, human-readable text from raw HTML using Mozilla Readability.
 * This is the same algorithm used by Firefox Reader Mode and many LLM pipelines.
 * CMS-agnostic: works with Tilda, Wix, WordPress, Bitrix, React SPAs, etc.
 *
 * Falls back to aggressive DOM cleanup if Readability fails to parse.
 */
function extractReadableText(html: string, pageUrl: string): string {
  // 0. Pre-strip <style> and <script> from raw HTML to prevent CSS/JS leaking
  //    into textContent (Tilda, Wix, Bitrix often inline massive style blocks).
  const cleanHtml = html
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, "");

  // 1. Try Readability (industry standard)
  try {
    const doc = new JSDOM(cleanHtml, { url: pageUrl });
    const reader = new Readability(doc.window.document, {
      charThreshold: 50,       // lower threshold → more content extracted
      nbTopCandidates: 10,     // consider more candidates for article body
      keepClasses: false,      // strip all CSS classes
    });
    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 100) {
      console.log(`[Scraper] 📖 Readability extracted ${article.textContent.trim().length} chars`);
      // Readability returns clean text — just normalize whitespace
      const text = article.textContent
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return text.slice(0, 15000);
    }
  } catch (err) {
    console.log(`[Scraper] ⚠️ Readability failed: ${err instanceof Error ? err.message : err}`);
  }

  // 2. Fallback: aggressive DOM cleanup via JSDOM
  console.log("[Scraper] 🔄 Readability insufficient, falling back to DOM cleanup...");
  try {
    const doc = new JSDOM(cleanHtml, { url: pageUrl });
    const document = doc.window.document;

    // Remove ALL non-content elements
    const junkSelectors = [
      "script", "style", "noscript", "svg", "template", "iframe",
      "canvas", "video", "audio", "object", "embed", "map",
      "link", "meta",
      // Structural noise
      "nav", "header", "footer", "aside",
      "[role='navigation']", "[role='banner']", "[role='contentinfo']",
      "[role='complementary']", "[role='search']",
      // Hidden elements
      "[hidden]", "[aria-hidden='true']",
      "[style*='display:none']", "[style*='display: none']",
      "[style*='visibility:hidden']", "[style*='visibility: hidden']",
      // Form internals
      "select", "option", "input", "textarea", "button",
      // Ad / tracking
      "[id*='cookie']", "[class*='cookie']",
      "[id*='banner']", "[class*='banner']",
      "[class*='popup']", "[class*='modal']",
      "[class*='overlay']",
    ].join(", ");
    document.querySelectorAll(junkSelectors).forEach((el) => el.remove());

    // Extract text from content-bearing elements only
    const contentSelectors = "p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, dt, dd, summary, caption";

    // Try scoped containers first
    const containerSelectors = ["main", "article", '[role="main"]', "#content", ".content"];
    let scope: Element = document.body;
    for (const sel of containerSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 200) {
        scope = el;
        break;
      }
    }

    const contentEls = scope.querySelectorAll(contentSelectors);
    const fragments: string[] = [];
    const seen = new Set<string>();

    for (const el of contentEls) {
      const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!txt || txt.length < 3) continue;
      if (seen.has(txt)) continue;
      seen.add(txt);
      fragments.push(txt);
    }

    // If content elements yielded too little, try leaf divs/spans
    if (fragments.join(" ").length < 300) {
      const fallbackEls = scope.querySelectorAll("div, span");
      for (const el of fallbackEls) {
        if (el.children.length > 3) continue; // skip wrapper divs
        const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length < 5 || txt.length > 2000) continue;
        if (seen.has(txt)) continue;
        seen.add(txt);
        fragments.push(txt);
      }
    }

    const text = fragments.join("\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log(`[Scraper] 📝 DOM fallback extracted ${text.length} chars`);
    return text.slice(0, 15000);
  } catch (err) {
    console.log(`[Scraper] ⚠️ DOM fallback failed: ${err instanceof Error ? err.message : err}`);
    return "";
  }
}

// ─── Fast fetch fallback — для случаев, когда Playwright таймаутит ───
async function fetchFallbackHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

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
  // Новые проверки
  robotsTxtAiFriendly: boolean;   // robots.txt НЕ блокирует AI-ботов
  robotsTxtBlockedBots: string[]; // Какие боты заблокированы (GPTBot, ClaudeBot, etc.)
  semanticHtmlValid: boolean;     // <main>/<article> + корректная иерархия H1→H2
  semanticHtmlDetails: {
    hasMain: boolean;
    hasArticle: boolean;
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    headingHierarchyOk: boolean;  // H1 → H2 без пропусков
    headings: string[];           // Список найденных h-тегов: ["h1","h2","h2","h3"]
  };
  // Entity SEO / Brand Passport
  hasBrandPassport: boolean;      // sameAs содержит Wikidata, Crunchbase, LinkedIn, Яндекс.Карты
  knowledgeGraphLinks: string[];  // Найденные sameAs-ссылки на Knowledge Graph
}

// ─── Brand Passport — Entity SEO via sameAs ────────────
const KNOWLEDGE_GRAPH_PATTERNS = [
  "wikidata.org",
  "crunchbase.com",
  "linkedin.com/company",
  "yandex.ru/maps",
  "wikipedia.org",
  "dbpedia.org",
  "g.co/kg",            // Google Knowledge Graph
];

function extractBrandPassport(schemaOrgData: Record<string, unknown>[]): {
  hasBrandPassport: boolean;
  knowledgeGraphLinks: string[];
} {
  const knowledgeGraphLinks: string[] = [];

  for (const item of schemaOrgData) {
    const type = String(item["@type"] ?? "").toLowerCase();
    // Also check @graph arrays (common in Yoast, Rank Math, etc.)
    const items: Record<string, unknown>[] =
      Array.isArray(item["@graph"])
        ? (item["@graph"] as Record<string, unknown>[])
        : [item];

    for (const entity of items) {
      const entityType = String(entity["@type"] ?? "").toLowerCase();
      const isOrgLike =
        entityType.includes("organization") ||
        entityType.includes("localbusiness") ||
        entityType.includes("corporation") ||
        entityType.includes("brand") ||
        type.includes("organization") ||
        type.includes("localbusiness");

      if (!isOrgLike) continue;

      const sameAs = entity["sameAs"] ?? entity["sameas"];
      if (!sameAs) continue;

      const urls: string[] = Array.isArray(sameAs)
        ? sameAs.map(String)
        : [String(sameAs)];

      for (const u of urls) {
        if (KNOWLEDGE_GRAPH_PATTERNS.some((p) => u.toLowerCase().includes(p))) {
          if (!knowledgeGraphLinks.includes(u)) {
            knowledgeGraphLinks.push(u);
          }
        }
      }
    }
  }

  return {
    hasBrandPassport: knowledgeGraphLinks.length > 0,
    knowledgeGraphLinks,
  };
}

// ─── Основная функция ───────────────────────────────────
export async function scrapeSite(url: string): Promise<SiteData> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-infobars",
        "--window-size=1280,720",
      ],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      locale: "en-US",
      timezoneId: "Europe/Moscow",
      bypassCSP: true,
    });

    const page = await context.newPage();

    // Блокируем тяжёлые ресурсы для ускорения
    await page.route("**/*.{png,jpg,jpeg,gif,svg,webp,mp4,webm,woff,woff2,ttf}", (route) =>
      route.abort()
    );

    console.log(`[Scraper] 🌐 Загружаю ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 12000,
    });

    // Короткое ожидание для SPA-рендеринга
    await page.waitForTimeout(1000);

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

    // Основной текст страницы (до 15000 символов)
    // Use @mozilla/readability — same algorithm as Firefox Reader Mode.
    // CMS-agnostic: works with Tilda, Wix, WordPress, Bitrix, React SPAs, etc.
    const renderedHtml = await page.content();
    const bodyText = extractReadableText(renderedHtml, url);

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

    // ─── Проверка /robots.txt (AI-боты) ────────────────
    let robotsTxtAiFriendly = true;
    const robotsTxtBlockedBots: string[] = [];
    const AI_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "ChatGPT-User", "Amazonbot", "anthropic-ai", "PerplexityBot"];

    try {
      const baseUrl = new URL(url);
      const robotsUrl = `${baseUrl.origin}/robots.txt`;

      const robotsPage = await context.newPage();
      const robotsResponse = await robotsPage.goto(robotsUrl, {
        waitUntil: "domcontentloaded",
        timeout: 8000,
      });

      if (robotsResponse && robotsResponse.ok()) {
        const robotsText = await robotsPage.evaluate(() => document.body?.innerText ?? "");
        if (robotsText && robotsText.length > 5) {
          // Парсим robots.txt: ищем блокировки AI-ботов
          const lines = robotsText.split("\n").map(l => l.trim());
          let currentAgent = "";

          for (const line of lines) {
            const lower = line.toLowerCase();
            if (lower.startsWith("user-agent:")) {
              currentAgent = line.slice("user-agent:".length).trim();
            } else if (lower.startsWith("disallow:") && lower.includes("/")) {
              // Проверяем, блокирует ли текущий user-agent AI-бота
              for (const bot of AI_BOTS) {
                if (currentAgent === "*" || currentAgent.toLowerCase() === bot.toLowerCase()) {
                  const disallowPath = line.slice("disallow:".length).trim();
                  if (disallowPath === "/" || disallowPath === "/*") {
                    if (currentAgent.toLowerCase() !== "*") {
                      // Явная блокировка AI-бота
                      if (!robotsTxtBlockedBots.includes(bot)) {
                        robotsTxtBlockedBots.push(
                          currentAgent === "*" ? `* (все боты)` : currentAgent
                        );
                      }
                    } else {
                      // Проверяем, есть ли allow для AI-ботов (wildcard block)
                      // Если * блокирует /, это может быть нормально если есть отдельный allow
                      // Не помечаем как блокировку, т.к. это стандартная практика
                    }
                  }
                }
              }
            }
          }

          // Также проверяем прямые блокировки конкретных ботов
          for (const bot of AI_BOTS) {
            const botLower = bot.toLowerCase();
            const hasUserAgent = lines.some(l => {
              const lower = l.toLowerCase().trim();
              return lower === `user-agent: ${botLower}`;
            });
            if (hasUserAgent) {
              // Найден user-agent для этого бота — проверяем, есть ли disallow: /
              let inBotBlock = false;
              for (const line of lines) {
                const lower = line.toLowerCase().trim();
                if (lower === `user-agent: ${botLower}`) {
                  inBotBlock = true;
                } else if (lower.startsWith("user-agent:")) {
                  inBotBlock = false;
                } else if (inBotBlock && lower.startsWith("disallow:")) {
                  const path = lower.slice("disallow:".length).trim();
                  if (path === "/" || path === "/*") {
                    if (!robotsTxtBlockedBots.includes(bot)) {
                      robotsTxtBlockedBots.push(bot);
                    }
                  }
                }
              }
            }
          }

          robotsTxtAiFriendly = robotsTxtBlockedBots.length === 0;
        }
      }
      await robotsPage.close();
    } catch {
      // robots.txt не найден — считаем AI-friendly (ничего не блокируется)
      robotsTxtAiFriendly = true;
    }

    // ─── Проверка семантического HTML ──────────────────
    const semanticHtmlDetails = await page.evaluate(() => {
      const hasMain = !!document.querySelector("main");
      const hasArticle = !!document.querySelector("article");
      const hasNav = !!document.querySelector("nav");
      const hasHeader = !!document.querySelector("header");
      const hasFooter = !!document.querySelector("footer");

      // Собираем иерархию заголовков
      const headingEls = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const headings: string[] = [];
      for (const el of headingEls) {
        headings.push(el.tagName.toLowerCase());
      }

      // Проверяем иерархию: H1 должен быть первым, далее H2, без пропусков уровней
      let headingHierarchyOk = false;
      if (headings.length > 0 && headings[0] === "h1") {
        headingHierarchyOk = true;
        let lastLevel = 1;
        for (let i = 1; i < headings.length; i++) {
          const level = parseInt(headings[i].charAt(1));
          if (level > lastLevel + 1) {
            // Пропуск уровня (например H1 → H3)
            headingHierarchyOk = false;
            break;
          }
          lastLevel = level;
        }
      }

      return { hasMain, hasArticle, hasNav, hasHeader, hasFooter, headingHierarchyOk, headings };
    });

    const semanticHtmlValid =
      (semanticHtmlDetails.hasMain || semanticHtmlDetails.hasArticle) &&
      semanticHtmlDetails.headingHierarchyOk;

    console.log(`[Scraper] ✅ Спарсил: title="${title}", h1="${h1?.slice(0, 50)}..."`);
    console.log(
      `[Scraper]    Schema.org types: [${schemaOrgTypes.join(", ")}], llms.txt: ${hasLlmsTxt}`
    );
    console.log(
      `[Scraper]    robots.txt AI-friendly: ${robotsTxtAiFriendly}${robotsTxtBlockedBots.length > 0 ? ` (blocked: ${robotsTxtBlockedBots.join(", ")})` : ""}`
    );
    console.log(
      `[Scraper]    Semantic HTML: main=${semanticHtmlDetails.hasMain}, article=${semanticHtmlDetails.hasArticle}, hierarchy=${semanticHtmlDetails.headingHierarchyOk}`
    );

    // ─── Brand Passport (Entity SEO) ──────────────────
    const brandPassport = extractBrandPassport(schemaOrgData);
    console.log(
      `[Scraper]    Brand Passport: ${brandPassport.hasBrandPassport}${brandPassport.knowledgeGraphLinks.length > 0 ? ` (${brandPassport.knowledgeGraphLinks.join(", ")})` : ""}`
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
      robotsTxtAiFriendly,
      robotsTxtBlockedBots,
      semanticHtmlValid,
      semanticHtmlDetails,
      hasBrandPassport: brandPassport.hasBrandPassport,
      knowledgeGraphLinks: brandPassport.knowledgeGraphLinks,
    };
  } catch (error) {
    console.error(`[Scraper] ❌ Playwright не смог загрузить ${url}:`, error instanceof Error ? error.message : error);

    // ── Fast fetch fallback ──────────────────────────────
    console.log(`[Scraper] 🔄 Пробую fetch-фоллбек для ${url}...`);
    const html = await fetchFallbackHtml(url);
    if (html && html.length > 200) {
      console.log(`[Scraper] ✅ Fetch-фоллбек сработал (${html.length} символов)`);

      // Базовый парсинг HTML без Playwright
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

      // Use Readability for CMS-agnostic content extraction
      const bodyTextCleaned = extractReadableText(html, url);

      // Schema.org extraction
      const schemaMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      const schemaOrgData: Record<string, unknown>[] = [];
      const schemaOrgTypes: string[] = [];
      for (const m of schemaMatches) {
        try {
          const obj = JSON.parse(m[1]);
          schemaOrgData.push(obj);
          if (obj["@type"]) schemaOrgTypes.push(String(obj["@type"]));
        } catch {}
      }

      // Check llms.txt
      let hasLlmsTxt = false;
      let llmsTxtContent = "";
      try {
        const baseUrl = new URL(url).origin;
        const resp = await fetch(`${baseUrl}/llms.txt`, { signal: AbortSignal.timeout(4000) });
        if (resp.ok) {
          llmsTxtContent = await resp.text();
          hasLlmsTxt = llmsTxtContent.trim().length > 0;
        }
      } catch {}

      // Check robots.txt
      let robotsTxtAiFriendly = true;
      const robotsTxtBlockedBots: string[] = [];
      try {
        const baseUrl = new URL(url).origin;
        const resp = await fetch(`${baseUrl}/robots.txt`, { signal: AbortSignal.timeout(4000) });
        if (resp.ok) {
          const robotsTxt = await resp.text();
          const aiBots = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot", "anthropic-ai"];
          for (const bot of aiBots) {
            const regex = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, "i");
            if (regex.test(robotsTxt)) {
              robotsTxtBlockedBots.push(bot);
            }
          }
          robotsTxtAiFriendly = robotsTxtBlockedBots.length === 0;
        }
      } catch {}

      // Semantic HTML detection
      const hasMain = /<main[\s>]/i.test(html);
      const hasArticle = /<article[\s>]/i.test(html);
      const hasNav = /<nav[\s>]/i.test(html);
      const hasHeader = /<header[\s>]/i.test(html);
      const hasFooter = /<footer[\s>]/i.test(html);
      const headings = [...html.matchAll(/<(h[1-6])[\s>]/gi)].map((m) => m[1].toLowerCase());
      let headingHierarchyOk = true;
      let lastLevel = 0;
      for (const h of headings) {
        const level = parseInt(h[1]);
        if (lastLevel > 0 && level > lastLevel + 1) {
          headingHierarchyOk = false;
          break;
        }
        lastLevel = level;
      }

      console.log(`[Scraper] ✅ (fetch) title="${titleMatch?.[1]?.slice(0, 50)}", llms.txt: ${hasLlmsTxt}`);

      const brandPassportFb = extractBrandPassport(schemaOrgData);
      console.log(
        `[Scraper]    (fetch) Brand Passport: ${brandPassportFb.hasBrandPassport}${brandPassportFb.knowledgeGraphLinks.length > 0 ? ` (${brandPassportFb.knowledgeGraphLinks.join(", ")})` : ""}`
      );

      return {
        url,
        title: titleMatch?.[1]?.trim() ?? "",
        description: descMatch?.[1]?.trim() ?? "",
        h1: h1Match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "",
        bodyText: bodyTextCleaned,
        hasLlmsTxt,
        llmsTxtContent,
        schemaOrgTypes,
        schemaOrgData,
        robotsTxtAiFriendly,
        robotsTxtBlockedBots,
        semanticHtmlValid: (hasMain || hasArticle) && headingHierarchyOk,
        semanticHtmlDetails: {
          hasMain,
          hasArticle,
          hasNav,
          hasHeader,
          hasFooter,
          headingHierarchyOk,
          headings,
        },
        hasBrandPassport: brandPassportFb.hasBrandPassport,
        knowledgeGraphLinks: brandPassportFb.knowledgeGraphLinks,
      };
    }

    throw new Error(
      `Не удалось спарсить сайт ${url}: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
