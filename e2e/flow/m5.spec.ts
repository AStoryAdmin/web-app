/**
 * M5, web book ordering built closed (docs/overnight/AUDIT.md §4), against the in-memory Supabase. With the price
 * check saying closed (the real state) /book has no Order and /book/order shows no prices and no form. With it
 * saying open: Editions has each printed edition's price and Order, to /book/order?…&edition=…; the order takes
 * copies (1 to 10), a US or Canadian address (or one kept on file, as the phone keeps them on the device), a note
 * for the first page; the print files are laid out and filed at the phone's paths; the create-book-checkout body is
 * the phone's plus returnTo, and the page leaves for Stripe (a host the mock refuses, so nothing is ever charged).
 * A gift's credit orders with no checkout; /book/thanks waits for the order to be paid; /book/orders lists it.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M5/ and held to the floor (e2e/support/
 * screen.ts): no price while closed, no free book, no countdown, no trial; body text 16px, main buttons 44px.
 */
import { expect, test, type Page } from "@playwright/test";
import { fixtures, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { bigEnough, checkCopy, checkFloor, shot } from "../support/screen";

const SHOTS = "docs/overnight/shots/M5";
const CHECKOUT = "https://checkout.example.test/c/pay/cs_test_m5";
/** Where the order page keeps addresses on this computer (BookOrder.tsx SAVED_KEY, the phone's BOOK_SHIP_TO). */
const SAVED_KEY = "astory:book-ship-to:v1";

/** Look, check, photograph: what every screen in this milestone gets. Prices only where ordering is open. */
async function screen(page: Page, name: string, { prices = false } = {}) {
  await checkCopy(page, name, { prices });
  await checkFloor(page, name);
  await shot(page, SHOTS, name);
}

/** Rose's book, kept by Jamie (signed in), with two memories. */
async function rosesBook(page: Page) {
  const mock = await mockSupabase(page);
  const jamie = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Hartley" });
  const [story] = mock.insert("stories", fixtures.story(jamie.id, { name: "Rose", relationship: "Mother", book_design: { listenKey: "FlowTestKey12345" } }));
  const sid = String(story.id);
  mock.insert(
    "memories",
    fixtures.memory(sid, { title: "The kitchen on Elm Street", era: "Childhood", body: "The radio was always on, and the window over the sink looked out on the pear tree.", created_at: "2026-09-02T10:00:00.000Z" }),
    fixtures.memory(sid, { title: "The dance at the Legion hall", era: "Love & family", body: "He trod on my feet all night and I married him anyway.", created_at: "2026-09-03T10:00:00.000Z" }),
  );
  Object.assign(mock.tables.profiles.find((p) => p.id === jamie.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, jamie);
  return { mock, jamie, story, sid };
}

/** create-book-checkout: the price check, and an order that starts a checkout or is paid with a gift's credit. */
function checkout(mock: MockSupabase, { open, credits = 0, userId = "" }: { open: boolean; credits?: number; userId?: string }) {
  const orders: Row[] = [];
  const checks: Row[] = [];
  mock.functions["create-book-checkout"] = (args) => {
    if (args.check) {
      checks.push(args);
      return {
        included: false,
        reason: open ? "open" : "not_member",
        member: credits > 0,
        orderingOpen: open,
        priceCents: 6900,
        credits,
        editions: [
          { id: "home", priceCents: 0, sale: "free" },
          { id: "digital", priceCents: 1900, sale: "iap" },
          { id: "softcover", priceCents: 3900, extraCents: 2900, sale: "stripe" },
          { id: "hardcover", priceCents: 6900, extraCents: 4900, sale: "stripe" },
          { id: "heirloom", priceCents: 14900, extraCents: 11900, sale: "stripe" },
          { id: "legacy", priceCents: 49900, extraCents: 11900, sale: "stripe" },
        ],
      };
    }
    if (!open) return { status: 400, body: { error: "Ordering isn’t open yet.", reason: "closed" } };
    orders.push(args);
    const orderId = `ord-${orders.length}`;
    const paid = credits > 0 && args.edition === "hardcover";
    const ship = (args.shipTo ?? {}) as Row;
    mock.insert("book_orders", {
      id: orderId,
      user_id: userId,
      story_id: args.storyId,
      status: paid ? "paid" : "pending",
      edition: args.edition,
      copies: args.copies,
      amount_cents: paid ? 0 : 6900,
      currency: "usd",
      included: paid,
      shipping_name: ship.name ?? null,
      shipping_address: { line1: ship.line1, city: ship.city, state: ship.region, postal_code: ship.postal, country: ship.country },
      gift_note: args.note ?? null,
      created_at: "2026-10-27T10:00:00.000Z",
      paid_at: paid ? "2026-10-27T10:00:00.000Z" : null,
    });
    return paid ? { orderId, paidWithCredit: true } : { orderId, url: CHECKOUT, checkoutUrl: CHECKOUT };
  };
  return { orders, checks };
}

/** Fills the address the courier needs, choosing fields by name (the Field's label also holds its error). */
async function fillAddress(page: Page) {
  await page.locator('input[name="name"]').fill("Rose Hartley");
  await page.locator('input[name="line1"]').fill("1 Elm Street");
  await page.locator('input[name="city"]').fill("Austin");
  await page.locator('input[name="region"]').fill("TX");
  await page.locator('input[name="postal"]').fill("78701");
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("with ordering closed nothing can be ordered: no Order on /book, and /book/order says it isn't open yet", async ({ page }) => {
  const { mock, sid } = await rosesBook(page);
  const { orders, checks } = checkout(mock, { open: false });

  await page.goto("/book");
  const editions = page.locator("#editions");
  await expect(editions.getByText(/Printed editions are coming/)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("a[href^='/book/order']")).toHaveCount(0);
  await expect(editions.locator(".ed-price")).toHaveCount(0);
  await expect(editions.getByRole("link", { name: "Your orders" })).toHaveCount(0);
  await editions.scrollIntoViewIfNeeded();
  await screen(page, "01-editions-closed");

  // typed straight in, with an edition: still closed
  await page.goto(`/book/order?story=${sid}&edition=hardcover`);
  await expect(page.getByRole("heading", { name: "Printed editions are coming" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Ordering isn’t open yet/)).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(/\$\s?\d/);
  await expect(page.locator('input[name="line1"]')).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Pay with Stripe|paid with your gift/ })).toHaveCount(0);
  await bigEnough(page, ".bo-closed .btn", "Back to the book");
  await screen(page, "02-order-closed");

  // only ever asked the price; no order, no checkout
  expect(checks.length).toBeGreaterThan(0);
  expect(orders).toEqual([]);
  expect([...mock.objects.keys()].filter((k) => k.startsWith("book-orders/"))).toEqual([]);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("open: Editions has prices and Order, the order is filled in, the print files are filed and the page leaves for Stripe", async ({ page }) => {
  test.setTimeout(180_000);
  const { mock, sid } = await rosesBook(page);
  const { orders } = checkout(mock, { open: true });

  await page.goto("/book");
  const editions = page.locator("#editions");
  const order = editions.getByRole("link", { name: "Order the Heirloom Edition" });
  await expect(order).toBeVisible({ timeout: 15_000 });
  await expect(editions.locator(".ed-price")).toHaveCount(4);
  expect(await editions.innerText()).toContain("$149");
  await expect(order).toHaveAttribute("href", /\/book\/order\?.*edition=heirloom/);
  await bigEnough(page, "#editions .ed-act .btn", "Order");
  await editions.scrollIntoViewIfNeeded();
  await screen(page, "03-editions-open", { prices: true });

  await order.click();
  await expect(page).toHaveURL(/\/book\/order\?.*edition=heirloom/);
  const pay = page.getByRole("button", { name: /Pay with Stripe/ });
  await expect(pay).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('input[name="edition"][value="heirloom"]')).toBeChecked();
  await screen(page, "04-order-open", { prices: true });

  // copies: one to ten, no further
  const more = page.getByRole("button", { name: "One more copy" });
  const fewer = page.getByRole("button", { name: "One fewer copy" });
  const count = page.locator(".bo-stepper output");
  await expect(count).toHaveText("1");
  await expect(fewer).toBeDisabled();
  for (let i = 0; i < 9; i++) await more.click();
  await expect(count).toHaveText("10");
  await expect(more).toBeDisabled();
  for (let i = 0; i < 8; i++) await fewer.click();
  await expect(count).toHaveText("2");
  await bigEnough(page, ".bo-stepper button", "copies stepper");

  // Pay with no address: the first missing field is named and focused, and nothing is sent
  await pay.click();
  await expect(page.locator('input[name="line1"]')).toBeFocused();
  expect(orders).toEqual([]);
  await screen(page, "05-order-missing", { prices: true });

  // ships to the US and Canada only; Canada asks for a province and a postal code
  const countries = page.locator('input[name="country"]');
  await expect(countries).toHaveCount(2);
  expect(await countries.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(["US", "CA"]);
  await page.locator("fieldset.bo-country label", { hasText: "Canada" }).click();
  await expect(page.getByText("Province", { exact: true })).toBeVisible();
  await page.locator("fieldset.bo-country label", { hasText: "United States" }).click();
  await expect(page.getByText("State", { exact: true })).toBeVisible();

  await fillAddress(page);
  await page.getByRole("textbox", { name: /note/i }).fill("For Rose, with love.");
  await expect(page.locator(".bo-summary")).toContainText("With your note on the first page");
  await screen(page, "06-order-filled", { prices: true });
  await pay.click();

  // the redirect target is the fake checkout URL; the mock refuses it, so it is asserted, never followed
  await expect.poll(() => mock.blocked.filter((u) => u.startsWith("https://checkout.example.test/")).length, { timeout: 150_000 }).toBeGreaterThan(0);
  expect(mock.blocked.find((u) => u.startsWith("https://checkout.example.test/"))).toBe(CHECKOUT);
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    storyId: sid,
    edition: "heirloom",
    copies: 2,
    shipTo: { name: "Rose Hartley", line1: "1 Elm Street", city: "Austin", region: "TX", postal: "78701", country: "US" },
    note: "For Rose, with love.",
    returnTo: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/book\/thanks$/),
  });
  // both print files, filed at the phone's paths before the page left
  const filed = [...mock.objects.keys()].filter((k) => k.startsWith("book-orders/")).sort();
  expect(filed).toEqual(["book-orders/ord-1-cover.pdf", "book-orders/ord-1.pdf"]);
  expect(mock.objects.get("book-orders/ord-1.pdf")!.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(mock.objects.get("book-orders/ord-1-cover.pdf")!.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(mock.blocked.filter((u) => !u.startsWith("https://checkout.example.test/")), "requests that left the machine").toEqual([]);
});

test("an address kept on file is offered again, and goes with the order", async ({ page }) => {
  test.setTimeout(180_000);
  const { mock, sid } = await rosesBook(page);
  const { orders } = checkout(mock, { open: true });
  const kept = { name: "Jamie Hartley", line1: "40 Bank Street", line2: "", city: "Toronto", region: "ON", postal: "M5V 2T6", country: "CA", phone: "" };
  await page.addInitScript(([key, v]) => window.localStorage.setItem(key, v), [SAVED_KEY, JSON.stringify({ me: kept })] as const);

  await page.goto(`/book/order?story=${sid}&edition=hardcover`);
  const pay = page.getByRole("button", { name: /Pay with Stripe/ });
  await expect(pay).toBeVisible({ timeout: 15_000 });
  const me = page.locator(".bo-person", { hasText: "Jamie Hartley" });
  await expect(me).toContainText("Address on file");
  await me.click();
  await expect(page.locator("address.bo-label")).toContainText("40 Bank Street");
  await expect(page.locator("address.bo-label")).toContainText("Toronto");
  await expect(page.locator('input[name="line1"]')).toHaveCount(0);
  await screen(page, "07-order-address-on-file", { prices: true });

  await pay.click();
  await expect.poll(() => orders.length, { timeout: 150_000 }).toBe(1);
  expect(orders[0]).toMatchObject({ edition: "hardcover", copies: 1, shipTo: { name: "Jamie Hartley", line1: "40 Bank Street", city: "Toronto", region: "ON", country: "CA" } });
  expect(orders[0].note ?? "").toBe("");
  await expect.poll(() => mock.blocked.filter((u) => u.startsWith("https://checkout.example.test/")).length, { timeout: 60_000 }).toBeGreaterThan(0);
  expect(mock.blocked.filter((u) => !u.startsWith("https://checkout.example.test/")), "requests that left the machine").toEqual([]);
});

test("a gift's credit orders with no checkout, thanks, and shows on Your orders", async ({ page }) => {
  test.setTimeout(180_000);
  const { mock, jamie, sid } = await rosesBook(page);
  const { orders } = checkout(mock, { open: true, credits: 1, userId: jamie.id });

  await page.goto("/book");
  await expect(page.locator("#editions").getByText("A gift has already paid for one.")).toBeVisible({ timeout: 15_000 });

  await page.goto(`/book/order?story=${sid}&edition=hardcover`);
  const order = page.getByRole("button", { name: /paid with your gift/ });
  await expect(order).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".bo-total")).toContainText("Paid with your gift");
  await fillAddress(page);
  await screen(page, "08-order-gift", { prices: true });
  await order.click();

  await expect(page).toHaveURL(/\/book\/thanks\?order=ord-1$/, { timeout: 150_000 });
  await expect(page.getByRole("heading", { name: /Ordered/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Paid with your gift’s hardcover/)).toBeVisible();
  // the server spends the credit itself (create-book-checkout creditApplies), so the body is the phone's: no credit id
  expect(orders[0]).toMatchObject({ storyId: sid, edition: "hardcover", copies: 1, shipTo: { name: "Rose Hartley", country: "US" } });
  await screen(page, "09-thanks-gift");
  // the upload still happened, at the phone's paths
  expect([...mock.objects.keys()].filter((k) => k.startsWith("book-orders/")).sort()).toEqual(["book-orders/ord-1-cover.pdf", "book-orders/ord-1.pdf"]);

  await page.goto("/book/orders");
  await expect(page.locator(".bo-order")).toHaveCount(1, { timeout: 15_000 });
  await expect(page.locator(".bo-order")).toContainText("Rose Hartley");
  await expect(page.locator(".bo-order-status")).not.toBeEmpty();
  expect(await page.locator("body").innerText(), "an amount on the orders").not.toMatch(/\$\s?\d/);
  await screen(page, "10-orders");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("back from Stripe, /book/thanks waits for the order to be paid, then says so calmly", async ({ page }) => {
  const { mock, jamie, sid } = await rosesBook(page);
  checkout(mock, { open: true });
  mock.insert("book_orders", {
    id: "ord-7",
    user_id: jamie.id,
    story_id: sid,
    status: "pending",
    edition: "hardcover",
    copies: 1,
    amount_cents: 6900,
    currency: "usd",
    included: false,
    shipping_name: "Rose Hartley",
    shipping_address: { line1: "1 Elm Street", city: "Austin", state: "TX", postal_code: "78701", country: "US" },
    gift_note: "For Rose, with love.",
    created_at: "2026-10-27T10:00:00.000Z",
  });

  // the server's success URL: order_id, as create-book-checkout's returnTo.js writes it
  await page.goto("/book/thanks?order_id=ord-7");
  await expect(page.getByRole("heading", { name: "Confirming your payment" })).toBeVisible({ timeout: 15_000 });
  await screen(page, "11-thanks-confirming");
  // Stripe's webhook lands a few seconds behind
  Object.assign(mock.tables.book_orders.find((o) => o.id === "ord-7")!, { status: "paid", paid_at: "2026-10-27T10:00:05.000Z" });
  await expect(page.getByRole("heading", { name: "Ordered" })).toBeVisible({ timeout: 12_000 });
  await expect(page.getByText("Rose’s book is on its way to Rose Hartley, Austin.")).toBeVisible();
  await expect(page.getByText(/Your note goes on the first page/)).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await screen(page, "12-thanks-paid");

  await page.goto("/book/orders");
  await expect(page.locator(".bo-order[data-status='paid']")).toHaveCount(1, { timeout: 15_000 });
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("back from Stripe without paying: nothing was charged, and the way back to the order", async ({ page }) => {
  const { mock, jamie, sid } = await rosesBook(page);
  checkout(mock, { open: true });
  mock.insert("book_orders", {
    id: "ord-9",
    user_id: jamie.id,
    story_id: sid,
    status: "pending",
    edition: "softcover",
    copies: 1,
    amount_cents: 3900,
    currency: "usd",
    included: false,
    created_at: "2026-10-27T10:00:00.000Z",
  });
  // the server's cancel URL: order_id, as create-book-checkout's returnTo.js writes it
  await page.goto("/book/thanks?order_id=ord-9&canceled=1");
  await expect(page.getByRole("heading", { name: "Not ordered" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/nothing was charged/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the order" })).toHaveAttribute("href", /\/book\/order\?/);
  await screen(page, "13-thanks-canceled");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
