/**
 * Phase 5, the admin view of printed-book orders (phone repo docs/PLAN_ORDERING.md, rulings P5-R8 and P5-R9), against
 * the in-memory Supabase. admin-orders is mocked here with an in-memory list of orders and answers 403 to anyone who
 * isn't on its staff list, as the real function does from the staff table; Stripe and the printer sit behind it, so
 * nothing real is called.
 *
 *   1. A signed-in family member who isn't staff opens /admin/orders and sees only "This page isn't available.".
 *   2. Staff see the list, newest first, and the status filter narrows it.
 *   3. An order's page shows its shipments with the address and tracking, the family's report with its photo, and the
 *      event log.
 *   4. Change status stays disabled until a note is typed, then sends { action: 'override', orderId, to, note }.
 *   5. Refund asks "Refund $X to the card?", sends { action: 'refund', orderId, note }, and the status reads refunded.
 * Every page holds the floor (16px text, 44px targets, no sideways scroll). No screenshots are written.
 */
import { expect, test, type Page } from "@playwright/test";
import { HOST, fixtures, mockSupabase, type MockSupabase, type Row } from "../support/mockSupabase";
import { checkFloor } from "../support/screen";

const A = "0a000000-0000-4000-8000-0000000000a1";
const B = "0b000000-0000-4000-8000-0000000000b2";
const C = "0c000000-0000-4000-8000-0000000000c3";
const PHOTO = `${HOST}/storage/v1/object/sign/order-issues/${B}/1f0e2d3c-4b5a-4968-8776-655443322110.jpg?token=t`;

type Order = Row & { id: string; status: string; createdAt: string; totalCents: number; charged: boolean };

/** Three orders: one sent and in production, one a family reported a problem with, one that failed to send. */
function orders(): Order[] {
  const base = { quantity: 1, submitAttempts: 0, nextAttemptAt: null, subtotalCents: 7900, shippingCents: 899, taxCents: 0, discountCents: 0, depositCreditCents: 0, currency: "usd" };
  return [
    { ...base, id: A, createdAt: "2026-11-03T10:00:00.000Z", status: "in_production", totalCents: 8799, customerEmail: "ann@example.com", paidAt: "2026-11-03T10:01:00.000Z", charged: true, stripePaymentIntentId: "pi_a" },
    { ...base, id: B, createdAt: "2026-11-02T10:00:00.000Z", status: "issue_reported", totalCents: 8799, customerEmail: "jamie@example.com", paidAt: "2026-11-02T10:01:00.000Z", charged: true, stripePaymentIntentId: "pi_b" },
    { ...base, id: C, createdAt: "2026-11-01T10:00:00.000Z", status: "submission_failed", totalCents: 0, customerEmail: "cal@example.com", paidAt: "2026-11-01T10:01:00.000Z", charged: false, submitAttempts: 3, stripePaymentIntentId: null },
  ];
}

