/**
 * Scraper — парсит сайт и извлекает данные для GEO-анализа.
 *
 * Провайдеры (waterfall — каждый следующий запускается при неудаче предыдущего):
 *   1. Firecrawl API        — облако, обходит Cloudflare/Qrator/WAF, возвращает Markdown
 *   2. ScrapingBee API      — renders JS, rotating residential proxies
 *   3. Playwright + BrightData proxy — headless Chrome через datacenter/residential proxy
 *   4. raw fetch()          — последний шанс, без JS-рендеринга
 *
 * Активация через .env:
 *   FIRECRAWL_API_KEY=fc-...
 *   SCRAPINGBEE_API_KEY=...
 *   BRIGHTDATA_PROXY_URL=http://user:pass@brd.superproxy.io:22225
 *   SCRAPING_PROVIDER=auto   # auto | firecrawl | scrapingbee | playwright (форсировать конкретный)
 */

import { chromium, type Browser, type Route } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import dns from "dns";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — SSRF / DNS-Rebinding protection (Playwright only)
// ═══════════════════════════════════════════════════════════════════════════════

function isPrivateIp(ip: string): boolean {
  if (ip === "::1") return true;
  if (/^(fc|fd)/i.test(ip)) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) return false;
  const [a, b] = parts;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

async function blockPrivateIpRoute(route: Route): Promise<void> {
  try {
    const reqUrl = new URL(route.request().url());
    const hostname = reqUrl.hostname;
    if (/^[\d.]+$/.test(hostname) || hostname.includes(":")) {
      if (isPrivateIp(hostname)) {
        console.warn(`[Scraper] 🚫 SSRF blocked (direct IP): ${hostname}`);
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
      return;
    }
    const { address } = await dns.promises.lookup(hostname, { family: 4 });
    if (isPrivateIp(address)) {
      console.warn(`[Scraper] 🚫 SSRF blocked: ${hostname} → ${address}`);
      await route.abort("blockedbyclient");
      return;
    }
  } catch {
    await route.abort("blockedbyclient").catch(() => {});
    return;
  }
  await route.continue();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Content extraction utilities (provider-agnostic)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extracts clean human-readable text from HTML via Mozilla Readability.
 * Falls back to aggressive DOM cleanup when Readability yields too little text.
 * Used by ScrapingBee, Playwright, and raw-fetch paths (Firecrawl returns markdown directly).
 */
function extractReadableText(html: string, pageUrl: string): string {
  const cleanHtml = html
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, "")
    .replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, "");

  // 1. Readability (Firefox Reader Mode algorithm)
  try {
    const doc = new JSDOM(cleanHtml, { url: pageUrl });
    const reader = new Readability(doc.window.document, {
      charThreshold: 50,
      nbTopCandidates: 10,
      keepClasses: false,
    });
    const article = reader.parse();
    if (article?.textContent && article.textContent.trim().length > 100) {
      console.log(`[Scraper] 📖 Readability: ${article.textContent.trim().length} chars`);
      return article.textContent
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 15000);
    }
  } catch (err) {
    console.log(`[Scraper] ⚠️ Readability failed: ${err instanceof Error ? err.message : err}`);
  }

  // 2. Aggressive DOM cleanup fallback
  try {
    const doc = new JSDOM(cleanHtml, { url: pageUrl });
    const document = doc.window.document;
    const junkSelectors = [
      "script","style","noscript","svg","template","iframe","canvas","video","audio",
      "object","embed","map","link","meta","nav","header","footer","aside",
      "[role='navigation']","[role='banner']","[role='contentinfo']","[role='complementary']",
      "[hidden]","[aria-hidden='true']","[style*='display:none']","[style*='visibility:hidden']",
      "select","option","input","textarea","button",
      "[id*='cookie']","[class*='cookie']","[class*='popup']","[class*='modal']","[class*='overlay']",
    ].join(", ");
    document.querySelectorAll(junkSelectors).forEach((el) => el.remove());

    const contentSelectors = "p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,figcaption,dt,dd,summary,caption";
    let scope: Element = document.body;
    for (const sel of ["main","article",'[role="main"]',"#content",".content"]) {
      const el = document.querySelector(sel);
      if (el && (el.textContent ?? "").trim().length > 200) { scope = el; break; }
    }

    const seen = new Set<string>();
    const fragments: string[] = [];
    for (const el of scope.querySelectorAll(contentSelectors)) {
      const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!txt || txt.length < 3 || seen.has(txt)) continue;
      seen.add(txt); fragments.push(txt);
    }
    if (fragments.join(" ").length < 300) {
      for (const el of scope.querySelectorAll("div,span")) {
        if (el.children.length > 3) continue;
        const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length < 5 || txt.length > 2000 || seen.has(txt)) continue;
        seen.add(txt); fragments.push(txt);
      }
    }
    const text = fragments.join("\n\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    console.log(`[Scraper] 📝 DOM fallback: ${text.length} chars`);
    return text.slice(0, 15000);
  } catch { return ""; }
}

