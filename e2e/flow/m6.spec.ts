/**
 * M6, plans, account and help (docs/overnight/AUDIT.md §4, gap rows 41 to 48), against the in-memory Supabase:
 * /plans shows no price, no hardcover promise and no free book, and says plans are chosen in the A Story app on
 * iPhone (DECISIONS.md, "Web plan billing"); a gift year (my_gift_year) shows as the gifted plan on Account and
 * Plans, never Free; Account's plan card says how to manage or stop the plan by where it came from (App Store, gift,
 * promo, access code); deleting the account warns that an App Store subscription keeps billing until it's cancelled
 * there, then lands on /account-deleted (delete-account mocked); "Have a code?" opens /gift/redeem; /help has the
 * questions and a feedback form that inserts one feedback row; Account says calls and reminders are set on the
 * phone; and the sign-in and create-account frame is whole at 1280 by 800.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M6/ and held to the floor and the copy rules
 * (e2e/support/screen.ts).
 *   npx playwright test --config playwright.config.ts e2e/flow/m6.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";
import { fixtures, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { bigEnough, checkCopy, checkFloor, shot } from "../support/screen";

const SHOTS = "docs/overnight/shots/M6";
const APP_STORE_STEPS = "iPhone Settings > your name > Subscriptions";

/** Look, check, photograph. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, SHOTS, name);
}

/** Sam, signed in, keeping Rose's story, on the plan the profile row says (and any gift year the rpc answers). */
async function sam(page: Page, { profile = {} as Row, giftYear = null as Row | null } = {}) {
  const mock = await mockSupabase(page);
  const user = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Lee", profile });
  const [story] = mock.insert("stories", fixtures.story(user.id));
  mock.insert("memories", fixtures.memory(String(story.id)));
  Object.assign(mock.tables.profiles.find((p) => p.id === user.id)!, { active_story_id: story.id, onboarding_complete: true });
  if (giftYear) mock.rpcs.my_gift_year = () => [giftYear];
  await mock.signedIn(page, user);
  return { mock, user, story };
}

/** Account, loaded, scrolled to the plan card. */
async function openAccount(page: Page) {
  await page.goto("/account");
  const plan = page.locator("#plan");
  await expect(plan).toBeVisible({ timeout: 15_000 });
  return plan;
}

/** The feedback rows the app posted, as rows. */
const feedbackRows = (mock: MockSupabase) =>
  mock
    .sent("/rest/v1/feedback", "POST")
    .map((c) => (Array.isArray(c.body) ? c.body[0] : c.body) as Row);

const A_YEAR_ON = "2027-10-20T12:00:00.000Z";
const A_YEAR_ON_WORDS = "20 October 2027";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("/plans shows no price, no hardcover and no free book, and says plans are chosen on iPhone", async ({ page }) => {
  await sam(page);
  await page.goto("/plans");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Plans");
  const text = await page.evaluate(() => document.body.innerText);
  expect(text).toMatch(/Plans are chosen in the A Story app on iPhone/);
  expect(text).not.toMatch(/\$\s?\d|£\s?\d|€\s?\d|\d+(\.\d\d)?\s?(USD|a year|\/yr|\/mo)/i);
  expect(text).not.toMatch(/Classic Hardcover|hardcover/i);
  // nothing here is a way to buy: the web has no checkout yet
  await expect(page.getByRole("button", { name: /buy|subscribe|upgrade|choose|start/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buy|subscribe|upgrade|checkout/i })).toHaveCount(0);
  await expect(page.locator("[aria-current=true]")).toContainText("Free");
  await screen(page, "01-plans-free");
});

test("a gift year shows as the gifted plan on Account and Plans, never Free", async ({ page }) => {
  await sam(page, { giftYear: { plan: "family", ends_at: A_YEAR_ON, from_name: "Rose", kind: "gift" } });
  const plan = await openAccount(page);
  await expect(plan.locator(".acct-plan b")).toHaveText("Family. A gift from Rose.");
  await expect(plan.locator(".acct-plan-how")).toHaveAttribute("data-source", "gift");
  await expect(plan).toContainText(`It ends on ${A_YEAR_ON_WORDS}, then the account returns to Free.`);
  await expect(plan).toContainText("Nothing renews and nothing is charged.");
  await expect(plan).not.toContainText(APP_STORE_STEPS);
  await plan.scrollIntoViewIfNeeded();
  await screen(page, "02-account-gift");

  await page.goto("/plans");
  await expect(page.locator(".pl-note")).toContainText(`You are on Family, a gift from Rose, until ${A_YEAR_ON_WORDS}.`);
  await expect(page.locator("[aria-current=true]")).toContainText("Family");
  await expect(page.locator(".pl-note")).not.toContainText("You are on Free");
  await screen(page, "03-plans-gift");
});

