/**
 * OpenRouter LLM Service — взаимодействие с ИИ-моделями через OpenRouter.
 *
 * Используем openai SDK с baseURL OpenRouter:
 * - Claude (anthropic/claude-sonnet-4) — генерация ключевых запросов и рекомендаций
 * - Perplexity Sonar (perplexity/sonar) — проверка Share of Voice (поиск в интернете)
 */

import OpenAI from "openai";
import { z } from "zod";
import type { SiteData } from "./scraper";
import { extractJson, repairJson } from "../lib/json-utils";

// ─── OpenRouter Client (lazy init — ждём загрузки .env) ──
let _openrouter: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_openrouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return _openrouter;
}

// ─── Модели ─────────────────────────────────────────────
const CLAUDE_MODEL = "anthropic/claude-opus-4.6";
const SONAR_MODEL = "perplexity/sonar-pro-search";
const CLAUDE_SONNET_MODEL = "anthropic/claude-sonnet-4.6";

// Multi-LLM модели для SoV-проверки
export const MULTI_LLM_MODELS = [
  { id: SONAR_MODEL, name: "Perplexity" },
  { id: CLAUDE_MODEL, name: "Claude Opus" },
  { id: CLAUDE_SONNET_MODEL, name: "Claude Sonnet" },
];

// Бесплатные fallback-модели (если закончились кредиты)
const FREE_FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3-4b:free",
];

// ─── Кэш топ-модели (обновляется раз в час) ────────────
let _cachedTopModel: string | null = null;
let _cachedTopModelTimestamp = 0;
const TOP_MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 час

/**
 * Запрашивает список моделей у OpenRouter и возвращает ID самой
 * «топовой» текстовой модели за последнюю неделю.
 * Сортируем по дате создания (новейшие), фильтруем: text->text, платные,
 * контекст >= 32k, не :free, не роутеры.
 */
async function fetchTopModel(): Promise<string | null> {
  // Проверяем кэш
  if (_cachedTopModel && Date.now() - _cachedTopModelTimestamp < TOP_MODEL_CACHE_TTL) {
    console.log(`[LLM] 📦 Используем кэшированную топ-модель: ${_cachedTopModel}`);
    return _cachedTopModel;
  }

  try {
    console.log("[LLM] 🌐 Запрашиваю список моделей у OpenRouter...");
    const resp = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!resp.ok) {
      console.error(`[LLM] ❌ OpenRouter /models вернул ${resp.status}`);
      return null;
    }

    const json = await resp.json();
    const models: Array<{
      id: string;
      name: string;
      created: number;
      context_length: number;
      architecture: { modality: string; input_modalities: string[]; output_modalities: string[] };
      pricing: { prompt: string; completion: string };
    }> = json.data ?? [];

    // Фильтруем: текстовые, платные, контекст >= 32k, не :free, не роутеры/специальные
    const oneWeekAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
    const excludePatterns = [
      "openrouter/", "switchpoint/", "relace/", "bodybuilder",
      "llama-guard", ":free", "deep-research", "search-preview",
    ];

    const candidates = models.filter((m) => {
      // Только текст в выходе
      if (!m.architecture?.output_modalities?.includes("text")) return false;
      // Контекст >= 32k
      if (m.context_length < 32000) return false;
      // Не бесплатные
      const promptPrice = parseFloat(m.pricing?.prompt ?? "0");
      if (promptPrice <= 0) return false;
      // Не роутеры/специальные
      if (excludePatterns.some((p) => m.id.toLowerCase().includes(p))) return false;
      // Не слишком дорогие (< $0.01 per 1k input tokens, т.е. < 0.00001 per token)
      if (promptPrice > 0.00001) return false;
      return true;
    });

    // Сортируем: новейшие (за последнюю неделю) + разумная цена
    const recentModels = candidates.filter((m) => m.created >= oneWeekAgo);
    const pool = recentModels.length >= 3 ? recentModels : candidates.slice(0, 20);

    // Выбираем лучшую: самую новую с хорошим контекстом
    pool.sort((a, b) => b.created - a.created);

    if (pool.length === 0) {
      console.log("[LLM] ⚠️ Не нашлось подходящих топ-моделей");
      return null;
    }

    const topModel = pool[0].id;
    _cachedTopModel = topModel;
    _cachedTopModelTimestamp = Date.now();
    console.log(`[LLM] 🏆 Топ-модель недели: ${topModel} (${pool[0].name})`);
    return topModel;
  } catch (err) {
    console.error("[LLM] ❌ Ошибка при получении списка моделей:", err);
    return null;
  }
}

