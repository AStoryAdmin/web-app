/**
 * Playwright for the signed-in flows, one spec per milestone (e2e/flow/*.spec.ts):
 *   npm run test:flow
 * Supabase is a fake URL and every request to it is answered by e2e/support/mockSupabase.ts; anything else that
 * leaves the machine is refused, so nothing real is ever called. Two widths: a small phone and a laptop.
 */
import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

// A fake microphone that needs no permission prompt, for recording an answer (M2).
const launchOptions = { executablePath: localChromium(), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] };

export default defineConfig({
  testDir: "e2e",
  testMatch: "flow/*.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    launchOptions,
  },
  projects: [
    { name: "360", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 }, hasTouch: true, launchOptions } },
    { name: "1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, launchOptions } },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    // These win over .env.local, which holds the real project's keys.
    env: {
      VITE_SUPABASE_URL: "https://flow-test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-flow-test-key",
      VITE_API_URL: "https://flow-test.supabase.co/api",
      VITE_LISTEN_URL: "",
      VITE_SITE_URL: "http://127.0.0.1:5191",
    },
  },
});