test("the plan card says how to manage or stop the plan, by where it came from", async ({ page }) => {
  // the App Store: renews there, cancelled in iPhone Settings
  const { mock, user } = await sam(page, { profile: { plan: "individual" } });
  let plan = await openAccount(page);
  await expect(plan.locator(".acct-plan-how")).toHaveAttribute("data-source", "app_store");
  await expect(plan).toContainText("Bought in the A Story app on iPhone, and it renews through the App Store.");
  await expect(plan).toContainText(`To change or cancel it: ${APP_STORE_STEPS}.`);
  await bigEnough(page, "#plan .btn, #plan .acct-code", "account plan card");
  await plan.scrollIntoViewIfNeeded();
  await screen(page, "04-account-app-store");

  // a promo month: on us, ends by itself
  const profile = mock.tables.profiles.find((p) => p.id === user.id)!;
  profile.plan = "free";
  mock.rpcs.my_gift_year = () => [{ plan: "monthly", ends_at: A_YEAR_ON, from_name: "", kind: "promo" }];
  plan = await openAccount(page);
  await expect(plan.locator(".acct-plan-how")).toHaveAttribute("data-source", "promo");
  await expect(plan.locator(".acct-plan b")).toHaveText("Monthly. A month on us.");
  await expect(plan).toContainText("Nothing renews and nothing is charged.");
  await expect(plan).not.toContainText(APP_STORE_STEPS);
  await screen(page, "05-account-promo");

  // an access code: full access, nothing to cancel
  delete mock.rpcs.my_gift_year;
  profile.comp_access_at = "2026-10-01T10:00:00.000Z";
  plan = await openAccount(page);
  await expect(plan.locator(".acct-plan b")).toHaveText("Full access, through an access code.");
  await expect(plan).toContainText("Nothing renews and nothing is charged.");
});

test("Account says calls and reminders are set on the phone", async ({ page }) => {
  await sam(page);
  await openAccount(page);
  await expect(page.locator("#privacy")).toContainText(/(notifications|reminders)[^.]*set in the A Story app on your phone/i);
});

test("'Have a code?' opens the gift redeem page", async ({ page }) => {
  await sam(page);
  const plan = await openAccount(page);
  const row = plan.getByRole("link", { name: /Have a code\?/ });
  await expect(row).toHaveAttribute("href", "/gift/redeem");
  await row.click();
  await expect(page).toHaveURL(/\/gift\/redeem$/);
  await expect(page.getByLabel("The code on the card")).toBeVisible({ timeout: 15_000 });
  // no code typed yet, so it asks for one rather than saying a code failed
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Type the code");
  await expect(page.getByText(/doesn’t open/)).toHaveCount(0);
  await screen(page, "06-gift-redeem");
});

