import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import {
  PRINT_ORDER_MESSAGES,
  arrivesWords,
  blankAddress,
  checkPrintOrder,
  coveredWords,
  fromSaved,
  groupWarnings,
  lineLabel,
  money,
  placePrintOrder,
  previewPrintOrder,
  price,
  reasonOf,
  stateCode,
  validateShipments,
  zipCode,
  type OrderLine,
  type PrintAddress,
} from "./printOrder";

const fetchSpy = vi.fn();
beforeEach(() => {
  sb.invoke.mockReset();
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

const rose: PrintAddress = { name: "Rose Hartley", line1: "1 Elm Street", line2: "", city: "San Jose", state: "CA", postal: "95112", phone: "" };
const httpError = (status: number, body: unknown) => ({ name: "FunctionsHttpError", message: "non-2xx", context: new Response(JSON.stringify(body), { status }) });

const lines: OrderLine[] = [
  { kind: "book", label: "Your book", quantity: 2, unitCents: 7900, amountCents: 15800 },
  { kind: "shipping", label: "Shipping", amountCents: 1299 },
  { kind: "deposit", label: "Your deposit", amountCents: -100 },
];

describe("the address rules, as the server's readShipments", () => {
  it("knows a state by its code or its name, and nothing else", () => {
    expect([stateCode("ny"), stateCode("New York"), stateCode("N.Y."), stateCode("DC")]).toEqual(["NY", "NY", "NY", "DC"]);
    expect([stateCode("Ontario"), stateCode("PR"), stateCode("")]).toEqual([null, null, null]);
  });

  it("takes a 5- or 9-digit ZIP and writes the long one with its dash", () => {
    expect([zipCode("95112"), zipCode("95112-1234"), zipCode("951121234"), zipCode(" 95112 ")]).toEqual(["95112", "95112-1234", "95112-1234", "95112"]);
    expect([zipCode("9511"), zipCode("M5V 2T6"), zipCode("95112-12")]).toEqual([null, null, null]);
  });

  it("tidies a good address: the state as its code and the ZIP as written back", () => {
    const out = validateShipments([{ quantity: 2, address: { ...rose, state: "california", postal: "951121234", name: "  Rose   Hartley " } }]);
    expect(out).toEqual({ ok: true, shipments: [{ quantity: 2, address: { ...rose, state: "CA", postal: "95112-1234" } }] });
  });

  it("names the first problem in the server's words, with the card it is about", () => {
    const two = (b: Partial<PrintAddress>) => validateShipments([{ quantity: 1, address: rose }, { quantity: 1, address: { ...rose, ...b } }]);
    expect(two({ postal: "1234" })).toMatchObject({ ok: false, error: "bad_zip", index: 1, field: "postal", message: "Please check the ZIP code for address 2. It should be 5 digits, like 10001." });
    expect(two({ name: "" })).toMatchObject({ error: "needs_name", index: 1, message: "Please add the name of the person receiving the book for address 2." });
    expect(validateShipments([{ quantity: 1, address: { ...rose, state: "Ontario" } }])).toMatchObject({ error: "bad_state", index: 0, message: "Please choose a US state." });
    expect(validateShipments([{ quantity: 1, address: { ...rose, phone: "call me" } }])).toMatchObject({ error: "bad_phone", message: "Please check the phone number, or leave it empty." });
  });

  it("keeps the phone optional", () => {
    expect(validateShipments([{ quantity: 1, address: { ...rose, phone: "" } }]).ok).toBe(true);
    expect(validateShipments([{ quantity: 1, address: { ...rose, phone: "(408) 555-0100" } }]).ok).toBe(true);
  });

  it("allows 1 to 10 copies an address and up to 5 addresses", () => {
    expect(validateShipments([{ quantity: 11, address: rose }])).toMatchObject({ error: "too_many_copies", index: 0, message: "We can send up to 10 copies to one address." });
    expect(validateShipments([{ quantity: 0, address: rose }])).toMatchObject({ error: "bad_quantity", index: 0 });
    expect(validateShipments(Array.from({ length: 6 }, () => ({ quantity: 1, address: rose })))).toMatchObject({ error: "too_many_shipments", message: "We can send one order to up to 5 addresses." });
    expect(validateShipments([])).toMatchObject({ error: "no_shipments" });
    expect(validateShipments(Array.from({ length: 5 }, () => ({ quantity: 10, address: rose }))).ok).toBe(true);
  });

  it("reads an address kept before Phase 4, and drops a Canadian province and postal code", () => {
    expect(fromSaved({ name: "Rose", line1: "1 Elm", line2: "", city: "Austin", region: "TX", postal: "78701", country: "US", phone: "" })).toEqual({ ...blankAddress(), name: "Rose", line1: "1 Elm", city: "Austin", state: "TX", postal: "78701" });
    expect(fromSaved({ name: "Ana", line1: "2 King St", city: "Toronto", region: "ON", postal: "M5V 2T6", country: "CA" })).toMatchObject({ state: "", postal: "" });
    expect([fromSaved(null), fromSaved("x"), fromSaved({})]).toEqual([null, null, null]);
  });
});

describe("checkPrintOrder", () => {
  it("asks with the page count and reads the price of one copy", async () => {
    sb.invoke.mockResolvedValue({ data: { orderingOpen: true, product: { name: "Square hardcover book", maxCopiesPerShipment: 10, maxShipments: 5 }, credits: [{ kind: "deposit", label: "Your deposit of $1.00" }], copyCents: 8500 }, error: null });
    const out = await checkPrintOrder({ pageCount: 140 });
    expect(sb.invoke).toHaveBeenCalledWith("create-book-order", { body: { check: true, pageCount: 140 } });
    expect(out).toEqual({
      orderingOpen: true,
      product: { name: "Square hardcover book", minPages: null, maxPages: null, maxCopiesPerShipment: 10, maxShipments: 5 },
      credits: [{ kind: "deposit", label: "Your deposit of $1.00" }],
      copyCents: 8500,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends no page count when it has none, and reads a server too old to answer as closed", async () => {
    sb.invoke.mockResolvedValue({ data: {}, error: null });
    await expect(checkPrintOrder()).resolves.toEqual({ orderingOpen: false, product: null, credits: [], copyCents: null });
    expect(sb.invoke.mock.calls[0][1].body).toEqual({ check: true });
  });

  it("says a dropped connection in plain words", async () => {
    sb.invoke.mockRejectedValue(new Error("offline"));
    await expect(checkPrintOrder()).rejects.toMatchObject({ reason: "network", message: PRINT_ORDER_MESSAGES.network });
  });
});

describe("previewPrintOrder", () => {
  it("asks read-only with the version and the shipments, and never a price", async () => {
    sb.invoke.mockResolvedValue({ data: { preview: true, totalCents: 16999, currency: "usd", lines, delivery: { earliest: "2026-11-10", latest: "2026-11-13" }, coveredByCredits: false }, error: null });
    const out = await previewPrintOrder({ versionId: "v-1", shipments: [{ quantity: 2, address: rose }] });
    const body = sb.invoke.mock.calls[0][1].body;
    expect(body).toEqual({ preview: true, versionId: "v-1", shipments: [{ quantity: 2, address: rose }] });
    expect(JSON.stringify(body)).not.toMatch(/cents|price|amount|total/i);
    expect(out).toEqual({ totalCents: 16999, currency: "usd", lines, delivery: { earliest: "2026-11-10", latest: "2026-11-13" }, coveredByCredits: false });
  });

  it("carries the server's sentence and the card it is about", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "bad_zip", index: 1, words: "Please check the ZIP code for address 2. It should be 5 digits, like 10001." }) });
    await expect(previewPrintOrder({ versionId: "v-1", shipments: [{ quantity: 1, address: rose }] })).rejects.toMatchObject({
      reason: "address",
      code: "bad_zip",
      index: 1,
      message: "Please check the ZIP code for address 2. It should be 5 digits, like 10001.",
    });
  });

  it("says ordering isn't open, and that the book needs approving again, in its own words", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "not_open", words: "Ordering printed books opens soon." }) });
    await expect(previewPrintOrder({ versionId: "v-1", shipments: [] })).rejects.toMatchObject({ reason: "not_open", message: "Ordering printed books opens soon." });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "not_approved" }) });
    await expect(previewPrintOrder({ versionId: "v-1", shipments: [] })).rejects.toMatchObject({ reason: "needs_review", message: PRINT_ORDER_MESSAGES.needs_review });
  });

  it("never shows a code as words", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(500, { error: "order_failed", words: "order_failed" }) });
    await expect(previewPrintOrder({ versionId: "v-1", shipments: [] })).rejects.toMatchObject({ reason: "unknown", message: PRINT_ORDER_MESSAGES.unknown });
  });
});