/**
 * Extracts Schema.org JSON-LD blocks from HTML string.
 * Works on both raw and cleaned HTML from any scraping provider.
 */
function extractSchemaOrg(html: string): {
  schemaOrgTypes: string[];
  schemaOrgData: Record<string, unknown>[];
} {
  const schemaOrgData: Record<string, unknown>[] = [];
  const schemaOrgTypes: string[] = [];
  const matches = [...html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )];
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"]) { schemaOrgTypes.push(String(item["@type"])); schemaOrgData.push(item); }
      }
    } catch { /* invalid JSON-LD */ }
  }
  return { schemaOrgTypes, schemaOrgData };
}

/**
 * Extracts semantic HTML signals from an HTML string (no browser needed).
 * Used by ScrapingBee and raw-fetch paths. Playwright path uses page.evaluate.
 */
function extractSemanticHtml(html: string): SiteData["semanticHtmlDetails"] & { semanticHtmlValid: boolean } {
  const hasMain    = /<main[\s>]/i.test(html);
  const hasArticle = /<article[\s>]/i.test(html);
  const hasNav     = /<nav[\s>]/i.test(html);
  const hasHeader  = /<header[\s>]/i.test(html);
  const hasFooter  = /<footer[\s>]/i.test(html);
  const headings   = [...html.matchAll(/<(h[1-6])[\s>]/gi)].map((m) => m[1].toLowerCase());

  let headingHierarchyOk = headings.length > 0 && headings[0] === "h1";
  let lastLevel = 1;
  for (let i = 1; i < headings.length; i++) {
    const level = parseInt(headings[i][1]);
    if (level > lastLevel + 1) { headingHierarchyOk = false; break; }
    lastLevel = level;
  }

  return {
    hasMain, hasArticle, hasNav, hasHeader, hasFooter,
    headingHierarchyOk, headings,
    semanticHtmlValid: (hasMain || hasArticle) && headingHierarchyOk,
  };
}

// ─── Lightweight side-fetches (robots.txt, llms.txt) ────────────────────────
// Plain text files — no JS rendering or anti-bot protection needed.

async function fetchLlmsTxt(siteOrigin: string): Promise<{ hasLlmsTxt: boolean; llmsTxtContent: string }> {
  try {
    const resp = await fetch(`${siteOrigin}/llms.txt`, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) return { hasLlmsTxt: false, llmsTxtContent: "" };
    const text = await resp.text();
    const valid = text.trim().length > 10 && text.trim().length < 50000;
    return { hasLlmsTxt: valid, llmsTxtContent: valid ? text.slice(0, 5000) : "" };
  } catch { return { hasLlmsTxt: false, llmsTxtContent: "" }; }
}

