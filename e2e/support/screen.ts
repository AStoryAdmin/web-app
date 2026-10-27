/**
 * What every screen in a milestone gets (the same checks as e2e/flow/m4.spec.ts, shared): a full-page photograph at
 * the test's width, the words the product never says (a price, a free book or print, days left, a trial) anywhere in
 * the visible text, and the floor (body text 16px and up, main buttons 44px and up, no sideways scroll). The checks
 * are soft, so one bad sentence is reported without hiding the rest of the flow.
 */
import { expect, test, type Page } from "@playwright/test";

/** A full-page picture of the screen, named for the step and the width: `${dir}/01-welcome-360.png`. */
export async function shot(page: Page, dir: string, name: string) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.screenshot({ path: `${dir}/${name}-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
}

/** The words the product never says, anywhere in the visible text, sentence by sentence. */
export async function checkCopy(page: Page, where: string) {
  const text = await page.evaluate(() => document.body.innerText);
  const sentences = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const said = (re: RegExp) => sentences.filter((s) => re.test(s));
  expect.soft(said(/\$\d/), `${where}: a price is shown`).toEqual([]);
  expect.soft(sentences.filter((s) => /free/i.test(s) && /book|print/i.test(s)), `${where}: the book or a print is called free`).toEqual([]);
  expect.soft(said(/days?\s+left/i), `${where}: a countdown`).toEqual([]);
  expect.soft(said(/trial/i), `${where}: trial language`).toEqual([]);
}

/** Body text 16px and up as it is drawn (CSS zoom included), main buttons 44px and up, nothing wider than the window. */
export async function checkFloor(page: Page, where: string) {
  const m = await page.evaluate(() => {
    const shown = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
    };
    const zoom = (el: Element) => (el as Element & { currentCSSZoom?: number }).currentCSSZoom ?? 1;
    const px = (el: Element) => parseFloat(getComputedStyle(el).fontSize) * zoom(el);
    // small print is what the design marks as such (BAOS rule 16: quiet ink at 13px, tracked small caps at 11px)
    const smallPrint = ".meta, .note, .folio, .running-head-sheet, header, nav, [aria-hidden=true]";
    const bodyInk = getComputedStyle(document.body).color;
    const allowed = (el: Element) => {
      const s = getComputedStyle(el);
      const size = px(el);
      if (size < 10.95) return false;
      const tracked = parseFloat(s.letterSpacing) / parseFloat(s.fontSize) >= 0.13;
      if (s.textTransform === "uppercase" && tracked) return true;
      if (s.color !== bodyInk && size >= 12.95) return true;
      return size >= 15.95;
    };
    const reading = [...document.querySelectorAll<HTMLElement>("p, dd, li, textarea, input:not([type=checkbox]):not([type=radio]):not([type=file])")]
      .filter(shown)
      .filter((el) => !el.closest(smallPrint))
      .filter((el) => {
        const control = el.querySelector("button, a");
        return !control || (control as HTMLElement).innerText.trim() !== (el.innerText || "").trim();
      })
      .filter((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el.innerText || "").trim().length >= 30);
    const small = reading
      .filter((el) => !allowed(el))
      .map((el) => ({ text: (el.innerText || el.getAttribute("aria-label") || el.className).trim().slice(0, 70), cls: el.className, px: Math.round(px(el) * 10) / 10 }));
    const buttons = [...document.querySelectorAll<HTMLElement>(".btn:not(.sm), button[type=submit]")]
      .filter(shown)
      .map((el) => ({ text: el.innerText.trim().slice(0, 40), h: Math.round(el.getBoundingClientRect().height * 10) / 10 }))
      .filter((x) => x.h < 43.5);
    return { body: px(document.body), small, buttons, overflow: document.documentElement.scrollWidth - window.innerWidth };
  });
  expect.soft(m.body, `${where}: body font size`).toBeGreaterThanOrEqual(16);
  expect.soft(m.small, `${where}: reading text under 16px`).toEqual([]);
  expect.soft(m.buttons, `${where}: main buttons under 44px tall`).toEqual([]);
  expect.soft(m.overflow, `${where}: sideways scroll`).toBeLessThanOrEqual(0);
}

/** A control the person came to press: 44px tall at least, whatever size class it wears. */
export async function bigEnough(page: Page, selector: string, where: string) {
  const heights = await page.locator(selector).evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({ text: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40), h: Math.round(el.getBoundingClientRect().height * 10) / 10 })),
  );
  expect.soft(heights.filter((x) => x.h < 43.5), `${where}: under 44px tall`).toEqual([]);
}
