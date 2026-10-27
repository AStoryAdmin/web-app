/**
 * Phase 4, the web's three-step book order (phone repo docs/PLAN_ORDERING.md §7, rulings P4-R1 to R10), against the
 * in-memory Supabase. create-book-order (check, preview, order), book-version (prepare, approve) and storage are
 * mocked; nothing real is called. The payment page's URL is intercepted with page.route and answered with a stub, so
 * the test sees the page leave for it and never reaches Stripe.
 *
 *   1. Closed: /book/order says "Printed books are coming", with no price and no form.
 *   2. Open: step 1 lays the book out and shows its rendered pages in the flip-through, the page count, the price of a
 *      copy and a plain blurry-photo warning; Continue waits for the box, and approve is sent with confirmed true.
 *      Step 2: a bad ZIP is named in a plain sentence; "Add another copy for someone else" adds a card, and it can be
 *      removed. Step 3: the book, shipping and "Your deposit −$1.00" lines, the total and "Arrives between …"; Pay sends
 *      client web, the version and the shipments, with no price, and the page goes to the payment page. Back from it
 *      without paying, the order resumes at Pay with "Nothing was charged."; paid and then shipped, /book/thanks leads
 *      to /book/orders/:id with Shipped as the current step and the parcel's tracking link.
 * On every step: no banned word (a printer's name, DPI, bleed, preflight, SKU, free) and every button 44px or taller.
 * No screenshots are written: docs/overnight/shots stays as it is.
 */