async function fetchRobotsTxt(siteOrigin: string): Promise<{
  robotsTxtAiFriendly: boolean;
  robotsTxtBlockedBots: string[];
}> {
  const AI_BOTS = ["GPTBot","ClaudeBot","Google-Extended","ChatGPT-User","Amazonbot","anthropic-ai","PerplexityBot","CCBot"];
  try {
    const resp = await fetch(`${siteOrigin}/robots.txt`, { signal: AbortSignal.timeout(6000) });
    if (!resp.ok) return { robotsTxtAiFriendly: true, robotsTxtBlockedBots: [] };
    const text = await resp.text();
    const lines = text.split("\n").map((l) => l.trim());
    const robotsTxtBlockedBots: string[] = [];
    let currentAgent = "";
    let inBotBlock = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith("user-agent:")) {
        currentAgent = line.slice("user-agent:".length).trim();
        inBotBlock = AI_BOTS.some((b) => b.toLowerCase() === currentAgent.toLowerCase());
      } else if (inBotBlock && lower.startsWith("disallow:")) {
        const path = lower.slice("disallow:".length).trim();
        if ((path === "/" || path === "/*") && !robotsTxtBlockedBots.includes(currentAgent)) {
          robotsTxtBlockedBots.push(currentAgent);
        }
      }
    }
    return { robotsTxtAiFriendly: robotsTxtBlockedBots.length === 0, robotsTxtBlockedBots };
  } catch { return { robotsTxtAiFriendly: true, robotsTxtBlockedBots: [] }; }
}

// ─── Brand Passport ─────────────────────────────────────────────────────────

const KNOWLEDGE_GRAPH_PATTERNS = [
  "wikidata.org","crunchbase.com","linkedin.com/company",
  "yandex.ru/maps","wikipedia.org","dbpedia.org","g.co/kg",
];

