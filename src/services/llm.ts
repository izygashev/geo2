/**
 * OpenRouter LLM Service — взаимодействие с ИИ-моделями через OpenRouter.
 *
 * Используем openai SDK с baseURL OpenRouter:
 * - Claude (anthropic/claude-sonnet-4) — генерация ключевых запросов и рекомендаций
 * - Perplexity Sonar (perplexity/sonar) — проверка Share of Voice (поиск в интернете)
 */

import OpenAI from "openai";
import { z } from "zod";
import type { SiteData } from "./scraper.js";
import { extractJson } from "../lib/json-utils.js";

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
const CLAUDE_MODEL = "anthropic/claude-sonnet-4";
const SONAR_MODEL = "perplexity/sonar";
const CHATGPT_MODEL = "openai/gpt-4o-mini";
const GEMINI_MODEL = "google/gemini-2.0-flash-001";

// Multi-LLM модели для SoV-проверки
export const MULTI_LLM_MODELS = [
  { id: SONAR_MODEL, name: "Perplexity" },
  { id: CHATGPT_MODEL, name: "ChatGPT" },
  { id: GEMINI_MODEL, name: "Gemini" },
];

// Бесплатные fallback-модели (если закончились кредиты)
const FREE_FALLBACK_MODELS = [
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3-4b:free",
];

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
  isMentioned: z.boolean(),
  mentionContext: z.string().optional(),
  competitors: z.array(
    z.object({
      name: z.string(),
      url: z.string().optional(),
    })
  ),
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

// ─── Типы ────────────────────────────────────────────────
export interface KeywordItem {
  query: string;
  intent: string;
}

export interface SovCheckResult {
  keyword: string;
  llmProvider: string;
  isMentioned: boolean;
  mentionContext: string;
  competitors: { name: string; url?: string }[];
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
async function callWithFallback(
  messages: { role: "system" | "user"; content: string }[],
  maxTokens: number,
  primaryModel: string = CLAUDE_MODEL
): Promise<string> {
  // Пробуем основную модель
  try {
    const completion = await getClient().chat.completions.create({
      model: primaryModel,
      max_tokens: maxTokens,
      messages,
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch (error: unknown) {
    const status = (error as { status?: number }).status;
    if (status === 402) {
      console.log(`[LLM] ⚠️ 402 на ${primaryModel}, переключаюсь на бесплатные модели...`);
    } else {
      throw error; // Другие ошибки — пробрасываем
    }
  }

  // Fallback: пробуем бесплатные модели
  for (const freeModel of FREE_FALLBACK_MODELS) {
    try {
      console.log(`[LLM] 🔄 Пробую бесплатную модель: ${freeModel}`);
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      });

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
Content (first 1500 chars): ${siteData.bodyText.slice(0, 1500)}

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
          content: `You are a helpful assistant that answers user queries. After answering, analyze your own response.

Return ONLY valid JSON with this structure:
{
  "isMentioned": true/false,
  "mentionContext": "brief context of how the site was mentioned, or empty string",
  "competitors": [
    { "name": "Competitor Name", "url": "https://example.com" }
  ]
}

- "isMentioned" = true if you mentioned or recommended "${domain}" in your answer
- "competitors" = other brands/products you mentioned (max 5)
- Return valid JSON only, no markdown`,
        },
        {
          role: "user",
          content: `${keyword}

After providing your answer, analyze it and return JSON indicating:
1. Whether you mentioned or recommended ${domain} (isMentioned)
2. List of other brands/competitors you mentioned (competitors)`,
        },
      ],
      1000,
      SONAR_MODEL
    );

    const jsonStr = extractJson(rawText);

    try {
      const parsed = SovResultSchema.parse(JSON.parse(jsonStr));
      console.log(
        `[LLM] ${parsed.isMentioned ? "✅" : "❌"} "${keyword}" → mentioned: ${parsed.isMentioned}, competitors: ${parsed.competitors.length}`
      );
      return {
        keyword,
        llmProvider: "perplexity-sonar",
        isMentioned: parsed.isMentioned,
        mentionContext: parsed.mentionContext ?? "",
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

  for (const model of MULTI_LLM_MODELS) {
    try {
      const domain = new URL(siteUrl).hostname.replace("www.", "");

      const rawText = await callWithFallback(
        [
          {
            role: "system",
            content: `You are a helpful assistant that answers user queries. After answering, analyze your own response.

Return ONLY valid JSON with this structure:
{
  "isMentioned": true/false,
  "mentionContext": "brief context of how the site was mentioned, or empty string",
  "competitors": [
    { "name": "Competitor Name", "url": "https://example.com" }
  ]
}

- "isMentioned" = true if you mentioned or recommended "${domain}" in your answer
- "competitors" = other brands/products you mentioned (max 5)
- Return valid JSON only, no markdown`,
          },
          {
            role: "user",
            content: `${keyword}

After providing your answer, analyze it and return JSON indicating:
1. Whether you mentioned or recommended ${domain} (isMentioned)
2. List of other brands/competitors you mentioned (competitors)`,
          },
        ],
        1000,
        model.id
      );

      const jsonStr = extractJson(rawText);

      try {
        const parsed = SovResultSchema.parse(JSON.parse(jsonStr));
        console.log(
          `[LLM] ${parsed.isMentioned ? "✅" : "❌"} [${model.name}] "${keyword}" → mentioned: ${parsed.isMentioned}`
        );
        results.push({
          keyword,
          llmProvider: model.name.toLowerCase(),
          isMentioned: parsed.isMentioned,
          mentionContext: parsed.mentionContext ?? "",
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
    .slice(0, 10);

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
- Content preview: ${siteData.bodyText.slice(0, 1000)}

## Share of Voice Results
- Mentioned in ${mentionedCount} out of ${totalChecks} AI searches
- Competitors found: [${allCompetitors.join(", ")}]
- Detailed results:
${sovResults.map((r) => `  - "${r.keyword}": ${r.isMentioned ? "✅ mentioned" : "❌ not mentioned"}`).join("\n")}

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
- content: based on content quality, length, clarity
- authority: estimated brand authority for AI citations

Recommendation types: "schema-org", "content", "technical", "llms-txt", "authority", "competitors".
Generate 4-7 specific, actionable recommendations in Russian with real code examples where applicable.
All recommendation titles and descriptions must be in Russian.
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
    const parsed = RecommendationsSchema.parse(JSON.parse(jsonStr));

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
        title: "Create /llms.txt file",
        description:
          "Add an /llms.txt file to your website root to help AI assistants understand your brand and offerings. This is a new standard for AI-friendly websites.",
        generatedCode: `# ${siteData.title}\n> ${siteData.description}\n\nThis file provides information about our website for AI assistants.`,
      });
    }

    if (siteData.schemaOrgTypes.length === 0) {
      fallbackRecs.push({
        type: "schema-org",
        title: "Add Schema.org structured data",
        description:
          "Implement JSON-LD structured data (Organization, FAQPage, Product) to help AI systems understand your content.",
        generatedCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "${siteData.title}",\n  "url": "${siteData.url}"\n}\n</script>`,
      });
    }

    if (mentionedCount === 0) {
      fallbackRecs.push({
        type: "authority",
        title: "Improve brand authority for AI citations",
        description:
          "Your brand was not mentioned in any AI search results. Focus on creating authoritative, well-cited content that AI systems are likely to reference.",
        generatedCode: "",
      });
    }

    return {
      overallScore: fallbackScore,
      scoreBreakdown: fallbackBreakdown,
      recommendations: fallbackRecs,
    };
  }
}
