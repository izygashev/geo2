import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import OpenAI from "openai";

// Rate limit: 5 content generations per minute per user (burst protection)
const GENERATE_RATE_LIMIT = { maxRequests: 5, windowSeconds: 60 };
// Daily cap: 30 generations per day per user (cost protection)
const GENERATE_DAILY_LIMIT = { maxRequests: 30, windowSeconds: 86400 };
// IP fallback: 10 per minute (protects against token-farm attacks)
const GENERATE_IP_LIMIT = { maxRequests: 10, windowSeconds: 60 };

const CLAUDE_MODEL = "anthropic/claude-sonnet-4";

function getClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  return new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
}

// ─── Промпты для разных типов ───────────────────────────

function buildContentPrompt(topic: string, projectUrl: string, competitor: string): string {
  return `You are a content strategist and SEO expert. Write a detailed, publication-ready article outline + draft for a business website.

**Website:** ${projectUrl}
**Topic:** ${topic}
**Competitor already ranking for this:** ${competitor}

Your task:
1. Write a compelling H1 title for the article (in Russian)
2. Write a meta-description (in Russian, 150-160 chars)
3. Create a detailed article outline with 5-7 sections
4. Write the first 2 sections in full (500+ words each, in Russian)
5. Include specific data points, statistics, or examples where relevant
6. Add a FAQ section with 3-5 questions and answers

Format the output in Markdown. The article should be authoritative, data-driven, and optimized for AI search engines (Perplexity, ChatGPT, Gemini).
Write everything in Russian.`;
}

function buildLlmsTxtPrompt(projectUrl: string, siteTitle?: string): string {
  return `You are an AI optimization expert. Create a professional llms.txt file for the website.

**Website:** ${projectUrl}
**Site Name:** ${siteTitle || projectUrl}

The llms.txt file is a standardized way for websites to communicate with AI assistants. It tells AI systems what the website is about, what it offers, and how to represent it accurately.

Create a complete llms.txt file with:
1. # [Brand Name] — one-line description
2. ## About — 2-3 sentence description of the company/product
3. ## Key Facts — bullet points with important facts, features, pricing
4. ## Products/Services — list of main offerings with brief descriptions  
5. ## Contact — how to reach the company
6. ## Guidelines — how AI should represent this brand

Output ONLY the raw llms.txt content (no markdown code blocks, no explanations).
Write the content in Russian, but keep the section headers in English (they are part of the llms.txt standard).`;
}

function buildFaqPrompt(topic: string, projectUrl: string): string {
  return `You are an SEO and content expert. Create a comprehensive FAQ section for a website.

**Website:** ${projectUrl}
**Topic/Niche:** ${topic}

Create 7-10 frequently asked questions and detailed answers about this topic. The FAQ should:
1. Cover questions that potential customers actually ask AI assistants
2. Include specific, data-driven answers
3. Be formatted as JSON-LD Schema.org FAQPage markup
4. Also provide the human-readable Markdown version

Output format:
## FAQ (Markdown version)
[Questions and answers in Markdown]

## Schema.org JSON-LD
\`\`\`html
<script type="application/ld+json">
[FAQPage schema markup]
</script>
\`\`\`

Write everything in Russian.`;
}

// ─── POST handler ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — burst (per user)
  const rl = await checkRateLimit(`gen-content:${session.user.id}`, GENERATE_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите минуту." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Rate limit — daily cap (per user, cost protection)
  const dailyRl = await checkRateLimit(`gen-content-daily:${session.user.id}`, GENERATE_DAILY_LIMIT);
  if (!dailyRl.allowed) {
    return NextResponse.json(
      { error: "Достигнут дневной лимит генераций (30). Попробуйте завтра." },
      { status: 429 }
    );
  }

  // Rate limit — IP layer (defense in depth against token farms)
  const ip = getClientIp(req.headers);
  const ipRl = await checkRateLimit(`gen-content-ip:${ip}`, GENERATE_IP_LIMIT);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов с этого IP. Подождите минуту." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { type, topic, projectUrl, competitor, siteTitle } = body as {
    type: "content" | "llms-txt" | "faq";
    topic?: string;
    projectUrl: string;
    competitor?: string;
    siteTitle?: string;
  };

  if (!type || !projectUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let systemPrompt = "You are a helpful AI assistant specialized in content creation and SEO.";
  let userPrompt: string;

  switch (type) {
    case "content":
      userPrompt = buildContentPrompt(topic ?? "", projectUrl, competitor ?? "конкурент");
      break;
    case "llms-txt":
      userPrompt = buildLlmsTxtPrompt(projectUrl, siteTitle);
      break;
    case "faq":
      userPrompt = buildFaqPrompt(topic ?? "", projectUrl);
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const client = getClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000); // 60s hard timeout

    const stream = await client.chat.completions.create(
      {
        model: CLAUDE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      },
      { signal: controller.signal }
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) {
              ctrl.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("[generate-content] Stream error:", err);
        } finally {
          clearTimeout(timeout);
          ctrl.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[generate-content] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