function extractBrandPassport(schemaOrgData: Record<string, unknown>[]): {
  hasBrandPassport: boolean;
  knowledgeGraphLinks: string[];
} {
  const knowledgeGraphLinks: string[] = [];
  for (const item of schemaOrgData) {
    const items: Record<string, unknown>[] = Array.isArray(item["@graph"])
      ? (item["@graph"] as Record<string, unknown>[]) : [item];
    for (const entity of items) {
      const t = String(entity["@type"] ?? "").toLowerCase();
      const isOrgLike = ["organization","localbusiness","corporation","brand"].some((k) => t.includes(k));
      if (!isOrgLike) continue;
      const sameAs = entity["sameAs"] ?? entity["sameas"];
      if (!sameAs) continue;
      const urls: string[] = Array.isArray(sameAs) ? sameAs.map(String) : [String(sameAs)];
      for (const u of urls) {
        if (KNOWLEDGE_GRAPH_PATTERNS.some((p) => u.toLowerCase().includes(p)) && !knowledgeGraphLinks.includes(u)) {
          knowledgeGraphLinks.push(u);
        }
      }
    }
  }
  return { hasBrandPassport: knowledgeGraphLinks.length > 0, knowledgeGraphLinks };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Types
// ═══════════════════════════════════════════════════════════════════════════════

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
  robotsTxtAiFriendly: boolean;
  robotsTxtBlockedBots: string[];
  semanticHtmlValid: boolean;
  semanticHtmlDetails: {
    hasMain: boolean;
    hasArticle: boolean;
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    headingHierarchyOk: boolean;
    headings: string[];
  };
  hasBrandPassport: boolean;
  knowledgeGraphLinks: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Scraping providers
// ═══════════════════════════════════════════════════════════════════════════════

// ── Provider 1: Firecrawl ─────────────────────────────────────────────────────
// Fully managed anti-bot service. Handles Cloudflare, Imperva, Qrator, etc.
// Returns clean Markdown — no need for Readability post-processing.
// Docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape
//
// Required env: FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxx

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogDescription?: string;
      h1?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

async function tryFirecrawl(url: string): Promise<SiteData | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  console.log(`[Scraper] 🔥 Firecrawl → ${url}`);
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        // Ask Firecrawl to wait for JS rendering and handle bot challenges
        waitFor: 2000,
        timeout: 30000,
        // Skip these to keep markdown clean
        excludeTags: ["script", "style", "nav", "footer", "header", "aside"],
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!resp.ok) {
      console.warn(`[Scraper] Firecrawl HTTP ${resp.status}: ${await resp.text().catch(() => "")}`);
      return null;
    }

    const json = (await resp.json()) as FirecrawlResponse;
    if (!json.success || !json.data) {
      console.warn(`[Scraper] Firecrawl non-success: ${json.error ?? "unknown"}`);
      return null;
    }

    const { markdown = "", html = "", metadata = {} } = json.data;

    // Firecrawl markdown is already clean — no Readability needed.
    // Trim to 15 000 chars to match other providers.
    const bodyText = markdown
      .replace(/!\[.*?\]\(.*?\)/g, "")  // strip images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip link syntax, keep text
      .replace(/#{1,6}\s*/g, "")        // strip markdown headings syntax (keep text)
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // strip bold/italic
      .replace(/`{1,3}[^`]*`{1,3}/g, "") // strip code
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 15000);

    if (bodyText.length < 100) {
      console.warn(`[Scraper] Firecrawl returned too little text (${bodyText.length} chars)`);
      return null;
    }

    // Extract schema.org from the raw HTML Firecrawl also returns
    const { schemaOrgTypes, schemaOrgData } = html ? extractSchemaOrg(html) : { schemaOrgTypes: [], schemaOrgData: [] };
    const semantic = html ? extractSemanticHtml(html) : {
      hasMain: false, hasArticle: false, hasNav: false, hasHeader: false, hasFooter: false,
      headingHierarchyOk: false, headings: [], semanticHtmlValid: false,
    };

    const origin = new URL(url).origin;
    const [llmsTxtResult, robotsResult] = await Promise.all([
      fetchLlmsTxt(origin),
      fetchRobotsTxt(origin),
    ]);

    const brandPassport = extractBrandPassport(schemaOrgData);

    const title       = metadata.title ?? "";
    const description = metadata.description ?? metadata.ogDescription ?? "";
    const h1          = metadata.h1 ?? "";

    console.log(`[Scraper] ✅ Firecrawl OK: title="${title.slice(0, 50)}", body=${bodyText.length}ch, schema=[${schemaOrgTypes.join(",")}]`);

    return {
      url,
      title,
      description,
      h1,
      bodyText,
      ...llmsTxtResult,
      schemaOrgTypes,
      schemaOrgData,
      ...robotsResult,
      semanticHtmlValid: semantic.semanticHtmlValid,
      semanticHtmlDetails: {
        hasMain: semantic.hasMain,
        hasArticle: semantic.hasArticle,
        hasNav: semantic.hasNav,
        hasHeader: semantic.hasHeader,
        hasFooter: semantic.hasFooter,
        headingHierarchyOk: semantic.headingHierarchyOk,
        headings: semantic.headings,
      },
      hasBrandPassport: brandPassport.hasBrandPassport,
      knowledgeGraphLinks: brandPassport.knowledgeGraphLinks,
    };
  } catch (err) {
    console.warn(`[Scraper] Firecrawl error: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

// ── Provider 2: ScrapingBee ───────────────────────────────────────────────────
// Residential proxy pool + JS rendering. Good for sites that block datacenters.
// Returns raw rendered HTML — run through Readability.
// Docs: https://www.scrapingbee.com/documentation/
//
// Required env: SCRAPINGBEE_API_KEY=xxxxxxxxxx

async function tryScrapingBee(url: string): Promise<SiteData | null> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) return null;

  console.log(`[Scraper] 🐝 ScrapingBee → ${url}`);
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      url,
      render_js: "true",           // Full JS rendering via headless Chrome
      premium_proxy: "false",      // Set to "true" for harder targets (+credits)
      stealth_proxy: "true",       // Stealth mode: rotates residential IPs
      country_code: "us",          // Appear to come from US DC
      wait_for: "2000",            // ms to wait after page load
      block_resources: "false",    // We need full HTML
      json_response: "false",      // Raw HTML response
    });

    const resp = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params.toString()}`,
      { signal: AbortSignal.timeout(35000) }
    );

    if (!resp.ok) {
      console.warn(`[Scraper] ScrapingBee HTTP ${resp.status}`);
      return null;
    }

    const html = await resp.text();
    if (!html || html.length < 200) return null;

    // Standard extraction pipeline
    const bodyText = extractReadableText(html, url);
    if (bodyText.length < 80) { console.warn(`[Scraper] ScrapingBee: too little text`); return null; }

    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    const title       = document.title ?? "";
    const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const h1          = document.querySelector("h1")?.textContent?.trim() ?? "";

    const { schemaOrgTypes, schemaOrgData } = extractSchemaOrg(html);
    const semantic = extractSemanticHtml(html);

    const origin = new URL(url).origin;
    const [llmsTxtResult, robotsResult] = await Promise.all([
      fetchLlmsTxt(origin),
      fetchRobotsTxt(origin),
    ]);

    const brandPassport = extractBrandPassport(schemaOrgData);
    console.log(`[Scraper] ✅ ScrapingBee OK: title="${title.slice(0, 50)}", body=${bodyText.length}ch`);

    return {
      url, title, description, h1, bodyText,
      ...llmsTxtResult, schemaOrgTypes, schemaOrgData, ...robotsResult,
      semanticHtmlValid: semantic.semanticHtmlValid,
      semanticHtmlDetails: {
        hasMain: semantic.hasMain, hasArticle: semantic.hasArticle,
        hasNav: semantic.hasNav, hasHeader: semantic.hasHeader, hasFooter: semantic.hasFooter,
        headingHierarchyOk: semantic.headingHierarchyOk, headings: semantic.headings,
      },
      hasBrandPassport: brandPassport.hasBrandPassport,
      knowledgeGraphLinks: brandPassport.knowledgeGraphLinks,
    };
  } catch (err) {
    console.warn(`[Scraper] ScrapingBee error: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

