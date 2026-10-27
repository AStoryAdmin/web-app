/**
 * M2, the first kept memory (docs/overnight/AUDIT.md §4, gap rows 13-18 and 24), against the in-memory Supabase:
 * today's question on Home is answered by writing, by voice and from a photograph, and each memory is saved as the
 * phone saves it: the question on the row (question_text, which the decks read back as the memory's prompt), a
 * keeper writing in a relative's story credited as phone lib/teller.js tellerCredit credits them, the voice in
 * memory-audio with its memory_audio row and its words from the AI server, a photograph kept with only a caption.
 * Each shows in the archive, the same question is not dealt again on the next visit, and the archive offers the
 * chapters "Not yet told". A family's shared question for today leads Home, and answering it tells the server.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M2/ (01-home-360.png ...) and held to the
 * floor: body text 16px and up, main buttons 44px and up, no sideways scroll, and none of the words the product
 * never says (a price, a free book or print, days left, a trial). Those checks are soft, so one bad sentence is
 * reported without hiding the rest of the flow.
 */
import { expect, test, type Page } from "@playwright/test";
import { fixtures, id, mockSupabase, type MockSupabase, type MockUser } from "../support/mockSupabase";

const SHOTS = "docs/overnight/shots/M2";
const TODAY = "2026-10-26";

/** A full-page picture of the screen, named for the step and the width: 01-home-360.png. */
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
    // print (BAOS rule 16: 13-14px, quiet) is what the design marks as such: meta lines, notes, the page's folio, and
    // the labels in a header or the bar.
    const smallPrint = ".meta, .note, .w-note:not(.w-say), .folio, .w-keep-note, header, nav";
    const reading = [...document.querySelectorAll<HTMLElement>("p, dd, li, textarea, input:not([type=checkbox]):not([type=radio]):not([type=file])")]
      .filter(shown)
      .filter((el) => !el.closest(smallPrint))
      // a line that is only a control (the storyteller pill in the archive's hero) is a label, held to 44px instead
      .filter((el) => {
        const control = el.querySelector("button, a");
        return !control || (control as HTMLElement).innerText.trim() !== (el.innerText || "").trim();
      })
      .filter((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el.innerText || "").trim().length >= 30);
    const small = reading
      .map((el) => ({ text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.className).trim().slice(0, 70), px: Math.round(px(el) * 10) / 10 }))
      .filter((x) => x.px < 15.95);
    const buttons = [...document.querySelectorAll<HTMLElement>(".btn:not(.sm), button[type=submit], .seal-button")]
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

/** Look, check, photograph: what every screen in this milestone gets. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, name);
}

/** The writer never shows what anything costs while ordering is closed (DECISIONS.md: the writer's photo line). */
async function noPriceLine(page: Page, where: string) {
  const text = await page.evaluate(() => document.body.innerText);
  expect.soft(text.match(/[$£€]\s?\d[^\n]*/g) ?? [], `${where}: a price line in the writer`).toEqual([]);
  expect.soft(text.match(/[^\n]*\b(per month|a month|\/mo|per year|a year)\b[^\n]*/gi) ?? [], `${where}: a plan's price in the writer`).toEqual([]);
}

/** The seal's "Keep it" reads whole: on one line, and nothing beside it (the Ctrl + Enter hint) drawn over it. */
async function sealReads(page: Page, where: string) {
  const m = await page.evaluate(() => {
    const seal = document.querySelector<HTMLElement>(".seal-button");
    const hint = document.querySelector<HTMLElement>(".w-keep-note");
    if (!seal) return null;
    const range = document.createRange();
    const label = [...seal.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (label) range.selectNodeContents(label);
    const lines = label ? range.getClientRects().length : 0;
    const a = label ? range.getBoundingClientRect() : seal.getBoundingClientRect();
    const b = hint?.getBoundingClientRect();
    const overlap = !!b && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return { lines, overlap };
  });
  expect.soft(m, `${where}: the seal button`).not.toBeNull();
  expect.soft(m?.lines, `${where}: "Keep it" breaks over lines`).toBe(1);
  expect.soft(m?.overlap, `${where}: the keyboard hint is drawn over "Keep it"`).toBe(false);
}

/** A storyteller with their own story, signed in. */
async function storyteller(page: Page, name = "Sam", extra: Record<string, unknown> = {}) {
  const mock = await mockSupabase(page);
  const user = mock.addUser({ email: `${name.toLowerCase()}@example.com`, firstName: name, lastName: "Hart" });
  const [story] = mock.insert("stories", fixtures.story(user.id, { name, last_name: "Hart", relationship: "Myself", ...extra }));
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, user);
  return { mock, user, story };
}

/** The AI server writes down what was said. */
function stubTranscribe(mock: MockSupabase, text = "We lived by the sea.") {
  let calls = 0;
  mock.api.transcribe = () => {
    calls++;
    return { transcript: text };
  };
  return () => calls;
}

