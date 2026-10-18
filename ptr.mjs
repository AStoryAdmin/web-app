import { createRequire } from "module";
const require = createRequire("C:/Users/vngia/OneDrive - Umich/Desktop/My startups/A Story - W Daniel/Web App Ver Daniel/09142026/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 2560, height: 1300 } })).newPage();
await p.addInitScript(() => sessionStorage.setItem("astory-opened", "1"));
for (const route of ["/sign-in", "/welcome"]) {
await p.goto("http://localhost:5180" + route, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
await p.mouse.move(60, 1250, { steps: 5 }); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
const st = await p.evaluate(() => { const s = document.querySelector('.stamp'); if (!s) return null; const r = s.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
for (let i = 0; i < 40; i++) { await p.mouse.move(400 + i, 1200, { steps: 1 }); await p.waitForTimeout(30); }
await p.waitForTimeout(1500);
const leaf = await p.evaluate(() => { const s = document.querySelector('.leaf'); const r = s.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; });
const lamp = await p.evaluate(() => { const s = document.querySelector('.lamp'); const r = s.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; });
console.log(route, "stamp centre", st, "(pressed 60,1250)", "leaf", leaf, "(pointer 439,1200; it trails +26,+30 css)", "lamp centre", lamp);
}
await b.close();
