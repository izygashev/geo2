/**
 * Bull Board — Admin Queue Monitor
 *
 * Доступен по: /api/admin/queues
 *
 * Защищён HTTP Basic Auth.
 * Установите переменные окружения:
 *   ADMIN_USER=admin
 *   ADMIN_PASSWORD=<сложный пароль>
 *
 * Интегрируется с @bull-board/api напрямую (без framework-адаптера),
 * перенаправляя Next.js App Router запросы к bull-board обработчикам.
 */

import { NextRequest, NextResponse } from "next/server";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getQueuesApi } = require("@bull-board/api/dist/queuesApi") as {
  getQueuesApi: (queues: import("@bull-board/api/baseAdapter").BaseAdapter[]) => {
    bullBoardQueues: Map<string, unknown>;
    setQueues: (q: import("@bull-board/api/baseAdapter").BaseAdapter[]) => void;
  };
};
import { reportQueue, pdfQueue } from "@/lib/queue";
import { readFileSync } from "fs";
import { join } from "path";

// @bull-board/api exposes routes via ./dist/* wildcard — use require to bypass TS module resolution
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appRoutes } = require("@bull-board/api/dist/routes") as {
  appRoutes: {
    views: { method: string; route: string | string[]; handler: (params: unknown) => unknown }[];
    api: { method: string; route: string; handler: (req: unknown) => Promise<{ status?: number; body?: unknown }> }[];
  };
};

// ── Bull Board queues registry (singleton) ────────────────────────────────────
const adapters = [
  new BullMQAdapter(reportQueue),
  new BullMQAdapter(pdfQueue),
];

const { bullBoardQueues } = getQueuesApi(adapters);

const BASE_PATH = "/api/admin/queues";

// ── Auth helper ───────────────────────────────────────────────────────────────
function checkBasicAuth(req: NextRequest): boolean {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    // No credentials configured → deny all (safe default)
    return false;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Basic ")) return false;

  const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
  const [user, ...rest] = decoded.split(":");
  const password = rest.join(":");

  // Timing-safe comparison
  const expectedUser = Buffer.from(adminUser);
  const expectedPass = Buffer.from(adminPassword);
  const givenUser = Buffer.from(user);
  const givenPass = Buffer.from(password);

  if (
    givenUser.length !== expectedUser.length ||
    givenPass.length !== expectedPass.length
  ) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < expectedUser.length; i++) diff |= expectedUser[i] ^ givenUser[i];
  for (let i = 0; i < expectedPass.length; i++) diff |= expectedPass[i] ^ givenPass[i];

  return diff === 0;
}

function unauthorizedResponse() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Bull Board Admin"',
    },
  });
}

// ── Route path helper ─────────────────────────────────────────────────────────
/** Strips the base path prefix to get the relative path bull-board expects */
function getRelativePath(req: NextRequest): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const relative = path.startsWith(BASE_PATH)
    ? path.slice(BASE_PATH.length) || "/"
    : path;
  return relative || "/";
}

// ── API route handler (JSON endpoints) ───────────────────────────────────────
async function handleApiRoute(
  req: NextRequest,
  relativePath: string
): Promise<NextResponse | null> {
  const url = new URL(req.url);
  const method = req.method.toLowerCase() as "get" | "put" | "post" | "delete";

  for (const route of appRoutes.api) {
    if (route.method !== method) continue;

    // Convert express-style :param to a regex pattern
    const pattern = route.route
      .replace(/:([^/]+)/g, "(?<$1>[^/]+)")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${pattern}$`);
    const match = relativePath.match(regex);

    if (!match) continue;

    const params = match.groups ?? {};
    const query: Record<string, string | string[]> = {};
    url.searchParams.forEach((v, k) => {
      const existing = query[k];
      if (existing) {
        query[k] = Array.isArray(existing) ? [...existing, v] : [existing, v];
      } else {
        query[k] = v;
      }
    });

    let body: Record<string, unknown> = {};
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        body = await req.json();
      }
    } catch { /* empty body */ }

    try {
      const result = await route.handler({
        queues: bullBoardQueues,
        params,
        query,
        body,
      } as never);

      return NextResponse.json(result.body ?? {}, { status: result.status ?? 200 });
    } catch (err) {
      console.error("[BullBoard] API handler error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  }

  return null; // No matching route
}

// ── UI HTML + static assets ───────────────────────────────────────────────────
function serveUiHtml(): NextResponse {
  const uiDistPath = join(
    process.cwd(),
    "node_modules/@bull-board/ui/dist"
  );

  // Read and render the EJS template manually (no ejs dependency needed)
  const template = readFileSync(join(uiDistPath, "index.ejs"), "utf-8");

  const staticPath = `${BASE_PATH}/static`;
  const html = template
    .replace(/<%=\s*basePath\s*%>/g, BASE_PATH + "/")
    .replace(/<%=\s*uiConfig\.boardTitle\s*%>/g, "GEO Studio — Queue Monitor")
    .replace(/<%-\s*uiConfig\.favIcon\.default\s*%>/g, `${staticPath}/favicon.ico`)
    .replace(/<%-\s*uiConfig\.favIcon\.alternative\s*%>/g, `${staticPath}/favicon.ico`)
    .replace(/<%[^>]*%>/g, "") // Strip remaining EJS tags
    .replace(/\/static\//g, `${staticPath}/`);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function serveStaticAsset(relativePath: string): NextResponse | null {
  const assetPath = relativePath.replace(/^\/static\//, "");
  if (!assetPath || assetPath.includes("..")) return null;

  const uiDistPath = join(process.cwd(), "node_modules/@bull-board/ui/dist/static");
  const fullPath = join(uiDistPath, assetPath);

  try {
    const content = readFileSync(fullPath);
    const ext = assetPath.split(".").pop() ?? "";
    const contentTypes: Record<string, string> = {
      js: "application/javascript",
      css: "text/css",
      ico: "image/x-icon",
      png: "image/png",
      svg: "image/svg+xml",
      woff: "font/woff",
      woff2: "font/woff2",
      map: "application/json",
    };
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return null;
  }
}

// ── Main handlers ─────────────────────────────────────────────────────────────
async function handler(req: NextRequest): Promise<NextResponse> {
  if (!checkBasicAuth(req)) return unauthorizedResponse();

  const relativePath = getRelativePath(req);

  // Static assets
  if (relativePath.startsWith("/static/")) {
    return serveStaticAsset(relativePath) ?? new NextResponse("Not Found", { status: 404 });
  }

  // API routes (JSON)
  if (relativePath.startsWith("/api/")) {
    const apiResult = await handleApiRoute(req, relativePath);
    if (apiResult) return apiResult;
  }

  // UI entry point (all non-API paths → SPA)
  return serveUiHtml();
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;

// Disable Next.js body parsing — we read it ourselves
export const dynamic = "force-dynamic";
