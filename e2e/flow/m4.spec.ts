/**
 * M4, a book worth ordering (docs/overnight/AUDIT.md §4, gap rows 36, 37, 38 and E24), against the in-memory
 * Supabase: /book/design saves the title, subtitle, dedication, cover style and colour, paper, chapter order and the
 * memories kept out to stories.book_design, whole and normalised, as the phone's BookDesignScreen and BookPagesScreen
 * write it; a memory kept out leaves the book's preview and the print-at-home book; the Book page offers "Print at
 * home" and never calls anything free; the print's listening codes point at astoryapp.com/l, as the phone's do
 * (phone-app/src/lib/links.js LISTEN_URL); and while create-book-checkout says ordering is closed the editions list
 * shows no price and no Order, the Digital Edition is never ordered, nothing is "included with your plan", and the
 * thanks for wanting a printed copy promises nothing it can't keep.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M4/ and held to the floor: body text 16px
 * and up, main buttons 44px and up, no sideways scroll, and none of the words the product never says (a price, a
 * free book or print, days left, a trial). Those checks are soft, so one bad sentence is reported without hiding the
 * rest of the flow.
 */
import { expect, test, type Page } from "@playwright/test";
import { fixtures, id, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { listenUrl, normaliseDesign } from "../../src/app-core/lib/bookDesign.js";
import { qrPath } from "../../src/app-core/lib/qr.js";

const SHOTS = "docs/overnight/shots/M4";
/** The book's own key for its listening codes, seeded so the Book page has no reason to write one. */
const LISTEN_KEY = "FlowTestKey12345";

/** A full-page picture of the screen, named for the step and the width: 01-design-360.png. */
async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.screenshot({ path: `${SHOTS}/${name}-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
}

/** The words the product never says, anywhere in the visible text. */
async function checkCopy(page: Page, where: string) {
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
async function checkFloor(page: Page, where: string) {
  const m = await page.evaluate(() => {
    const shown = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
    };
    const zoom = (el: Element) => (el as Element & { currentCSSZoom?: number }).currentCSSZoom ?? 1;
    const px = (el: Element) => parseFloat(getComputedStyle(el).fontSize) * zoom(el);
    // reading text: any paragraph, definition or list line long enough to be a sentence, and every text field. Small
    // print is what the design marks as such (meta lines, notes, the folio, a header or the bar, BAOS rule 16's quiet
    // ink at 13px or tracked small caps at 11px), and the book's own pages, which are set at the printed size.
    const smallPrint = ".meta, .note, .folio, .running-head-sheet, header, nav, [aria-hidden=true], .bk-stage, .bd-rail-cover, .bd-choice-specimen";
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
      // a line that is only a control is a label, held to 44px instead
      .filter((el) => {
        const control = el.querySelector("button, a");
        return !control || (control as HTMLElement).innerText.trim() !== (el.innerText || "").trim();
      })
      .filter((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el.innerText || "").trim().length >= 30);
    const small = reading
      .filter((el) => !allowed(el))
      .map((el) => ({ text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.className).trim().slice(0, 70), cls: el.className, px: Math.round(px(el) * 10) / 10 }));
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
async function bigEnough(page: Page, selector: string, where: string) {
  const heights = await page.locator(selector).evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({ text: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40), h: Math.round(el.getBoundingClientRect().height * 10) / 10 })),
  );
  expect.soft(heights.filter((x) => x.h < 43.5), `${where}: under 44px tall`).toEqual([]);
}

/** Look, check, photograph: what every screen in this milestone gets. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, name);
}

type Design = ReturnType<typeof normaliseDesign>;

/**
 * Rose's book, kept by Jamie (signed in): three memories in three chapters, the first with Rose's voice on it (so
 * the print carries a listening code). `relationship: "Myself"` makes Jamie the storyteller, whose press is a
 * "Not for the book" (heldBack) rather than a keeper's "Left out" (excluded).
 */
async function rosesBook(page: Page, { relationship = "Mother", design = null as Row | null } = {}) {
  const mock = await mockSupabase(page);
  const jamie = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Hartley" });
  const [story] = mock.insert(
    "stories",
    fixtures.story(jamie.id, { name: relationship === "Myself" ? "Jamie" : "Rose", relationship, book_design: design ?? { listenKey: LISTEN_KEY } }),
  );
  const sid = String(story.id);
  const kitchen = fixtures.memory(sid, { title: "The kitchen on Elm Street", era: "Childhood", body: "The radio was always on, and the window over the sink looked out on the pear tree.", created_at: "2026-09-02T10:00:00.000Z" });
  const dance = fixtures.memory(sid, { title: "The dance at the Legion hall", era: "Love & family", body: "He trod on my feet all night and I married him anyway.", created_at: "2026-09-03T10:00:00.000Z" });
  const bakery = fixtures.memory(sid, { title: "Mornings at the bakery", era: "Work & making a living", body: "Four in the morning, flour to the elbows, and the first loaves out by six.", created_at: "2026-09-04T10:00:00.000Z" });
  mock.insert("memories", kitchen, dance, bakery);
  mock.insert("memory_audio", { id: id("c"), memory_id: kitchen.id, bucket: "memory-audio", storage_path: `${sid}/${kitchen.id}/voice.m4a`, speaker: "Rose", duration_seconds: 42, transcript: "", sort_order: 0 });
  Object.assign(mock.tables.profiles.find((p) => p.id === jamie.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, jamie);
  return { mock, jamie, story, kitchen, dance, bakery };
}

/** What went to stories.book_design, last write first. */
const designWrites = (mock: MockSupabase) =>
  mock
    .sent("/rest/v1/stories")
    .filter((c) => (c.method === "PATCH" || c.method === "POST") && c.body && typeof c.body === "object")
    .map((c) => (Array.isArray(c.body) ? (c.body[0] as Row) : (c.body as Row)).book_design)
    .filter(Boolean)
    .reverse() as Design[];

/** Every page of the preview, read by turning them one at a time (reduced motion: no leaf, just the next page). */
async function previewText(page: Page): Promise<string> {
  const stage = page.locator(".bk-stage");
  await expect(stage).toBeVisible({ timeout: 15_000 });
  const next = page.getByRole("button", { name: "Next page" });
  const seen: string[] = [await stage.innerText()];
  for (let i = 0; i < 80 && (await next.isEnabled()); i++) {
    const where = await page.locator(".bk-where").innerText();
    await next.click();
    await expect(page.locator(".bk-where")).not.toHaveText(where);
    seen.push(await stage.innerText());
  }
  return seen.join("\n");
}

/** Print at home: the window it opens, once it holds the book rather than its "Making the book…" line. */
async function printedBook(page: Page): Promise<string> {
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Print at home" }).click();
  const win = await popup;
  await expect.poll(() => win.evaluate(() => document.title + document.body.innerHTML.length).catch(() => ""), { timeout: 20_000 }).not.toMatch(/^Making the book/);
  await expect.poll(async () => (await win.content()).includes("<!doctype") || (await win.content()).length > 5000, { timeout: 20_000 }).toBe(true);
  return win.content();
}

/** The create-book-checkout price check, as the server answers it while printing is closed. */
function orderingClosed(mock: MockSupabase, extra: Row = {}) {
  const asked: Row[] = [];
  mock.functions["create-book-checkout"] = (args) => {
    asked.push(args);
    if (!args.check) return { status: 400, body: { error: "Ordering isn’t open yet.", reason: "closed" } };
    return {
      included: false,
      reason: "not_member",
      member: false,
      orderingOpen: false,
      priceCents: 6900,
      credits: 0,
      editions: [
        { id: "home", priceCents: 0, sale: "free" },
        { id: "digital", priceCents: 1900, sale: "iap" },
        { id: "softcover", priceCents: 3900, extraCents: 2900, sale: "stripe" },
        { id: "hardcover", priceCents: 6900, extraCents: 4900, sale: "stripe" },
        { id: "heirloom", priceCents: 14900, extraCents: 11900, sale: "stripe" },
        { id: "legacy", priceCents: 49900, extraCents: 11900, sale: "stripe" },
      ],
      ...extra,
    };
  };
  return asked;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // The print window asks to print once the book is in it; a test has nobody to answer the dialog.
  await page.context().addInitScript(() => {
    window.print = () => {};
  });
});

test("/book/design saves every choice to stories.book_design in the phone's shape", async ({ page }) => {
  const { mock, story, dance } = await rosesBook(page);
  orderingClosed(mock);

  await page.goto("/book/design");
  await expect(page.getByRole("heading", { name: /Design the book/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("radiogroup", { name: "Cover style" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /Everyone who keeps the book/ })).toBeVisible();
  await screen(page, "01-design");

  // the keepsake's colour, then a cover of another material: the colour is kept for the keepsake
  await page.getByRole("button", { name: "Forest cover" }).click();
  await expect(page.getByRole("button", { name: "Forest cover" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radiogroup", { name: "Cover style" }).locator("label.bd-choice", { hasText: "Clothbound" }).click();
  await expect(page.getByRole("radio", { name: /Clothbound/ })).toBeChecked();

  await page.getByLabel("Title", { exact: true }).fill("Rose, in her own words");
  await page.getByLabel("Subtitle", { exact: true }).fill("Elm Street and after");
  await page.getByRole("textbox", { name: "Dedication" }).fill("For Sam and Lou, who asked the first question.");
  await page.getByRole("radiogroup", { name: "Paper" }).locator("label.bd-choice", { hasText: "Ivory" }).click();
  await expect(page.getByRole("radio", { name: /Ivory/ })).toBeChecked();

  // the chapters, in print order: Work moves ahead of Love & family
  const chapterNames = () => page.locator(".bd-chapter .bd-chapter-words b").allInnerTexts();
  await expect.poll(chapterNames).toEqual(["Childhood", "Love & family", "Work & making a living"]);
  const earlier = page.getByRole("button", { name: "Move Work & making a living earlier" });
  await bigEnough(page, ".bd-mover", "the chapter movers");
  await earlier.click();
  await expect.poll(chapterNames).toEqual(["Childhood", "Work & making a living", "Love & family"]);

  // the dance is kept out: a keeper's "Left out"
  await page.locator(".bd-chapter", { hasText: "Love & family" }).locator(".bd-chapter-open").click();
  const danceBox = page.getByRole("checkbox", { name: /The dance at the Legion hall/ });
  await expect(danceBox).toHaveAttribute("aria-checked", "true");
  await bigEnough(page, ".bd-memory", "a memory's In or Out");
  await danceBox.click();
  await expect(danceBox).toHaveAttribute("aria-checked", "false");
  await expect(danceBox).toContainText("Left out");
  await expect(page.locator(".bd-rail-count")).toContainText("2 of 3 memories");
  await expect(page.getByRole("status").filter({ hasText: "Not saved yet." })).toBeVisible();
  await screen(page, "02-design-changed");

  await page.getByRole("button", { name: "Save the design" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: /^Saved\./ })).toBeVisible();
  await screen(page, "03-design-saved");

  // what went to the database: the whole design, normalised, as the phone's normaliseDesign writes it
  const [sent] = designWrites(mock);
  expect(sent, "a book_design was written").toBeTruthy();
  expect(sent).toEqual(normaliseDesign(sent));
  expect(Object.keys(sent).sort()).toEqual(Object.keys(normaliseDesign(null)).sort());
  expect(Object.keys(sent.cover).sort()).toEqual(Object.keys(normaliseDesign(null).cover).sort());
  expect(sent).toMatchObject({
    version: 1,
    paper: "ivory",
    dedication: "For Sam and Lou, who asked the first question.",
    excluded: [dance.id],
    included: [],
    heldBack: [],
    arrangement: "chapters",
    listenKey: LISTEN_KEY,
    cover: { style: "cloth", color: "forest", title: "Rose, in her own words", subtitle: "Elm Street and after" },
  });
  // the whole sequence is kept (the phone's moveChapter), so the order seen is the order that prints
  expect(sent.chapterOrder.indexOf("Work & making a living")).toBeLessThan(sent.chapterOrder.indexOf("Love & family"));
  expect(sent.chapterOrder.indexOf("Childhood")).toBeLessThan(sent.chapterOrder.indexOf("Work & making a living"));
  const row = mock.tables.stories.find((s) => s.id === story.id)!;
  expect(row.book_design).toEqual(sent);

  // read back: a reload shows the saved design, nothing left unsaved
  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Rose, in her own words", { timeout: 15_000 });
  await expect(page.getByLabel("Subtitle", { exact: true })).toHaveValue("Elm Street and after");
  await expect(page.getByRole("textbox", { name: "Dedication" })).toHaveValue("For Sam and Lou, who asked the first question.");
  await expect(page.getByRole("radio", { name: /Clothbound/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Ivory/ })).toBeChecked();
  await expect.poll(chapterNames).toEqual(["Childhood", "Work & making a living", "Love & family"]);
  await expect(page.getByRole("button", { name: "Save the design" }).first()).toBeDisabled();
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("leaving /book/design with changes saves them on the way out", async ({ page }) => {
  const { mock } = await rosesBook(page);
  orderingClosed(mock);
  await page.goto("/book/design");
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("textbox", { name: "Dedication" }).fill("For everyone at the table.");
  // on a phone the rail scrolls away, so Save is held at the foot while something is unsaved; a laptop keeps the rail's
  const narrow = test.info().project.name === "360";
  await expect(page.locator(narrow ? ".bd-dock" : ".bd-rail").getByRole("button", { name: "Save the design" })).toBeVisible();
  await screen(page, "04-design-unsaved");
  await page.getByRole("link", { name: /Open the book/ }).click();
  await expect(page).toHaveURL(/\/book$/, { timeout: 15_000 });
  const [sent] = designWrites(mock);
  expect(sent?.dedication).toBe("For everyone at the table.");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a memory the storyteller keeps out leaves the preview and the print-at-home book", async ({ page }) => {
  const { mock, dance } = await rosesBook(page, { relationship: "Myself" });
  orderingClosed(mock);

  await page.goto("/book/design");
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("textbox", { name: "Dedication" }).fill("For my grandchildren.");
  await page.locator(".bd-chapter", { hasText: "Love & family" }).locator(".bd-chapter-open").click();
  const danceBox = page.getByRole("checkbox", { name: /The dance at the Legion hall/ });
  await danceBox.click();
  await expect(danceBox).toContainText("You kept this out");
  await screen(page, "05-design-kept-out");
  await page.getByRole("button", { name: "Save the design" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: /^Saved\./ })).toBeVisible();
  const [sent] = designWrites(mock);
  // the storyteller's own "Not for the book" (the phone's holdBack), which no keeper's switch overrides
  expect(sent.heldBack).toEqual([dance.id]);
  expect(sent.excluded).toEqual([]);

  // the preview on the Book page: every page turned, the dance on none of them
  await page.goto("/book");
  await expect(page.getByRole("button", { name: "Print at home" })).toBeVisible({ timeout: 15_000 });
  await screen(page, "06-book");
  const preview = await previewText(page);
  expect(preview).toContain("The kitchen on Elm Street");
  expect(preview).toContain("Mornings at the bakery");
  expect(preview).toContain("For my grandchildren.");
  expect(preview, "the kept-out memory in the preview").not.toContain("The dance at the Legion hall");
  expect(preview).not.toContain("trod on my feet");
  await screen(page, "07-book-last-page");

  // the print-at-home book: the same choices, the same memory left out
  const html = await printedBook(page);
  expect(html).toContain("The kitchen on Elm Street");
  expect(html).toContain("Mornings at the bakery");
  expect(html).toContain("For my grandchildren.");
  expect(html, "the kept-out memory in the printed book").not.toContain("Legion hall");
  expect(html).not.toContain("trod on my feet");
  expect(html).not.toMatch(/supabase\.co\/functions/);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the print follows the design: title, dedication and the listening code on astoryapp.com/l", async ({ page }) => {
  const { mock, kitchen } = await rosesBook(page, {
    design: {
      listenKey: LISTEN_KEY,
      paper: "antique",
      dedication: "For Sam and Lou.",
      excluded: [],
      cover: { style: "keepsake", color: "slate", title: "Elm Street", subtitle: "Rose Hartley, as she told it" },
    },
  });
  orderingClosed(mock);

  await page.goto("/book");
  const print = page.getByRole("button", { name: "Print at home" });
  await expect(print).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Elm Street");
  await bigEnough(page, ".bk-print .btn", "Print at home");
  await screen(page, "08-book-designed");

  const html = await printedBook(page);
  expect(html).toContain("Elm Street");
  expect(html).toContain("Rose Hartley, as she told it");
  expect(html).toContain("For Sam and Lou.");
  expect(html).toContain("The dance at the Legion hall");
  expect(html).toMatch(/Scan with a phone camera to hear Rose tell this/);
  // the code beside the kitchen is the phone's: astoryapp.com/l with the memory and the book's key
  const url = listenUrl("https://astoryapp.com/l", kitchen.id, LISTEN_KEY) as string;
  expect(url).toMatch(/^https:\/\/astoryapp\.com\/l\?m=[A-Za-z0-9_-]{22}&k=FlowTestKey12345$/);
  expect(html, "the listening code encodes astoryapp.com/l").toContain(`d="${qrPath(url).d}"`);
  // and not the project's own functions URL, which a printed book would outlive
  const old = listenUrl("https://flow-test.supabase.co/functions/v1/listen", kitchen.id, LISTEN_KEY) as string;
  expect(html).not.toContain(`d="${qrPath(old).d}"`);
  expect(html).not.toMatch(/supabase\.co\/functions/);
  // the print says nothing the product never says either
  const words = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, "\n");
  expect.soft(words.split(/\n+|(?<=[.!?])\s+/).filter((s) => /free/i.test(s) && /book|print/i.test(s)), "the printed book calls itself free").toEqual([]);
  expect.soft(words.match(/\$\d/g) ?? [], "a price in the printed book").toEqual([]);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the Book page says Print at home and never calls the book free", async ({ page }) => {
  const { mock } = await rosesBook(page);
  orderingClosed(mock);
  await page.goto("/book");
  await expect(page.getByRole("button", { name: "Print at home" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/free/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Design the book/ })).toHaveAttribute("href", "/book/design");
  await checkCopy(page, "09-book-print");
  await checkFloor(page, "09-book-print");
  await page.getByRole("button", { name: "Print at home" }).scrollIntoViewIfNeeded();
  await shot(page, "09-book-print");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("with ordering closed the editions show no prices and no Order, and promise nothing", async ({ page }) => {
  const { mock, story } = await rosesBook(page);
  // a member with a gift's credit: still nothing "included", still nothing to order
  const asked = orderingClosed(mock, { member: true, plan: "yearly", credits: 1 });

  await page.goto("/book");
  const editions = page.locator("#editions");
  await expect(editions.getByRole("heading", { name: /Editions/ })).toBeVisible({ timeout: 15_000 });
  await expect(editions.getByText(/Printed editions are coming/)).toBeVisible();
  expect(asked.some((a) => a.check === true && a.storyId === story.id), "the price check was asked").toBe(true);
  await editions.scrollIntoViewIfNeeded();

  const rows = editions.locator(".ed-row");
  await expect(rows).toHaveCount(5);
  await expect(rows.locator("h3")).toHaveText(["Digital Edition", "Softcover", "Classic Hardcover", "Heirloom Edition", "Full-Service Edition"]);
  const text = await editions.innerText();
  expect(text, "a price on the editions").not.toMatch(/\$\s?\d/);
  expect(text, "a price on the editions").not.toMatch(/\d+\.\d\d\b|\bUSD\b/);
  await expect(editions.locator(".ed-price")).toHaveCount(0);
  await expect(editions.getByRole("link", { name: /order/i })).toHaveCount(0);
  await expect(editions.getByRole("button", { name: /^order/i })).toHaveCount(0);
  await expect(page.locator("a[href^='/book/order']")).toHaveCount(0);
  const digital = rows.filter({ hasText: "Digital Edition" });
  await expect(digital.getByRole("link")).toHaveCount(0);
  await expect(digital.getByRole("button")).toHaveCount(0);
  expect(text, "'included with your plan'").not.toMatch(/included with your plan/i);
  expect.soft(text, "anything called included").not.toMatch(/\bincluded\b/i);
  await screen(page, "10-editions-closed");

  // the printed copy: the thanks says where ordering will open, and announces nothing nobody will send
  const want = editions.getByRole("button", { name: /I’d like a printed copy/ });
  await expect(want).toBeVisible();
  await bigEnough(page, "#editions .ed-wait .btn", "I'd like a printed copy");
  await want.click();
  const thanks = editions.getByRole("status");
  await expect(thanks).toBeVisible();
  const said = await thanks.innerText();
  expect(said, "a promise of an announcement, an email or a place on a list").not.toMatch(/announce|we.?ll (let you know|tell you|email|write|send)|notify|in touch|waitlist|waiting list|on the list|first to know/i);
  await screen(page, "11-editions-asked");
  // asking only says so: no order, no checkout, nothing stored
  expect(asked.every((a) => a.check === true)).toBe(true);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a server too old to say whether ordering is open counts as closed", async ({ page }) => {
  const { mock } = await rosesBook(page);
  mock.functions["create-book-checkout"] = () => ({ ok: true });
  await page.goto("/book");
  const editions = page.locator("#editions");
  await expect(editions.getByText(/Printed editions are coming/)).toBeVisible({ timeout: 15_000 });
  expect(await editions.innerText()).not.toMatch(/\$\s?\d/);
  await expect(editions.getByRole("link", { name: /order/i })).toHaveCount(0);
  await screen(page, "12-editions-old-server");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("once the server says ordering is open, each printed edition has its price and Order, to the ordering page (M5)", async ({ page }) => {
  const { mock } = await rosesBook(page);
  orderingClosed(mock, { orderingOpen: true, reason: "open" });
  await page.goto("/book");
  const editions = page.locator("#editions");
  // /book/order is here (M5, data/book.ts ORDER_PAGE): Order shows only when the server says ordering is open
  await expect(editions.getByRole("link", { name: "Order the Classic Hardcover" })).toBeVisible({ timeout: 15_000 });
  await expect(editions.getByText(/Printed editions are coming/)).toHaveCount(0);
  for (const id of ["softcover", "hardcover", "heirloom", "legacy"]) await expect(editions.locator(`a[href^='/book/order?'][href$='edition=${id}']`)).toHaveCount(1);
  await expect(editions.locator(".ed-price")).toHaveCount(4);
  const text = await editions.innerText();
  expect(text).toContain("$69");
  expect(text).not.toMatch(/included with your plan/i);
  const digital = editions.locator(".ed-row").filter({ hasText: "Digital Edition" });
  await expect(digital.getByRole("link")).toHaveCount(0);
  await expect(digital).toContainText("Bought once in the A Story app.");
  expect(await digital.innerText(), "the Digital Edition priced on the web").not.toMatch(/\$\s?\d/);
  await checkFloor(page, "13-editions-open");
  await editions.scrollIntoViewIfNeeded();
  await shot(page, "13-editions-open");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