// ─── Zod Схемы ──────────────────────────────────────────
const KeywordsSchema = z.object({
  keywords: z
    .array(
      z.object({
        query: z.string(),
        intent: z.string(),
      })
    )
    .min(1)
    .max(10),
});

const SovResultSchema = z.object({
  categorySearched: z.string(),
  isMentioned: z.boolean(),
  mentionContext: z.string().optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  competitors: z.array(
    z.object({
      name: z.string(),
      url: z.string().optional(),
      rank: z.number().optional(),
    })
  ).min(1),
});

const RecommendationsSchema = z.object({
  overallScore: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    sov: z.number().min(0).max(100),
    schema: z.number().min(0).max(100),
    llmsTxt: z.number().min(0).max(100),
    content: z.number().min(0).max(100),
    authority: z.number().min(0).max(100),
  }),
  recommendations: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      description: z.string(),
      generatedCode: z.string(),
    })
  ),
});

const DigitalPrSchema = z.object({
  mentions: z.array(
    z.object({
      platform: z.string(),
      mentioned: z.boolean(),
      url: z.string().optional(),
      context: z.string(),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    })
  ),
});

// ─── Типы ────────────────────────────────────────────────
export interface DigitalPrMention {
  platform: string;
  mentioned: boolean;
  url?: string;
  context: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface KeywordItem {
  query: string;
  intent: string;
}

export interface SovCheckResult {
  keyword: string;
  llmProvider: string;
  isMentioned: boolean;
  mentionContext: string;
  sentiment?: "positive" | "neutral" | "negative";
  categorySearched?: string;
  competitors: { name: string; url?: string; rank?: number }[];
}

export interface RecommendationItem {
  type: string;
  title: string;
  description: string;
  generatedCode: string;
}

export interface AnalysisResult {
  overallScore: number;
  scoreBreakdown: {
    sov: number;
    schema: number;
    llmsTxt: number;
    content: number;
    authority: number;
  };
  recommendations: RecommendationItem[];
}

// ─── Утилита: вызов LLM с fallback на бесплатные модели при 402 ───
// Обёртка с таймаутом для любого промиса
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

const API_TIMEOUT = 180_000; // 180 секунд — Sonar Pro Search делает multi-step

async function callWithFallback(
  messages: { role: "system" | "user"; content: string }[],
  maxTokens: number,
  primaryModel: string = CLAUDE_MODEL
): Promise<string> {
  // Пробуем основную модель
  try {
    const completion = await withTimeout(
      getClient().chat.completions.create({
        model: primaryModel,
        max_tokens: maxTokens,
        messages,
      }),
      API_TIMEOUT,
      primaryModel
    );
    return completion.choices[0]?.message?.content ?? "";
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.log(`[LLM] ⚠️ Ошибка на ${primaryModel} (status=${status}): ${errMsg}`);
    console.log(`[LLM] 🔄 Включаю авто-фоллбэк...`);
  }

  // Fallback 1: Пробуем топовую модель недели с OpenRouter
  try {
    const topModel = await fetchTopModel();
    if (topModel && topModel !== primaryModel) {
      console.log(`[LLM] 🏆 Пробую топ-модель: ${topModel}`);
      const completion = await withTimeout(
        getClient().chat.completions.create({
          model: topModel,
          max_tokens: maxTokens,
          messages,
        }),
        API_TIMEOUT,
        topModel
      );
      const text = completion.choices[0]?.message?.content ?? "";
      if (text) {
        console.log(`[LLM] ✅ Топ-модель ${topModel} справилась!`);
        return text;
      }
    }
  } catch (topErr: unknown) {
    const errMsg = topErr instanceof Error ? topErr.message : String(topErr);
    console.log(`[LLM] ⚠️ Топ-модель тоже не сработала: ${errMsg}`);
  }

  // Fallback 2: пробуем бесплатные модели
  for (const freeModel of FREE_FALLBACK_MODELS) {
    try {
      console.log(`[LLM] 🔄 Пробую бесплатную модель: ${freeModel}`);
      const resp = await withTimeout(
        fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "GEO SaaS",
          },
          body: JSON.stringify({
            model: freeModel,
            max_tokens: maxTokens,
            messages,
          }),
        }),
        API_TIMEOUT,
        freeModel
      );

