/**
 * M3, the family loop (docs/overnight/AUDIT.md §4, gap rows 7, 10, 11, 19, 26-30 and 34), against the in-memory
 * Supabase: the Family page shows the family's own code, made once by family_code_for and kept while it has more than
 * a week to run, with Copy and a QR, and every code out says the date it stops working (never "N days left");
 * someone who has passed away is added to the tree with the year they died and no code, and is given a face; the
 * account sets its own picture and sees who it is to the storyteller; the keeper sends today's question to the
 * storyteller as an /a/ answer link, from Home and from the storyteller's page, with Copy and a QR; a family with no
 * story still draws its tree; a signed-out visitor reads the family's link (/join/:code, and the phone's /?ref=CODE),
 * adds what they remember and keeps it with an account; a code that opens no story keeps the account plate; and a
 * relative who joins lands on /joined with the family's newest memory.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M3/ and held to the floor: body text 16px
 * and up, main buttons 44px and up, no sideways scroll, and none of the words the product never says (a price, a
 * free book or print, days left, a trial). Those checks are soft, so one bad sentence is reported without hiding the
 * rest of the flow.
 */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { fixtures, id, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";

const SHOTS = "docs/overnight/shots/M3";
const TODAY = "2026-10-27";
const DAY = 86_400_000;

/** A full-page picture of the screen, named for the step and the width: 01-family-code-360.png. */
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
    // print is what the design marks as such: meta lines, notes, the page's folio, the labels in a header or the bar,
    // and anything set as BAOS rule 16 sets it: quiet (a softer ink than the body's) at 13px or more, or the book's
    // tracked small caps at 11px or more. Nothing is under 11px, whatever it is.
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

/** A control the person came to press (Copy, Add a picture): 44px tall at least, whatever size class it wears. */
async function bigEnough(target: Locator, where: string) {
  const box = await target.boundingBox();
  expect.soft(box?.height ?? 0, `${where}: under 44px tall`).toBeGreaterThanOrEqual(43.5);
}

/** A control nothing is drawn over (the tab bar, a footer): scrolled to, its middle answers to it. */
async function reachable(target: Locator, where: string) {
  await target.scrollIntoViewIfNeeded();
  const hit = await target.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!top && (top === el || el.contains(top));
  });
  expect.soft(hit, `${where}: something is drawn over it`).toBe(true);
}

/** Look, check, photograph: what every screen in this milestone gets. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, name);
}

/** What the page last put on the clipboard. */
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

/** A real picture for the file pickers: a 300 x 400 PNG drawn in the page, taller than wide as a portrait is. */
async function portraitPng(page: Page): Promise<Buffer> {
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 400;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c9b48a";
    g.fillRect(0, 0, 300, 400);
    g.fillStyle = "#6b4f2a";
    g.beginPath();
    g.arc(150, 150, 70, 0, Math.PI * 2);
    g.fill();
    return c.toDataURL("image/png").split(",")[1];
  });
  return Buffer.from(data, "base64");
}

/**
 * Grandma Hoa's story, kept by Linh (signed in): Hoa and Linh in one tree. family_code_for makes the family's code
 * as the server does: a row in family_codes that listMyCodes reads back, good for 30 days and ten people, and the
 * same code handed back while one for the story has more than a week to run (so React's development double effect
 * asks twice but only one code is ever out).
 */
