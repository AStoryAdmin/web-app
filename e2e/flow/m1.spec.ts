/**
 * M1, the front door and the same account (docs/overnight/AUDIT.md §4), against the in-memory Supabase:
 * signed out, / opens on Welcome; a new account (password, at least 8) → the emailed code → "Whose story is this?" →
 * Home; an account made on the phone signs in with an emailed code; an invited keeper lands on the story they were
 * invited to, not on /start; a reset link asks only for the new password; and an email never rides in a URL.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M1/ (01-welcome-360.png ...), and every
 * screen is held to the floor: body text 16px and up, main buttons 44px and up, no sideways scroll, and none of
 * the words the product never says (a price, a free book or print, days left, a trial). Those checks are soft, so
 * one bad sentence is reported without hiding the rest of the flow.
 */
import { expect, test, type Page } from "@playwright/test";
import { AUTH_STORAGE_KEY, fixtures, mockSupabase, OTP, sessionJson, type MockSupabase } from "../support/mockSupabase";

const SHOTS = "docs/overnight/shots/M1";

/** A full-page picture of the screen, named for the step and the width: 01-welcome-360.png. */
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
    // reading text: any paragraph, definition or list line long enough to be a sentence, and every text field
    // (the code field's own text is invisible; its six slots draw the digits)
    const reading = [...document.querySelectorAll<HTMLElement>("p, dd, li, input:not([type=checkbox]):not([type=radio]):not(.plate-code-input)")]
      .filter(shown)
      .filter((el) => el.tagName === "INPUT" || (el.innerText || "").trim().length >= 30);
    const small = reading
      .map((el) => ({ text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.className).trim().slice(0, 70), px: Math.round(px(el) * 10) / 10 }))
      .filter((x) => x.px < 15.95);
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

/** Look, check, photograph: what every screen in this milestone gets. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, name);
}

/** Every address the tab has been at, history pushes included, for the never-in-the-URL check. */
function watchUrls(page: Page): string[] {
  const urls: string[] = [];
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) urls.push(f.url());
  });
  return urls;
}

/** The address must not show up in a page URL, nor in a request URL (bodies are where it belongs). */
function expectNoEmailInUrls(urls: string[], mock: MockSupabase, email: string) {
  const forms = [email, encodeURIComponent(email), email.replace("@", "%40")].map((s) => s.toLowerCase());
  const leaks = [...urls, ...mock.calls.map((c) => c.url)].filter((u) => forms.some((f) => u.toLowerCase().includes(f)));
  expect(leaks, "an email in a URL").toEqual([]);
}

/** The emailed code, typed into the plate's one field; six digits submit on their own. */
async function typeCode(page: Page, code = OTP) {
  await page.getByLabel("6-digit code").fill(code);
}

/** A story with one memory, as the phone app would have saved it, and the profile pointing at it. */
function storyFor(mock: MockSupabase, ownerId: string, extra: Record<string, unknown> = {}) {
  const story = fixtures.story(ownerId, extra);
  mock.insert("stories", story);
  mock.insert("memories", fixtures.memory(String(story.id)));
  return story;
}