describe("placePrintOrder", () => {
  it("sends client web, the version, the shipments and the way back, and returns Checkout", async () => {
    sb.invoke.mockResolvedValue({ data: { orderId: "o-1", totalCents: 16999, lines, delivery: null, paid: false, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1", clientSecret: null }, error: null });
    const out = await placePrintOrder({ versionId: "v-1", shipments: [{ quantity: 2, address: rose }], returnTo: "https://app.astoryapp.com/book/thanks" });
    expect(sb.invoke.mock.calls[0][1].body).toEqual({ versionId: "v-1", shipments: [{ quantity: 2, address: rose }], client: "web", returnTo: "https://app.astoryapp.com/book/thanks" });
    expect(out).toMatchObject({ orderId: "o-1", totalCents: 16999, paid: false, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1" });
  });

  it("returns an order credits paid for, with no page to go to", async () => {
    sb.invoke.mockResolvedValue({ data: { orderId: "o-2", totalCents: 0, lines, paid: true, checkoutUrl: null }, error: null });
    await expect(placePrintOrder({ versionId: "v-1", shipments: [], returnTo: "x" })).resolves.toMatchObject({ orderId: "o-2", paid: true, checkoutUrl: null });
  });

  it("stops rather than send the family nowhere", async () => {
    for (const data of [{ orderId: "o-3", totalCents: 100, paid: false, checkoutUrl: null }, { orderId: "o-3", totalCents: 100, paid: false, checkoutUrl: "javascript:alert(1)" }, { totalCents: 0, paid: true }]) {
      sb.invoke.mockResolvedValue({ data, error: null });
      await expect(placePrintOrder({ versionId: "v-1", shipments: [], returnTo: "x" })).rejects.toMatchObject({ reason: "unknown" });
    }
  });
});

describe("Order more copies (P5-R14)", () => {
  it("previewPrintOrder and placePrintOrder pass reorderOf through, and still no price", async () => {
    sb.invoke.mockResolvedValue({ data: { preview: true, totalCents: 16999, currency: "usd", lines, delivery: null, coveredByCredits: false }, error: null });
    await previewPrintOrder({ versionId: "v-1", shipments: [{ quantity: 1, address: rose }], reorderOf: "o-9" });
    const preview = sb.invoke.mock.calls[0][1].body;
    expect(preview).toEqual({ preview: true, versionId: "v-1", shipments: [{ quantity: 1, address: rose }], reorderOf: "o-9" });
    expect(JSON.stringify(preview)).not.toMatch(/cents|price|amount|total/i);

    sb.invoke.mockResolvedValue({ data: { orderId: "o-10", totalCents: 16999, lines, delivery: null, paid: false, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_2" }, error: null });
    await placePrintOrder({ versionId: "v-1", shipments: [{ quantity: 1, address: rose }], returnTo: "https://app.astoryapp.com/book/thanks", reorderOf: "o-9" });
    expect(sb.invoke.mock.calls[1][1].body).toEqual({ versionId: "v-1", shipments: [{ quantity: 1, address: rose }], client: "web", returnTo: "https://app.astoryapp.com/book/thanks", reorderOf: "o-9" });
  });

  it("leaves reorderOf out of an ordinary order", async () => {
    sb.invoke.mockResolvedValue({ data: { preview: true, totalCents: 100, currency: "usd", lines, delivery: null, coveredByCredits: false }, error: null });
    await previewPrintOrder({ versionId: "v-1", shipments: [], reorderOf: null });
    expect(sb.invoke.mock.calls[0][1].body).not.toHaveProperty("reorderOf");
  });

  it("reads bad_reorder in plain words", async () => {
    expect(PRINT_ORDER_MESSAGES.bad_reorder).toBe("We couldn’t find that order to copy. Please start again from your book.");
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "bad_reorder" }) });
    await expect(previewPrintOrder({ versionId: "v-1", shipments: [], reorderOf: "o-x" })).rejects.toMatchObject({ reason: "bad_reorder", code: "bad_reorder", message: PRINT_ORDER_MESSAGES.bad_reorder });
  });
});

describe("reasonOf", () => {
  it("reads a dropped connection as network", async () => {
    await expect(reasonOf({ name: "FunctionsFetchError" })).resolves.toMatchObject({ reason: "network" });
  });
  it("falls back to the status when the body is not JSON", async () => {
    await expect(reasonOf({ name: "FunctionsHttpError", context: new Response("oops", { status: 401 }) })).resolves.toMatchObject({ reason: "not_signed_in", words: null });
  });
});

describe("the words", () => {
  it("writes amounts with cents, a credit with a minus, a price in a sentence without", () => {
    expect([money(7900), money(-100), money(123456), money(0)]).toEqual(["$79.00", "−$1.00", "$1,234.56", "$0.00"]);
    expect([price(7900), price(8450)]).toEqual(["$79", "$84.50"]);
  });

  it("labels the book line with its copies", () => {
    expect(lines.map(lineLabel)).toEqual(["Your book × 2", "Shipping", "Your deposit"]);
  });

  it("says when it arrives as a range of days", () => {
    expect(arrivesWords({ earliest: "2026-11-10", latest: "2026-11-13" })).toBe("Arrives between Tue 10 Nov and Fri 13 Nov");
    expect(arrivesWords(null)).toBeNull();
  });

  it("says whose credit covered a $0 order, never that it was free", () => {
    expect(coveredWords([{ kind: "founding_copy", label: "x", amountCents: -1 }])).toBe("Covered by your Founding Family place");
    expect(coveredWords([{ kind: "gift_copy", label: "x", amountCents: -1 }])).toBe("Covered by a gift");
    expect(coveredWords([])).not.toMatch(/free/i);
  });

  it("groups photo warnings one line per memory, and never says DPI", () => {
    const out = groupWarnings(
      [
        { kind: "photo_blurry", words: "This photo may look blurry in print: Our wedding.", memoryId: "m1" },
        { kind: "photo_very_blurry", words: "This photo will likely look blurry in print: Our wedding.", memoryId: "m1" },
        { kind: "photo_blurry", words: "This photo may look blurry in print: The farm.", memoryId: "m2" },
        { kind: "listening_code", words: "The listening code for \"The farm\" won't play anything yet.", memoryId: "m2" },
      ],
      [
        { id: "m1", title: "Our wedding" },
        { id: "m2", title: "The farm" },
      ],
    );
    expect(out).toEqual(["2 photos in “Our wedding” may look blurry in print.", "A photo in “The farm” may look blurry in print.", "The listening code for \"The farm\" won't play anything yet."]);
    expect(out.join(" ")).not.toMatch(/dpi|ppi|preflight|bleed/i);
  });
});
