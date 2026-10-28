/**
 * Phase 5, the family's side after paying (phone repo docs/PLAN_ORDERING.md, rulings P5-R12, R13, R14, the words in
 * P5-R16), against the in-memory Supabase. book-order-help and create-book-order are mocked, and each answers as the
 * server would, moving the seeded order's status itself; storage keeps what goes up. Nothing real is called, and the
 * payment page is a stub answered here.
 *
 *   1. Report a problem: a delivered order shows "Report a problem with my book"; the family picks "It arrived
 *      damaged", writes what happened and adds a small PNG (removing and adding it again on the way). The photo goes up
 *      to order-issues/<orderId>/<uuid>.jpg, the report carries that path, the thanks show, and the order reads
 *      issue_reported after the re-read.
 *   2. Order more copies: from the same kind of order to /book/order?…&reorder=<id>&step=send, with no Review step and
 *      no "I've reviewed my book" box; step=review lands on Send. Continue reaches Pay with the fresh lines, and the
 *      preview and the order carry the order's book_version_id and reorderOf, and no price.
 *   3. Cancel during the hold: a paid order with submit_after ahead reads Approved, "You can cancel until …" and
 *      "Cancel this order"; the dialog asks first, Yes sends { action: 'cancel' } and the refunded words show. A paid
 *      order past its submit_after has no cancel button.
 * On every step: no banned word (a printer's name, DPI, bleed, preflight, SKU, free), every button 44px or taller, and
 * the shared floor. No screenshots are written.
 */
import { deflateSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";
import { fixtures, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { checkCopy, checkFloor } from "../support/screen";

const CHECKOUT = "https://checkout.stripe.com/c/pay/cs_test_m9";
const TRACKING = "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490";
const BANNED = /prodigi|\bdpi\b|bleed|preflight|\bsku\b|free/i;
/** A small, valid PNG (8 × 8, warm grey), made here so the browser can decode it. */
function smallPng(): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const size = 8;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const rows = Buffer.concat(Array.from({ length: size }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(size * 3, 0x9a)])));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}
const PNG = smallPng();
const VERSION = "7e7e7e7e-0000-4000-8000-000000000007";
const DELIVERED = "0d0d0d0d-0000-4000-8000-000000000001";
const IN_HOLD = "0b0b0b0b-0000-4000-8000-000000000002";
const PAST_HOLD = "0c0c0c0c-0000-4000-8000-000000000003";
const TOTAL = 7900 + 899 - 100;
const LINES = [
  { kind: "book", label: "Your book", quantity: 1, unitCents: 7900, amountCents: 7900 },
  { kind: "shipping", label: "Shipping", amountCents: 899 },
  { kind: "deposit", label: "Your deposit", amountCents: -100 },
];
const THANKS = "Thank you for telling us. We'll write to you by email.";
const REFUNDED = "Your order is canceled. We've refunded $86.99. Banks usually take 5 to 10 business days to show it.";
const TOO_LATE = "Your book has already gone to print, so it can't be canceled here. Write to us at daniel@astoryapp.com and we'll help.";

