/**
 * Playwright for the holiday gift pages (lane G) only:
 *   npx playwright test --config e2e/gift.config.ts
 * The pages are mounted by src/pages/gift/e2e/harness.html (a memory router), so this runs before App.tsx has the
 * routes. create-gift-checkout and the database functions are mocked by route interception in the spec; the dev
 * server is given a fake Supabase URL so nothing real is ever called, and Stripe is a stub page.
 */
import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 5191;

/** Use the Chromium this machine already has when the pinned revision isn't installed (no downloads here). */
function localChromium(): string | undefined {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || join(process.env.LOCALAPPDATA || "", "ms-playwright");
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of dirs) {
    const exe = join(root, d, "chrome-win64", "chrome.exe");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const launchOptions = {
  executablePath: localChromium(),
  args: [],
};

export default defineConfig({
  testDir: ".",
  testMatch: "gift.spec.ts",
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions,
  },
  projects: [
    { name: "phone-360", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 }, hasTouch: true, launchOptions } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, launchOptions } },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/src/pages/gift/e2e/harness.html`,
    // the web app root, not this folder: the harness is at /src/pages/gift/e2e/harness.html
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_SUPABASE_URL: "https://gift-test.supabase.co", VITE_SUPABASE_ANON_KEY: "anon-test-key" },
  },
});