async function hoasFamily(page: Page) {
  const mock = await mockSupabase(page);
  const linh = mock.addUser({ email: "linh@example.com", firstName: "Linh", lastName: "Tran" });
  const household = id("b");
  const [story] = mock.insert("stories", fixtures.story(linh.id, { name: "Hoa", last_name: "Tran", relationship: "Mother", household_id: household }));
  mock.insert("households", { id: household, created_by: linh.id });
  const hoa = fixtures.person(household, { given_name: "Hoa", family_name: "Tran", sex: "F", story_id: story.id, birth_year: 1940 });
  const me = fixtures.person(household, { given_name: "Linh", family_name: "Tran", sex: "F", user_id: linh.id });
  mock.insert("people", hoa, me);
  mock.insert("relationships", { id: id("r"), household_id: household, from_person: hoa.id, to_person: me.id, kind: "parent" });
  mock.insert("memories", fixtures.memory(String(story.id), { title: "The market in Hội An", body: "Hoa sold silk by the river." }));
  Object.assign(mock.tables.profiles.find((p) => p.id === linh.id)!, { active_story_id: story.id, onboarding_complete: true });

  const codeCalls: Row[] = [];
  mock.rpcs.family_code_for = (args, { user }) => {
    codeCalls.push(args);
    const now = Date.now();
    const standing = mock.table("family_codes").find((c) => c.story_id === args.sid && !c.person_id && Date.parse(String(c.expires_at)) - now > 7 * DAY);
    if (standing) return standing.code;
    const code = "FAM234";
    mock.insert("family_codes", {
      code,
      created_by: user?.id ?? null,
      person_id: args.pid ?? null,
      story_id: args.sid ?? null,
      max_uses: 10,
      uses: 0,
      expires_at: new Date(now + 30 * DAY).toISOString(),
      created_at: new Date(now).toISOString(),
    });
    return code;
  };
  await mock.signedIn(page, linh);
  return { mock, linh, household, story, hoa, me, codeCalls };
}

