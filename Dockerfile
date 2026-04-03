# ════════════════════════════════════════════════════════════
# GEO SaaS — Production Dockerfile
# Base: Playwright image (has system libs for headless Chromium)
# ════════════════════════════════════════════════════════════

# ── Stage 1: Install dependencies ──────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build the Next.js app ────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js (standalone output)
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy worker source + tsx for running it
COPY --from=builder /app/src/workers ./src/workers
COPY --from=builder /app/src/services ./src/services
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
