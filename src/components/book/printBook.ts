/**
 * Print at home. The printable HTML is the phone app's (app-core
 * legacyBook), so a book printed from a laptop is the same book the app
 * prints. The one thing the web has to do first is sign every photograph:
 * the buckets are private, and the print window can only load a URL the
 * Storage policy has signed for this person.
 *
 * The window opens before the signing starts (a browser only lets a click
 * open a window), shows a line while the book is being made, then becomes
 * the book and asks to print. "Save as PDF" is the same dialog.
 */
import { smarten } from "../../lib/typography";
import { buildLegacyHtml } from "../../app-core/lib/legacyBook.js";
import { bodyHash } from "../../app-core/lib/bookDesign.js";
import { photoUrl } from "../../lib/photoUrls";
import type { Story } from "../../data/stories";

const WAITING_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Making the book…</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3EBDE;color:#4A3327;font:500 20px/1.5 Montserrat,system-ui,sans-serif;text-align:center;padding:24px}
p{margin:8px 0 0;font-size:16px;color:#6B5546}</style></head>
<body><div><strong>Making the book…</strong><p>Every photograph is being fetched. The print dialog opens when it is ready.</p></div></body></html>`;

/** Where the printed book's listening codes point (the listen Edge Function). */
function listenBase(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, "")}/functions/v1/listen` : "";
}

/** The story with every photograph swapped for a URL the print window can load. */
export async function signStoryPhotos(story: Story): Promise<Story> {
  const urls = new Set<string>();
  for (const m of story.memories) for (const p of m.photos || []) if (p) urls.add(p);
  if (story.photo) urls.add(story.photo);
  if (story.cover) urls.add(story.cover);
  const design = story.bookDesign as { cover?: { photo?: string | null; photos?: string[] } } | null;
  if (design?.cover?.photo) urls.add(design.cover.photo);
  for (const p of design?.cover?.photos || []) if (p) urls.add(p);

  const signed = new Map<string, string>();
  await Promise.all(
    [...urls].map(async (u) => {
      const s = await photoUrl(u).catch(() => null);
      if (s) signed.set(u, s);
    }),
  );
  const swap = (u: string | null | undefined) => (u ? signed.get(u) || u : u);
  return {
    ...story,
    photo: swap(story.photo) ?? null,
    cover: swap(story.cover) ?? null,
    bookDesign: design
      ? { ...design, cover: { ...(design.cover || {}), photo: swap(design.cover?.photo) ?? null, photos: (design.cover?.photos || []).map((p) => swap(p) || p) } }
      : story.bookDesign,
    memories: story.memories.map((m) => ({ ...m, photos: (m.photos || []).map((p) => swap(p) || p) })),
  };
}

/** Set a body as the screen sets it: paragraph by paragraph, so smarten's dash rules never join across a line break. */
const NL = String.fromCharCode(10);
const paras = (t: unknown) => String(t ?? "").split(NL).map(smarten).join(NL);

/**
 * The typesetter's pass over what people typed, before app-core sets the printed book: each memory's title and words,
 * the book's title, subtitle, motto, back message and dedication, with curly quotes, dashes and ellipses, as the screen
 * sets them. The kept rows are untouched (lib/typography).
 *
 * A third-person book prints a memory's retold words only while the retelling's hash matches the memory's body
 * (app-core printedBody). So the retold entries that match the raw body are typeset too and re-keyed to the typeset
 * body's hash; a stale retelling stays stale, as it would have.
 */
export function typeset(story: Story): Story {
  const set = (v: unknown) => (typeof v === "string" ? smarten(v) : v);
  type Retold = { h: string; body: string };
  const design = story.bookDesign as (Record<string, unknown> & { cover?: Record<string, unknown>; retold?: Record<string, Retold> }) | null;
  const cover = design?.cover;
  const bodies = new Map(story.memories.map((m) => [m.id, typeof m.body === "string" ? paras(m.body) : m.body]));
  let retold = design?.retold;
  if (retold && typeof retold === "object") {
    const next: Record<string, Retold> = {};
    for (const [id, r] of Object.entries(retold)) {
      const m = story.memories.find((x) => x.id === id);
      const body = bodies.get(id);
      next[id] = m && body !== undefined && r && typeof r.body === "string" && r.h === bodyHash(m.body) ? { h: bodyHash(body) as string, body: paras(r.body) } : r;
    }
    retold = next;
  }
  return {
    ...story,
    bookDesign: design
      ? {
          ...design,
          dedication: set(design.dedication),
          ...(retold ? { retold } : {}),
          cover: cover
            ? { ...cover, title: set(cover.title), subtitle: set(cover.subtitle), tagline: set(cover.tagline), backMessage: set(cover.backMessage) }
            : cover,
        }
      : story.bookDesign,
    memories: story.memories.map((m) => ({ ...m, title: set(m.title) as string, body: bodies.get(m.id) as string })),
  };
}

/** The printable book as HTML, photographs signed, its words typeset. */
export async function printableHtml(story: Story, recordedBy: string): Promise<string> {
  const signed = typeset(await signStoryPhotos(story));
  return buildLegacyHtml(signed, { recordedBy, now: new Date(), listenBase: listenBase() }) as string;
}

/**
 * Opens the book in a new window and asks to print it. Resolves when the
 * window is showing the book; rejects if the browser refused the window
 * (a popup blocker) so the page can say so.
 */
export async function printAtHome(story: Story, recordedBy: string): Promise<void> {
  const win = window.open("", "_blank");
  if (!win) throw new Error("The browser stopped the book from opening. Allow pop-ups for A Story and try again.");
  win.document.open();
  win.document.write(WAITING_HTML);
  win.document.close();

  let html: string;
  try {
    html = await printableHtml(story, recordedBy);
  } catch (err) {
    win.close();
    throw err;
  }

  // Written into the window rather than navigated to a blob URL: a
  // navigation replaces the Window and with it any listener waiting for the
  // photographs, and an <img> that has not loaded prints as a blank frame.
  win.document.open();
  win.document.write(html);
  win.document.close();

  const imgs = Array.from(win.document.images);
  const settle = Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((done) => {
          if (img.complete) return done();
          img.addEventListener("load", () => done(), { once: true });
          img.addEventListener("error", () => done(), { once: true });
        }),
    ),
  );
  const timeout = new Promise<void>((done) => setTimeout(done, 8000));
  await Promise.race([settle, timeout]);
  try {
    win.focus();
    win.print();
  } catch {
    /* the person can still print from the window's own menu */
  }
}