test.beforeEach(async ({ page }) => {
  // the sign-in book's opening flourish once per tab: off, so the forms are on screen when the test looks
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("signed out, the front door is Welcome, not Sign in", async ({ page }) => {
  const mock = await mockSupabase(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every life holds a story");
  await expect(page.getByRole("link", { name: "Begin a book" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Sign in/ })).toHaveCount(0);
  await screen(page, "01-welcome");

  // a deep link still goes to sign in and comes back
  await page.goto("/archive");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Farchive$/);
  await expect(page.getByRole("heading", { name: /^Sign in/ })).toBeVisible();
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a new account: password, the emailed code, whose story, then Home", async ({ page }) => {
  const mock = await mockSupabase(page);
  const urls = watchUrls(page);
  const email = "mai.tran@example.com";

  await page.goto("/");
  await page.getByRole("link", { name: "Begin a book" }).click();
  await expect(page).toHaveURL(/\/create-account/);
  await page.getByLabel("Your name (this book belongs to)").fill("Mai Tran");
  await page.getByLabel("Email").fill(email);
  await screen(page, "02-create-who");
  await page.getByRole("button", { name: "Continue" }).click();

  // seven characters is one short: the app's PASSWORD_MIN is 8
  const password = page.getByLabel(/^Password/);
  await password.fill("short77");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("The password needs at least 8 characters.")).toBeVisible();
  expect(mock.sent("/auth/v1/signup")).toHaveLength(0);
  await screen(page, "03-create-password");

  await password.fill("kitchen-pear-tree");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify\?/);
  await expect(page.getByText(email)).toBeVisible();
  const signup = mock.sent("/auth/v1/signup")[0];
  expect(signup?.body).toMatchObject({ email, password: "kitchen-pear-tree", data: { first_name: "Mai", last_name: "Tran", signed_up_on: "web" } });
  await screen(page, "04-verify");

  // a wrong code is refused in plain words; the right one goes on
  await typeCode(page, "111111");
  await expect(page.getByText("That code isn’t right, or it has run out. Check it, or send another.")).toBeVisible();
  await page.getByLabel("6-digit code").fill("");
  await typeCode(page);
  await expect.poll(() => mock.sent("/auth/v1/verify").at(-1)?.body).toMatchObject({ email, token: OTP, type: "signup" });

  // no story yet: the one question between an account and Home
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("heading", { name: /Whose story is this/ })).toBeVisible();
  await screen(page, "05-start");

  await page.getByRole("button", { name: /Someone in my family/ }).click();
  await page.getByLabel("Their first name").fill("Rose");
  await screen(page, "06-start-about-them");
  await page.getByRole("button", { name: "Begin Rose’s story" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Rose’s story/).filter({ visible: true }).first()).toBeVisible();
  const user = mock.userByEmail(email)!;
  const made = mock.tables.stories?.find((s) => s.owner_id === user.id);
  expect(made, "the story row").toMatchObject({ name: "Rose", relationship: "Mother" });
  expect(mock.tables.profiles.find((p) => p.id === user.id)).toMatchObject({ active_story_id: made!.id, onboarding_complete: true });
  await screen(page, "07-home-new");

  expectNoEmailInUrls(urls, mock, email);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("an account made on the phone signs in with an emailed code", async ({ page }) => {
  const mock = await mockSupabase(page);
  const urls = watchUrls(page);
  // the phone's default: a code by email, no password ever set
  const user = mock.addUser({ email: "bao.nguyen@example.com", password: null, firstName: "Bao", lastName: "Nguyen" });
  const story = storyFor(mock, user.id);
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });

  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /^Sign in/ })).toBeVisible();
  await screen(page, "08-sign-in");

  // an address with no account is told so, not given a fresh empty one
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByRole("button", { name: "Email me a code instead" }).click();
  await expect(page.getByText("We don’t have an account with that email. Check it, or create one.")).toBeVisible();
  expect(mock.userByEmail("nobody@example.com")).toBeUndefined();

  await page.getByLabel("Email").fill("Bao.Nguyen@example.com ");
  await page.getByRole("button", { name: "Email me a code instead" }).click();
  await expect(page).toHaveURL(/\/verify\?/);
  expect(mock.sent("/auth/v1/otp").at(-1)?.body).toMatchObject({ email: "bao.nguyen@example.com", create_user: false });
  await expect(page.getByText("No password needed.", { exact: false })).toBeVisible();
  await screen(page, "09-sign-in-code");

  await typeCode(page);
  await expect.poll(() => mock.sent("/auth/v1/verify").at(-1)?.body).toMatchObject({ email: "bao.nguyen@example.com", token: OTP, type: "email" });
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Rose’s story/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("The kitchen on Elm Street").filter({ visible: true }).first()).toBeVisible();
  await screen(page, "10-home-by-code");

  expect(urls.some((u) => /\/start$/.test(u)), "went through /start").toBe(false);
  expectNoEmailInUrls(urls, mock, "bao.nguyen@example.com");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("an invited keeper lands on Home with the story they were invited to", async ({ page }) => {
  const mock = await mockSupabase(page);
  const urls = watchUrls(page);
  const owner = mock.addUser({ email: "linh@example.com", password: "owner-password", firstName: "Linh", lastName: "Tran" });
  const keeper = mock.addUser({ email: "an.keeper@example.com", password: "keeper-password", firstName: "An", lastName: "Pham" });
  // the story was shared with An's email; it reads as theirs only once sign-in accepts the invitation, which is slow
  const story = fixtures.story(owner.id, { name: "Grandma Hoa", last_name: "Tran", relationship: "Grandmother" });
  mock.holdUntil("stories", story, "accept_story_invites");
  mock.holdUntil("memories", fixtures.memory(String(story.id), { title: "The market in Hội An" }), "accept_story_invites");
  mock.rpcs.accept_story_invites = () => ({ status: 200, body: 1, delayMs: 1200 });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(keeper.email);
  await page.getByLabel(/^Password/).fill("keeper-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(page.getByText(/Grandma Hoa’s story/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("The market in Hội An").filter({ visible: true }).first()).toBeVisible();
  expect(urls.some((u) => /\/start$/.test(u)), "went through /start").toBe(false);
  expect(mock.sent("/rest/v1/rpc/accept_story_invites")).toHaveLength(1);
  await screen(page, "11-home-invited");

  expectNoEmailInUrls(urls, mock, keeper.email);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a reset link asks only for the new password, then goes on to Home", async ({ page }) => {
  const mock = await mockSupabase(page);
  const urls = watchUrls(page);
  const user = mock.addUser({ email: "rosa@example.com", password: "old-password-1", firstName: "Rosa", lastName: "Diaz" });
  const story = storyFor(mock, user.id);
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });

  // resetPasswordForEmail left a PKCE verifier marked "recovery" in this browser; the email's link brings ?code=
  await page.addInitScript((key) => {
    try {
      if (!sessionStorage.getItem("flow-verifier")) {
        sessionStorage.setItem("flow-verifier", "1");
        localStorage.setItem(`${key}-code-verifier`, JSON.stringify("flow-test-verifier/recovery"));
      }
    } catch {
      /* no storage: the link reads as run out */
    }
  }, AUTH_STORAGE_KEY);
  await page.goto(`/reset-password?code=recovery-${user.id}`);

  await expect(page.getByRole("heading", { name: /Choose a new password/ })).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
  // the code was exchanged and taken out of the address
  expect(mock.sent("/auth/v1/token?grant_type=pkce")).toHaveLength(1);
  await expect(page).toHaveURL(/\/reset-password$/);
  await screen(page, "12-reset-link");

  const field = page.getByLabel(/^New password/);
  await field.fill("short");
  await page.getByRole("button", { name: "Save and go on" }).click();
  await expect(page.getByText("The new password needs at least 8 characters.")).toBeVisible();
  await field.fill("pear-tree-window");
  await page.getByRole("button", { name: "Save and go on" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Rose’s story/).filter({ visible: true }).first()).toBeVisible();
  expect(mock.sent("/auth/v1/user", "PUT").at(-1)?.body).toMatchObject({ password: "pear-tree-window" });
  expect(user.password).toBe("pear-tree-window");
  await screen(page, "13-home-after-reset");

  expectNoEmailInUrls(urls, mock, user.email);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("a reset link that has run out says so and offers a code", async ({ page }) => {
  const mock = await mockSupabase(page);
  await page.goto("/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
  await expect(page.getByText("That reset link has run out. Type your email and we’ll send a fresh code.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send the code" })).toBeVisible();
  await screen(page, "14-reset-expired");

  await page.getByLabel("Email").fill("rosa@example.com");
  await page.getByRole("button", { name: "Send the code" }).click();
  await expect(page.getByRole("heading", { name: /Choose a new password/ })).toBeVisible();
  expect(mock.sent("/auth/v1/recover").at(-1)?.body).toMatchObject({ email: "rosa@example.com" });
  await screen(page, "15-reset-code");

  // the code path's own verifyOtp fires PASSWORD_RECOVERY: the code form must stay put, and its error on it
  const user = mock.addUser({ email: "rosa@example.com", password: "old-password-1", firstName: "Rosa", lastName: "Diaz" });
  const story = storyFor(mock, user.id);
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });
  await typeCode(page);
  await page.getByLabel(/^New password/).fill("pear-tree-window");
  await page.getByRole("button", { name: "Save and sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Rose’s story/).filter({ visible: true }).first()).toBeVisible();
  expect(user.password).toBe("pear-tree-window");
  // the reset is over: coming back to /reset-password signed in is not a link waiting for a password
  await page.evaluate(() => window.history.pushState(null, "", "/reset-password"));
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate")));
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("an older reset link with the session in the address still asks for the new password", async ({ page }) => {
  const mock = await mockSupabase(page);
  const urls = watchUrls(page);
  const user = mock.addUser({ email: "rosa@example.com", password: "old-password-1", firstName: "Rosa", lastName: "Diaz" });
  const story = storyFor(mock, user.id);
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });
  const s = sessionJson(user);
  await page.goto(`/reset-password#access_token=${s.access_token}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=recovery`);

  await expect(page.getByRole("heading", { name: /Choose a new password/ })).toBeVisible();
  // the tokens are taken out of the address
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel(/^New password/).fill("pear-tree-window");
  await page.getByRole("button", { name: "Save and go on" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(user.password).toBe("pear-tree-window");
  expectNoEmailInUrls(urls, mock, user.email);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
