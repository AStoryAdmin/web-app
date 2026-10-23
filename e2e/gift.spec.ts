/**
 * The holiday gift pages end to end, against a mocked create-gift-checkout and mocked database functions
 * (gift_preview), at 360×740 and 1280×800: write the card, pay (a Stripe stub), the thanks page with the printable
 * card and code (the webhook a moment late), and what the recipient opens, which carries no price or plan word.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const HOST = "https://gift-test.supabase.co";
const FN = `${HOST}/functions/v1/create-gift-checkout`;
const STRIPE = "https://checkout.stripe.test/c/pay/cs_test_new";
const SESSION = "cs_test_abc1234567";
const HARNESS = (at: string) => `/src/pages/gift/e2e/harness.html?at=${encodeURIComponent(at)}`;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

const paid = {
  status: "paid",
  code: "K7M2QX9P",
  recipientName: "Hien",
  buyerName: "Daniel Nguyen",
  note: "Mẹ ơi, con muốn nghe hết.",
  firstQuestion: "What was the house you grew up in like?",
  deliverOn: "2026-12-25",
  emailed: true,
};

type Seen = { posts: Record<string, unknown>[]; rpc: string[] };
async function mock(page: Page, fn: (body: Record<string, unknown>, n: number) => { status?: number; body: unknown }) {
  const seen: Seen = { posts: [], rpc: [] };
  await page.route(/gift-test\.supabase\.co|checkout\.stripe\.test/, async (route: Route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (url.startsWith(FN)) {
      const body = req.postDataJSON() as Record<string, unknown>;
      seen.posts.push(body);
      expect(req.headers()["apikey"]).toBe("anon-test-key");
      const a = fn(body, seen.posts.length);
      return route.fulfill({ status: a.status ?? 200, headers: CORS, contentType: "application/json", body: JSON.stringify(a.body) });
    }
    if (url.includes("/rest/v1/rpc/")) {
      const name = url.split("/rpc/")[1].split("?")[0];
      seen.rpc.push(name);
      if (name === "gift_preview")
        return route.fulfill({
          status: 200,
          headers: CORS,
          contentType: "application/json",
          body: JSON.stringify([{ from_name: "Daniel Nguyen", to_name: "Hien", note: paid.note, first_question: paid.firstQuestion, deliver_on: "2026-12-25", redeemed: false }]),
        });
    }
    if (url.startsWith(STRIPE)) return route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Stripe stub</h1>" });
    return route.fulfill({ status: 404, headers: CORS, body: "" });
  });
  return seen;
}

async function noSideways(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
}

test("write the card, see it written, and go to Stripe with what was written", async ({ page }) => {
  const seen = await mock(page, () => ({ body: { checkoutUrl: STRIPE, orderId: "ord-1" } }));
  await page.goto(HARNESS("/gift"));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Give someone you love A Story");
  await page.getByLabel("Their first name").fill("Hien");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Give Hien A Story");
  await expect(page.locator(".gift-card-dear")).toHaveText("Dear Hien,");
  await page.getByLabel("A note from you").fill("Mẹ ơi, con muốn nghe hết.");
  await expect(page.locator(".gift-card-note")).toHaveText("Mẹ ơi, con muốn nghe hết.");
  await page.getByRole("button", { name: /What was the house you grew up in like/ }).click();
  await expect(page.locator(".gift-card-q")).toContainText("What was the house you grew up in like?");
  await expect(page.getByRole("heading", { name: "What $99 gives Hien" })).toBeVisible();
  await expect(page.getByText("It doesn’t renew: nothing is charged again.", { exact: false })).toBeVisible();
  await page.getByLabel("Your name, as it’s signed").fill("Daniel Nguyen");
  await page.getByLabel("Your email").fill("daniel@example.com");
  await noSideways(page);
  await page.getByRole("button", { name: "Continue to payment · $99" }).click();
  await page.waitForURL(STRIPE);
  expect(seen.posts).toHaveLength(1);
  expect(seen.posts[0]).toMatchObject({
    action: "checkout",
    recipientName: "Hien",
    note: "Mẹ ơi, con muốn nghe hết.",
    firstQuestion: "What was the house you grew up in like?",
    buyerName: "Daniel Nguyen",
    buyerEmail: "daniel@example.com",
  });
  expect(String(seen.posts[0].deliverOn)).toMatch(/^\d{4}-12-25$|^\d{4}-\d{2}-\d{2}$/);
});

test("an empty form says what is missing on the field, and calls nothing", async ({ page }) => {
  const seen = await mock(page, () => ({ body: {} }));
  await page.goto(HARNESS("/gift"));
  await page.getByRole("button", { name: "Continue to payment · $99" }).click();
  await expect(page.getByText("Who is it for? A first name is enough.")).toBeVisible();
  await expect(page.getByLabel("Their first name")).toBeFocused();
  expect(seen.posts).toHaveLength(0);
});

test("before sales open, the page says so and nothing is charged", async ({ page }) => {
  await mock(page, () => ({ status: 409, body: { error: "The holiday gift opens soon.", reason: "not_open" } }));
  await page.goto(HARNESS("/gift"));
  await page.getByLabel("Their first name").fill("Hien");
  await page.getByLabel("Your name, as it’s signed").fill("Daniel");
  await page.getByLabel("Your email").fill("d@example.com");
  await page.getByRole("button", { name: "Continue to payment · $99" }).click();
  await expect(page.getByRole("alert")).toHaveText("The holiday gift opens soon. Nothing was charged.");
});

test("thanks: waits for Stripe, then the printable card with the code and what happens next", async ({ page }) => {
  const seen = await mock(page, (b, n) => {
    expect(b).toMatchObject({ action: "status", sessionId: SESSION });
    return { body: n === 1 ? { status: "pending" } : paid };
  });
  await page.goto(HARNESS(`/gift/thanks?session_id=${SESSION}`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your gift for Hien is ready.");
  expect(seen.posts.length).toBeGreaterThanOrEqual(2);
  await expect(page.locator(".gift-card-code")).toHaveText("K7M2 QX9P");
  await expect(page.getByRole("img", { name: /QR code that opens the gift for Hien/ })).toBeVisible();
  await expect(page.getByText("We email Hien on the morning of 25 December, with your note and the code.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Print the card" })).toBeVisible();
  await noSideways(page);
  // only the card prints
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Print the card" })).toBeHidden();
  await expect(page.locator(".gift-card")).toBeVisible();
});

test("redeem, signed out: the card from Daniel, two ways in, and no price or plan word", async ({ page }) => {
  const seen = await mock(page, () => ({ body: {} }));
  await page.goto(HARNESS("/gift/redeem/k7m2-qx9p"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hien, this is for you.");
  await expect(page.getByText("A gift from Daniel")).toBeVisible();
  await expect(page.locator(".gift-card-note")).toHaveText(paid.note);
  expect(seen.rpc).toContain("gift_preview");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\$|\bprice\b|\bplans?\b|\bpay\b|renew|subscri|individual/i);
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByTestId("elsewhere")).toHaveText(`/create-account?next=${encodeURIComponent("/gift/redeem/K7M2QX9P")}`);
});

test("redeem: a code that isn't one asks for the card's code", async ({ page }) => {
  await mock(page, () => ({ body: {} }));
  await page.goto(HARNESS("/gift/redeem/x1"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That code doesn’t open a gift.");
  await page.getByLabel("The code on the card").fill("K7");
  await page.getByRole("button", { name: "Open this code" }).click();
  await expect(page.getByText("A gift code is eight letters and numbers, like K7M2 QX9P.")).toBeVisible();
});

test("promo code: a free month, checked before an account, in any case, with no price or countdown", async ({ page }) => {
  const seen: string[] = [];
  await page.route(/gift-test\.supabase\.co/, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (req.url().includes("/rpc/promo_preview")) {
      seen.push(String((req.postDataJSON() as { p_code: string }).p_code));
      return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify([{ valid: true, reason: null, months: 1 }]) });
    }
    return route.fulfill({ status: 404, headers: CORS, body: "" });
  });
  await page.goto(HARNESS("/gift/redeem/Ilovemyfamily2026"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A free month of A Story.");
  expect(seen.length).toBeGreaterThan(0);
  expect(new Set(seen)).toEqual(new Set(["ILOVEMYFAMILY2026"]));
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\$|\bprice\b|hurry|days left/i);
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
  await noSideways(page);
});

test("promo code that has ended says so, and nothing else is offered", async ({ page }) => {
  await page.route(/gift-test\.supabase\.co/, (route) =>
    route.request().method() === "OPTIONS"
      ? route.fulfill({ status: 204, headers: CORS })
      : route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify([{ valid: false, reason: "expired", months: 1 }]) }),
  );
  await page.goto(HARNESS("/gift/redeem/ILOVEMYFAMILY2026"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That code can’t be used.");
  await expect(page.getByText("That code has ended. Everything free stays open.")).toBeVisible();
});