const peopleNamed = (mock: MockSupabase, name: string) => (mock.tables.people ?? []).filter((p) => p.given_name === name);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Copy is read back from the clipboard; without these the app falls back to window.prompt
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("the Family page shows the family's code, made once and kept on the next visit", async ({ page }) => {
  const { mock, story, codeCalls } = await hoasFamily(page);

  await page.goto("/family");
  await expect(page.getByRole("heading", { name: "Invitations" })).toBeVisible({ timeout: 15_000 });
  const card = page.locator(".fcode");
  await expect(card.getByLabel("Family code F A M 2 3 4")).toBeVisible();
  await expect(card.getByText(/works until/i).first()).toBeVisible();
  expect(codeCalls.length).toBeGreaterThan(0);
  expect(codeCalls.every((c) => c.pid === null && c.sid === story.id)).toBe(true);
  await screen(page, "01-family-code");
  const asked = codeCalls.length;

  // the next visit finds the code already out and makes no other
  await page.reload();
  await expect(page.locator(".fcode").getByLabel("Family code F A M 2 3 4")).toBeVisible({ timeout: 15_000 });
  expect(codeCalls.length).toBe(asked);
  expect(mock.tables.family_codes?.length).toBe(1);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the family's code copies, its link copies, and a QR carries the link", async ({ page }) => {
  const { mock } = await hoasFamily(page);

  await page.goto("/family");
  const card = page.locator(".fcode");
  await expect(card.getByLabel("Family code F A M 2 3 4")).toBeVisible({ timeout: 15_000 });

  const copyCode = card.getByRole("button", { name: "Copy", exact: true });
  await bigEnough(copyCode, "the code card's Copy");
  await copyCode.click();
  await expect(card.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await clipboard(page)).toBe("FAM234");

  const copyLink = card.getByRole("button", { name: "Copy link" });
  await bigEnough(copyLink, "the code card's Copy link");
  await copyLink.click();
  await expect.poll(() => clipboard(page)).toMatch(/\/join\/FAM234$/);
  await expect(card.getByText(/\/join\/FAM234/)).toBeVisible();

  const qr = card.getByRole("img", { name: /QR code for the family’s link/ });
  await expect(qr).toBeVisible();
  await expect(qr.locator("svg")).toHaveCount(1);
  const qrBox = await qr.boundingBox();
  expect(qrBox?.width ?? 0, "a QR big enough to scan").toBeGreaterThanOrEqual(96);

  await card.getByRole("button", { name: "Copy the whole message" }).click();
  await expect.poll(() => clipboard(page)).toContain("FAM234");
  const message = await clipboard(page);
  expect(message).toMatch(/\/join\/FAM234/);
  expect.soft(message, "the message names no countdown").not.toMatch(/days?\s+left|trial/i);
  await screen(page, "02-family-code-copied");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("every code out says the date it stops working, never how many days are left", async ({ page }) => {
  const { mock, linh, household, story } = await hoasFamily(page);
  // Bao was given a code three days ago that runs out in four: the list and Bao's page say the date
  const bao = fixtures.person(household, { given_name: "Bao", family_name: "Tran", sex: "M", invited_at: new Date(Date.now() - 3 * DAY).toISOString() });
  mock.insert("people", bao);
  const ends = new Date(Date.now() + 4 * DAY);
  mock.insert("family_codes", {
    code: "BAO777",
    created_by: linh.id,
    person_id: bao.id,
    story_id: story.id,
    max_uses: 1,
    uses: 0,
    expires_at: ends.toISOString(),
    created_at: new Date(Date.now() - 3 * DAY).toISOString(),
  });
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][ends.getMonth()];
  const until = new RegExp(`works until ${ends.getDate()} ${month}`);

  await page.goto("/family");
  const list = page.getByRole("list", { name: "Codes you’ve sent" });
  await expect(list).toBeVisible({ timeout: 15_000 });
  const line = list.getByRole("listitem").filter({ hasText: "BAO 777" });
  await expect(line).toContainText("for Bao Tran");
  await expect(line).toContainText(until);
  await expect(page.getByText(/\d+\s+days?\s+left/i)).toHaveCount(0);
  await screen(page, "03-codes-until");

  await page.goto(`/family/${bao.id}`);
  await expect(page.getByRole("heading", { name: /Bao/ }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/\d+\s+days?\s+left/i)).toHaveCount(0);
  await screen(page, "04-invited-person");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("someone who has passed away joins the tree with the year they died and a face, and no code is made for them", async ({ page }) => {
  const { mock, household, codeCalls } = await hoasFamily(page);

  await page.goto("/family");
  await expect(page.getByRole("heading", { name: "Invitations" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".fcode").getByLabel(/Family code/)).toBeVisible();
  await page.getByRole("button", { name: "Invite someone" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Invite someone" });
  await sheet.getByLabel("First name").fill("Walter");
  await sheet.getByRole("button", { name: /^partner$/i }).click();
  await sheet.getByLabel("Year born").fill("1936");
  await sheet.getByText("Walter has passed away").click();
  await sheet.getByLabel("Year they passed away").fill("1979");
  await expect(sheet.getByLabel(/Email/)).toHaveCount(0);
  await screen(page, "05-passed-away");
  await sheet.getByRole("button", { name: "Add to the family" }).click();
  await expect(sheet.getByRole("heading", { name: "Walter is in the family" })).toBeVisible();

  await expect.poll(() => peopleNamed(mock, "Walter").length).toBe(1);
  const [walter] = peopleNamed(mock, "Walter");
  expect(Number(walter.death_year)).toBe(1979);
  expect(Number(walter.birth_year)).toBe(1936);
  expect(walter.invited_at ?? null).toBeNull();
  // the only code made is the family's own, never one for Walter
  expect(codeCalls.every((c) => !c.pid)).toBe(true);
  await screen(page, "06-remembered");

  // Walter's page: the years, no way to ask him, and a face from this computer
  await page.goto(`/family/${walter.id}`);
  await expect(page.getByText("Born 1936 · Passed away 1979").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /^Ask Walter/ })).toHaveCount(0);
  // what to write about him is asked of a life that has ended: nothing in the present tense
  const prompts = await page.getByRole("list", { name: "Something to write about Walter" }).innerText();
  expect
    .soft(
      prompts.split("\n").filter((q) => /\b(is|does|has|loves?|makes)\s+Walter\b|\bthese days\b/.test(q)),
      "questions in the present tense about someone who has passed",
    )
    .toEqual([]);
  await page.getByRole("button", { name: "Change Walter’s details" }).click();
  const face = page.getByRole("group", { name: "Walter’s picture" });
  const add = face.getByRole("button", { name: "Add a picture" });
  await expect(add).toBeVisible();
  await bigEnough(add, "Walter's Add a picture");
  await face.locator("input[type=file]").setInputFiles({ name: "walter.png", mimeType: "image/png", buffer: await portraitPng(page) });
  await expect(face.getByRole("status")).toHaveText("Saved. Only your family can see it.");
  const key = [...mock.objects.keys()].find((k) => k.startsWith(`family-photos/${household}/${walter.id}/`));
  expect(key, "Walter's face in family-photos/{household}/{person}/").toBeTruthy();
  expect(mock.objects.get(key!)?.type).toBe("image/jpeg");
  expect(String(walter.avatar_url || "")).toContain(key!.replace(/^family-photos\//, ""));
  await screen(page, "07-remembered-face");

  // "Remove from the tree" can be read: its words are not drawn in the colour of its own fill
  const remove = page.getByRole("button", { name: "Remove from the tree" });
  await expect(remove).toBeVisible();
  const inks = await remove.evaluate((el) => {
    const s = getComputedStyle(el);
    return { ink: s.color, fill: s.backgroundColor };
  });
  expect.soft(inks.ink, "Remove from the tree: words the colour of the button").not.toBe(inks.fill);

  // a year typed with words around it keeps only its digits, as "Year born" does
  const died = page.getByLabel("Year they passed away");
  await died.fill("about 1979");
  await expect.soft(died, "the year they died keeps only digits").toHaveValue("1979");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the account sets its own picture, and says who it is to the storyteller", async ({ page }) => {
  const { mock, linh, me } = await hoasFamily(page);

  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Your picture" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Who you are to Hoa" })).toBeVisible();
  await expect(page.getByText("Hoa’s daughter")).toBeVisible();
  await expect(page.getByRole("link", { name: "Change it in the family tree" })).toHaveAttribute("href", "/family");
  await screen(page, "08-account-profile");

  const face = page.getByRole("group", { name: "Your picture" });
  await bigEnough(face.getByRole("button", { name: "Add a picture" }), "Your picture's Add a picture");
  await face.locator("input[type=file]").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: await portraitPng(page) });
  await expect(face.getByRole("status")).toHaveText("Your picture is set.");

  // the account's picture, public and cache-busted, and the same face on Linh's own place in the tree
  expect(mock.objects.get(`avatars/${linh.id}/avatar.jpg`)?.type).toBe("image/jpeg");
  const profile = mock.tables.profiles.find((p) => p.id === linh.id)!;
  expect(String(profile.avatar_url)).toMatch(/\/avatars\/.+\/avatar\.jpg\?t=\d+$/);
  expect([...mock.objects.keys()].some((k) => k.startsWith(`family-photos/${me.household_id}/${me.id}/`))).toBe(true);
  expect(String(me.avatar_url || "")).toContain(`/${me.id}/`);
  await expect(face.getByRole("button", { name: "Choose another picture" })).toBeVisible();
  await screen(page, "09-account-picture");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("Home sends today's question to the storyteller as an answer link", async ({ page }) => {
  const { mock, story, hoa } = await hoasFamily(page);
  mock.rpcs.story_rota = () => ({ today: TODAY, next: TODAY, days: [] });
  const asked: Row[] = [];
  mock.rpcs.daily_question_create = (args) => {
    asked.push(args);
    return { id: "dq-9", send_on: TODAY, today: TODAY, link_token: "tok-hoa-1" };
  };

  await page.goto("/");
  const ask = page.getByRole("button", { name: "Ask Hoa today’s question" });
  await expect(ask).toBeVisible({ timeout: 15_000 });
  await ask.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("button", { name: "Make the link" })).toBeEnabled();
  await screen(page, "10-ask-choose");
  await sheet.getByRole("button", { name: "Make the link" }).click();

  await expect(sheet.getByText("/a/tok-hoa-1")).toBeVisible();
  await expect(sheet.getByText(/ready for Hoa to answer now/)).toBeVisible();
  expect(asked).toHaveLength(1);
  expect(asked[0]).toMatchObject({ p_story: story.id, p_teller: hoa.id, p_ms: 0 });
  expect(String(asked[0].p_text).length).toBeGreaterThan(10);

  await expect(sheet.getByRole("img", { name: /QR code for .*answer link/ })).toBeVisible();
  const copy = sheet.getByRole("button", { name: "Copy link" });
  await bigEnough(copy, "the answer link's Copy link");
  await copy.click();
  await expect(sheet.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await clipboard(page)).toMatch(/\/a\/tok-hoa-1$/);
  await screen(page, "11-ask-link");
  await reachable(sheet.getByRole("button", { name: "Done" }), "the ask sheet's Done on Home");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("'Ask Hoa' on her page makes an answer link with a QR and Copy", async ({ page }) => {
  const { mock, story, hoa } = await hoasFamily(page);
  mock.rpcs.story_rota = () => ({ today: TODAY, next: TODAY, days: [] });
  const asked: Row[] = [];
  mock.rpcs.daily_question_create = (args) => {
    asked.push(args);
    return { id: "dq-10", send_on: TODAY, today: TODAY, link_token: "tok-hoa-2" };
  };

  await page.goto(`/family/${hoa.id}`);
  const ask = page.getByRole("button", { name: "Ask Hoa", exact: true });
  await expect(ask).toBeVisible({ timeout: 15_000 });
  await screen(page, "12-person-ask");
  await ask.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Ask Hoa a question" })).toBeVisible();
  await sheet.getByRole("button", { name: "Make the link" }).click();
  await expect(sheet.getByRole("heading", { name: "Send Hoa the link" })).toBeVisible();
  await expect(sheet.getByText("/a/tok-hoa-2")).toBeVisible();
  expect(asked).toHaveLength(1);
  expect(asked[0]).toMatchObject({ p_story: story.id, p_teller: hoa.id });
  await expect(sheet.getByRole("img", { name: /QR code for .*answer link/ })).toBeVisible();
  await screen(page, "13-person-ask-link");
  // the sheet is drawn over the page, never under it: its Copy link answers to a press
  const copy = sheet.getByRole("button", { name: "Copy link" });
  await reachable(copy, "the ask sheet's Copy link on Hoa's page");
  // pressed as a click reaches it, so the copy itself is still checked when something is drawn over the sheet
  await copy.dispatchEvent("click");
  await expect.poll(() => clipboard(page)).toMatch(/\/a\/tok-hoa-2$/);
  // Done is the sheet's last word; it has to be pressable at every width (Close in the corner always is)
  await reachable(sheet.getByRole("button", { name: "Done" }), "the ask sheet's Done on Hoa's page");
  await reachable(sheet.getByRole("button", { name: "Close" }), "the ask sheet's Close on Hoa's page");
  await sheet.getByRole("button", { name: "Close" }).dispatchEvent("click");
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask Hoa", exact: true })).toBeFocused();
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a family with no story yet still draws its tree", async ({ page }) => {
  const mock = await mockSupabase(page);
  const sam = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Lee" });
  const household = id("b");
  mock.insert("households", { id: household, created_by: sam.id });
  const me = fixtures.person(household, { given_name: "Sam", family_name: "Lee", sex: "M", user_id: sam.id });
  const mum = fixtures.person(household, { given_name: "Mai", family_name: "Lee", sex: "F", birth_year: 1960 });
  mock.insert("people", me, mum);
  mock.insert("relationships", { id: id("r"), household_id: household, from_person: mum.id, to_person: me.id, kind: "parent" });
  Object.assign(mock.tables.profiles.find((p) => p.id === sam.id)!, { onboarding_complete: true });
  await mock.signedIn(page, sam);

  await page.goto("/family");
  await expect(page).toHaveURL(/\/family$/, { timeout: 15_000 });
  const tree = page.getByRole("region", { name: "The family tree" });
  await expect(tree).toBeVisible({ timeout: 15_000 });
  await expect(tree.getByText("Sam").first()).toBeVisible();
  await expect(tree.getByText("Mai").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "No story yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add someone" })).toBeVisible();
  await screen(page, "14-tree-no-story");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

/** Rose's family link, as family_link_read answers it for RS4HNT (nothing for any other code). */
function rosesLink(mock: MockSupabase) {
  mock.rpcs.family_link_read = (a) =>
    a.p_code === "RS4HNT"
      ? {
          story_id: "s1",
          name: "Rose",
          last_name: "Miller",
          photo_url: null,
          birth_year: "1941",
          sender_name: "Jamie",
          memories: [
            { id: "m1", title: "The kitchen", body: "We had a blue kitchen on Elm Street.\n\nIt smelled of bread.", created_at: "2026-10-01T10:00:00Z", via: "written", period: "1955" },
            { id: "m2", title: "The goose", body: "My father kept a very bad-tempered goose.", created_at: "2026-10-20T10:00:00Z", contributor: "Linh, her daughter", via: "link" },
          ],
        }
      : null;
}

test("a visitor reads the family's link, adds a memory and keeps it with an account", async ({ page }) => {
  const mock = await mockSupabase(page);
  rosesLink(mock);
  let sent: Row | null = null;
  mock.rpcs.family_link_add_memory = (a) => {
    sent = a;
    return [{ id: "c0ffee00-0000-4000-8000-000000000001", status: "pending" }];
  };

  await page.goto("/join/RS4HNT");
  await expect(page.getByRole("heading", { name: /Rose Miller’s family/ })).toBeVisible({ timeout: 15_000 });
  await page.getByText("The goose").click();
  await expect(page.getByText("bad-tempered goose")).toBeVisible();
  await screen(page, "15-link-read");
  await page.getByRole("button", { name: "Add what you remember" }).click();
  await page.getByLabel("What you remember about Rose").fill("She taught me to whistle.");
  await screen(page, "16-link-write");
  await page.getByRole("button", { name: /Next: who/ }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Sam Lee");
  await page.getByRole("textbox", { name: /^How you knew Rose/ }).fill("Her neighbour");
  await page.getByRole("button", { name: "Send it to Jamie" }).click();
  await expect(page.getByRole("heading", { name: /Sent to Jamie/ })).toBeVisible();
  expect(sent).toMatchObject({ p_code: "RS4HNT", p_name: "Sam Lee", p_how: "Her neighbour", p_body: "She taught me to whistle." });
  await screen(page, "17-link-sent");

  await page.getByLabel("Your email").fill("sam@example.com");
  await page.getByRole("button", { name: "Keep this, make an account" }).click();
  await expect(page).toHaveURL(/\/create-account\?code=RS4HNT/);
  expect(page.url()).not.toContain("sam@");
  await expect(page.getByLabel("Email")).toHaveValue("sam@example.com");
  const held = await page.evaluate(() => localStorage.getItem("astory-pending-claims"));
  expect(held).toContain("sam@example.com");
  // nobody signed in at any point: no session was asked for
  expect(mock.sent("/auth/v1/token")).toEqual([]);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("the phone's family link (/?ref=CODE) opens the same page without an account", async ({ page }) => {
  const mock = await mockSupabase(page);
  rosesLink(mock);
  await page.goto("/?ref=rs4hnt");
  await expect(page).toHaveURL(/\/join\/RS4HNT$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Rose Miller’s family/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add what you remember" })).toBeVisible();
  await screen(page, "18-link-ref");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a code that opens no story keeps the account plate", async ({ page }) => {
  const mock = await mockSupabase(page);
  mock.rpcs.family_link_read = () => null;
  await page.goto("/join/RS4HNT");
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible({ timeout: 15_000 });
  await screen(page, "19-join-plate");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a relative who joins with a code lands on /joined with the family's newest memory", async ({ page }) => {
  const mock = await mockSupabase(page);
  const me = mock.addUser({ email: "linh@example.com", password: "linh-password-1", firstName: "Linh", lastName: "Tran" });
  const [story] = mock.insert("stories", fixtures.story(me.id, { name: "Rose", last_name: "Miller" }));
  mock.insert("memories", fixtures.memory(String(story.id), { title: "An older memory", created_at: "2026-09-02T10:00:00Z" }));
  mock.insert("memories", fixtures.memory(String(story.id), { title: "The kitchen on Elm Street", created_at: "2026-10-20T10:00:00Z" }));
  mock.rpcs.join_family = () => ({ ok: true, story_id: story.id, story_name: "Rose", inviter_name: "Jamie", person_name: "Linh" });
  await mock.signedIn(page, me);

  await page.goto("/join/RS4HNT");
  await expect(page).toHaveURL(/\/joined$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /You’re in, Linh/ })).toBeVisible();
  await expect(page.getByText(/Jamie invited you/)).toBeVisible();
  await expect(page.getByText("The kitchen on Elm Street").first()).toBeVisible();
  await expect(page.getByText("An older memory")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Answer today’s question/ })).toBeVisible();
  await screen(page, "20-joined");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