const memoriesOf = (mock: MockSupabase, storyId: unknown) => mock.tables.memories?.filter((m) => m.story_id === storyId) ?? [];

/** A one-pixel photograph, as a file the picker hands over. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+v9/PQAJYQPa9kWZ3wAAAABJRU5ErkJggg==", "base64");

test.beforeEach(async ({ page }) => {
  // the writer's book is laid down and the seal pressed without the long tweens, so the steps are on screen when looked at
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Home shows today's question; writing it keeps the question, and the next visit asks another", async ({ page }) => {
  const { mock, story } = await storyteller(page, "Ada");

  await page.goto("/");
  const ask = page.locator(".home-hero .story-q");
  await expect(ask).toBeVisible();
  const q = (await ask.innerText()).trim();
  expect(q.length).toBeGreaterThan(10);
  await screen(page, "01-home");

  await page.getByRole("link", { name: "Write it" }).first().click();
  await expect(page).toHaveURL(/\/write\?q=/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(q.slice(0, 20));
  await screen(page, "02-writer");
  await noPriceLine(page, "02-writer");

  // a title of their own, so it is the question on the row (not the title) that keeps it from coming back
  await page.getByLabel("Title").fill("The cupboard under the stairs");
  await page.getByLabel("The memory").fill("Under the stairs, with a torch and a book.");
  await sealReads(page, "02-writer, words in");
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect.poll(() => memoriesOf(mock, story.id).length).toBe(1);
  await expect(page.getByRole("heading", { name: /Kept in/ })).toBeVisible();

  const [mem] = memoriesOf(mock, story.id);
  expect(mem).toMatchObject({ title: "The cupboard under the stairs", body: "Under the stairs, with a torch and a book.", question_text: q, status: "saved", via: "written" });
  // the storyteller's own page carries no credit
  expect(mem.contributor ?? null).toBeNull();
  await screen(page, "03-kept");

  // in the archive, and a fresh visit to Home deals a different question
  await page.goto("/archive");
  await expect(page.getByText("The cupboard under the stairs").first()).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".home-hero .story-q")).toBeVisible();
  await expect(page.locator(".home-hero .story-q")).not.toHaveText(q);
  // nor does the writer offer it among today's questions
  await page.goto("/write");
  await expect(page.locator(".w-qs .w-q").filter({ hasText: q.slice(0, 30) })).toHaveCount(0);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the family's question for today leads Home, and answering it tells the server", async ({ page }) => {
  const { mock, story } = await storyteller(page, "Bea");
  const asked = "What song did your mother sing in the kitchen?";
  const [row] = mock.insert("daily_questions", { id: "dq-1", story_id: story.id, text: asked, question_ref: null, asker_name: "Jamie Hart", send_on: TODAY, answered_at: null, created_at: "2026-10-25T08:00:00.000Z" });
  mock.rpcs.story_rota = () => ({ today: TODAY });
  const marked: Record<string, unknown>[] = [];
  mock.rpcs.daily_question_answer = (args) => {
    marked.push(args);
    return true;
  };

  await page.goto("/");
  await expect(page.locator(".home-hero .story-q")).toHaveText(asked);
  await page.getByRole("link", { name: "Write it" }).first().click();
  await page.getByLabel("The memory").fill("“Que sera, sera”, every Sunday while the bread rose.");
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect.poll(() => memoriesOf(mock, story.id).length).toBe(1);

  const [mem] = memoriesOf(mock, story.id);
  expect(mem.question_text).toBe(asked);
  expect(mem.via).toBe("written");
  await expect.poll(() => marked.length).toBe(1);
  expect(marked[0]).toEqual({ p_id: row.id, p_memory: mem.id });
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

/**
 * Grandma Hoa's story, owned by Linh; Jamie (Linh's daughter) keeps it with her. The tree says Jamie is Hoa's
 * granddaughter, so the phone credits her page "Jamie, her granddaughter" with her person id (teller.js tellerCredit).
 */
function keeperFamily(mock: MockSupabase) {
  const owner = mock.addUser({ email: "linh@example.com", firstName: "Linh", lastName: "Tran" });
  const keeper = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Tran" });
  const household = id("b");
  const [story] = mock.insert("stories", fixtures.story(owner.id, { name: "Hoa", last_name: "Tran", relationship: "Grandmother", household_id: household }));
  mock.insert("households", { id: household, created_by: owner.id });
  const hoa = fixtures.person(household, { given_name: "Hoa", family_name: "Tran", sex: "F", story_id: story.id, birth_year: 1940 });
  const linh = fixtures.person(household, { given_name: "Linh", family_name: "Tran", sex: "F", user_id: owner.id });
  const jamie = fixtures.person(household, { given_name: "Jamie", family_name: "Tran", sex: "F", user_id: keeper.id });
  mock.insert("people", hoa, linh, jamie);
  mock.insert("relationships", { id: id("r"), household_id: household, from_person: hoa.id, to_person: linh.id, kind: "parent" }, { id: id("r"), household_id: household, from_person: linh.id, to_person: jamie.id, kind: "parent" });
  mock.insert("memories", fixtures.memory(String(story.id), { title: "The market in Hội An", body: "Hoa sold silk by the river.", contributor: "" }));
  Object.assign(mock.tables.profiles.find((p) => p.id === keeper.id)!, { active_story_id: story.id, onboarding_complete: true });
  return { owner, keeper, story, jamie };
}

