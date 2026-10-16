// Screenshots every mockup at 1440×900 and 390×844 (viewport); `full` also writes *-full.png full-page captures.
// Run from landing-page-publish (where Playwright is installed):
//   node "../web-app/docs/mockups/shots/shoot.mjs" [only=02] [full]
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '..');
const only = process.argv.find(a => a.startsWith('only='))?.slice(5);
const full = process.argv.includes('full');

const pages = [
  ['01-sign-in', ['signin', 'create', 'code']],
  ['02-home', ['']],
  ['03-live-conversation', ['speaking', 'listening', 'ended']],
  ['04-archive', ['']],
  ['05-memory', ['']],
  ['06-family', ['']],
];
const sizes = [[1440, 900, 'desktop'], [390, 844, 'phone']];

// Playwright's bundled build for this version is not downloaded; use the one that is.
const exe = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium_headless_shell-1243', 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
const browser = await chromium.launch({ executablePath: exe });
for (const [name, states] of pages) {
  if (only && !name.startsWith(only)) continue;
  for (const [w, h, tag] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const st of states) {
      const url = pathToFileURL(path.join(dir, name + '.html')).href + (st ? `?state=${st}` : '');
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const out = path.join(here, `${name}${st ? '-' + st : ''}-${tag}.png`);
      await page.screenshot({ path: out, fullPage: false });
      if (full) { await page.goto(url + (st ? '&' : '?') + 'chrome=0', { waitUntil: 'networkidle' }); await page.waitForTimeout(300); await page.screenshot({ path: out.replace(/.png$/, '-full.png'), fullPage: true }); }
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      console.log(`${path.basename(out)}  scrollWidth=${sw}${sw > w ? '  <-- OVERFLOW' : ''}`);
    }
    await ctx.close();
  }
}
await browser.close();
