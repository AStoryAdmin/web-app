/**
 * Playwright for the link to one memory (/m/:token) only:
 *   npx playwright test --config e2e/memoryLink.config.ts
 * memory_link_read and the listen function are mocked by route interception inside the spec; the dev server is
 * given a fake Supabase URL so nothing real is ever called.
 */
import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PORT = 5192;

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

const launchOptions = { executablePath: localChromium(), args: ["--autoplay-policy=no-user-gesture-required"] };

export default defineConfig({
  testDir: ".",
  testMatch: "memoryLink.spec.ts",
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions,
  },
  projects: [{ name: "phone-360", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 }, hasTouch: true, launchOptions } }],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    cwd: "..",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_SUPABASE_URL: "https://link-test.supabase.co", VITE_SUPABASE_ANON_KEY: "anon-test-key" },
  },
});