/** admin-orders as the server answers it, with every body kept. Only ids in `staff` pass; everyone else gets 403. */
function adminServer(mock: MockSupabase, staff: string[]) {
  const list = orders();
  const bodies: Row[] = [];
  const events: Record<string, Row[]> = {
    [B]: [
      { id: 1, at: "2026-11-02T10:01:00.000Z", actor: "stripe", kind: "status", fromStatus: "payment_pending", toStatus: "paid", note: null, data: null },
      { id: 2, at: "2026-11-02T11:01:00.000Z", actor: "cron", kind: "status", fromStatus: "paid", toStatus: "submitted_to_provider", note: null, data: { attempt: 1 } },
      { id: 3, at: "2026-11-05T09:00:00.000Z", actor: "customer:u-1", kind: "status", fromStatus: "shipped", toStatus: "issue_reported", note: "family report", data: null },
    ],
  };
  let nextEvent = 10;
  const log = (orderId: string, e: Row) => (events[orderId] ??= []).push({ id: nextEvent++, at: "2026-11-06T12:00:00.000Z", note: null, data: null, ...e });
  mock.functions["admin-orders"] = (args, { user }) => {
    bodies.push(args);
    if (!user) return { status: 401, body: { error: "not_signed_in" } };
    if (!staff.includes(user.id)) return { status: 403, body: { error: "not_staff" } };
    const actor = `admin:${user.id}`;
    const o = list.find((x) => x.id === args.orderId);
    switch (args.action) {
      case "me":
        return { staff: true };
      case "list": {
        const want = args.status === "needs_look" ? ["submission_failed", "issue_reported"] : args.status ? [String(args.status)] : null;
        const rows = list.filter((x) => !want || want.includes(x.status)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        return { orders: rows.map(({ id, createdAt, status, totalCents, quantity, customerEmail, paidAt, submitAttempts, nextAttemptAt }) => ({ id, createdAt, status, totalCents, quantity, customerEmail, paidAt, submitAttempts, nextAttemptAt })), next: null };
      }
      case "detail":
        if (!o) return { status: 404, body: { error: "not_found" } };
        return {
          order: o,
          shipments:
            o.id === B
              ? [
                  {
                    id: "s-b1",
                    quantity: 1,
                    name: "Mae Lindqvist",
                    line1: "1 Elm Street",
                    line2: null,
                    city: "San Jose",
                    state: "CA",
                    postalCode: "95112",
                    country: "US",
                    status: "shipped",
                    carrier: "USPS",
                    trackingNumber: "9400111899223197428490",
                    trackingUrl: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490",
                    providerOrderId: "ord_812345",
                    providerIssue: null,
                  },
                ]
              : [],
          events: events[o.id] ?? [],
          issues: o.id === B ? [{ id: "i-1", reason: "damaged", description: "The cover arrived torn at the corner.", photoUrl: PHOTO, createdAt: "2026-11-05T09:00:00.000Z", resolvedAt: null }] : [],
        };
      case "override": {
        if (!o) return { status: 404, body: { error: "not_found" } };
        if (typeof args.note !== "string" || args.note.trim().length < 3) return { status: 400, body: { error: "needs_note" } };
        const from = o.status;
        o.status = String(args.to);
        log(o.id, { actor, kind: "override", fromStatus: from, toStatus: o.status, note: args.note });
        return { changed: true, from, to: o.status, status: o.status };
      }
      case "refund": {
        if (!o) return { status: 404, body: { error: "not_found" } };
        if (!o.charged) return { status: 409, body: { error: "nothing_charged" } };
        const from = o.status;
        o.status = "refunded";
        log(o.id, { actor, kind: "status", fromStatus: from, toStatus: "refunded", note: args.note, data: { printCancel: [] } });
        return { refunded: true, alreadyRefunded: false, changed: true, status: "refunded", printCancel: [] };
      }
      case "retry":
        return { ok: true, nextAttemptAt: "2026-11-06T12:00:00.000Z" };
      default:
        return { status: 400, body: { error: "bad_action" } };
    }
  };
  return { list, bodies };
}

/** Jamie, signed in with a story of their own (so the signed-in frame has someone to show). */
async function signedIn(page: Page) {
  const mock = await mockSupabase(page);
  const jamie = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Hartley" });
  const [story] = mock.insert("stories", fixtures.story(jamie.id, { name: "Rose", relationship: "Mother" }));
  Object.assign(mock.tables.profiles.find((p) => p.id === jamie.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, jamie);
  return { mock, jamie };
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("a signed-in user who isn't staff sees only 'This page isn't available.'", async ({ page }) => {
  const { mock } = await signedIn(page);
  const { bodies } = adminServer(mock, []);

  await page.goto("/admin/orders");
  await expect(page.getByText("This page isn’t available.")).toBeVisible({ timeout: 15_000 });
  const text = await page.locator("body").innerText();
  for (const leak of ["ann@example.com", "jamie@example.com", "in production", "$87.99", "Load more"]) expect(text).not.toContain(leak);
  await expect(page.locator("table, select")).toHaveCount(0);
  await checkFloor(page, "not staff: list");

  await page.goto(`/admin/orders/${B}`);
  await expect(page.getByText("This page isn’t available.")).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("body").innerText()).not.toContain("Mae Lindqvist");
  await checkFloor(page, "not staff: detail");

  // it asked only "me" (React asks twice in development), and the server refused it
  expect(bodies.length).toBeGreaterThan(0);
  expect(new Set(bodies.map((b) => b.action))).toEqual(new Set(["me"]));
  expect(mock.blocked, "requests that left the machine").toEqual([]);
});

test("staff: the list filters, the order shows its shipments, report and log; override and refund are sent as asked", async ({ page }) => {
  const { mock, jamie } = await signedIn(page);
  const { list, bodies } = adminServer(mock, [jamie.id]);

  /* ── the list ── */
  await page.goto("/admin/orders");
  await expect(page.locator(".adm-page select")).toBeVisible({ timeout: 15_000 });
  const rows = page.locator(".adm-table tbody tr");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("in production");
  await expect(rows.nth(0)).toContainText("ann@example.com");
  await expect(rows.nth(0)).toContainText("$87.99");
  await checkFloor(page, "list: all");

  const show = page.getByLabel("Show");
  await show.selectOption("needs_look");
  await expect(rows).toHaveCount(2);
  await expect(page.locator(".adm-table")).not.toContainText("ann@example.com");
  await show.selectOption("submission_failed");
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText("cal@example.com");
  await expect(rows.nth(0)).toContainText("3");
  await checkFloor(page, "list: one status");
  expect(bodies.filter((b) => b.action === "list").map((b) => b.status ?? "")).toEqual(["", "needs_look", "submission_failed"]);

  /* ── the order a family reported ── */
  await show.selectOption("issue_reported");
  await expect(rows).toHaveCount(1);
  await rows.nth(0).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${B}$`));
  await expect(page.getByTestId("adm-status")).toHaveText("issue reported", { timeout: 15_000 });
  // the shipment: the full address, the tracking and the printer's order id
  const ship = page.locator("section", { has: page.getByRole("heading", { name: "Shipments" }) });
  await expect(ship).toContainText("Mae Lindqvist");
  await expect(ship).toContainText("1 Elm Street");
  await expect(ship).toContainText("San Jose, CA 95112");
  await expect(ship).toContainText("USPS 9400111899223197428490");
  await expect(ship).toContainText("ord_812345");
  await expect(ship.getByRole("link", { name: "Tracking link" })).toHaveAttribute("href", /^https:\/\/tools\.usps\.com\//);
  // the report, with its photo
  const report = page.locator("section", { has: page.getByRole("heading", { name: "Reports from the family" }) });
  await expect(report).toContainText("It arrived damaged");
  await expect(report).toContainText("The cover arrived torn at the corner.");
  await expect(report.locator("img")).toHaveAttribute("src", PHOTO);
  // the log, oldest first, with each event's data folded away
  const log = page.locator(".adm-log li");
  await expect(log).toHaveCount(3);
  await expect(log.nth(0)).toContainText("stripe");
  await expect(log.nth(0)).toContainText("payment pending → paid");
  await expect(log.nth(1)).toContainText("cron");
  await expect(log.nth(1).locator("details summary")).toHaveText("Data");
  await expect(log.nth(2)).toContainText("family report");
  // money lines
  await expect(page.locator(".adm-money")).toContainText("Shipping");
  await expect(page.locator(".adm-money")).toContainText("$87.99");
  // no retry on an order that didn't fail to send
  await expect(page.getByRole("button", { name: "Retry sending to the printer" })).toHaveCount(0);
  await checkFloor(page, "detail");

  /* ── change status: disabled until a note ── */
  await expect(page.getByText("This changes the status only. It doesn’t refund, email the family or tell the printer.")).toBeVisible();
  const change = page.getByRole("button", { name: "Change status", exact: true });
  await page.getByLabel("New status").selectOption("delivered");
  await expect(change).toBeDisabled();
  const notes = page.getByLabel("Note (required)");
  await notes.nth(0).fill("ok");
  await expect(change).toBeDisabled();
  await notes.nth(0).fill("Reprinted by hand, family has the new copy");
  await expect(change).toBeEnabled();
  await change.click();
  await expect(page.getByText("Change the status to delivered?")).toBeVisible();
  await page.getByRole("button", { name: "Yes, change it" }).click();
  await expect(page.getByTestId("adm-status")).toHaveText("delivered");
  await expect(page.getByText("Status changed to delivered.")).toBeVisible();
  expect(bodies.filter((b) => b.action === "override")).toEqual([{ action: "override", orderId: B, to: "delivered", note: "Reprinted by hand, family has the new copy" }]);
  await expect(log).toHaveCount(4);
  await expect(log.nth(3)).toContainText(`admin:${jamie.id}`);
  await expect(log.nth(3)).toContainText("override");
  await checkFloor(page, "after override");

  /* ── refund: confirm the amount, then refunded ── */
  const refund = page.getByRole("button", { name: "Refund", exact: true });
  await expect(refund).toBeDisabled();
  await page.getByLabel("Note (required)").nth(1).fill("Family asked for their money back");
  await refund.click();
  await expect(page.getByText("Refund $87.99 to the card?")).toBeVisible();
  await checkFloor(page, "refund confirm");
  await page.getByRole("button", { name: "Yes, refund $87.99" }).click();
  await expect(page.getByTestId("adm-status")).toHaveText("refunded");
  await expect(page.getByText("Refunded $87.99.")).toBeVisible();
  expect(bodies.filter((b) => b.action === "refund")).toEqual([{ action: "refund", orderId: B, note: "Family asked for their money back" }]);
  expect(list.find((o) => o.id === B)?.status).toBe("refunded");
  // a refunded order offers no second refund
  await expect(page.getByRole("button", { name: "Refund", exact: true })).toHaveCount(0);
  await checkFloor(page, "after refund");

  /* ── an order with nothing charged offers retry, and no refund ── */
  await page.goto(`/admin/orders/${C}`);
  await expect(page.getByTestId("adm-status")).toHaveText("submission failed", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Refund", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry sending to the printer" }).click();
  await expect(page.getByText("It will be sent on the next run.")).toBeVisible();
  expect(bodies.filter((b) => b.action === "retry")).toEqual([{ action: "retry", orderId: C }]);
  await checkFloor(page, "retry");

  expect(mock.blocked, "requests that left the machine").toEqual([]);
});
