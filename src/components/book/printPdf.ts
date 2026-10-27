/**
 * The printer's files for an ordered book (D19): the interior and the cover
 * laid flat, to the print profile in app-core legacyBook (PRINT_PROFILES,
 * phone docs/book-fulfilment.md "Print specs"), filed in the book-orders
 * bucket where the phone files them (bookOrderFlow.js uploadOrderPdf):
 * `{orderId}.pdf` and `{orderId}-cover.pdf`.
 *
 * The phone hands its HTML to expo-print, a real print engine. A web page
 * has none it can call (window.print() only opens a dialog), and no PDF
 * library is in package.json, so the book is made here without one:
 *
 *   1. app-core sets the book with the profile (`buildLegacyHtml(story,
 *      { print })`): the page box, the mirrored margins, no cover page.
 *   2. A hidden iframe lays the text block out in CSS columns, one column
 *      to a page. Columns are the browser's only fragmentation a script can
 *      read; the book's forced page breaks become column breaks (forColumns).
 *      The column count is the page count.
 *   3. Each page is drawn through an SVG <foreignObject> onto a canvas at
 *      `dpi` (300 by default) and kept as a JPEG, placed at the recto or
 *      verso margins on a page the size of the trim plus bleed.
 *   4. A small PDF writer below (buildImagePdf) files the pages, with
 *      MediaBox = BleedBox = the page box and TrimBox inset by the bleed,
 *      and adds the blank pages that bring the count to an even 24 or more.
 *   5. The cover is the profile's spread (buildCoverWrapHtml with the bound
 *      page count, so the spine is the printer's table) drawn the same way.
 *   6. The interior is read back (readPdfPages) and checked against the
 *      profile before anything is uploaded (checkInterior). A book that
 *      fails throws PrintPdfError and is never filed, so an order is never
 *      placed with it as long as the ordering page prepares the files
 *      (prepareBookPdfs) before it starts the checkout.
 *
 * Where this falls short of the print spec, precisely:
 *   - Fonts are not embedded, because there is no text in the PDF: every
 *     page is a 300 ppi image. Lulu accepts that (a PDF with no fonts has
 *     nothing to embed), but type is raster, not vector: it prints as sharp
 *     as a 300 ppi photograph, a shade softer than set type.
 *   - Pagination is the browser's column breaking, not its print engine's.
 *     It honours forced breaks, break-inside: avoid, orphans and widows the
 *     same way, but `@page :left/:right` margins are not read (both are
 *     placed by hand here, from pageMarginsIn) and nothing that only exists
 *     in paged media (running heads, page counters) can appear. legacyBook
 *     uses neither today.
 *   - Georgia comes from the reader's own machine, as on the phone; on one
 *     without it the browser substitutes its serif. Cormorant and the
 *     script face travel inside the HTML as base64 and are always right.
 *   - Safari will not let a page read back a canvas it drew an SVG
 *     <foreignObject> onto, so in Safari this throws "render_failed" and the
 *     book cannot be ordered from that browser. Chrome, Edge and Firefox work.
 *   - The cover's wrap and board overhang are the profile's assumptions
 *     (book-fulfilment.md): check them against Lulu's template once.
 *
 * The profile is a parameter (prepareBookPdfs's `profile`, bookPlan,
 * checkInterior, interiorGeometry). Left out, it is PRINT_PROFILE, the old
 * Lulu book. The order page (BookOrder.tsx, Phase 4) always passes the one a
 * locked book version names (bookVersion.ts prepareVersion), and files to
 * the private book-versions bucket (uploadVersionPdfs):
 * `{versionId}/interior.pdf` and `{versionId}/cover.pdf`.
 *
 * prepareBookPdfs also hands back the drawn pages as object URLs (`pages`,
 * `coverPage`), the same JPEGs the PDF holds, for the flip-through
 * (BookFlip.tsx), and each printed photograph's size (`photos`) for
 * preflight.js. The page revokes the URLs (revokeBookPages) when it is done.
 */
