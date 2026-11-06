/**
 * The link to one memory (/m/:token), end to end against a mocked memory_link_read and listen function:
 * the title, the photograph, the words, who sent it, and an audio element pointed at the listen function;
 * then the same link opened again says so and names the sender; a link the server does not know is the
 * same page without a name; and a server without the SQL says the link is not switched on.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const HOST = "https://link-test.supabase.co";
const RPC = `${HOST}/rest/v1/rpc/memory_link_read`;
const LISTEN = `${HOST}/functions/v1/listen`;
const TOKEN = "K7PX2QHM4D";

const row = {
  story_id: "s1",
  memory_id: "m1",
  title: "The Sunday pot roast",
  period: "the 1960s",
  body: "Margaret never measured anything.\n\nShe knew by the smell when it was done.",
  photo_url: `${HOST}/photos/roast.jpg`,
  teller_name: "Rose",
  teller_last_name: "Bennett",
  sender_name: "Daniel",
  sender_id: "u1",
  for_name: "Dad",
  has_voice: true,
  audio_seconds: 94,
  opened: false,
  read_at: "2026-11-06T10:00:00Z",
};
const openedRow = { opened: true, sender_name: "Daniel" };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

/** Three seconds of near-silence as a WAV, so the voice really plays. */
function wav(seconds = 3, rate = 8000): Buffer {
  const n = seconds * rate;
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(n, 40);
  b.fill(128, 44);
  return b;
}

// A 1×1 PNG, for the photograph.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** LINK_SHOTS=<dir> saves a picture of each state for a human to look at. */
async function shot(page: Page, name: string) {
  const dir = process.env.LINK_SHOTS;
  if (dir) await page.screenshot({ path: `${dir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

type Seen = { reads: { p_token: string }[]; listens: string[] };
type Answer = { status: number; body: unknown };

/** memory_link_read answers in order: the first read gets answers[0], the next answers[1], and so on (the last repeats). */
async function mock(page: Page, answers: Answer[]): Promise<Seen> {
  const seen: Seen = { reads: [], listens: [] };
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://fonts.gstatic.com/**", (r) => r.abort());
  await page.route(`${HOST}/**`, async (route: Route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (url === RPC && req.method() === "POST") {
      expect(req.headers()["apikey"]).toBe("anon-test-key");
      const body = req.postDataJSON() as { p_token: string };
      seen.reads.push(body);
      const a = answers[Math.min(seen.reads.length - 1, answers.length - 1)];
      return route.fulfill({ status: a.status, headers: CORS, contentType: "application/json", body: JSON.stringify(a.body) });
    }
    if (url.startsWith(`${LISTEN}?`)) {
      seen.listens.push(url);
      return route.fulfill({ status: 200, headers: { ...CORS, "Cache-Control": "no-store" }, contentType: "audio/wav", body: wav() });
    }
    if (url.endsWith("/photos/roast.jpg")) return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    return route.fulfill({ status: 404, headers: CORS, body: "" });
  });
  return seen;
}

test("the memory opens with its title, photo, words, sender and voice", async ({ page }) => {
  const seen = await mock(page, [{ status: 200, body: [row] }]);
  await page.goto(`/m/${TOKEN.toLowerCase()}`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Sunday pot roast");
  await expect(page.getByText("Daniel sent you this memory from Rose’s story")).toBeVisible();
  await expect(page.getByText("the 1960s")).toBeVisible();
  await expect(page.getByText("Margaret never measured anything.")).toBeVisible();
  await expect(page.getByText("She knew by the smell when it was done.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Photograph/ })).toBeVisible();
  await expect(page).toHaveTitle("The Sunday pot roast · A Story");

  // the token is sent cleaned (upper case), once
  expect(seen.reads).toEqual([{ p_token: TOKEN }]);

  // the voice: one audio element pointed at the listen function, keyed by the link
  const audio = page.locator("audio");
  await expect(audio).toHaveCount(1);
  await expect(audio).toHaveAttribute("src", `${LISTEN}?t=${TOKEN}`);
  const hear = page.getByRole("button", { name: /Hear Rose tell it/ });
  await expect(hear).toBeVisible();
  await expect(hear).toContainText("1 min 34 s");
  await hear.click();
  const pause = page.getByRole("button", { name: /Pause/ });
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => seen.listens.length, { timeout: 10_000 }).toBeGreaterThan(0);
  expect(seen.listens[0]).toBe(`${LISTEN}?t=${TOKEN}`);
  await pause.click();
  await expect(page.getByRole("button", { name: /Hear Rose tell it/ })).toHaveAttribute("aria-pressed", "false");

  await shot(page, "1-memory");

  // the quiet way in, and nothing else that sells
  await expect(page.getByRole("link", { name: "Keep this in A Story" })).toHaveAttribute("href", "/welcome");
  await expect(page.getByText(/\$|per month|plan/i)).toHaveCount(0);
});

test("a memory without a recording shows no player", async ({ page }) => {
  await mock(page, [{ status: 200, body: [{ ...row, has_voice: false, audio_seconds: null }] }]);
  await page.goto(`/m/${TOKEN}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Sunday pot roast");
  await expect(page.locator("audio")).toHaveCount(0);
});

test("opened once: the second visit says so and names the sender", async ({ page }) => {
  const seen = await mock(page, [{ status: 200, body: [row] }, { status: 200, body: [openedRow] }]);
  await page.goto(`/m/${TOKEN}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Sunday pot roast");

  await page.reload();
  await expect(page.getByText("This link has been opened already.")).toBeVisible();
  await expect(page.getByText("Ask Daniel to send a new one.")).toBeVisible();
  await shot(page, "2-opened-already");
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
  expect(seen.reads).toHaveLength(2);
  await expect(page.getByRole("link", { name: /Keep your family’s memories in A Story/ })).toHaveAttribute("href", "/welcome");
});

test("a link the server does not know reads as opened, without a name", async ({ page }) => {
  await mock(page, [{ status: 200, body: [] }]);
  await page.goto(`/m/${TOKEN}`);
  await expect(page.getByText("This link has been opened already.")).toBeVisible();
  await expect(page.getByText("Ask the person who sent it to send a new one.")).toBeVisible();
});

test("a server that fails once can be tried again, and reads the link only then", async ({ page }) => {
  const seen = await mock(page, [{ status: 500, body: { message: "x" } }, { status: 200, body: [row] }]);
  await page.goto(`/m/${TOKEN}`);
  await expect(page.getByText("Something went wrong on our side. Try again in a moment.")).toBeVisible();
  expect(seen.reads).toHaveLength(1);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Sunday pot roast");
  expect(seen.reads).toHaveLength(2);
});

test("a server without the SQL says the link is not switched on", async ({ page }) => {
  await mock(page, [{ status: 404, body: { code: "PGRST202", message: "Could not find the function public.memory_link_read(p_token)" } }]);
  await page.goto(`/m/${TOKEN}`);
  await expect(page.getByText("This link isn’t switched on yet.")).toBeVisible();
});