test("deleting the account warns an App Store subscription keeps billing, then lands on /account-deleted", async ({ page }) => {
  const { mock } = await sam(page, { profile: { plan: "family" } });
  let deleted = 0;
  mock.functions["delete-account"] = () => {
    deleted++;
    return { success: true };
  };
  await openAccount(page);
  const del = page.locator("#delete");
  await del.scrollIntoViewIfNeeded();
  await del.getByRole("button", { name: /Delete my account/ }).click();
  const confirm = page.getByRole("group", { name: "Confirm deleting the account" });
  await expect(confirm).toBeVisible();
  // Rose's story has no other keeper, so it goes with the account, and they are told before anything happens
  await expect(confirm).toContainText("has nobody else keeping it and is deleted with the account");
  const warning = confirm.getByRole("note");
  await expect(warning).toContainText("Your subscription keeps going");
  await expect(warning).toContainText(`It keeps renewing until it’s cancelled there: ${APP_STORE_STEPS}.`);

  // nothing is deleted until they say they understand
  const go = confirm.getByRole("button", { name: "Delete my account", exact: true });
  await expect(go).toBeDisabled();
  await confirm.getByText("It’s too expensive").click();
  await confirm.getByText(/I understand\. Delete the account/).click();
  await bigEnough(page, "#delete .btn", "delete buttons");
  await screen(page, "07-account-delete");
  await go.click();

  await expect(page).toHaveURL(/\/account-deleted$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your account is deleted");
  await expect(page.locator("main")).toContainText(`Your App Store subscription is still running. Cancel it in ${APP_STORE_STEPS}`);
  expect(deleted).toBe(1);
  expect(feedbackRows(mock).filter((r) => r.type === "account_deletion")).toHaveLength(1);
  expect(feedbackRows(mock).find((r) => r.type === "account_deletion")?.message).toBe("It’s too expensive");
  await screen(page, "08-account-deleted");
});

test("a gift recipient deleting the account is not told about a subscription", async ({ page }) => {
  const { mock } = await sam(page, { giftYear: { plan: "individual", ends_at: A_YEAR_ON, from_name: "Rose", kind: "gift" } });
  mock.functions["delete-account"] = () => ({ success: true });
  await openAccount(page);
  await page.locator("#delete").getByRole("button", { name: /Delete my account/ }).click();
  const confirm = page.getByRole("group", { name: "Confirm deleting the account" });
  await expect(confirm).toContainText("has nobody else keeping it");
  await expect(confirm.getByRole("note")).toHaveCount(0);
  await confirm.getByText(/I understand\. Delete the account/).click();
  await confirm.getByRole("button", { name: "Delete my account", exact: true }).click();
  await expect(page).toHaveURL(/\/account-deleted$/, { timeout: 15_000 });
  await expect(page.locator("main")).not.toContainText("still running");
});

test("a delete that fails and is tried again sends the leaving note once", async ({ page }) => {
  const { mock } = await sam(page);
  let tries = 0;
  mock.functions["delete-account"] = () => (++tries === 1 ? { error: "Something went wrong" } : { success: true });
  await openAccount(page);
  await page.locator("#delete").getByRole("button", { name: /Delete my account/ }).click();
  const confirm = page.getByRole("group", { name: "Confirm deleting the account" });
  await expect(confirm).toContainText("has nobody else keeping it");
  await confirm.getByText("It’s too expensive").click();
  await confirm.getByText(/I understand\. Delete the account/).click();
  const go = confirm.getByRole("button", { name: "Delete my account", exact: true });
  await go.click();
  await expect(confirm).toContainText("The account wasn’t deleted");
  await go.click();
  await expect(page).toHaveURL(/\/account-deleted$/, { timeout: 15_000 });
  expect(tries).toBe(2);
  expect(feedbackRows(mock).filter((r) => r.type === "account_deletion")).toHaveLength(1);
});

test("/help has the questions and a feedback form that inserts one feedback row", async ({ page }) => {
  const { mock, user } = await sam(page);
  await openAccount(page);
  await page.getByRole("link", { name: /Help and feedback/ }).first().click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("details.help-q")).not.toHaveCount(0);
  await page.getByText("Is my family’s story private?").click();
  await expect(page.locator("details.help-q[open]")).toHaveCount(1);
  await screen(page, "09-help");

  // an empty message is caught before anything is sent
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(feedbackRows(mock)).toHaveLength(0);

  await page.getByLabel("Your message").fill("The book page won’t scroll on my tablet.");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  const rows = feedbackRows(mock);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ user_id: user.id, message: "The book page won’t scroll on my tablet." });
  await screen(page, "10-help-sent");
});

for (const [n, path] of [["11", "/sign-in"], ["12", "/create-account"]] as const) {
  test(`the ${path} frame is whole and on the page`, async ({ page }) => {
    await mockSupabase(page);
    await page.goto(path);
    await expect(page.locator(".plate")).toBeVisible();
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    const name = path.slice(1);
    await screen(page, `${n}-${name}`);
    if (test.info().project.name !== "1280") return;
    const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
    const leaf = await box(".leaf-r");
    const plate = await box(".plate");
    const vh = page.viewportSize()!.height;
    expect(leaf.y, "the frame's top is on the page").toBeGreaterThanOrEqual(0);
    expect(plate.y + plate.height, "the plate sits inside its frame").toBeLessThanOrEqual(leaf.y + leaf.height + 0.5);
    expect(leaf.y + leaf.height, "the frame's foot is on the page at 1280 by 800").toBeLessThanOrEqual(vh);
  });
}