test("a keeper writing in a relative's story is credited as the phone credits them", async ({ page }) => {
  const mock = await mockSupabase(page);
  const { keeper, story, jamie } = keeperFamily(mock);
  await mock.signedIn(page, keeper as MockUser);

  await page.goto("/");
  const ask = page.locator(".home-hero .story-q");
  await expect(ask).toBeVisible();
  const q = (await ask.innerText()).trim();
  await expect(page.getByText(/A little question for Hoa/).first()).toBeVisible();
  await screen(page, "04-home-keeper");

  await page.getByRole("link", { name: "Write it" }).first().click();
  await expect(page).toHaveURL(/\/write\?q=/);
  await screen(page, "05-writer-keeper");
  await noPriceLine(page, "05-writer-keeper");
  await page.getByLabel("The memory").fill("She always kept a tin of ginger sweets for us by the door.");
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect.poll(() => memoriesOf(mock, story.id).length).toBe(2);

  const mem = memoriesOf(mock, story.id).find((m) => m.title !== "The market in Hội An")!;
  expect(mem).toMatchObject({ question_text: q, contributor: "Jamie, her granddaughter", author_person_id: jamie.id, via: "written" });
  await expect(page.getByRole("heading", { name: /Kept in/ })).toBeVisible();
  await screen(page, "06-kept-keeper");

  // Home's "From the family" now has it
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "From the family" })).toBeVisible();
  await expect(page.locator(".home-hero .story-q")).not.toHaveText(q);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("signed in, by voice: /talk leads to Record it here, the voice is kept with its words, and it plays", async ({ page }) => {
  const { mock, story } = await storyteller(page);
  const transcribed = stubTranscribe(mock);

  await page.goto("/talk");
  await expect(page.getByRole("link", { name: "Record it here" })).toBeVisible();
  // the browser can't ring anyone: it says where the calls are
  await expect(page.getByText(/Calls that ring .* in the A Story app on iPhone\./)).toBeVisible();
  await screen(page, "07-talk");

  await page.getByRole("link", { name: "Record it here" }).click();
  await expect(page).toHaveURL(/\/record/);
  const q = (await page.locator(".rec-card .talk-q").innerText()).trim();
  await screen(page, "08-record-ready");

  await page.getByRole("button", { name: "Record", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Talking with A Story" })).toBeVisible();
  await screen(page, "09-record-consent");
  await page.getByRole("button", { name: "Allow" }).click();
  await expect(page.getByText("Recording. Take your time.")).toBeVisible();
  await screen(page, "10-recording");
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "I’m done" }).click();
  await expect(page.getByRole("button", { name: /Listen back/ })).toBeVisible();
  await screen(page, "11-record-review");

  await page.getByRole("button", { name: "Say it again" }).click();
  await expect(page.getByRole("heading", { name: "Record over this one?" })).toBeVisible();
  await page.getByRole("button", { name: "Keep this one" }).click();

  await page.getByRole("button", { name: "Keep it" }).click();
  const words = page.getByLabel("Your words, as A Story heard them");
  await expect(words).toHaveValue("We lived by the sea.");
  await screen(page, "12-record-words");
  await words.fill("We lived by the sea, in a white house.");
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByRole("heading", { name: /Kept/ })).toBeVisible();
  await screen(page, "13-record-kept");

  expect(transcribed()).toBe(1);
  const [mem] = memoriesOf(mock, story.id);
  expect(mem).toMatchObject({ body: "We lived by the sea, in a white house.", title: q, question_text: q, via: "recorded" });
  const audio = (mock.tables.memory_audio || []).filter((a) => a.memory_id === mem.id);
  expect(audio).toHaveLength(1);
  const path = String(audio[0].storage_path);
  expect(audio[0]).toMatchObject({ bucket: "memory-audio", transcript: "We lived by the sea, in a white house." });
  expect(path).toMatch(new RegExp(`^${story.id}/${mem.id}/voice\\.(m4a|webm|ogg)$`));
  // the real recording went up to memory-audio at that path
  const stored = mock.objects.get(`memory-audio/${path}`);
  expect(stored?.bytes.length ?? 0, "bytes uploaded to memory-audio").toBeGreaterThan(500);
  expect(stored?.type).toMatch(/^audio\//);

  // the memory page plays it
  await page.getByRole("link", { name: "Read it" }).click();
  await expect(page).toHaveURL(new RegExp(`/archive/${mem.id}$`));
  const play = page.getByRole("button", { name: /^Play .*recording/ });
  await expect(play).toBeEnabled();
  await screen(page, "14-memory-voice");
  await play.click();
  await expect.poll(() => page.locator(".mp-player audio").evaluate((a: HTMLAudioElement) => a.currentTime), { message: "the recording plays" }).toBeGreaterThan(0.2);
  await expect(page.getByRole("button", { name: /^Pause .*recording/ })).toBeVisible();
  await expect(page.getByText(/wouldn’t play|couldn’t be loaded/)).toHaveCount(0);

  // in the archive at once, and the same question is not dealt again
  await page.goto("/archive");
  await expect(page.getByText(q).first()).toBeVisible();
  await page.goto("/record");
  await expect(page.locator(".rec-card .talk-q")).not.toHaveText(q);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a memory can start from a photograph: kept with only the photo and a caption", async ({ page }) => {
  const { mock, story } = await storyteller(page, "Nell");

  await page.goto("/write?photo=1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Start with a photograph.");
  await expect(page.getByRole("button", { name: "Keep it" })).toBeDisabled();
  await screen(page, "15-photo-start");
  await noPriceLine(page, "15-photo-start");

  await page.locator(".w-prints input[type=file]").setInputFiles({ name: "beach.png", mimeType: "image/png", buffer: PNG });
  await expect(page.locator(".w-prints .wphoto")).toHaveCount(1);
  await page.getByLabel("Title").fill("Nana at Brighton, 1962");
  await expect(page.getByRole("button", { name: "Keep it" })).toBeEnabled();
  await screen(page, "16-photo-chosen");
  await noPriceLine(page, "16-photo-chosen");
  await sealReads(page, "16-photo-chosen");

  await page.getByRole("button", { name: "Keep it" }).click();
  await expect.poll(() => memoriesOf(mock, story.id).length).toBe(1);
  await expect(page.getByRole("heading", { name: /Kept in/ })).toBeVisible();

  const [mem] = memoriesOf(mock, story.id);
  expect(mem).toMatchObject({ title: "Nana at Brighton, 1962", body: "", status: "saved" });
  const photos = (mock.tables.memory_photos || []).filter((p) => p.memory_id === mem.id);
  expect(photos).toHaveLength(1);
  expect(String(photos[0].storage_path)).toMatch(new RegExp(`^${story.id}/${mem.id}/.+\\.png$`));
  expect(mem.cover_url).toBe(photos[0].public_url);
  expect([...mock.objects.keys()].filter((k) => k.startsWith(`memory-photos/${story.id}/${mem.id}/`))).toHaveLength(1);
  await screen(page, "17-photo-kept");

  await page.goto("/archive");
  await expect(page.getByText("Nana at Brighton, 1962").first()).toBeVisible();
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the archive shows the chapters not yet told, each a question to answer", async ({ page }) => {
  const { mock, story } = await storyteller(page, "Ivo");
  mock.insert("memories", fixtures.memory(String(story.id)));

  await page.goto("/archive");
  const untold = page.locator(".arc-untold");
  await expect(untold.getByRole("heading", { name: "Not yet told" })).toBeVisible();
  const rows = untold.locator(".arc-untold-row");
  expect(await rows.count()).toBeGreaterThan(0);
  // the chapter that has a memory (Childhood) is not offered
  await expect(untold.locator(".arc-untold-era").filter({ hasText: /^Childhood$/ })).toHaveCount(0);
  await untold.scrollIntoViewIfNeeded();
  await screen(page, "18-archive-untold");

  const first = rows.first();
  const q = (await first.locator(".arc-untold-q").innerText()).trim();
  await first.getByRole("link", { name: /^Answer:/ }).click();
  await expect(page).toHaveURL(/\/write\?q=/);
  // the same question, whichever way its quotes were curled
  const plain = (s: string) => s.replace(/[‘’“”'"]/g, "").trim();
  await expect.poll(async () => plain(await page.getByRole("heading", { level: 1 }).innerText())).toBe(plain(q));
  await noPriceLine(page, "19-writer-untold");
  await shot(page, "19-writer-untold");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("no microphone: writing is the way in", async ({ page }) => {
  await storyteller(page, "Rae");
  await page.addInitScript(() => {
    Object.defineProperty(window, "MediaRecorder", { value: undefined, configurable: true });
  });
  await page.goto("/record");
  await expect(page.getByText("This browser can’t record.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Write it instead" })).toHaveAttribute("href", /\/write\?q=/);
  await screen(page, "20-record-no-mic");
});