import { bookStructure, buildCoverWrapHtml, buildLegacyHtml, coverSpreadIn, pageBoxIn, pageMarginsIn, paddedPageCount, printProfile, spineWidthIn } from "../../app-core/lib/legacyBook.js";
import { signStoryPhotos, typeset } from "./printBook";
import { listenBase } from "../../lib/qrLinks";
import { smarten } from "../../lib/typography";
import { supabase } from "../../lib/supabase";
import type { Story } from "../../data/stories";
import type { Contribution } from "../../data/contributions";

/** The printer an ordered book goes to (book-fulfilment.md: Lulu, US Trade 6 × 9 in, Hardcover Casewrap). */
export const PRINT_PROFILE = "lulu-6x9-hardcover";
export const BUCKET = "book-orders";
/** The private bucket a locked book version's two files go to (R10, R11). */
export const VERSION_BUCKET = "book-versions";

const PX_PER_IN = 96; // a CSS pixel
const PT_PER_IN = 72; // a PDF point
/** Room between columns while the book is laid out, so nothing from one page shows on the next. */
const COLUMN_GAP_PX = PX_PER_IN;

type Profile = {
  trimIn: [number, number];
  bleedIn: number;
  minPages: number;
  maxPages: number;
  pageMultiple: number;
};

export type PrintPdfProblem = "empty" | "too_many_pages" | "too_few_pages" | "odd_pages" | "wrong_size" | "render_failed" | "upload_failed";

/** Why the printer's files could not be made or filed. `problem` is for the page; the message is for a person. */
export class PrintPdfError extends Error {
  problem: PrintPdfProblem;
  constructor(problem: PrintPdfProblem, message: string) {
    super(message);
    this.name = "PrintPdfError";
    this.problem = problem;
  }
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * The profile to use: the one named, or PRINT_PROFILE when none is. A name this copy of app-core doesn't know (a
 * server ahead of the web) is a PrintPdfError with a plain message, not legacyBook's developer one.
 */
export function profileName(name?: string | null): string {
  const chosen = name || PRINT_PROFILE;
  try {
    printProfile(chosen);
  } catch {
    throw new PrintPdfError("render_failed", "This page needs updating before it can prepare the book. Please reload the page and try again.");
  }
  return chosen;
}
const profileOf = (name: string) => printProfile(name) as unknown as Profile;

/* ── The plan: page count, spine, sizes ─────────────────────────────────── */

export type BookPlan = {
  /** Pages the layout made. */
  rendered: number;
  /** Pages the printer binds: even, at least the profile's minimum. */
  pages: number;
  /** Blank pages added at the back to get there. */
  blanks: number;
  spineIn: number;
  /** The interior's page box (trim and bleed), in inches. */
  pageIn: [number, number];
  /** The cover laid flat, in inches. */
  coverIn: [number, number];
};

/** What the printer binds for a layout of `rendered` pages. Throws when it can't be bound. Pure. */
export function bookPlan(rendered: number, profileArg?: string | null): BookPlan {
  const profile = profileName(profileArg);
  if (!(rendered > 0)) throw new PrintPdfError("empty", "The book has no pages yet. Add a memory and try again.");
  const { pages, blanks, tooMany } = paddedPageCount(profile, rendered);
  const p = profileOf(profile);
  if (tooMany) throw new PrintPdfError("too_many_pages", `The book is ${rendered} pages, and the printer binds at most ${p.maxPages}. Hold a few memories back in Cover and layout and try again.`);
  const spineIn = spineWidthIn(profile, pages);
  const cover = coverSpreadIn(profile, pages, { spineIn });
  return { rendered, pages, blanks, spineIn, pageIn: pageBoxIn(profile) as [number, number], coverIn: [cover.width, cover.height] };
}

