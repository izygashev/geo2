/**
 * Playwright Scraper — парсит сайт и извлекает данные для GEO-анализа.
 *
 * Извлекает: title, description, h1, основной текст (до 15000 символов),
 * наличие /llms.txt, Schema.org (JSON-LD) данные.
 */

import { chromium, type Browser } from "playwright";

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
    // CRITICAL: Extract text ONLY from content-bearing elements to prevent
    // Tilda/Webflow/Next.js inline JS/CSS from leaking into RAG chunks.
    const bodyText = await page.evaluate(() => {
      // Clone body so we don't mutate the live DOM (needed for later checks)
      const clone = document.body.cloneNode(true) as HTMLElement;

      // 1. Strip ALL non-content elements aggressively
      const junkSelectors = [
        "script", "style", "noscript", "svg", "template", "iframe",
        "canvas", "video", "audio", "object", "embed", "map",
        "link[rel='stylesheet']", "link[rel='preload']",
        // Tilda-specific: navigation, popups, technical blocks
        "[data-tilda-root-zone-menuid]", ".t-menuburger", ".t-tildalabel",
        ".t-popup", ".t-store__filter", ".t228", ".t390",
        // Generic: navigation, footer, sidebars
        "nav", "header", "footer", "aside",
        "[role='navigation']", "[role='banner']", "[role='contentinfo']",
        // Form internals, hidden elements
        "select", "option", "input", "textarea", "button",
        "[style*='display:none']", "[style*='display: none']",
        "[hidden]", ".hidden", ".sr-only",
      ].join(", ");
      clone.querySelectorAll(junkSelectors).forEach((el) => el.remove());

      // 2. Extract text ONLY from content-bearing elements
      const contentSelectors = "p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, dt, dd, summary, caption, label, legend";
      
      // Try content containers first
      const containerSelectors = ["main", "article", '[role="main"]', "#content", ".content", "#rec", '[class*="t-container"]'];
      let scope: HTMLElement = clone;
      for (const sel of containerSelectors) {
        const el = clone.querySelector(sel) as HTMLElement | null;
        if (el && el.textContent && el.textContent.trim().length > 200) {
          scope = el;
          break;
        }
      }

      // Collect text from content elements
      const contentEls = scope.querySelectorAll(contentSelectors);
      const fragments: string[] = [];
      const seen = new Set<string>();

      for (const el of contentEls) {
        const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        // Skip empty, too short, duplicate, or code-like text
        if (!txt || txt.length < 3) continue;
        if (seen.has(txt)) continue;
        // Code detection: skip if >10% of chars are code syntax {;=()=>
        const codeChars = (txt.match(/[{};=()=>]/g) || []).length;
        if (codeChars / txt.length > 0.10) continue;
        // Skip CSS-like strings: "display:flex;margin:0;..."
        if (/(?:[a-z-]+\s*:\s*[^;]{1,30};\s*){3,}/.test(txt)) continue;
        // Skip JS function signatures: "function t_menuburger_init(..."
        if (/function\s+\w+\s*\(/.test(txt)) continue;
        seen.add(txt);
        fragments.push(txt);
      }

      // If content elements yielded very little, fall back to divs/spans with text
      if (fragments.join(" ").length < 300) {
        const fallbackEls = scope.querySelectorAll("div, span, a");
        for (const el of fallbackEls) {
          // Only direct text nodes — skip if element has many child elements
          if (el.children.length > 3) continue;
          const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
          if (!txt || txt.length < 5 || txt.length > 2000) continue;
          if (seen.has(txt)) continue;
          const codeChars = (txt.match(/[{};=()=>]/g) || []).length;
          if (codeChars / txt.length > 0.08) continue;
          if (/(?:[a-z-]+\s*:\s*[^;]{1,30};\s*){2,}/.test(txt)) continue;
          if (/function\s+\w+\s*\(/.test(txt)) continue;
          if (/^\s*(?:var|let|const|if|else|return|window|document)\b/.test(txt)) continue;
          seen.add(txt);
          fragments.push(txt);
        }
      }

      let result = fragments.join("\n\n");

      // 3. Final regex cleanup — catch anything that slipped through
      result = result
        // Tilda function names: t_menuburger_init, t_lazyload_init, etc.
        .replace(/\bt_\w+_init\b[^.]*\./g, "")
        .replace(/\bt\d{3,}[_.][\w.]+/g, "")
        // CSS property leaks
        .replace(/(?:[a-z-]+\s*:\s*[^;]{1,40};\s*){2,}/gi, "")
        // Stray curly brace blocks: { ... }
        .replace(/\{[^}]{0,200}\}/g, " ")
        // JS keywords followed by code
        .replace(/\b(?:function|var|let|const|return|if|else|typeof|undefined|null|true|false|window\.|document\.)\b[^.!?\n]{0,100}/g, "")
        // data-* attribute values that leaked
        .replace(/data-[\w-]+=["'][^"']*["']/g, "")
        // Orphaned CSS class names: .t-class-name
        .replace(/\.t-[\w-]+/g, "")
        // Collapse whitespace
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // 4. Final line-level filter — destroy any CSS/JS lines that survived
      result = result
        .split("\n")
        .filter((line: string) => {
          const t = line.trim();
          if (!t) return true; // keep blank lines for paragraph breaks
          // Drop lines containing CSS/JS block syntax
          if (t.includes("{") || t.includes("}")) return false;
          // Drop lines that look like CSS properties: "property: value;"
          if (/^[a-z-]+\s*:\s*.+;$/i.test(t)) return false;
          // Drop lines with CSS selectors: ".class", "#id", "tag:pseudo"
          if (/^[.#][\w-]+|^\w+:(?:hover|focus|active|nth|first|last|before|after)/.test(t)) return false;
          // Drop lines with @-rules: @keyframes, @media, @import
          if (/^@(?:keyframes|media|import|font-face|charset|supports)\b/.test(t)) return false;
          // Drop lines that are pure JS: assignments, function calls
          if (/^(?:var|let|const|function|return|if|else|for|while|switch)\b/.test(t)) return false;
          // Drop lines that are predominantly semicolons/symbols
          const symbolChars = (t.match(/[{};:=()[\]<>]/g) || []).length;
          if (t.length > 5 && symbolChars / t.length > 0.25) return false;
          return true;
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      return result.slice(0, 15000);
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
      const bodyTextMatch = html
        // Strip ALL non-content elements (same set as Playwright path)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/<canvas[\s\S]*?<\/canvas>/gi, "")
        .replace(/<video[\s\S]*?<\/video>/gi, "")
        .replace(/<audio[\s\S]*?<\/audio>/gi, "")
        .replace(/<object[\s\S]*?<\/object>/gi, "")
        .replace(/<embed[\s\S]*?<\/embed>/gi, "")
        .replace(/<template[\s\S]*?<\/template>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<link[^>]*>/gi, "")
        // Strip all HTML tags, keeping only text
        .replace(/<[^>]+>/g, " ")
        // ── JS cleanup: IIFEs, Tilda functions, Next.js, Webpack ──
        .replace(/!function\s*\([^)]*\)\s*\{[\s\S]{0,2000}?\}/g, " ")
        .replace(/\(function\s*\([^)]*\)\s*\{[\s\S]{0,2000}?\}\)/g, " ")
        .replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{0,2000}?\}/g, " ")
        .replace(/var\s+__[A-Z_]+=[\s\S]{0,1000}?;/g, " ")
        .replace(/\(self\.__next_f=self\.__next_f[\s\S]{0,1000}?\)/g, " ")
        .replace(/self\.__next_f\.push[\s\S]{0,1000}?\)/g, " ")
        // Tilda-specific patterns
        .replace(/\bt_\w+_init\b[^.]*?\./g, " ")
        .replace(/\bt\d{3,}[_.][\w.]+/g, " ")
        .replace(/\.t-[\w-]+/g, " ")
        .replace(/\$\(\s*["'][^"']+["']\s*\)[^;]{0,200};/g, " ")
        // Stray JSON objects
        .replace(/\{(?:"[\w]+":\s*(?:"[^"]*"|[\d.]+|true|false|null|(?:\{[^}]*\}))\s*,?\s*){3,}\}/g, " ")
        // CSS property blocks: display:flex;justify-content:center;…
        .replace(/(?:[a-z-]+\s*:\s*[^;]{1,40};\s*){2,}/gi, " ")
        // Stray curly brace blocks
        .replace(/\{[^}]{0,300}\}/g, " ")
        // JS keywords followed by code
        .replace(/\b(?:var|let|const|return|typeof|undefined|window\.|document\.)\b[^.!?\n]{0,100}/g, " ")
        // data-* attributes that leaked
        .replace(/data-[\w-]+=["'][^"']*["']/g, " ")
        // Base64 data URIs
        .replace(/data:[a-z]+\/[a-z+.-]+;base64,[A-Za-z0-9+/=]{20,}/g, " ")
        // Long hex/hash strings
        .replace(/[0-9a-f]{20,}/gi, " ")
        // Collapse whitespace
        .replace(/\s+/g, " ")
        .trim();

      // Line-level filter — destroy any CSS/JS lines that survived
      const bodyTextCleaned = bodyTextMatch
        .split(/\.\s+/)
        .filter((sentence: string) => {
          const t = sentence.trim();
          if (!t || t.length < 3) return false;
          if (t.includes("{") || t.includes("}")) return false;
          if (/^[a-z-]+\s*:\s*.+;$/i.test(t)) return false;
          if (/^@(?:keyframes|media|import|font-face)\b/.test(t)) return false;
          if (/^(?:var|let|const|function|return|if|else|for|while)\b/.test(t)) return false;
          const symbolChars = (t.match(/[{};:=()[\]<>]/g) || []).length;
          if (t.length > 5 && symbolChars / t.length > 0.25) return false;
          return true;
        })
        .join(". ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 15000);

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
