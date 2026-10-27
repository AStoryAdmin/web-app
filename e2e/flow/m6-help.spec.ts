/**
 * M6, help: /help answers the questions in place and "Write to us" inserts one feedback row exactly as the phone
 * does (data/feedback.js); /account-deleted opens signed out; the sign-in plate's whole frame is on the page at
 * 1280 by 800 (its foot ornaments were cut off).
 *   npx playwright test --config playwright.config.ts e2e/flow/m6-help.spec.ts
 */
import { expect, test } from "@playwright/test";
import { fixtures, mockSupabase, type Row } from "../support/mockSupabase";

test("/help opens a question in place and sends feedback as the phone does", async ({ page }) => {
  const mock = await mockSupabase(page);
  const sam = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Lee" });
  const [story] = mock.insert("stories", fixtures.story(sam.id));
  Object.assign(mock.tables.profiles.find((p) => p.id === sam.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, sam);

  await page.goto("/help");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Questions");
  const q = page.getByText("How do I bring family in?");
  await q.click();
  await expect(page.getByText(/Open Family and choose Add someone/)).toBeVisible();
  // no plan price, no countdown, never "free"
  const words = await page.locator("main, .page").first().innerText();
  expect(words).not.toMatch(/\$\d|days? left|free/i);

  // an empty message is caught before anything is sent
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.getByRole("alert")).toContainText("A line is enough");

  await page.getByText("Something’s wrong").click();
  await page.getByLabel("Your message").fill("  The book page won’t scroll on my tablet.  ");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();

  const sent = mock.sent("/rest/v1/feedback").filter((c) => c.method === "POST");
  expect(sent).toHaveLength(1);
  const row = (Array.isArray(sent[0].body) ? sent[0].body[0] : sent[0].body) as Row;
  expect(row).toEqual({ user_id: sam.id, type: "bug", message: "The book page won’t scroll on my tablet.", contact_email: "sam@example.com" });
});

test("/account-deleted opens with no one signed in", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/account-deleted");
  await expect(page).toHaveURL(/\/account-deleted$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

for (const path of ["/sign-in", "/create-account"]) {
  test(`the ${path} plate's whole frame is on the page at 1280 by 800`, async ({ page }) => {
    await mockSupabase(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await expect(page.locator(".plate")).toBeVisible();
    const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
    const leaf = await box(".leaf-r");
    const plate = await box(".plate");
    expect(plate.y + plate.height).toBeLessThanOrEqual(leaf.y + leaf.height);
    expect(leaf.y + leaf.height).toBeLessThanOrEqual(800);
  });
}