import { expect, test, type Page } from "@playwright/test";
import { HOST, fixtures, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { checkCopy, checkFloor } from "../support/screen";

const CHECKOUT = "https://checkout.stripe.com/c/pay/cs_test_m8";
const TRACKING = "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490";
const BANNED = /prodigi|\bdpi\b|bleed|preflight|\bsku\b|free/i;
const LINES = [
  {
    kind: "book",
    label: "Your book",
    quantity: 1,
    unitCents: 7900,
    amountCents: 7900,
  },
  { kind: "shipping", label: "Shipping", amountCents: 899 },
  { kind: "deposit", label: "Your deposit", amountCents: -100 },
];
const TOTAL = 7900 + 899 - 100;

/** Rose's book, kept by Jamie (signed in), with two memories, one with a photograph too small to print sharply. */
async function rosesBook(page: Page) {
  const mock = await mockSupabase(page);
  const jamie = mock.addUser({
    email: "jamie@example.com",
    firstName: "Jamie",
    lastName: "Hartley",
  });
  const [story] = mock.insert(
    "stories",
    fixtures.story(jamie.id, {
      name: "Rose",
      relationship: "Mother",
      book_design: { listenKey: "FlowTestKey12345" },
    }),
  );
  const sid = String(story.id);
  const [, wedding] = mock.insert(
    "memories",
    fixtures.memory(sid, {
      title: "The kitchen on Elm Street",
      era: "Childhood",
      body: "The radio was always on, and the window over the sink looked out on the pear tree.",
      created_at: "2026-09-02T10:00:00.000Z",
    }),
    fixtures.memory(sid, {
      title: "Our wedding",
      era: "Love & family",
      body: "He trod on my feet all night and I married him anyway.",
      created_at: "2026-09-03T10:00:00.000Z",
    }),
  );
  // a public URL the mock answers with a 1px picture: measured, it can only look blurry in print
  mock.insert("memory_photos", {
    id: "ph-1",
    memory_id: wedding.id,
    public_url: `${HOST}/storage/v1/object/public/flow-photos/wedding.png`,
    sort_order: 0,
  });
  Object.assign(
    mock.tables.profiles.find((p) => p.id === jamie.id)!,
    { active_story_id: story.id, onboarding_complete: true },
  );
  await mock.signedIn(page, jamie);
  return { mock, jamie, sid };
}

/** create-book-order and book-version as the server answers them, with every body kept. */
function server(mock: MockSupabase, { open, userId = "" }: { open: boolean; userId?: string }) {
  const checks: Row[] = [];
  const previews: Row[] = [];
  const orders: Row[] = [];
  const versions: Row[] = [];
  mock.functions["create-book-order"] = (args) => {
    if (args.check === true) {
      checks.push(args);
      return {
        orderingOpen: open,
        product: {
          sku: "ASTORY-SQ-HC-8",
          name: "Square hardcover book, 8¼ × 8¼ inches",
          retailCents: 7900,
          minPages: 24,
          maxPages: 300,
          maxCopiesPerShipment: 10,
          maxShipments: 5,
        },
        credits: [{ kind: "deposit", label: "Your deposit of $1.00" }],
        copyCents: typeof args.pageCount === "number" ? 7900 : null,
      };
    }
    if (!open)
      return {
        status: 409,
        body: {
          error: "not_open",
          words: "Ordering printed books opens soon.",
        },
      };
    if (args.preview === true) {
      previews.push(args);
      return {
        preview: true,
        totalCents: TOTAL,
        currency: "usd",
        lines: LINES,
        delivery: { earliest: "2026-11-10", latest: "2026-11-13" },
        coveredByCredits: false,
      };
    }
    orders.push(args);
    const orderId = `ord-${orders.length}`;
    const shipments = (args.shipments as { quantity: number; address: Row }[]) ?? [];
    mock.insert("book_orders", {
      id: orderId,
      user_id: userId,
      story_id: mock.tables.stories[0].id,
      status: "payment_pending",
      quantity: shipments.reduce((n, s) => n + s.quantity, 0),
      subtotal_cents: 7900,
      shipping_cents: 899,
      tax_cents: 0,
      discount_cents: 0,
      deposit_credit_cents: 100,
      total_cents: TOTAL,
      amount_cents: TOTAL,
      currency: "usd",
      created_at: "2026-10-27T10:00:00.000Z",
      paid_at: null,
      delivery_earliest: "2026-11-10",
      delivery_latest: "2026-11-13",
    });
    shipments.forEach((s, i) =>
      mock.insert("order_shipments", {
        id: `${orderId}-s${i}`,
        order_id: orderId,
        quantity: s.quantity,
        name: s.address.name,
        line1: s.address.line1,
        city: s.address.city,
        state: s.address.state,
        postal_code: s.address.postal,
        country: "US",
        status: "pending",
        tracking_url: null,
        created_at: `2026-10-27T10:00:0${i}.000Z`,
      }),
    );
    return {
      orderId,
      totalCents: TOTAL,
      currency: "usd",
      lines: LINES,
      delivery: { earliest: "2026-11-10", latest: "2026-11-13" },
      paid: false,
      checkoutUrl: CHECKOUT,
      clientSecret: null,
    };
  };
  mock.functions["book-version"] = (args) => {
    versions.push(args);
    if (args.action === "prepare")
      return {
        versionId: "ver-1",
        version: 1,
        printProfile: "prodigi-square-hc-8",
        uploadPaths: ["ver-1/interior.pdf", "ver-1/cover.pdf"],
        listenKey: "FlowTestKey12345",
        minPages: 24,
        maxPages: 300,
      };
    if (args.action === "approve")
      return {
        versionId: args.versionId,
        approvedAt: "2026-10-27T10:00:00.000Z",
      };
    return { status: 400, body: { error: "bad_request" } };
  };
  return { checks, previews, orders, versions };
}

/** No banned word anywhere on the screen, every button in the flow 44px or taller, and the shared floor. */
async function holdsTheFloor(page: Page, where: string, { prices = true } = {}) {
  const text = await page.locator("body").innerText();
  expect.soft(text.match(BANNED)?.[0] ?? null, `${where}: a banned word`).toBeNull();
  const short = await page.locator(".bo-page button, .bo-page .btn").evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({
        text: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40),
        h: Math.round(el.getBoundingClientRect().height * 10) / 10,
      }))
      .filter((b) => b.h < 43.5),
  );
  expect.soft(short, `${where}: buttons under 44px tall`).toEqual([]);
  await checkCopy(page, where, { prices });
  await checkFloor(page, where);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("closed: /book/order says printed books are coming, with no price and no form", async ({ page }) => {
  const { mock, sid } = await rosesBook(page);
  const { checks, previews, orders, versions } = server(mock, { open: false });

  await page.goto(`/book/order?story=${sid}`);
  await expect(page.getByRole("heading", { name: "Printed books are coming" })).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("body").innerText()).not.toMatch(/\$\s?\d/);
  await expect(page.locator("input, select, textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Pay|Continue|Place my order/ })).toHaveCount(0);
  await holdsTheFloor(page, "closed", { prices: false });

  // the Book page has no way in either
  await page.goto("/book");
  await expect(page.locator("#editions").getByText(/Printed editions are coming/)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("a[href^='/book/order?']")).toHaveCount(0);

  expect(checks.length).toBeGreaterThan(0);
  expect([previews, orders, versions]).toEqual([[], [], []]);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("open: review and approve, send, pay; the payment page is stubbed; back unpaid, then paid and shipped", async ({ page }) => {
  test.setTimeout(300_000);
  const { mock, sid, jamie } = await rosesBook(page);
  const { previews, orders, versions } = server(mock, {
    open: true,
    userId: jamie.id,
  });
  // the payment page, answered here and never fetched from the internet
  const checkoutHits: string[] = [];
  await page.route(`${CHECKOUT}**`, (route) => {
    checkoutHits.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Payment stub</title><p>Payment stub</p>",
    });
  });

  // the Book page's one way in
  await page.goto("/book");
  const order = page.locator("#editions").getByRole("link", { name: "Order a printed copy" });
  await expect(order).toBeVisible({ timeout: 15_000 });
  await expect(order).toHaveAttribute("href", `/book/order?story=${sid}`);
  await expect(page.locator("#editions .ed-price")).toHaveCount(0);
  await order.click();

  /* ── Step 1: Review ── */
  await expect(
    page.getByRole("status").filter({
      hasText: /Getting your book ready…|Laying out page \d+ of \d+…|Saving your book’s pages…/,
    }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Look through Rose’s book" })).toBeVisible({ timeout: 240_000 });
  const flip = page.locator(".bf");
  const shown = flip.locator("img.bf-page");
  await expect(shown).toBeVisible();
  expect(await shown.getAttribute("src")).toMatch(/^blob:/);
  // a real rendered page, drawn and loaded, not an empty frame
  await expect.poll(() => shown.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 100)).toBe(true);
  await expect(flip.locator(".bf-where")).toHaveText("The cover");
  await flip.getByRole("button", { name: /Next page/ }).click();
  await expect(flip.locator(".bf-where")).toHaveText(/^Page 1 of \d+$/);
  expect(await shown.getAttribute("src")).toMatch(/^blob:/);
  await page.keyboard.press("ArrowRight");
  await expect(flip.locator(".bf-where")).toHaveText(/^Page 2 of \d+$/);

  await expect(page.getByText(/^Your book has \d+ pages$/)).toBeVisible();
  await expect(page.getByText("Each copy: $79")).toBeVisible();
  await expect(page.getByText("A photo in “Our wedding” may look blurry in print.")).toBeVisible();
  const cont = page.getByRole("button", { name: "Continue" });
  await expect(cont).toBeDisabled();
  await holdsTheFloor(page, "review");
  // the file was filed with the version before anything was approved
  expect(mock.objects.get("book-versions/ver-1/interior.pdf")?.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(mock.objects.get("book-versions/ver-1/cover.pdf")?.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(versions.filter((v) => v.action === "approve")).toEqual([]);

  await page
    .getByRole("checkbox", {
      name: "I've reviewed my book and it's ready to print.",
    })
    .click();
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(page).toHaveURL(/step=send/);
  const approved = versions.filter((v) => v.action === "approve");
  expect(approved).toHaveLength(1);
  expect(approved[0]).toMatchObject({
    action: "approve",
    versionId: "ver-1",
    confirmed: true,
  });
  expect(approved[0].pageCount).toBeGreaterThanOrEqual(24);

  /* ── Step 2: Who should receive it ── */
  await expect(page.getByRole("heading", { name: "Who should receive it" })).toBeVisible();
  const card = page.locator(".bo-card").first();
  await card.locator('input[name="name"]').fill("Rose Hartley");
  await card.locator('input[name="line1"]').fill("1 Elm Street");
  await card.locator('input[name="city"]').fill("San Jose");
  await card.locator('select[name="state"]').selectOption("CA");
  await card.locator('input[name="postal"]').fill("9511");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please check the ZIP code. It should be 5 digits, like 10001.")).toBeVisible();
  await expect(page).toHaveURL(/step=send/);
  expect(previews).toEqual([]);
  await holdsTheFloor(page, "send-bad-zip", { prices: false });
  await card.locator('input[name="postal"]').fill("95112");

  await page.getByRole("button", { name: "Add another copy for someone else" }).click();
  await expect(page.locator(".bo-card")).toHaveCount(2);
  await holdsTheFloor(page, "send-two", { prices: false });
  await page.locator(".bo-card").nth(1).getByRole("button", { name: "Remove this address" }).click();
  await expect(page.locator(".bo-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Continue" }).click();

  /* ── Step 3: Pay ── */
  await expect(page).toHaveURL(/step=pay/);
  const summary = page.locator(".bo-summary");
  await expect(summary.locator(".bo-line", { hasText: "Your book" })).toContainText("$79.00");
  await expect(summary.locator(".bo-line", { hasText: "Shipping" })).toContainText("$8.99");
  await expect(summary.locator(".bo-line", { hasText: "Your deposit" })).toContainText("−$1.00");
  await expect(summary.locator(".bo-total")).toContainText("$86.99");
  await expect(summary.getByText("Arrives between Tue 10 Nov and Fri 13 Nov")).toBeVisible();
  await holdsTheFloor(page, "pay");
  // read-only, so asking twice (React's development double effect) changes nothing; every ask is the same
  expect(previews.length).toBeGreaterThan(0);
  for (const p of previews)
    expect(p).toEqual({
      preview: true,
      versionId: "ver-1",
      shipments: [
        {
          quantity: 1,
          address: {
            name: "Rose Hartley",
            line1: "1 Elm Street",
            line2: "",
            city: "San Jose",
            state: "CA",
            postal: "95112",
            phone: "",
          },
        },
      ],
    });
  expect(orders, "no order before Pay is pressed").toEqual([]);

  await page.getByRole("button", { name: "Pay $86.99" }).click();
  await page.waitForURL(`${CHECKOUT}**`, { timeout: 30_000 });
  await expect(page.getByText("Payment stub")).toBeVisible();
  expect(checkoutHits).toEqual([CHECKOUT]);
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    client: "web",
    versionId: "ver-1",
    shipments: [
      {
        quantity: 1,
        address: {
          name: "Rose Hartley",
          line1: "1 Elm Street",
          city: "San Jose",
          state: "CA",
          postal: "95112",
        },
      },
    ],
    returnTo: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/book\/thanks$/),
  });
  expect(JSON.stringify(orders[0]), "a price sent by the page").not.toMatch(/cents|price|amount|total/i);

  /* ── Back from the payment page without paying ── */
  await page.goto("/book/thanks?order_id=ord-1&canceled=1");
  await expect(page).toHaveURL(/\/book\/order\?.*step=pay/, {
    timeout: 15_000,
  });
  await expect(page.getByText(/Nothing was charged\./)).toBeVisible();
  await expect(page.locator(".bo-summary .bo-total")).toContainText("$86.99");
  expect(
    versions.filter((v) => v.action === "prepare"),
    "asked to look through the book again",
  ).toHaveLength(1);

  /* ── Paid, then shipped ── */
  const row = mock.tables.book_orders.find((o) => o.id === "ord-1")!;
  Object.assign(row, { status: "paid", paid_at: "2026-10-27T10:00:05.000Z" });
  Object.assign(row, { status: "shipped" });
  Object.assign(
    mock.tables.order_shipments.find((s) => s.order_id === "ord-1")!,
    {
      status: "shipped",
      carrier: "USPS",
      tracking_url: TRACKING,
      shipped_at: "2026-10-30T10:00:00.000Z",
    },
  );

  await page.goto("/book/thanks?order_id=ord-1");
  await expect(page).toHaveURL(/\/book\/orders\/ord-1/, { timeout: 15_000 });
  const current = page.locator('.bo-tracker li[aria-current="step"]');
  await expect(current).toHaveText("Shipped", { timeout: 15_000 });
  await expect(page.locator(".bo-tracker li")).toHaveText(["Approved", "Printing", "Shipped", "Delivered"]);
  const track = page.getByRole("link", {
    name: "Track the parcel to Rose in San Jose",
  });
  await expect(track).toHaveAttribute("href", TRACKING);
  await expect(track).toHaveAttribute("target", "_blank");
  await expect(track).toHaveAttribute("rel", /noopener/);
  expect(await page.locator("body").innerText(), "a street on the status page").not.toContain("1 Elm Street");
  await holdsTheFloor(page, "status");

  // the list shows it, paid, with its stage, and goes to its page
  await page.goto("/book/orders");
  const listed = page.locator(".bo-order");
  await expect(listed).toHaveCount(1, { timeout: 15_000 });
  await expect(listed).toContainText("Shipped");
  await expect(listed.getByRole("link", { name: "Rose’s book" })).toHaveAttribute("href", "/book/orders/ord-1");

  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("covered by a gift: the total is $0, the button reads Place my order, and the order is placed with no payment page", async ({ page }) => {
  const { mock, sid, jamie } = await rosesBook(page);
  const { orders } = server(mock, { open: true, userId: jamie.id });
  const answer = mock.functions["create-book-order"];
  const GIFT_LINES = [
    { kind: "book", label: "Your book", quantity: 1, unitCents: 7900, amountCents: 7900 },
    { kind: "shipping", label: "Shipping", amountCents: 899 },
    { kind: "gift_copy", label: "Covered by a gift", amountCents: -8799 },
  ];
  mock.functions["create-book-order"] = (args, ctx) => {
    if (args.check === true) return answer(args, ctx);
    if (args.preview === true)
      return { preview: true, totalCents: 0, currency: "usd", lines: GIFT_LINES, delivery: { earliest: "2026-11-10", latest: "2026-11-13" }, coveredByCredits: true };
    const placed = answer(args, ctx) as Row;
    Object.assign(mock.tables.book_orders.find((o) => o.id === placed.orderId)!, { status: "paid", paid_at: "2026-10-27T10:00:01.000Z", total_cents: 0, amount_cents: 0 });
    return { orderId: placed.orderId, totalCents: 0, currency: "usd", lines: GIFT_LINES, delivery: placed.delivery, paid: true, checkoutUrl: null, clientSecret: null };
  };
  const checkoutHits: string[] = [];
  await page.route("https://checkout.stripe.com/**", (route) => {
    checkoutHits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Payment stub</title>" });
  });
  // the book was reviewed and approved (step 1) and the address given (step 2) earlier in this visit
  const draft = {
    versionId: "ver-1",
    pageCount: 32,
    copyCents: 7900,
    cards: [{ id: "card-0", pick: "other", quantity: 1, address: { name: "Rose Hartley", line1: "1 Elm Street", line2: "", city: "San Jose", state: "CA", postal: "95112", phone: "" } }],
  };
  await page.addInitScript(([key, value]) => sessionStorage.setItem(key, value), [`astory:book-order:${sid}:v1`, JSON.stringify(draft)] as const);

  await page.goto(`/book/order?story=${sid}&step=pay`);
  const summary = page.locator(".bo-summary");
  await expect(summary.locator(".bo-total")).toContainText("Covered by a gift", { timeout: 15_000 });
  const place = page.getByRole("button", { name: "Place my order" });
  await expect(place).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pay / })).toHaveCount(0);
  await holdsTheFloor(page, "pay-covered");
  expect(orders).toEqual([]);

  await place.click();
  await expect(page).toHaveURL(/\/book\/orders\/ord-1/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /is ordered/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".bo-tracker li")).toHaveText(["Approved", "Printing", "Shipped", "Delivered"]);
  await expect(page.getByText(/Confirming your payment/)).toHaveCount(0);
  expect(orders).toHaveLength(1);
  expect(checkoutHits, "a request to the payment page").toEqual([]);
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