/** Rose's story, kept by Jamie (signed in). */
async function rosesStory(page: Page) {
  const mock = await mockSupabase(page);
  const jamie = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Hartley" });
  const [story] = mock.insert("stories", fixtures.story(jamie.id, { name: "Rose", relationship: "Mother", book_design: { listenKey: "FlowTestKey12345" } }));
  const sid = String(story.id);
  mock.insert("memories", fixtures.memory(sid));
  Object.assign(mock.tables.profiles.find((p) => p.id === jamie.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, jamie);
  return { mock, jamie, sid };
}

/** A paid order of Rose's book as the server keeps it, with one parcel to Rose. */
function seedOrder(mock: MockSupabase, { id, userId, storyId, ...over }: { id: string; userId: string; storyId: string } & Row) {
  mock.insert("book_orders", {
    id,
    user_id: userId,
    story_id: storyId,
    status: "delivered",
    book_version_id: VERSION,
    page_count_estimate: 48,
    quantity: 1,
    subtotal_cents: 7900,
    shipping_cents: 899,
    tax_cents: 0,
    discount_cents: 0,
    deposit_credit_cents: 100,
    total_cents: TOTAL,
    amount_cents: TOTAL,
    currency: "usd",
    stripe_payment_intent_id: `pi_${id.slice(0, 8)}`,
    created_at: "2026-10-20T10:00:00.000Z",
    paid_at: "2026-10-20T10:00:05.000Z",
    submit_after: "2026-10-20T11:00:05.000Z",
    shipped_at: "2026-10-23T10:00:00.000Z",
    delivery_earliest: "2026-10-27",
    delivery_latest: "2026-10-30",
    reorder_of: null,
    ...over,
  });
  mock.insert("order_shipments", {
    id: `${id.slice(0, 8)}-0000-4000-8000-0000000000aa`,
    order_id: id,
    quantity: 1,
    name: "Rose Hartley",
    line1: "1 Elm Street",
    city: "San Jose",
    state: "CA",
    postal_code: "95112",
    country: "US",
    status: over.status === "delivered" ? "delivered" : over.status === "shipped" ? "shipped" : "pending",
    carrier: "USPS",
    tracking_url: over.status === "delivered" || over.status === "shipped" ? TRACKING : null,
    created_at: "2026-10-20T10:00:00.000Z",
  });
}

/** book-order-help as the server answers it (help.js): the owner only, the hold for a cancel, a stored photo for a report. */
function helpServer(mock: MockSupabase) {
  const asks: Row[] = [];
  mock.functions["book-order-help"] = (args, { user }) => {
    asks.push(args);
    const row = mock.tables.book_orders.find((o) => o.id === args.orderId && o.user_id === user?.id);
    if (!row) return { status: 404, body: { error: "not_found", words: "We couldn't find that order." } };
    if (args.action === "cancel") {
      if (row.status === "refunded") return { ok: true, status: "refunded", words: REFUNDED };
      if (row.status !== "paid" || !(Date.parse(String(row.submit_after)) > Date.now())) return { status: 409, body: { error: "too_late", words: TOO_LATE } };
      row.status = "refunded";
      return { ok: true, status: "refunded", words: REFUNDED };
    }
    if (args.action === "report") {
      if (!["shipped", "delivered", "issue_reported"].includes(String(row.status)))
        return { status: 409, body: { error: "not_yet", words: "You can report a problem once your book has shipped." } };
      const path = typeof args.photoPath === "string" ? args.photoPath : null;
      if (path && (!new RegExp(`^${row.id}/[0-9a-f-]{36}\\.(jpg|png)$`).test(path) || !mock.objects.has(`order-issues/${path}`)))
        return { status: 400, body: { error: "bad_photo", words: "That photo didn't upload. Please try adding it again." } };
      row.status = "issue_reported";
      return { ok: true, status: "issue_reported", words: THANKS };
    }
    return { status: 400, body: { error: "bad_request" } };
  };
  return asks;
}

/** create-book-order as the server answers it, every body kept. */
function orderServer(mock: MockSupabase, userId: string) {
  const checks: Row[] = [];
  const previews: Row[] = [];
  const orders: Row[] = [];
  mock.functions["create-book-order"] = (args) => {
    if (args.check === true) {
      checks.push(args);
      return {
        orderingOpen: true,
        product: { name: "Square hardcover book, 8¼ × 8¼ inches", minPages: 24, maxPages: 300, maxCopiesPerShipment: 10, maxShipments: 5 },
        credits: [],
        copyCents: typeof args.pageCount === "number" ? 7900 : null,
      };
    }
    if (args.preview === true) {
      previews.push(args);
      return { preview: true, totalCents: TOTAL, currency: "usd", lines: LINES, delivery: { earliest: "2026-11-10", latest: "2026-11-13" }, coveredByCredits: false };
    }
    orders.push(args);
    const orderId = "0e0e0e0e-0000-4000-8000-000000000009";
    mock.insert("book_orders", { id: orderId, user_id: userId, story_id: mock.tables.stories[0].id, status: "payment_pending", reorder_of: args.reorderOf ?? null, total_cents: TOTAL, paid_at: null });
    return { orderId, totalCents: TOTAL, currency: "usd", lines: LINES, delivery: { earliest: "2026-11-10", latest: "2026-11-13" }, paid: false, checkoutUrl: CHECKOUT, clientSecret: null };
  };
  return { checks, previews, orders };
}

/** No banned word anywhere on the screen, every button 44px or taller, and the shared floor. */
async function holdsTheFloor(page: Page, where: string, { prices = true } = {}) {
  const text = await page.locator("body").innerText();
  expect.soft(text.match(BANNED)?.[0] ?? null, `${where}: a banned word`).toBeNull();
  const short = await page.locator(".bo-page button, .bo-page .btn, .bo-page .bo-reason").evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null || el.closest("dialog[open]"))
      .map((el) => ({ text: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40), h: Math.round(el.getBoundingClientRect().height * 10) / 10 }))
      .filter((b) => b.h < 43.5),
  );
  expect.soft(short, `${where}: buttons under 44px tall`).toEqual([]);
  await checkCopy(page, where, { prices });
  await checkFloor(page, where);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("report a problem: a delivered order, the damaged reason, a few words and a photo, then issue_reported", async ({ page }) => {
  const { mock, jamie, sid } = await rosesStory(page);
  seedOrder(mock, { id: DELIVERED, userId: jamie.id, storyId: sid, status: "delivered" });
  const asks = helpServer(mock);

  await page.goto(`/book/orders/${DELIVERED}`);
  await expect(page.locator('.bo-tracker li[aria-current="step"]')).toHaveText("Delivered", { timeout: 15_000 });
  const reportButton = page.getByRole("button", { name: "Report a problem with my book" });
  await expect(reportButton).toBeVisible();
  await expect(page.getByRole("link", { name: "Order more copies" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel this order" })).toHaveCount(0);
  await holdsTheFloor(page, "delivered");

  await reportButton.click();
  await expect(page.getByRole("group", { name: "What happened?" })).toBeVisible();
  for (const label of ["It hasn’t arrived", "It arrived damaged", "Something in the book is wrong", "Something else"]) await expect(page.getByRole("radio", { name: label })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a photo (if you can)" })).toBeVisible();
  await holdsTheFloor(page, "report-form");

  // nothing chosen yet: asked plainly, nothing sent
  await page.getByRole("button", { name: "Send to A Story" }).click();
  await expect(page.getByText("Please choose what happened.")).toBeVisible();
  expect(asks).toEqual([]);

  await page.getByRole("radio", { name: "It arrived damaged" }).check();
  const description = "The cover came bent at one corner, and two pages are creased.";
  await page.getByLabel("Tell us a little more").fill(description);
  const file = page.locator(".bo-photo input[type=file]");
  await file.setInputFiles({ name: "bent.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "The photo you chose" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Change the photo" })).toBeVisible();
  await page.getByRole("button", { name: "Remove the photo" }).click();
  await expect(page.getByRole("img", { name: "The photo you chose" })).toHaveCount(0);
  await file.setInputFiles({ name: "bent.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Remove the photo" })).toBeVisible();
  await holdsTheFloor(page, "report-filled");

  await page.getByRole("button", { name: "Send to A Story" }).click();
  await expect(page.getByText(THANKS)).toBeVisible({ timeout: 15_000 });

  // the photo went up first, to the private bucket under the order, as a JPEG
  const uploads = mock.calls.filter((c) => c.method === "POST" && c.path.startsWith("/storage/v1/object/order-issues/"));
  expect(uploads).toHaveLength(1);
  const key = decodeURIComponent(uploads[0].path.slice("/storage/v1/object/".length).split("?")[0]);
  expect(key).toMatch(new RegExp(`^order-issues/${DELIVERED}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png)$`));
  expect(mock.objects.get(key)?.type).toBe("image/jpeg");
  const photoPath = key.slice("order-issues/".length);
  expect(asks).toEqual([{ action: "report", orderId: DELIVERED, reason: "damaged", description, photoPath }]);

  // read again: the order is issue_reported, in its own sentence, and the form has closed
  expect(mock.tables.book_orders.find((o) => o.id === DELIVERED)?.status).toBe("issue_reported");
  await expect(page.getByText("Thank you for telling us what happened. We’ll write to you by email.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /looking into/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send to A Story" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Report a problem with my book" })).toBeVisible();
  expect(await page.locator("body").innerText(), "a street on the status page").not.toContain("1 Elm Street");
  await holdsTheFloor(page, "reported");
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("order more copies: straight to Send with the same locked book, no review, then Pay with fresh lines", async ({ page }) => {
  const { mock, jamie, sid } = await rosesStory(page);
  seedOrder(mock, { id: DELIVERED, userId: jamie.id, storyId: sid, status: "delivered" });
  helpServer(mock);
  const { checks, previews, orders } = orderServer(mock, jamie.id);
  const versions: Row[] = [];
  mock.functions["book-version"] = (args) => {
    versions.push(args);
    return { status: 400, body: { error: "bad_request" } };
  };
  const checkoutHits: string[] = [];
  await page.route(`${CHECKOUT}**`, (route) => {
    checkoutHits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Payment stub</title><p>Payment stub</p>" });
  });

  await page.goto(`/book/orders/${DELIVERED}`);
  const more = page.getByRole("link", { name: "Order more copies" });
  await expect(more).toBeVisible({ timeout: 15_000 });
  await expect(more).toHaveAttribute("href", `/book/order?story=${sid}&reorder=${DELIVERED}&step=send`);
  await more.click();

  /* ── Send, with no Review ── */
  await expect(page).toHaveURL(new RegExp(`/book/order\\?story=${sid}&reorder=${DELIVERED}&step=send$`));
  await expect(page.getByRole("heading", { name: "More copies of the same book" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("The book you approved, 48 pages. Nothing in it changes.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who should receive it" })).toBeVisible();
  await expect(page.locator(".bo-steps-bar li")).toHaveText([/Who should receive it/, /Pay/]);
  await expect(page.getByText(/Review your book/)).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /reviewed my book/ })).toHaveCount(0);
  await expect(page.getByText("Each copy: $79")).toBeVisible();
  // the copy's price was asked again for the locked book's page count
  expect(checks.some((c) => c.pageCount === 48)).toBe(true);
  await holdsTheFloor(page, "reorder-send", { prices: true });

  const card = page.locator(".bo-card").first();
  await card.locator('input[name="name"]').fill("Sam Hartley");
  await card.locator('input[name="line1"]').fill("9 Oak Avenue");
  await card.locator('input[name="city"]').fill("Portland");
  await card.locator('select[name="state"]').selectOption("OR");
  await card.locator('input[name="postal"]').fill("97201");
  await page.getByRole("button", { name: "Continue" }).click();

  /* ── Pay ── */
  await expect(page).toHaveURL(/reorder=.*step=pay/);
  const summary = page.locator(".bo-summary");
  await expect(summary.locator(".bo-line", { hasText: "Your book" })).toContainText("$79.00", { timeout: 15_000 });
  await expect(summary.locator(".bo-line", { hasText: "Shipping" })).toContainText("$8.99");
  await expect(summary.locator(".bo-total")).toContainText("$86.99");
  await holdsTheFloor(page, "reorder-pay");
  expect(previews.length).toBeGreaterThan(0);
  for (const p of previews) {
    expect(p).toMatchObject({ preview: true, versionId: VERSION, reorderOf: DELIVERED });
    expect(JSON.stringify(p), "a price sent by the page").not.toMatch(/cents|price|amount|total/i);
  }
  expect(orders).toEqual([]);

  await page.getByRole("button", { name: "Pay $86.99" }).click();
  await page.waitForURL(`${CHECKOUT}**`, { timeout: 30_000 });
  expect(checkoutHits).toEqual([CHECKOUT]);
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({ client: "web", versionId: VERSION, reorderOf: DELIVERED, shipments: [{ quantity: 1, address: { name: "Sam Hartley", city: "Portland", state: "OR", postal: "97201" } }] });
  expect(JSON.stringify(orders[0]), "a price sent by the page").not.toMatch(/cents|price|amount|total/i);
  // the book was never made or approved again
  expect(versions).toEqual([]);

  // a link with step=review still starts at Send
  await page.goto(`/book/order?story=${sid}&reorder=${DELIVERED}&step=review`);
  await expect(page).toHaveURL(/reorder=.*step=send/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Who should receive it" })).toBeVisible();
  expect(versions).toEqual([]);

  // an order that can't be copied (not this family's, or not shipped) says so in plain words
  await page.goto(`/book/order?story=${sid}&reorder=0f0f0f0f-0000-4000-8000-00000000dead&step=send`);
  await expect(page.getByText("We couldn’t find that order to copy. Please start again from your book.")).toBeVisible({ timeout: 15_000 });
  await holdsTheFloor(page, "reorder-bad", { prices: false });
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("leaving the payment page of a reorder goes back to the reorder's Pay step, not the review", async ({ page }) => {
  const { mock, jamie, sid } = await rosesStory(page);
  seedOrder(mock, { id: DELIVERED, userId: jamie.id, storyId: sid, status: "delivered" });
  const UNPAID = "0d0d0d0d-0000-4000-8000-000000000004";
  seedOrder(mock, { id: UNPAID, userId: jamie.id, storyId: sid, status: "payment_pending", reorder_of: DELIVERED, paid_at: null, shipped_at: null });
  helpServer(mock);
  orderServer(mock, jamie.id);
  const seen: string[] = [];
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) seen.push(f.url());
  });

  await page.goto(`/book/thanks?order_id=${UNPAID}&canceled=1`);
  await expect(page).toHaveURL(new RegExp(`/book/order\\?story=${sid}&reorder=${DELIVERED}&step=`), { timeout: 15_000 });
  expect(seen.some((u) => u.includes(`/book/order?story=${sid}&reorder=${DELIVERED}&step=pay&canceled=1`)), seen.join("\n")).toBe(true);
  await expect(page.getByRole("checkbox", { name: /reviewed my book/ })).toHaveCount(0);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("cancel during the hold: Approved, the time, the dialog, Yes refunds; past the hold there is no cancel", async ({ page }) => {
  const { mock, jamie, sid } = await rosesStory(page);
  const ahead = new Date(Date.now() + 40 * 60_000).toISOString();
  seedOrder(mock, { id: IN_HOLD, userId: jamie.id, storyId: sid, status: "paid", submit_after: ahead, shipped_at: null, created_at: "2026-10-27T10:00:00.000Z" });
  seedOrder(mock, { id: PAST_HOLD, userId: jamie.id, storyId: sid, status: "paid", submit_after: new Date(Date.now() - 5 * 60_000).toISOString(), shipped_at: null });
  const asks = helpServer(mock);

  await page.goto(`/book/orders/${IN_HOLD}`);
  await expect(page.locator('.bo-tracker li[aria-current="step"]')).toHaveText("Approved", { timeout: 15_000 });
  await expect(page.getByText("Your order is in. We wait an hour before printing, in case anything needs changing.")).toBeVisible();
  await expect(page.getByText(/^You can cancel until \d{1,2}:\d{2} (am|pm)\.$/)).toBeVisible();
  const cancel = page.getByRole("button", { name: "Cancel this order" });
  await expect(cancel).toBeVisible();
  await expect(page.getByRole("button", { name: "Report a problem with my book" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Order more copies" })).toHaveCount(0);
  await holdsTheFloor(page, "hold");

  // the dialog asks first; "Keep my order" changes nothing
  await cancel.click();
  const dialog = page.getByRole("dialog", { name: "Cancel this order?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("We’ll refund $86.99 to your card. This can’t be undone.")).toBeVisible();
  await holdsTheFloor(page, "cancel-dialog");
  await dialog.getByRole("button", { name: "Keep my order" }).click();
  await expect(dialog).toBeHidden();
  await expect(cancel).toBeFocused();
  expect(asks).toEqual([]);

  await cancel.click();
  await dialog.getByRole("button", { name: "Yes, cancel it" }).click();
  await expect(page.getByText(REFUNDED)).toBeVisible({ timeout: 15_000 });
  expect(asks).toEqual([{ action: "cancel", orderId: IN_HOLD }]);
  await expect(page.getByRole("heading", { name: "This order was refunded" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Cancel this order" })).toHaveCount(0);
  expect(mock.tables.book_orders.find((o) => o.id === IN_HOLD)?.status).toBe("refunded");
  await holdsTheFloor(page, "canceled");

  // past the hold: printing, and no way to cancel here
  await page.goto(`/book/orders/${PAST_HOLD}`);
  await expect(page.locator('.bo-tracker li[aria-current="step"]')).toHaveText("Printing", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Cancel this order" })).toHaveCount(0);
  await expect(page.getByText(/You can cancel until/)).toHaveCount(0);
  await holdsTheFloor(page, "past-hold");
  expect(asks).toHaveLength(1);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