/** Where the text block sits on a page, in CSS pixels. Page 1 is a right-hand page (book-fulfilment.md: mirrored). */
export function interiorGeometry(profileArg?: string | null) {
  const profile = profileName(profileArg);
  const [w, h] = pageBoxIn(profile) as [number, number];
  const { recto, verso } = pageMarginsIn(profile);
  const px = (inches: number) => round4(inches * PX_PER_IN);
  return {
    pageW: px(w),
    pageH: px(h),
    // inside + outside is the same on both sides, so every column is one width
    columnW: px(w - recto.left - recto.right),
    columnH: px(h - recto.top - recto.bottom),
    top: px(recto.top),
    left: (page: number) => px(page % 2 === 1 ? recto.left : verso.left),
  };
}

/**
 * The book's forced page breaks as column breaks, so a column layout breaks where the printed book does. Only
 * forced breaks change; `avoid` means the same in both. Pure.
 */
export function forColumns(html: string): string {
  return html
    .replace(/page-break-(before|after)\s*:\s*always/g, "break-$1: column")
    .replace(/break-(before|after)\s*:\s*(page|left|right|recto|verso)\b/g, "break-$1: column");
}

/* ── The PDF writer ─────────────────────────────────────────────────────── */

/** One page of the PDF: a JPEG covering it, or (no image) a blank page. Sizes in points. */
export type PdfPage = { widthPt: number; heightPt: number; bleedPt?: number; jpeg?: Uint8Array; pxW?: number; pxH?: number };

const enc = new TextEncoder();
const num = (n: number) => String(round4(n));

/**
 * A PDF of whole-page images (DCTDecode, so the JPEG goes in untouched). Each page has MediaBox and BleedBox at the
 * page box and, when `bleedPt` is given, a TrimBox inset by it: what a print shop's preflight reads. Pure.
 */