// ── Provider 3: Playwright + BrightData / direct ─────────────────────────────
// Headless Chrome. With BRIGHTDATA_PROXY_URL it routes through residential IPs.
// Without proxy it still works for sites without aggressive WAF.
//
// Optional env: BRIGHTDATA_PROXY_URL=http://user:pass@brd.superproxy.io:22225
//   (supports both http and socks5 proxies)

async function tryPlaywright(url: string): Promise<SiteData | null> {
  let browser: Browser | null = null;
  const proxyUrl = process.env.BRIGHTDATA_PROXY_URL;

  console.log(`[Scraper] 🎭 Playwright${proxyUrl ? " + proxy" : ""} → ${url}`);

  try {
    // Parse proxy URL if provided
    let proxyConfig: { server: string; username?: string; password?: string } | undefined;
    if (proxyUrl) {
      try {
        const parsed = new URL(proxyUrl);
        proxyConfig = {
          server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
          ...(parsed.username ? { username: decodeURIComponent(parsed.username) } : {}),
          ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
        };
      } catch {
        // Malformed proxy URL — use as-is (plain "host:port" format)
        proxyConfig = { server: proxyUrl };
      }
    }

    browser = await chromium.launch({
      headless: true,
      ...(proxyConfig ? { proxy: proxyConfig } : {}),
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
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      locale: "en-US",
      timezoneId: "Europe/Moscow",
      bypassCSP: true,
    });

    const page = await context.newPage();

    // SSRF protection only makes sense without an external proxy
    if (!proxyConfig) {
      await page.route("**/*", blockPrivateIpRoute);
    }

    // Block heavy media resources
    await page.route("**/*.{png,jpg,jpeg,gif,svg,webp,mp4,webm,woff,woff2,ttf}", (route) => route.abort());

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);

    const title       = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content").catch(() => "");
    const h1          = await page.locator("h1").first().textContent().catch(() => "");
    const renderedHtml = await page.content();

    const bodyText = extractReadableText(renderedHtml, url);

    // Schema.org via DOM (most accurate — works with late-injected JSON-LD)
    const jsonLdBlocks = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map((s) => s.textContent ?? "");
    });
    const schemaOrgData: Record<string, unknown>[] = [];
    const schemaOrgTypes: string[] = [];
    for (const raw of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item["@type"]) { schemaOrgTypes.push(String(item["@type"])); schemaOrgData.push(item); }
        }
      } catch { /* skip */ }
    }

    // Semantic HTML via DOM
    const semanticHtmlDetails = await page.evaluate(() => {
      const hasMain    = !!document.querySelector("main");
      const hasArticle = !!document.querySelector("article");
      const hasNav     = !!document.querySelector("nav");
      const hasHeader  = !!document.querySelector("header");
      const hasFooter  = !!document.querySelector("footer");
      const headings   = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) => el.tagName.toLowerCase());

      let headingHierarchyOk = headings.length > 0 && headings[0] === "h1";
      let lastLevel = 1;
      for (let i = 1; i < headings.length; i++) {
        const level = parseInt(headings[i][1]);
        if (level > lastLevel + 1) { headingHierarchyOk = false; break; }
        lastLevel = level;
      }
      return { hasMain, hasArticle, hasNav, hasHeader, hasFooter, headingHierarchyOk, headings };
    });

    await page.close();

    // llms.txt via separate context page
    let hasLlmsTxt = false;
    let llmsTxtContent = "";
    try {
      const origin = new URL(url).origin;
      const llmsPage = await context.newPage();
      if (!proxyConfig) await llmsPage.route("**/*", blockPrivateIpRoute);
      const llmsResp = await llmsPage.goto(`${origin}/llms.txt`, { waitUntil: "domcontentloaded", timeout: 8000 });
      if (llmsResp?.ok()) {
        const ct = llmsResp.headers()["content-type"] ?? "";
        if (!ct.includes("text/html")) {
          const text = await llmsPage.evaluate(() => document.body?.innerText ?? "");
          if (text.length > 10 && text.length < 50000) { hasLlmsTxt = true; llmsTxtContent = text.slice(0, 5000); }
        }
      }
      await llmsPage.close();
    } catch { /* not found */ }

    // robots.txt
    const origin = new URL(url).origin;
    const robotsResult = await fetchRobotsTxt(origin);

    const brandPassport = extractBrandPassport(schemaOrgData);
    const semanticHtmlValid = (semanticHtmlDetails.hasMain || semanticHtmlDetails.hasArticle) && semanticHtmlDetails.headingHierarchyOk;

    console.log(`[Scraper] ✅ Playwright OK: title="${title?.slice(0, 50)}", body=${bodyText.length}ch, schema=[${schemaOrgTypes.join(",")}]`);

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
      ...robotsResult,
      semanticHtmlValid,
      semanticHtmlDetails,
      hasBrandPassport: brandPassport.hasBrandPassport,
      knowledgeGraphLinks: brandPassport.knowledgeGraphLinks,
    };
  } catch (err) {
    console.warn(`[Scraper] Playwright error: ${err instanceof Error ? err.message : err}`);
    return null;
  } finally {
    await browser?.close();
  }
}

