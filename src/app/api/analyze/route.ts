import { NextRequest, NextResponse } from "next/server";
import { extractJson, repairJson, normalizeUrl } from "@/lib/json-utils";

// ─── Типы ────────────────────────────────────────────────
interface AnalysisResponse {
  summary: string;
  pros: string[];
  cons: string[];
  score: number;
  url: string;
}

// ─── Бесплатные модели (fallback chain) ──────────────────
const FREE_MODELS = [
  "stepfun/step-3.5-flash:free",
  "qwen/qwen3-4b:free",
];

// ─── POST /api/analyze ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key не настроен на сервере" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { url?: string };
    if (!body.url || body.url.trim().length < 3) {
      return NextResponse.json(
        { error: "Введите корректный URL" },
        { status: 400 }
      );
    }

    const url = normalizeUrl(body.url);
    const domain = new URL(url).hostname.replace(/^www\./, "");

    // Пробуем модели по очереди (fallback chain)
    let lastError: unknown = null;

    const systemPrompt = `You are a GEO (Generative Engine Optimization) expert. You analyze websites for their visibility in AI search engines (ChatGPT, Perplexity, Claude, Gemini).

Given a website URL and domain, provide a quick AI-visibility audit.

ALWAYS return ONLY valid JSON (no markdown, no explanations outside JSON) in this exact format:
{
  "summary": "2-3 sentence overview of the site's AI visibility in Russian",
  "pros": ["strength 1 in Russian", "strength 2 in Russian", "strength 3 in Russian"],
  "cons": ["weakness 1 in Russian", "weakness 2 in Russian", "weakness 3 in Russian"],
  "score": 65
}

Rules:
- summary: Brief assessment in Russian, 2-3 sentences
- pros: 2-4 strengths (things site does well for AI visibility), in Russian
- cons: 2-4 weaknesses (things to improve), in Russian
- score: integer 0-100 representing AI visibility score
- Be specific to the domain/brand, not generic
- All text must be in Russian`;

    const userPrompt = `Analyze the AI visibility of this website:
URL: ${url}
Domain: ${domain}

Consider these aspects:
1. Would AI assistants like ChatGPT or Perplexity likely recommend this brand?
2. Does this domain likely have Schema.org markup, /llms.txt, or other AI-friendly features?
3. How strong is the brand's online authority for AI citations?
4. What are the likely strengths and weaknesses for GEO?

Return the JSON analysis.`;

    for (const model of FREE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "GEO SaaS",
          },
          body: JSON.stringify({
            model,
            max_tokens: 2000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.error(`[Analyze] Model ${model} returned ${response.status}:`, errBody);

          // При rate limit — ждём и пробуем ту же модель ещё раз
          if (response.status === 429) {
            console.log(`[Analyze] Rate limited on ${model}, waiting 3s and retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const retry = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "GEO SaaS",
              },
              body: JSON.stringify({
                model,
                max_tokens: 2000,
                messages: [
                  {
                    role: "system",
                    content: systemPrompt,
                  },
                  {
                    role: "user",
                    content: userPrompt,
                  },
                ],
              }),
            });
            if (retry.ok) {
              const retryData = await retry.json();
              const retryText = retryData.choices?.[0]?.message?.content ?? "";
              if (retryText) {
                const retryJsonStr = extractJson(retryText);
                const retryRepaired = repairJson(retryJsonStr);
                const retryParsed = JSON.parse(retryRepaired) as AnalysisResponse;
                if (typeof retryParsed.summary === "string" && Array.isArray(retryParsed.pros)) {
                  retryParsed.score = Math.max(0, Math.min(100, Math.round(retryParsed.score)));
                  retryParsed.url = domain;
                  return NextResponse.json(retryParsed);
                }
              }
            }
          }

          lastError = new Error(`${model}: HTTP ${response.status}`);
          continue; // Пробуем следующую модель
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content ?? "";

        if (!rawText) {
          lastError = new Error(`${model}: пустой ответ`);
          continue;
        }

        const jsonStr = extractJson(rawText);
        const repaired = repairJson(jsonStr);
        const parsed = JSON.parse(repaired) as AnalysisResponse;

        // Валидация базовой структуры
        if (
          typeof parsed.summary !== "string" ||
          !Array.isArray(parsed.pros) ||
          !Array.isArray(parsed.cons) ||
          typeof parsed.score !== "number"
        ) {
          lastError = new Error(`${model}: невалидная структура JSON`);
          continue;
        }

        // Нормализуем score
        parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
        parsed.url = domain;

        return NextResponse.json(parsed);
      } catch (err) {
        console.error(`[Analyze] Ошибка с моделью ${model}:`, err);
        lastError = err;
        continue;
      }
    }

    // Все модели провалились
    console.error("[Analyze] Все модели недоступны, последняя ошибка:", lastError);
    return NextResponse.json(
      { error: "AI-модели временно недоступны. Попробуйте через минуту." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[Analyze] Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