export function buildImagePdf(pages: PdfPage[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (b: Uint8Array) => {
    chunks.push(b);
    length += b.length;
  };
  const text = (s: string) => push(enc.encode(s));
  const object = (id: number, body: (string | Uint8Array)[]) => {
    offsets[id] = length;
    text(`${id} 0 obj\n`);
    for (const part of body) {
      if (typeof part === "string") text(part);
      else push(part);
    }
    text("\nendobj\n");
  };

  // 1 catalog, 2 page tree, then three objects a page: page, contents, image
  const pageId = (i: number) => 3 + i * 3;
  // the second line's four bytes above 127 tell a reader the file is binary (raw bytes, not UTF-8 pairs)
  push(new Uint8Array([...enc.encode("%PDF-1.4\n%"), 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, [`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`]);
  pages.forEach((p, i) => {
    const id = pageId(i);
    const w = num(p.widthPt);
    const h = num(p.heightPt);
    const b = p.bleedPt ?? 0;
    const trim = b > 0 ? ` /TrimBox [${num(b)} ${num(b)} ${num(p.widthPt - b)} ${num(p.heightPt - b)}]` : "";
    const res = p.jpeg ? `/Resources << /XObject << /Im0 ${id + 2} 0 R >> >>` : "/Resources << >>";
    object(id, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /BleedBox [0 0 ${w} ${h}]${trim} ${res} /Contents ${id + 1} 0 R >>`]);
    // a blank page is white: the paper's colour is the stock's, never ink (legacyBook)
    const draw = p.jpeg ? `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q` : "";
    object(id + 1, [`<< /Length ${enc.encode(draw).length} >>\nstream\n${draw}\nendstream`]);
    if (p.jpeg) {
      object(id + 2, [
        `<< /Type /XObject /Subtype /Image /Width ${p.pxW} /Height ${p.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
        p.jpeg,
        "\nendstream",
      ]);
    } else {
      object(id + 2, ["null"]);
    }
  });

  const count = 3 + pages.length * 3;
  const xref = length;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id++) table += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  text(`${table}trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** The pages of a PDF this file wrote (its dictionaries are uncompressed): how many, and each MediaBox in points. */
export function readPdfPages(bytes: Uint8Array): { count: number; boxes: [number, number][] } {
  let s = "";
  // Latin-1, a chunk at a time: the JPEG bytes stay one character each and never match a dictionary
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const boxes: [number, number][] = [];
  for (const m of s.matchAll(/\/Type \/Page\b(?!s)[^>]*?\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)) boxes.push([Number(m[1]), Number(m[2])]);
  const tree = /\/Type \/Pages\b[^>]*\/Count (\d+)/.exec(s);
  return { count: tree ? Number(tree[1]) : 0, boxes };
}

/**
 * The interior against the profile: an even count (the profile's multiple), at least its minimum, at most its
 * maximum, every page the page box. Null when the printer would take it. Pure.
 */
export function checkInterior(info: { count: number; boxes: [number, number][] }, profileArg?: string | null): PrintPdfProblem | null {
  const profile = profileName(profileArg);
  const p = profileOf(profile);
  if (info.count < 1) return "empty";
  if (info.count < p.minPages) return "too_few_pages";
  if (info.count > p.maxPages) return "too_many_pages";
  if (info.count % p.pageMultiple !== 0) return "odd_pages";
  const [w, h] = (pageBoxIn(profile) as [number, number]).map((n) => n * PT_PER_IN);
  if (info.boxes.length !== info.count || info.boxes.some(([bw, bh]) => Math.abs(bw - w) > 0.5 || Math.abs(bh - h) > 0.5)) return "wrong_size";
  return null;
}

/* ── Drawing pages in the browser ───────────────────────────────────────── */

export type RasterPage = { jpeg: Uint8Array; pxW: number; pxH: number };

/** How a page becomes a picture. The browser's own by default; the tests pass their own. */
export type Rasterizer = {
  /** Lays the interior out and draws every page it made, in order. */
  interior(html: string, geometry: ReturnType<typeof interiorGeometry>, dpi: number, onPage?: (done: number, total: number) => void): Promise<RasterPage[]>;
  /** Draws a fixed-size document (the cover) as one page. */
  single(html: string, sizeIn: [number, number], dpi: number): Promise<RasterPage>;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Reads a photograph into the document itself: an SVG drawn as an image may load nothing from outside. */
async function inlineImage(url: string, maxPx = 2400): Promise<string> {
  if (!url || url.startsWith("data:")) return url;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.92);
}

/** The document with every photograph inside it, the extra CSS added and (for the interior) its body in one column box. */
async function selfContained(html: string, css: string, columns: boolean): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const cache = new Map<string, Promise<string>>();
  const inline = (u: string) => {
    if (!cache.has(u)) cache.set(u, inlineImage(u).catch(() => ""));
    return cache.get(u)!;
  };
  await Promise.all(
    Array.from(doc.images).map(async (img) => {
      const src = img.getAttribute("src") || "";
      img.setAttribute("src", await inline(src));
    }),
  );
  await Promise.all(
    Array.from(doc.querySelectorAll<HTMLElement>("[style*='url(']")).map(async (el) => {
      const style = el.getAttribute("style") || "";
      const urls = [...style.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1]);
      let next = style;
      for (const u of urls) next = next.split(u).join(await inline(u));
      el.setAttribute("style", next);
    }),
  );
  const style = doc.createElement("style");
  style.textContent = css;
  doc.head.appendChild(style);
  if (columns) {
    const box = doc.createElement("div");
    box.className = "pdf-columns";
    while (doc.body.firstChild) box.appendChild(doc.body.firstChild);
    doc.body.appendChild(box);
  }
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}

/** A hidden frame holding the document, laid out and with its fonts and pictures in. */
async function frameFor(html: string, widthPx: number, heightPx: number): Promise<{ doc: Document; remove: () => void }> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  Object.assign(frame.style, { position: "fixed", left: "-100000px", top: "0", width: `${widthPx}px`, height: `${heightPx}px`, border: "0", opacity: "0", pointerEvents: "none" });
  const loaded = new Promise<void>((r) => frame.addEventListener("load", () => r(), { once: true }));
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await loaded;
  const doc = frame.contentDocument!;
  await Promise.race([doc.fonts?.ready, sleep(8000)]);
  await Promise.all(Array.from(doc.images).map((img) => img.decode().catch(() => undefined)));
  return { doc, remove: () => frame.remove() };
}

/** Draws an SVG of the given CSS-pixel size onto a white canvas at `dpi` and keeps it as a JPEG. */
async function drawSvg(svg: string, widthPx: number, heightPx: number, dpi: number): Promise<RasterPage> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const scale = dpi / PX_PER_IN;
  const c = document.createElement("canvas");
  c.width = Math.round(widthPx * scale);
  c.height = Math.round(heightPx * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  let blob: Blob | null;
  try {
    blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
  } catch {
    blob = null; // Safari: a canvas that drew a <foreignObject> may not be read
  }
  if (!blob) throw new PrintPdfError("render_failed", "This browser couldn’t lay the book out for the printer. Try Chrome, Edge or Firefox.");
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), pxW: c.width, pxH: c.height };
}

const foreign = (x: number, y: number, w: number, h: number, pageW: number, pageH: number, xhtml: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">` +
  `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}">${xhtml}</foreignObject></svg>`;

const SHIFT = "--pdf-shift-px";

export const browserRasterizer: Rasterizer = {
  async interior(html, g, dpi, onPage) {
    const css = `html, body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
  .pdf-columns { width: ${g.columnW}px; height: ${g.columnH}px; column-width: ${g.columnW}px; column-gap: ${COLUMN_GAP_PX}px; column-fill: auto;
    transform: translateX(calc(-1px * var(${SHIFT}, 0))); }`;
    const { doc, remove } = await frameFor(await selfContained(forColumns(html), css, true), g.columnW, g.columnH);
    try {
      const box = doc.querySelector<HTMLElement>(".pdf-columns")!;
      const pitch = g.columnW + COLUMN_GAP_PX;
      const total = Math.max(1, Math.round((box.scrollWidth + COLUMN_GAP_PX) / pitch));
      const xhtml = new XMLSerializer().serializeToString(doc.documentElement);
      const pages: RasterPage[] = [];
      for (let i = 0; i < total; i++) {
        // the column for page i slid under the text block's window
        const shifted = xhtml.replace("<html ", `<html style="${SHIFT}: ${i * pitch}" `);
        pages.push(await drawSvg(foreign(g.left(i + 1), g.top, g.columnW, g.columnH, g.pageW, g.pageH, shifted), g.pageW, g.pageH, dpi));
        onPage?.(i + 1, total);
      }
      return pages;
    } finally {
      remove();
    }
  },
  async single(html, [wIn, hIn], dpi) {
    const w = round4(wIn * PX_PER_IN);
    const h = round4(hIn * PX_PER_IN);
    const css = "html, body { margin: 0 !important; padding: 0 !important; }";
    const { doc, remove } = await frameFor(await selfContained(html, css, false), w, h);
    try {
      return await drawSvg(foreign(0, 0, w, h, w, h, new XMLSerializer().serializeToString(doc.documentElement)), w, h, dpi);
    } finally {
      remove();
    }
  },
};

/* ── Making and filing the two files ────────────────────────────────────── */

/** A photograph in the book, measured, as preflight.js reads it (pixelsW and pixelsH at full size). */
export type MeasuredPhoto = { id: string; memoryId: string; label: string; pixelsW: number; pixelsH: number };

export type PreparedBookPdfs = {
  interior: Blob;
  cover: Blob;
  plan: BookPlan;
  /**
   * The interior's pages as the PDF holds them, one object URL per drawn page and null for each blank page added
   * at the back: the flip-through shows the exact file (P4-R2). Empty where the browser can't make object URLs.
   * Revoke them with revokeBookPages when the page is done with them.
   */
  pages: (string | null)[];
  /** The cover laid flat, as an object URL (or null). */
  coverPage: string | null;
  /** Each photograph in the printed memories with its size in pixels, for preflight. One that couldn't be read is left out. */
  photos: MeasuredPhoto[];
};

export type PrepareOptions = {
  sides?: Contribution[];
  /** The print profile (legacyBook PRINT_PROFILES). Left out: PRINT_PROFILE. A book version's comes from prepareVersion. */
  profile?: string | null;
  dpi?: number;
  rasterizer?: Rasterizer;
  /** "Laying out page 12 of 96": every page as it is drawn. */
  onProgress?: (done: number, total: number) => void;
  /** How a page picture becomes something an <img> shows. URL.createObjectURL by default; the tests pass their own. */
  objectUrl?: ((blob: Blob) => string) | null;
  /** How a photograph's size is read. The browser's own by default; the tests pass their own. */
  measurePhoto?: (url: string) => Promise<{ width: number; height: number } | null>;
};

/** A photograph's full size, read by the browser; null when it can't be loaded within 15 s. */
async function browserMeasure(url: string): Promise<{ width: number; height: number } | null> {
  if (typeof Image === "undefined" || !url) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await Promise.race([img.decode(), sleep(15000).then(() => Promise.reject(new Error("timeout")))]);
    return img.naturalWidth > 0 && img.naturalHeight > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : null;
  } catch {
    return null;
  }
}

const defaultObjectUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? (b: Blob) => URL.createObjectURL(b) : null;

/** The photographs of the memories that print, each measured once. Never throws: a photo that can't be read is left out. */
async function measurePhotos(story: Story, design: unknown, measure: NonNullable<PrepareOptions["measurePhoto"]>): Promise<MeasuredPhoto[]> {
  let printed: { id: string; title?: string; photos?: string[] }[];
  try {
    const book = bookStructure(story, { design }) as { chapters: { items: { id: string; title?: string; photos?: string[] }[] }[] };
    printed = book.chapters.flatMap((c) => c.items);
  } catch {
    return [];
  }
  const sizes = new Map<string, Promise<{ width: number; height: number } | null>>();
  const sizeOf = (u: string) => {
    if (!sizes.has(u)) sizes.set(u, measure(u).catch(() => null));
    return sizes.get(u)!;
  };
  const out = await Promise.all(
    printed.flatMap((m) =>
      (m.photos || []).filter(Boolean).map(async (url, i) => {
        const size = await sizeOf(url);
        return size ? { id: `${m.id}:${i}`, memoryId: m.id, label: (m.title || "").trim() || "a photo", pixelsW: size.width, pixelsH: size.height } : null;
      }),
    ),
  );
  return out.filter((p): p is MeasuredPhoto => !!p);
}

/** Lets go of the page pictures prepareBookPdfs made. Safe to call twice, and with nothing. */
export function revokeBookPages(prepared: Pick<PreparedBookPdfs, "pages" | "coverPage"> | null | undefined, revoke: (url: string) => void = (u) => URL.revokeObjectURL?.(u)) {
  if (!prepared) return;
  for (const u of [...prepared.pages, prepared.coverPage]) {
    if (u && u.startsWith("blob:")) {
      try {
        revoke(u);
      } catch {
        /* already gone */
      }
    }
  }
}

/**
 * Both files for the printer, checked, nothing uploaded. The ordering page calls this before it starts the checkout,
 * so an order is only ever placed for a book whose files passed. Throws PrintPdfError.
 */
export async function prepareBookPdfs(story: Story, design: Story["bookDesign"] | null | undefined, opts: PrepareOptions = {}): Promise<PreparedBookPdfs> {
  const { sides = [], dpi = 300, rasterizer = browserRasterizer, onProgress, measurePhoto = browserMeasure } = opts;
  const objectUrl = opts.objectUrl === undefined ? defaultObjectUrl : opts.objectUrl;
  const profile = profileName(opts.profile);
  const ready = typeset(await signStoryPhotos({ ...story, bookDesign: design ?? story.bookDesign }));
  // measured first, so the layout below finds each photograph already in the browser's cache
  const photos = await measurePhotos(ready, ready.bookDesign, measurePhoto);
  // set as printBook's printableHtml sets them: paragraph by paragraph
  const set = sides.map((c) => ({ ...c, body: String(c.body ?? "").split("\n").map(smarten).join("\n") }));
  const html = buildLegacyHtml(ready, { now: new Date(), listenBase: listenBase(), sides: set as never[], print: profile as never }) as string;

  const g = interiorGeometry(profile);
  let drawn: RasterPage[];
  try {
    drawn = await rasterizer.interior(html, g, dpi, onProgress);
  } catch (err) {
    if (err instanceof PrintPdfError) throw err;
    throw new PrintPdfError("render_failed", "We couldn’t lay the book out for the printer. Please try again.");
  }
  const plan = bookPlan(drawn.length, profile);

  const bleedPt = profileOf(profile).bleedIn * PT_PER_IN;
  const [wPt, hPt] = plan.pageIn.map((n) => n * PT_PER_IN);
  const pages: PdfPage[] = [
    ...drawn.map((p) => ({ widthPt: wPt, heightPt: hPt, bleedPt, ...p })),
    ...Array.from({ length: plan.blanks }, () => ({ widthPt: wPt, heightPt: hPt, bleedPt })),
  ];
  const interior = buildImagePdf(pages);
  const problem = checkInterior(readPdfPages(interior), profile);
  if (problem) throw new PrintPdfError(problem, "The book’s pages didn’t come out the way the printer needs them. Please try again.");

  // the spine is worked out from the bound count, as plan.spineIn was
  const coverHtml = buildCoverWrapHtml(ready, { print: profile as never, pages: plan.pages }) as string;
  let coverPage: RasterPage;
  try {
    coverPage = await rasterizer.single(coverHtml, plan.coverIn, dpi);
  } catch (err) {
    if (err instanceof PrintPdfError) throw err;
    throw new PrintPdfError("render_failed", "We couldn’t lay the cover out for the printer. Please try again.");
  }
  const cover = buildImagePdf([{ widthPt: plan.coverIn[0] * PT_PER_IN, heightPt: plan.coverIn[1] * PT_PER_IN, ...coverPage }]);

  // the same JPEGs the PDF holds, so what the family looks through is the file that prints
  const picture = (p: RasterPage) => (objectUrl ? objectUrl(new Blob([p.jpeg as BlobPart], { type: "image/jpeg" })) : null);
  const pictures = objectUrl ? [...drawn.map(picture), ...Array.from({ length: plan.blanks }, () => null)] : [];

  return {
    interior: new Blob([interior as BlobPart], { type: "application/pdf" }),
    cover: new Blob([cover as BlobPart], { type: "application/pdf" }),
    plan,
    pages: pictures,
    coverPage: picture(coverPage),
    photos,
  };
}

/** Where an order's files go in the book-orders bucket: the phone's paths, the only ones its Storage policy lets the owner write. */
export const orderPdfPaths = (orderId: string) => ({ interior: `${orderId}.pdf`, cover: `${orderId}-cover.pdf` });

/** Files both PDFs with the order. Replaces any earlier upload for it (upsert, as the phone does). Throws PrintPdfError. */
export async function uploadBookPdfs(orderId: string, files: Pick<PreparedBookPdfs, "interior" | "cover">): Promise<{ interior: string; cover: string }> {
  const paths = orderPdfPaths(orderId);
  const bucket = supabase().storage.from(BUCKET);
  for (const [path, blob] of [
    [paths.interior, files.interior],
    [paths.cover, files.cover],
  ] as const) {
    const { error } = await bucket.upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (error) throw new PrintPdfError("upload_failed", "The book’s files didn’t reach the printer’s folder. Please try again.");
  }
  return paths;
}

export type FiledBookPdfs = { ok: true; interior: string; cover: string; plan: BookPlan } | { ok: false; problem: PrintPdfProblem; error: string };

/**
 * Makes, checks and files both PDFs for an order that already exists. Never throws: by now the order stands, so
 * this is best-effort, as on the phone (uploadOrderPdf). To keep an order from being placed for a book that fails
 * the check, call prepareBookPdfs before the checkout and uploadBookPdfs after it instead.
 */
export async function renderAndUploadBookPdfs(story: Story, design: Story["bookDesign"] | null | undefined, orderId: string, opts: PrepareOptions = {}): Promise<FiledBookPdfs> {
  try {
    const prepared = await prepareBookPdfs(story, design, opts);
    return { ok: true, ...(await uploadBookPdfs(orderId, prepared)), plan: prepared.plan };
  } catch (err) {
    const problem = err instanceof PrintPdfError ? err.problem : "render_failed";
    return { ok: false, problem, error: (err as Error)?.message || "We couldn’t make the book’s files." };
  }
}

/* ── A locked book version's files ──────────────────────────────────────── */

/**
 * Where a book version's files go in the book-versions bucket: the only two paths its Storage policy lets a member
 * write, and only while the version is not yet approved (R11). The same as the server's uploadPaths(versionId).
 */
export const versionPdfPaths = (versionId: string) => ({ interior: `${versionId}/interior.pdf`, cover: `${versionId}/cover.pdf` });

/**
 * Files both PDFs with a book version, before it is approved. Replaces an earlier upload for the same version
 * (upsert), so a family can prepare the book again after a failed try. Throws PrintPdfError("upload_failed").
 */
export async function uploadVersionPdfs(versionId: string, files: Pick<PreparedBookPdfs, "interior" | "cover">): Promise<{ interior: string; cover: string }> {
  const failed = () => new PrintPdfError("upload_failed", "We couldn’t save your book’s pages. Please check your connection and try again.");
  if (!versionId || !files?.interior || !files?.cover) throw failed();
  const paths = versionPdfPaths(versionId);
  const bucket = supabase().storage.from(VERSION_BUCKET);
  for (const [path, blob] of [
    [paths.interior, files.interior],
    [paths.cover, files.cover],
  ] as const) {
    let error: unknown;
    try {
      ({ error } = await bucket.upload(path, blob, { contentType: "application/pdf", upsert: true }));
    } catch (err) {
      error = err ?? true; // a dropped connection rejects instead of returning an error
    }
    if (error) throw failed();
  }
  return paths;
}

/* ── Which browsers can make the files ──────────────────────────────────── */

/** What a browser that can't make the files says instead (R10). */
export const PRINT_BROWSER_MESSAGE = "To prepare the book for printing, please order from the A Story app, or open this page in Chrome on a computer.";

export type BrowserHints = { userAgent?: string; maxTouchPoints?: number; vendor?: string };

/**
 * Whether this browser can draw the book's pages and read them back (step 3 above). Safari can't: WebKit taints a
 * canvas that drew an SVG <foreignObject>, so toBlob fails. A feature test would have to draw and read a whole page
 * to find out, which is slow and fails late, so this reads the user agent instead:
 *   - every browser on an iPhone or iPad is WebKit underneath (Chrome there is "CriOS", Firefox "FxiOS"), including
 *     an iPad that calls itself a Mac (a "Macintosh" with touch points);
 *   - desktop Safari says "Safari/" and Apple as its vendor, without Chrome's, Edge's, Opera's or Firefox's names.
 * Everything else (Chrome, Edge, Firefox on Windows, Mac, Linux or Android) can. Without a navigator (tests, a
 * server) it answers true, so nothing is refused on a guess. The page shows PRINT_BROWSER_MESSAGE when it's false.
 */
export function isPrintCapableBrowser(hints: BrowserHints | null = typeof navigator === "undefined" ? null : navigator): boolean {
  if (!hints) return true;
  const ua = hints.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return false;
  if (/Macintosh/i.test(ua) && (hints.maxTouchPoints ?? 0) > 1) return false;
  if (/Chrome\/|Chromium\/|Firefox\/|Edg\/|OPR\/|Android/i.test(ua)) return true;
  return !(/Safari\//i.test(ua) || /Apple/i.test(hints.vendor || ""));
}