// ── Provider 4: raw fetch() ───────────────────────────────────────────────────
// Last resort. No JS rendering. Works for static/SSR sites.

async function tryRawFetch(url: string): Promise<SiteData | null> {
  console.log(`[Scraper] 🌐 raw fetch → ${url}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;

    const html = await resp.text();
    if (!html || html.length < 200) return null;

    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    const title       = document.title ?? "";
    const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const h1          = document.querySelector("h1")?.textContent?.trim() ?? "";

    const bodyText = extractReadableText(html, url);
    if (bodyText.length < 50) return null;

    const { schemaOrgTypes, schemaOrgData } = extractSchemaOrg(html);
    const semantic = extractSemanticHtml(html);

    const origin = new URL(url).origin;
    const [llmsTxtResult, robotsResult] = await Promise.all([
      fetchLlmsTxt(origin),
      fetchRobotsTxt(origin),
    ]);

    const brandPassport = extractBrandPassport(schemaOrgData);
    console.log(`[Scraper] ✅ raw fetch OK: title="${title.slice(0, 50)}", body=${bodyText.length}ch`);

    return {
      url, title, description, h1, bodyText,
      ...llmsTxtResult, schemaOrgTypes, schemaOrgData, ...robotsResult,
      semanticHtmlValid: semantic.semanticHtmlValid,
      semanticHtmlDetails: {
        hasMain: semantic.hasMain, hasArticle: semantic.hasArticle,
        hasNav: semantic.hasNav, hasHeader: semantic.hasHeader, hasFooter: semantic.hasFooter,
        headingHierarchyOk: semantic.headingHierarchyOk, headings: semantic.headings,
      },
      hasBrandPassport: brandPassport.hasBrandPassport,
      knowledgeGraphLinks: brandPassport.knowledgeGraphLinks,
    };
  } catch (err) {
    console.warn(`[Scraper] raw fetch error: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Main entry point (waterfall)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scrapes a URL using a waterfall of providers:
 *   Firecrawl → ScrapingBee → Playwright(+proxy) → raw fetch
 *
 * Set SCRAPING_PROVIDER=firecrawl|scrapingbee|playwright to force a specific one.
 * Default (SCRAPING_PROVIDER=auto or unset): tries all in order.
 */
export async function scrapeSite(url: string): Promise<SiteData> {
  const forced = (process.env.SCRAPING_PROVIDER ?? "auto").toLowerCase();

  // ── Forced provider mode ──────────────────────────────────────────────────
  if (forced === "firecrawl") {
    const result = await tryFirecrawl(url);
    if (result) return result;
    throw new Error(`[Scraper] Firecrawl (forced) failed for ${url}`);
  }
  if (forced === "scrapingbee") {
    const result = await tryScrapingBee(url);
    if (result) return result;
    throw new Error(`[Scraper] ScrapingBee (forced) failed for ${url}`);
  }
  if (forced === "playwright") {
    const result = await tryPlaywright(url);
    if (result) return result;
    throw new Error(`[Scraper] Playwright (forced) failed for ${url}`);
  }

  // ── Auto waterfall ────────────────────────────────────────────────────────

  // 1. Firecrawl (best anti-bot, clean markdown output)
  if (process.env.FIRECRAWL_API_KEY) {
    const result = await tryFirecrawl(url);
    if (result) return result;
    console.warn("[Scraper] Firecrawl failed, trying ScrapingBee...");
  }

  // 2. ScrapingBee (residential proxy pool, JS rendering)
  if (process.env.SCRAPINGBEE_API_KEY) {
    const result = await tryScrapingBee(url);
    if (result) return result;
    console.warn("[Scraper] ScrapingBee failed, trying Playwright...");
  }

  // 3. Playwright (with BrightData proxy if configured, or direct)
  {
    const result = await tryPlaywright(url);
    if (result) return result;
    console.warn("[Scraper] Playwright failed, trying raw fetch...");
  }

  // 4. Raw fetch — last resort (no JS rendering)
  {
    const result = await tryRawFetch(url);
    if (result) return result;
  }

  throw new Error(
    `[Scraper] All providers failed for ${url}. ` +
    `Configure FIRECRAWL_API_KEY or SCRAPINGBEE_API_KEY for anti-bot protection.`
  );
}
