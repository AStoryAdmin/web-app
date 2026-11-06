/**
 * The printed book's codes (/read), end to end against a mocked book_read: a chapter code shows the chapter's
 * three memories with their titles and her words cleaned of every "Storyteller:" label, "Hear it" only where
 * there is a voice (pointed at the listen function with the memory and the book's key); a wrong code says the
 * book is not one we know; a server without the SQL says the page is not switched on.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const HOST = "https://read-test.supabase.co";
const RPC = `${HOST}/rest/v1/rpc/book_read`;
const LISTEN = `${HOST}/functions/v1/listen`;
const STORY = "MAAAAAAAAAAAAAAAAAAAAQ";
const KEY = "Ab3_dE-fGh1jKlM9";
const ID = (n: string) => `QAAAAAAAAAAAAAAAAAAA${n}`;

const rows = [
  {
    memory_short: ID("EQ"),
    title: "The Sunday pot roast",
    body: "Storyteller: Margaret never measured anything.\nInterviewer: How did she know it was done?\nStoryteller: She knew by the smell.",
    era: "Childhood",
    period: "the 1960s",
    photo_url: `${HOST}/photos/roast.jpg`,
    has_voice: true,
    teller_name: "Rose",
    sides: [{ name: "Linh", body: "I remember the gravy most." }],
  },
  {
    memory_short: ID("IQ"),
    title: "Pulling onions",
    body: "We pulled onions at dawn, before school.",
    era: "Childhood",
    period: "1958",
    photo_url: null,
    has_voice: false,
    teller_name: "Rose",
    sides: [],
  },
  {
    memory_short: ID("MQ"),
    title: "The blue door",
    body: "Storyteller: The house had a blue door that stuck in summer.",
    era: "Childhood",
    period: "",
    photo_url: null,
    has_voice: false,
    teller_name: "Rose",
    sides: [],
  },
];

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

// A 1×1 PNG, for the photograph.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** READ_SHOTS=<dir> saves a picture of each state for a human to look at. */
async function shot(page: Page, name: string) {
  const dir = process.env.READ_SHOTS;
  if (dir) await page.screenshot({ path: `${dir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

type Seen = { reads: Record<string, unknown>[] };
type Answer = { status: number; body: unknown };

async function mock(page: Page, answer: Answer): Promise<Seen> {
  const seen: Seen = { reads: [] };
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://fonts.gstatic.com/**", (r) => r.abort());
  await page.route(`${HOST}/**`, async (route: Route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (url === RPC && req.method() === "POST") {
      expect(req.headers()["apikey"]).toBe("anon-test-key");
      seen.reads.push(req.postDataJSON() as Record<string, unknown>);
      return route.fulfill({ status: answer.status, headers: CORS, contentType: "application/json", body: JSON.stringify(answer.body) });
    }
    if (url.endsWith("/photos/roast.jpg")) return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    return route.fulfill({ status: 404, headers: CORS, body: "" });
  });
  return seen;
}

test("a chapter code opens the chapter's three memories, her words clean, a voice only where there is one", async ({ page }) => {
  const seen = await mock(page, { status: 200, body: rows });
  await page.goto(`/read?s=${STORY}&c=childhood&k=${KEY}`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Childhood, from Rose’s book");
  const titles = page.getByRole("heading", { level: 2 });
  await expect(titles).toHaveCount(3);
  // the book's order: by date, the undated last
  await expect(titles).toHaveText(["Pulling onions", "The Sunday pot roast", "The blue door"]);
  await expect(page.getByText("Margaret never measured anything.")).toBeVisible();
  await expect(page.getByText("She knew by the smell.")).toBeVisible();
  await expect(page.getByText("The house had a blue door that stuck in summer.")).toBeVisible();
  await expect(page.getByText("We pulled onions at dawn, before school.")).toBeVisible();
  // the asker's turn is gone, and no label is ever shown
  await expect(page.getByText("How did she know it was done?")).toHaveCount(0);
  await expect(page.getByText(/Storyteller:|Interviewer:/)).toHaveCount(0);
  await expect(page.getByText("the 1960s")).toBeVisible();
  await expect(page.getByRole("img", { name: /Photograph/ })).toHaveCount(1);
  await expect(page.getByText("I remember the gravy most.")).toBeVisible();
  await expect(page.getByText("Linh", { exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Childhood · A Story");

  // the server was asked for this chapter by name, once, with the key
  expect(seen.reads).toEqual([{ p_story_short: STORY, p_key: KEY, p_chapter: "Childhood", p_memory_short: null }]);

  // one voice: the listen function with the memory and the book's key, the code the older books print
  const audio = page.locator("audio");
  await expect(audio).toHaveCount(1);
  await expect(audio).toHaveAttribute("src", `${LISTEN}?m=${ID("EQ")}&k=${KEY}`);
  await expect(page.getByRole("button", { name: /Hear Rose tell it/ })).toHaveCount(1);

  await shot(page, "1-chapter");

  // the quiet way in, and nothing that sells
  await expect(page.getByRole("link", { name: "Keep this in A Story" })).toHaveAttribute("href", "/welcome");
  await expect(page.getByText(/\$|per month|plan/i)).toHaveCount(0);
  // no memory id in the address
  expect(page.url()).not.toContain(ID("EQ"));
});

test("an older code beside one memory opens that memory alone", async ({ page }) => {
  const seen = await mock(page, { status: 200, body: [rows[0]] });
  await page.goto(`/read?m=${ID("EQ")}&k=${KEY}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Sunday pot roast");
  await expect(page.getByText("From Rose’s book")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  expect(seen.reads).toEqual([{ p_story_short: null, p_key: KEY, p_chapter: null, p_memory_short: ID("EQ") }]);
  await expect(page.locator("audio")).toHaveAttribute("src", `${LISTEN}?m=${ID("EQ")}&k=${KEY}`);
});

test("a wrong code: the server answers nothing, and the page says so without naming anything", async ({ page }) => {
  const seen = await mock(page, { status: 200, body: [] });
  await page.goto(`/read?s=${STORY}&c=childhood&k=WrongKeyWrongKey`);
  await expect(page.getByText("This code doesn’t match a book we know.")).toBeVisible();
  await expect(page.getByText("Ask the family for a new copy.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
  await expect(page.locator("audio")).toHaveCount(0);
  expect(seen.reads).toHaveLength(1);
  await shot(page, "2-wrong-code");
  await expect(page.getByRole("link", { name: /Keep your family’s memories in A Story/ })).toHaveAttribute("href", "/welcome");
});

test("a code with no key never reaches the server", async ({ page }) => {
  const seen = await mock(page, { status: 200, body: rows });
  await page.goto(`/read?s=${STORY}&c=childhood`);
  await expect(page.getByText("This code doesn’t match a book we know.")).toBeVisible();
  expect(seen.reads).toHaveLength(0);
});

test("a server without the SQL says the page is not switched on", async ({ page }) => {
  await mock(page, { status: 404, body: { code: "PGRST202", message: "Could not find the function public.book_read" } });
  await page.goto(`/read?s=${STORY}&c=childhood&k=${KEY}`);
  await expect(page.getByText("This page isn’t switched on yet.")).toBeVisible();
});
