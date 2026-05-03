import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env so DATABASE_URL, YOOKASSA_* etc. are available in tests
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  // Only look in tests/ directory
  testDir: "./tests",

  // Run each test file in isolation — important for DB state
  fullyParallel: false,
  workers: 1,

  // Retry once on CI to avoid flaky false-negatives
  retries: process.env.CI ? 1 : 0,

  // Generous timeout for integration tests (DB + HTTP round-trips)
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // Base URL for the running Next.js dev server
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

    // Don't launch a real browser for API/integration tests —
    // they use `request` fixture which is pure HTTP
    // (browser tests can override this per-suite)
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  // Start Next.js dev server before the test run (if not already running)
  webServer: {
    command: "npm run dev",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    reuseExistingServer: true,   // Don't spin up a 2nd server if dev is already running
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