      if (resp.status === 429) {
        console.log(`[LLM] ⏳ Rate limit на ${freeModel}, жду 3с...`);
        await new Promise((r) => setTimeout(r, 3000));
        const retry = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "GEO SaaS",
          },
          body: JSON.stringify({ model: freeModel, max_tokens: maxTokens, messages }),
        });
        if (retry.ok) {
          const data = await retry.json();
          const text = data.choices?.[0]?.message?.content ?? "";
          if (text) return text;
        }
        continue;
      }

      if (!resp.ok) {
        console.error(`[LLM] ❌ ${freeModel} вернул ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      if (text) return text;
    } catch (err) {
      console.error(`[LLM] ❌ Ошибка на ${freeModel}:`, err);
      continue;
    }
  }

  throw new Error("Все модели недоступны (платные — 402, бесплатные — ошибка)");
}

// ═══════════════════════════════════════════════════════════
// 1. Генерация ключевых запросов
// ═══════════════════════════════════════════════════════════
export async function generateKeywords(siteData: SiteData): Promise<KeywordItem[]> {
  console.log(`[LLM] 🔑 Генерирую ключевые запросы для ${siteData.url}`);

  try {
    const rawText = await callWithFallback(
      [
        {
          role: "system",
          content: `You are an SEO and GEO (Generative Engine Optimization) expert. 
Your task is to generate search queries that a potential customer might ask an AI assistant (ChatGPT, Perplexity, Claude) when looking for a product or service like the one on this website.

Return ONLY valid JSON, no explanations or markdown.`,
        },
        {
          role: "user",
          content: `Analyze this website and generate 5 search queries:

URL: ${siteData.url}
Title: ${siteData.title}
Description: ${siteData.description}
H1: ${siteData.h1}
Content (first 15000 chars): ${siteData.bodyText.slice(0, 15000)}

Return JSON in this exact format:
{
  "keywords": [
    { "query": "best [category] tools in 2025", "intent": "informational" },
    { "query": "what is the best [specific solution]", "intent": "commercial" }
  ]
}

Generate exactly 5 diverse queries: mix of informational, commercial, and navigational intent.`,
        },
      ],
      1000,
      CLAUDE_MODEL
    );

    const jsonStr = extractJson(rawText);
    const parsed = KeywordsSchema.parse(JSON.parse(jsonStr));

    console.log(`[LLM] ✅ Сгенерировано ${parsed.keywords.length} ключевых запросов`);
    return parsed.keywords;
  } catch (error) {
    console.error("[LLM] ❌ Ошибка генерации ключевых слов:", error);
    // Fallback: базовые запросы
    const domain = new URL(siteData.url).hostname.replace("www.", "");
    return [
      { query: `what is ${domain}`, intent: "navigational" },
      { query: `${siteData.title} reviews`, intent: "commercial" },
      { query: `best alternatives to ${domain}`, intent: "commercial" },
      { query: siteData.h1 || siteData.title || domain, intent: "informational" },
      { query: `is ${domain} worth it`, intent: "commercial" },
    ];
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Проверка Share of Voice (через Perplexity Sonar)
// ═══════════════════════════════════════════════════════════
export async function checkShareOfVoice(
  keyword: string,
  siteUrl: string
): Promise<SovCheckResult> {
  console.log(`[LLM] 🔍 SoV проверка: "${keyword}"`);

  const domain = new URL(siteUrl).hostname.replace("www.", "");

  try {
    const rawText = await callWithFallback(
      [
        {
          role: "system",
          content: `You are a helpful AI assistant. The user asks a question. You must:

1. Identify the category/niche the question relates to.
2. Answer the question naturally, recommending the top 5-10 best services/products/companies in this niche. Be specific — list REAL companies with real URLs.
3. After answering, self-analyze: did you mention "${domain}" in your recommendations?
4. If you mentioned "${domain}", evaluate the sentiment of your mention (positive/neutral/negative).

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "categorySearched": "the niche/category you identified (e.g. 'SEO-оптимизация', 'CRM-системы')",
  "isMentioned": true/false,
  "mentionContext": "exact sentence where you mentioned ${domain}, or empty string if not mentioned",
  "sentiment": "positive" | "neutral" | "negative",
  "competitors": [
    { "name": "Company Name", "url": "https://example.com", "rank": 1 },
    { "name": "Another Company", "url": "https://another.com", "rank": 2 }
  ]
}

CRITICAL RULES:
- "competitors" MUST contain 5-10 REAL companies/services that are actual leaders in this niche
- Each competitor MUST have a "rank" (1 = top recommendation)
- Include "${domain}" in competitors list if you would genuinely recommend it
- "isMentioned" = true ONLY if "${domain}" appears in your competitors list
- If "isMentioned" is false, "sentiment" should be omitted or null
- Be honest — do not fabricate mentions. If you don't know "${domain}", say so.`,
        },
        {
          role: "user",
          content: keyword,
        },
      ],
      1500,
      SONAR_MODEL
    );

    const jsonStr = extractJson(rawText);

    try {
      const parsed = SovResultSchema.parse(JSON.parse(jsonStr));

      // Programmatic verification — не доверяем LLM self-reporting
      const lowerDomain = domain.toLowerCase();
      const actuallyMentioned = parsed.competitors.some(
        (c) =>
          c.name.toLowerCase().includes(lowerDomain) ||
          (c.url && c.url.toLowerCase().includes(lowerDomain))
      );

      const isMentioned = actuallyMentioned || parsed.isMentioned;

      console.log(
        `[LLM] ${isMentioned ? "✅" : "❌"} "${keyword}" → category: "${parsed.categorySearched}", mentioned: ${isMentioned}${actuallyMentioned !== parsed.isMentioned ? ` (corrected from ${parsed.isMentioned})` : ""}, competitors: ${parsed.competitors.length}${parsed.sentiment ? `, sentiment: ${parsed.sentiment}` : ""}`
      );
      return {
        keyword,
        llmProvider: "perplexity-sonar",
        isMentioned,
        mentionContext: parsed.mentionContext ?? "",
        sentiment: parsed.sentiment ?? undefined,
        categorySearched: parsed.categorySearched,
        competitors: parsed.competitors,
      };
    } catch {
      // Если JSON не парсится, пробуем определить по тексту
      const lowerText = rawText.toLowerCase();
      const lowerDomain = domain.toLowerCase();
      const isMentioned = lowerText.includes(lowerDomain);

      console.log(
        `[LLM] ⚠️ JSON не парсится, fallback текстовый анализ: mentioned=${isMentioned}`
      );
      return {
        keyword,
        llmProvider: "perplexity-sonar",
        isMentioned,
        mentionContext: isMentioned ? rawText.slice(0, 200) : "",
        competitors: [],
      };
    }
  } catch (error) {
    console.error(`[LLM] ❌ Ошибка SoV для "${keyword}":`, error);
    return {
      keyword,
      llmProvider: "perplexity-sonar",
      isMentioned: false,
      mentionContext: "",
      competitors: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 2b. Multi-LLM проверка SoV (через несколько моделей)
// ═══════════════════════════════════════════════════════════
export async function checkShareOfVoiceMultiLlm(
  keyword: string,
  siteUrl: string
): Promise<SovCheckResult[]> {
  console.log(`[LLM] 🔍 Multi-LLM SoV проверка: "${keyword}"`);

  const results: SovCheckResult[] = [];
  const domain = new URL(siteUrl).hostname.replace("www.", "");

  for (const model of MULTI_LLM_MODELS) {
    try {
      const rawText = await callWithFallback(
        [
          {
            role: "system",
            content: `You are a helpful AI assistant. The user asks a question. You must:

1. Identify the category/niche the question relates to.
2. Answer the question naturally, recommending the top 5-10 best services/products/companies in this niche. Be specific — list REAL companies with real URLs.
3. After answering, self-analyze: did you mention "${domain}" in your recommendations?
4. If you mentioned "${domain}", evaluate the sentiment of your mention (positive/neutral/negative).

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "categorySearched": "the niche/category you identified",
  "isMentioned": true/false,
  "mentionContext": "exact sentence where you mentioned ${domain}, or empty string",
  "sentiment": "positive" | "neutral" | "negative",
  "competitors": [
    { "name": "Company Name", "url": "https://example.com", "rank": 1 }
  ]
}

CRITICAL RULES:
- "competitors" MUST contain 5-10 REAL companies that are actual leaders in this niche
- Each competitor MUST have a "rank" (1 = top recommendation)
- Include "${domain}" in competitors list if you would genuinely recommend it
- "isMentioned" = true ONLY if "${domain}" appears in your competitors list
- Be honest — do not fabricate mentions.`,
          },
          {
            role: "user",
            content: keyword,
          },
        ],
        1500,
        model.id
      );

      const jsonStr = extractJson(rawText);

      try {
        const parsed = SovResultSchema.parse(JSON.parse(jsonStr));

        // Programmatic verification — не доверяем LLM self-reporting
        const lowerDomain = domain.toLowerCase();
        const actuallyMentioned = parsed.competitors.some(
          (c) =>
            c.name.toLowerCase().includes(lowerDomain) ||
            (c.url && c.url.toLowerCase().includes(lowerDomain))
        );

        const isMentioned = actuallyMentioned || parsed.isMentioned;

        console.log(
          `[LLM] ${isMentioned ? "✅" : "❌"} [${model.name}] "${keyword}" → category: "${parsed.categorySearched}", mentioned: ${isMentioned}${actuallyMentioned !== parsed.isMentioned ? ` (corrected from ${parsed.isMentioned})` : ""}`
        );
        results.push({
          keyword,
          llmProvider: model.name.toLowerCase(),
          isMentioned,
          mentionContext: parsed.mentionContext ?? "",
          sentiment: parsed.sentiment ?? undefined,
          categorySearched: parsed.categorySearched,
          competitors: parsed.competitors,
        });
      } catch {
        const lowerText = rawText.toLowerCase();
        const isMentioned = lowerText.includes(domain.toLowerCase());
        results.push({
          keyword,
          llmProvider: model.name.toLowerCase(),
          isMentioned,
          mentionContext: isMentioned ? rawText.slice(0, 200) : "",
          competitors: [],
        });
      }
    } catch (error) {
      console.error(`[LLM] ❌ Ошибка Multi-LLM SoV [${model.name}] для "${keyword}":`, error);
      results.push({
        keyword,
        llmProvider: model.name.toLowerCase(),
        isMentioned: false,
        mentionContext: "",
        competitors: [],
      });
    }

    // Пауза между моделями
    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════
// 3. Генерация рекомендаций и итогового Score
// ═══════════════════════════════════════════════════════════
export async function generateRecommendations(
  siteData: SiteData,
  sovResults: SovCheckResult[]
): Promise<AnalysisResult> {
  console.log(`[LLM] 📝 Генерирую рекомендации для ${siteData.url}`);

  const mentionedCount = sovResults.filter((r) => r.isMentioned).length;
  const totalChecks = sovResults.length;

  const allCompetitors = sovResults
    .flatMap((r) => r.competitors.map((c) => c.name))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 15);

  // Собираем уникальные категории из SoV
  const categories = sovResults
    .map((r) => r.categorySearched)
    .filter((v): v is string => !!v)
    .filter((v, i, a) => a.indexOf(v) === i);

  try {
    const systemContent = `You are a GEO (Generative Engine Optimization) expert. You help websites get recommended by AI assistants (ChatGPT, Perplexity, Claude, Gemini).

Analyze the website data and Share of Voice results, then provide:
1. An overall GEO score (0-100)
2. Actionable recommendations to improve AI visibility

Return ONLY valid JSON, no markdown or explanations.`;

    const userContent = `Analyze this website's AI visibility:

## Website Data
- URL: ${siteData.url}
- Title: ${siteData.title}
- Description: ${siteData.description}
- H1: ${siteData.h1}
- Has /llms.txt: ${siteData.hasLlmsTxt}
- Schema.org types: [${siteData.schemaOrgTypes.join(", ")}]
- robots.txt AI-friendly: ${siteData.robotsTxtAiFriendly}${siteData.robotsTxtBlockedBots.length > 0 ? ` (blocked bots: ${siteData.robotsTxtBlockedBots.join(", ")})` : ""}
- Semantic HTML valid: ${siteData.semanticHtmlValid} (main: ${siteData.semanticHtmlDetails.hasMain}, article: ${siteData.semanticHtmlDetails.hasArticle}, heading hierarchy OK: ${siteData.semanticHtmlDetails.headingHierarchyOk})
- Content preview: ${siteData.bodyText.slice(0, 15000)}

## Share of Voice Results
- Category/Niche identified: ${categories.join(", ") || "unknown"}
- Mentioned in ${mentionedCount} out of ${totalChecks} AI searches
- Top competitors AI recommends: [${allCompetitors.join(", ")}]
- Detailed results:
${sovResults.map((r) => `  - "${r.keyword}" (category: ${r.categorySearched ?? "?"}): ${r.isMentioned ? `✅ mentioned (sentiment: ${r.sentiment ?? "n/a"})` : "❌ not mentioned"}, competitors: [${r.competitors.map(c => c.name).join(", ")}]`).join("\n")}

Return JSON in this exact format:
{
  "overallScore": 65,
  "scoreBreakdown": {
    "sov": 40,
    "schema": 70,
    "llmsTxt": 0,
    "content": 60,
    "authority": 55
  },
  "recommendations": [
    {
      "type": "schema-org",
      "title": "Add FAQ Schema markup",
      "description": "Adding FAQ structured data helps AI assistants find and cite your answers directly.",
      "generatedCode": "<script type=\\"application/ld+json\\">...</script>"
    }
  ]
}

scoreBreakdown rules (each 0-100):
- sov: based on mention ratio (${mentionedCount}/${totalChecks})
- schema: 0 if no Schema.org, 50-100 based on richness
- llmsTxt: 0 if missing, 80-100 if present
- content: based on content quality, length, clarity, semantic HTML, and robots.txt friendliness
- authority: estimated brand authority for AI citations

Recommendation types: "schema-org", "schema-faq", "content", "rag-content", "technical", "llms-txt", "authority", "competitors", "robots-txt", "semantic-html", "semantic-tables", "entity", "platform-seeding", "sentiment".
Type descriptions (use every relevant type):
- schema-faq: FAQPage / HowTo schema markup for AI answer extraction
- rag-content: Chunked, paragraph-level content that RAG pipelines can easily retrieve
- semantic-tables: Comparison tables and data tables that LLMs cite in responses
- entity: Named entity consistency, Knowledge Graph presence, Wikidata alignment
- platform-seeding: Presence on AI-indexed platforms (Wikipedia, GitHub, Reddit, HuggingFace)
- sentiment: Positive brand sentiment signals AI models use for ranking
Generate 6-12 specific, actionable recommendations in Russian with real code examples where applicable. Cover as many different types as possible.
All recommendation titles and descriptions must be in Russian.
${!siteData.robotsTxtAiFriendly ? `IMPORTANT: robots.txt blocks AI bots (${siteData.robotsTxtBlockedBots.join(", ")}). Include a recommendation about this.` : ""}
${!siteData.semanticHtmlValid ? `IMPORTANT: Semantic HTML issues found (missing <main>/<article>, heading hierarchy problems). Include a recommendation about this.` : ""}
The overallScore should be a weighted average of scoreBreakdown components.`;

    const rawText = await callWithFallback(
      [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      2000,
      CLAUDE_MODEL
    );

    const jsonStr = extractJson(rawText);
    let jsonFixed = jsonStr;
    try {
      JSON.parse(jsonFixed);
    } catch {
      jsonFixed = repairJson(jsonFixed);
    }
    const parsed = RecommendationsSchema.parse(JSON.parse(jsonFixed));

    console.log(
      `[LLM] ✅ Score: ${parsed.overallScore}, рекомендаций: ${parsed.recommendations.length}`
    );
    return parsed;
  } catch (error) {
    console.error("[LLM] ❌ Ошибка генерации рекомендаций:", error);

    // Fallback: базовый скоринг и рекомендации
    const sovPct = Math.round((mentionedCount / Math.max(totalChecks, 1)) * 100);
    const schemaPct = siteData.schemaOrgTypes.length > 0 ? 60 : 0;
    const llmsPct = siteData.hasLlmsTxt ? 80 : 0;
    const contentPct = siteData.bodyText.length > 1000 ? 60 : siteData.bodyText.length > 500 ? 40 : 15;
    const authorityPct = sovPct > 50 ? 50 : sovPct > 0 ? 30 : 10;
    const fallbackScore = Math.min(
      Math.round(sovPct * 0.3 + schemaPct * 0.2 + llmsPct * 0.15 + contentPct * 0.2 + authorityPct * 0.15),
      100
    );

    const fallbackBreakdown = {
      sov: sovPct,
      schema: schemaPct,
      llmsTxt: llmsPct,
      content: contentPct,
      authority: authorityPct,
    };

    const fallbackRecs: RecommendationItem[] = [];

    if (!siteData.hasLlmsTxt) {
      fallbackRecs.push({
        type: "llms-txt",
        title: "Создайте файл /llms.txt для AI-ботов",
        description:
          "Добавьте файл /llms.txt в корень сайта, чтобы AI-ассистенты могли понять ваш бренд и предложения. Это новый стандарт для AI-дружественных сайтов.",
        generatedCode: `# ${siteData.title}\n> ${siteData.description}\n\nЭтот файл содержит информацию о нашем сайте для AI-ассистентов.`,
      });
    }

    if (siteData.schemaOrgTypes.length === 0) {
      fallbackRecs.push({
        type: "schema-org",
        title: "Добавьте разметку Schema.org (JSON-LD)",
        description:
          "Внедрите структурированные данные JSON-LD (Organization, FAQPage, Product), чтобы AI-системы лучше понимали ваш контент и цитировали его в ответах.",
        generatedCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${siteData.title}",\n  "url": "${siteData.url}"\n}\n</script>`,
      });
    }

    if (mentionedCount === 0) {
      fallbackRecs.push({
        type: "authority",
        title: "Повысьте авторитетность бренда для AI-цитирования",
        description:
          "Ваш бренд не упоминается ни в одном AI-результате. Сосредоточьтесь на создании авторитетного, хорошо цитируемого контента, на который AI-системы будут ссылаться.",
        generatedCode: "",
      });
    }

    // --- Additional GEO-specific fallback recommendations ---

    fallbackRecs.push({
      type: "schema-faq",
      title: "Добавьте FAQPage Schema для AI-извлечения ответов",
      description:
        "Разметка FAQPage позволяет AI-моделям мгновенно находить пары вопрос-ответ на вашем сайте и цитировать их. Добавьте минимум 5 часто задаваемых вопросов.",
      generatedCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Что такое ${siteData.title}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${siteData.description || 'Описание вашего продукта/услуги'}"
      }
    }
  ]
}
</script>`,
    });

    fallbackRecs.push({
      type: "rag-content",
      title: "Оптимизируйте контент для RAG-пайплайнов",
      description:
        "AI-модели используют Retrieval-Augmented Generation (RAG) для поиска релевантных фрагментов. Разбейте длинные страницы на семантические параграфы (150-300 слов) с чёткими заголовками, чтобы повысить точность извлечения.",
      generatedCode: `<!-- Пример RAG-оптимизированной структуры -->
<article>
  <section id="что-это">
    <h2>Что такое ${siteData.title}?</h2>
    <p>Чёткий ответ в 2-3 предложениях, который AI может процитировать целиком.</p>
  </section>
  <section id="преимущества">
    <h2>Ключевые преимущества</h2>
    <p>Каждый параграф — один факт. Идеально для чанкинга.</p>
  </section>
</article>`,
    });

    fallbackRecs.push({
      type: "entity",
      title: "Укрепите сущность бренда в Knowledge Graph",
      description:
        "AI-модели опираются на Knowledge Graph и Wikidata при формировании ответов. Убедитесь, что название бренда, описание и ключевые атрибуты одинаковы во всех источниках: сайт, Google My Business, Wikipedia, Crunchbase.",
      generatedCode: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${siteData.title}",
  "url": "${siteData.url}",
  "sameAs": [
    "https://www.wikidata.org/wiki/QXXXXX",
    "https://www.crunchbase.com/organization/ваш-бренд",
    "https://github.com/ваш-бренд"
  ]
}
</script>`,
    });

    fallbackRecs.push({
      type: "semantic-tables",
      title: "Добавьте сравнительные таблицы для AI-цитирования",
      description:
        "LLM-модели часто цитируют данные из таблиц при ответах на сравнительные вопросы. Добавьте HTML-таблицы со сравнением характеристик, цен или функциональности.",
      generatedCode: `<table>
  <caption>Сравнение тарифов ${siteData.title}</caption>
  <thead>
    <tr><th>Функция</th><th>Бесплатный</th><th>Про</th><th>Бизнес</th></tr>
  </thead>
  <tbody>
    <tr><td>Отчёты в месяц</td><td>3</td><td>30</td><td>Безлимит</td></tr>
    <tr><td>AI-анализ</td><td>Базовый</td><td>Глубокий</td><td>Enterprise</td></tr>
  </tbody>
</table>`,
    });

    fallbackRecs.push({
      type: "platform-seeding",
      title: "Разместите бренд на AI-индексируемых платформах",
      description:
        "AI-модели обучаются на данных из Wikipedia, Reddit, GitHub, StackOverflow и HuggingFace. Создайте страницу бренда на этих платформах с актуальной информацией и ссылками.",
      generatedCode: "",
    });

    fallbackRecs.push({
      type: "sentiment",
      title: "Управляйте тональностью упоминаний бренда",
      description:
        "AI-модели учитывают тональность при ранжировании рекомендаций. Мониторьте упоминания бренда, отвечайте на негативные отзывы и генерируйте позитивный контент: кейсы, отзывы клиентов, пресс-релизы.",
      generatedCode: "",
    });

    if (!siteData.semanticHtmlValid) {
      fallbackRecs.push({
        type: "semantic-html",
        title: "Исправьте семантическую HTML-структуру",
        description:
          "AI-модели лучше извлекают информацию из страниц с правильной семантической разметкой: <main>, <article>, <section>, иерархия заголовков H1→H2→H3. Это повышает точность чанкинга при RAG-индексации.",
        generatedCode: `<main>\n  <article>\n    <h1>Заголовок страницы</h1>\n    <section>\n      <h2>Раздел</h2>\n      <p>Контент раздела...</p>\n    </section>\n  </article>\n</main>`,
      });
    }

    if (!siteData.robotsTxtAiFriendly) {
      fallbackRecs.push({
        type: "robots-txt",
        title: "Откройте robots.txt для AI-ботов",
        description:
          `Ваш robots.txt блокирует AI-краулеры (${siteData.robotsTxtBlockedBots?.join(", ") || "GPTBot, ClaudeBot"}). Это критическая проблема — AI-поисковики не могут индексировать ваш сайт.`,
        generatedCode: `# Разрешить AI-ботам\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /`,
      });
    }

    return {
      overallScore: fallbackScore,
      scoreBreakdown: fallbackBreakdown,
      recommendations: fallbackRecs,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 4. Digital PR — проверка упоминаний бренда на площадках
// ═══════════════════════════════════════════════════════════
const DIGITAL_PR_PLATFORMS = [
  "vc.ru",
  "habr.com",
  "pikabu.ru",
  "otzovik.com",
  "yandex.ru/maps",
  "2gis.ru",
];

export async function checkDigitalPr(
  siteUrl: string,
  brandName: string
): Promise<DigitalPrMention[]> {
  const domain = new URL(siteUrl).hostname.replace("www.", "");
  const platformsList = DIGITAL_PR_PLATFORMS.join(", ");

  console.log(`[LLM] 📰 Digital PR проверка для "${brandName}" (${domain})`);

  try {
    const rawText = await callWithFallback(
      [
        {
          role: "system",
          content: `You are an expert digital PR analyst specialising in the Russian-speaking (CIS) internet.
Your task is to find REAL, organic mentions of a brand on popular Russian community, review, and map platforms.

CRITICAL RULES:
- Search specifically for actual discussions, reviews, company profiles, threads, or posts mentioning the brand.
- Only report REAL mentions you can verify. Do NOT fabricate URLs or discussions.
- If you find no mentions on a platform, set "mentioned": false and explain briefly in Russian.
- For each real mention found, include the actual URL if possible.
- Evaluate the sentiment of each mention (positive/neutral/negative).
- All "context" values MUST be in Russian.

Return ONLY valid JSON, no markdown or extra text.`,
        },
        {
          role: "user",
          content: `Найди недавние органические обсуждения, отзывы, профили или упоминания бренда "${brandName}" (сайт: ${siteUrl}, домен: ${domain}) на этих площадках: ${platformsList}.

Для каждой площадки укажи, упоминается ли бренд, и дай краткий контекст на русском языке.

Return JSON in this exact format:
{
  "mentions": [
    {
      "platform": "vc.ru",
      "mentioned": true,
      "url": "https://vc.ru/...",
      "context": "Краткое описание обсуждения или упоминания",
      "sentiment": "positive"
    },
    {
      "platform": "otzovik.com",
      "mentioned": false,
      "url": "",
      "context": "Упоминания на Отзовике не найдены",
      "sentiment": "neutral"
    }
  ]
}

Return exactly ${DIGITAL_PR_PLATFORMS.length} entries, one per platform: ${platformsList}.`,
        },
      ],
      2000,
      SONAR_MODEL
    );

    const jsonStr = extractJson(rawText);
    let jsonFixed = jsonStr;
    try {
      JSON.parse(jsonFixed);
    } catch {
      jsonFixed = repairJson(jsonFixed);
    }
    const parsed = DigitalPrSchema.parse(JSON.parse(jsonFixed));

    const mentionedCount = parsed.mentions.filter((m) => m.mentioned).length;
    console.log(
      `[LLM] ✅ Digital PR: ${mentionedCount}/${parsed.mentions.length} площадок с упоминаниями`
    );

    return parsed.mentions;
  } catch (error) {
    console.error(`[LLM] ❌ Ошибка Digital PR для "${brandName}":`, error);
    // Fallback: все площадки без упоминаний
    return DIGITAL_PR_PLATFORMS.map((platform) => ({
      platform,
      mentioned: false,
      context: "Не удалось проверить площадку — повторите анализ позже",
    }));
  }
}
