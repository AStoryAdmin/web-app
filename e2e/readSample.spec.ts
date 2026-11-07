/**
 * The sample books' codes (/read?sample=<book>&c=<chapter>, plan 2026-11-07 D3): one chapter per sample book,
 * from the bundled public/read-samples/<book>.json with no Supabase call at all. Each shows the chapter's name,
 * every memory's title and its words in full, the label "Sample book", the note "A sample. The voice is synthetic."
 * at "Hear it", and the first "Hear it" really plays (the audio's currentTime moves).
 *   npx playwright test --config e2e/readSample.config.ts
 * READ_SHOTS=<dir> saves a full-page picture of each as read-sample-<book>.png.
 */
import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type SampleFile = { teller: string; chapters: { slug: string; name: string; memories: { title: string; body: string; audio?: string }[] }[] };
const read = (book: string) => JSON.parse(readFileSync(join(process.cwd(), "public", "read-samples", `${book}.json`), "utf8")) as SampleFile;

// one chapter a book, each with more than one memory where the book has one
const CASES: [string, string][] = [
  ["carolyn", "love-family"],
  ["raymond", "when-everything-changed"],
  ["tom", "the-world-we-lived-through"],
];

for (const [book, slug] of CASES) {
  test(`${book}: /read?sample=${book}&c=${slug} shows the chapter's words and plays Hear it`, async ({ page }) => {
    const file = read(book);
    const ch = file.chapters.find((c) => c.slug === slug)!;
    expect(ch, `${slug} in ${book}.json`).toBeTruthy();
    const supabase: string[] = [];
    page.on("request", (r) => {
      if (/supabase/.test(r.url())) supabase.push(r.url());
    });
    await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
    await page.route("https://fonts.gstatic.com/**", (r) => r.abort());

    await page.goto(`/read?sample=${book}&c=${slug}`);
    await expect(page.locator("h1.rd-chapter")).toHaveText(`${ch.name}, from ${file.teller}’s book`);
    await expect(page.locator(".rd-sample")).toHaveText("Sample book");
    await expect(page).toHaveTitle(`${ch.name} · Sample book · A Story`);

    const blocks = page.locator(".rd-memory");
    await expect(blocks).toHaveCount(ch.memories.length);
    for (let i = 0; i < ch.memories.length; i++) {
      const m = ch.memories[i];
      await expect(blocks.nth(i).locator(".rd-title")).toHaveText(m.title);
      // every paragraph of her words, whole
      const paras = m.body.split(/\n\s*\n/);
      const shown = await blocks.nth(i).locator(".ml-words p").allTextContents();
      expect(shown).toEqual(paras);
      if (m.audio) await expect(blocks.nth(i).locator(".rd-sample-note")).toHaveText("A sample. The voice is synthetic.");
    }

    // Hear it: a tap plays the bundled clip
    const first = blocks.first();
    await expect(first.locator("audio")).toHaveAttribute("src", ch.memories[0].audio!);
    await first.locator("button.rd-hear").click();
    await expect(first.locator("button.rd-hear")).toHaveText(/Pause/);
    await expect.poll(() => first.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime), { timeout: 15_000 }).toBeGreaterThan(0);
    const t = await first.locator("audio").evaluate((a: HTMLAudioElement) => ({ t: a.currentTime, d: a.duration, err: a.error?.code ?? null }));
    expect(t.err).toBeNull();
    expect(t.d).toBeGreaterThan(5);
    console.log(`${book}/${slug}: ${ch.memories.length} memories, audio playing at ${t.t.toFixed(2)} s of ${t.d.toFixed(1)} s`);
    // the photographs load
    for (const img of await page.locator("img.ml-photo").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth), { timeout: 15_000 }).toBeGreaterThan(0);
    }
    await first.locator("button.rd-hear").click(); // pause before the picture
    if (process.env.READ_SHOTS) await page.screenshot({ path: `${process.env.READ_SHOTS}/read-sample-${book}.png`, fullPage: true });
    expect(supabase, "a sample never calls Supabase").toEqual([]);
  });
}

test("a sample code the page cannot read says so, and a chapter not in the file is not a book", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.goto("/read?sample=carolyn&c=Love%20family");
  await expect(page.getByText("This code doesn’t match a book we know.")).toBeVisible();
  await page.goto("/read?sample=carolyn&c=the-1960s");
  await expect(page.getByText("This code doesn’t match a book we know.")).toBeVisible();
  await page.goto("/read?sample=nobody&c=childhood");
  await expect(page.getByText("This code doesn’t match a book we know.")).toBeVisible();
});
