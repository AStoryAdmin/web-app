import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/photoUrls", () => ({ photoUrl: async (u: string) => u }));
const storage = vi.hoisted(() => ({ upload: vi.fn(), bucket: "" }));
vi.mock("../../lib/supabase", () => ({
  supabase: () => ({ storage: { from: (b: string) => ((storage.bucket = b), { upload: storage.upload }) } }),
}));

import {
  bookPlan,
  buildImagePdf,
  checkInterior,
  forColumns,
  interiorGeometry,
  orderPdfPaths,
  prepareBookPdfs,
  PrintPdfError,
  readPdfPages,
  renderAndUploadBookPdfs,
  type Rasterizer,
} from "./printPdf";
import { newMemory, newStory } from "../../data/memories";

// The smallest bytes that stand in for a JPEG: the writer never decodes them.
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const page = { jpeg: JPEG, pxW: 2, pxH: 3 };

function fakeRasterizer(pages: number) {
  const seen = { interior: "", cover: "", coverIn: [0, 0] as [number, number] };
  const r: Rasterizer = {
    interior: async (html) => ((seen.interior = html), Array.from({ length: pages }, () => page)),
    single: async (html, sizeIn) => ((seen.cover = html), (seen.coverIn = sizeIn), page),
  };
  return { r, seen };
}

function story() {
  const s = newStory({ id: "s1", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941" });
  s.memories = [newMemory({ id: "m1", title: "Nora's kitchen", era: "Childhood", period: "1949", body: "We had each other.", createdAt: "2026-09-01T10:00:00.000Z" })];
  return s;
}

// jsdom's Blob has no arrayBuffer(); FileReader reads it
const blob = (b: Blob) =>
  new Promise<Uint8Array>((done) => {
    const r = new FileReader();
    r.onload = () => done(new Uint8Array(r.result as ArrayBuffer));
    r.readAsArrayBuffer(b);
  });

beforeEach(() => storage.upload.mockReset());

describe("bookPlan", () => {
  it("pads a short book to Lulu's 24 pages, with the narrowest spine and a 14 × 10.75 in cover", () => {
    expect(bookPlan(9)).toEqual({ rendered: 9, pages: 24, blanks: 15, spineIn: 0.25, pageIn: [6.25, 9.25], coverIn: [14, 10.75] });
  });
  it("rounds an odd count up to even and takes the spine from the bound count", () => {
    const p = bookPlan(141);
    expect([p.pages, p.blanks, p.spineIn]).toEqual([142, 1, 0.625]);
  });
  it("refuses an empty book and one the printer can't bind", () => {
    expect(() => bookPlan(0)).toThrow(PrintPdfError);
    expect(() => bookPlan(801)).toThrow(/at most 800/);
  });
});

describe("interiorGeometry", () => {
  it("mirrors the margins: the gutter left on odd pages, right on even ones", () => {
    const g = interiorGeometry();
    expect([g.pageW, g.pageH, g.columnW]).toEqual([600, 888, 432]);
    expect(g.left(1)).toBe(96); // inside 0.875 + bleed 0.125 in
    expect(g.left(2)).toBe(72); // outside 0.625 + bleed 0.125 in
  });
});

describe("forColumns", () => {
  it("turns forced page breaks into column breaks and leaves avoid alone", () => {
    const css = ".a { page-break-before: always; } .b { page-break-after:always } .c { break-before: page; } .d { page-break-inside: avoid; }";
    expect(forColumns(css)).toBe(".a { break-before: column; } .b { break-after: column } .c { break-before: column; } .d { page-break-inside: avoid; }");
  });
});

describe("the PDF", () => {
  it("writes pages a reader can count, each at its page box with the trim inside the bleed", () => {
    const pdf = buildImagePdf([
      { widthPt: 450, heightPt: 666, bleedPt: 9, ...page },
      { widthPt: 450, heightPt: 666, bleedPt: 9 },
    ]);
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text.startsWith("%PDF-1.4\n%")).toBe(true);
    expect(pdf[10]).toBe(0xe2);
    expect(text).toContain("/TrimBox [9 9 441 657]");
    expect(text).toContain("/Filter /DCTDecode");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(readPdfPages(pdf)).toEqual({ count: 2, boxes: [[450, 666], [450, 666]] });
  });

  it("points the cross-reference table at every object", () => {
    const pdf = buildImagePdf([{ widthPt: 10, heightPt: 10, ...page }]);
    const text = new TextDecoder("latin1").decode(pdf);
    const start = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(start, start + 4)).toBe("xref");
    const offsets = [...text.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offsets.forEach((o, i) => expect(text.slice(o).startsWith(`${i + 1} 0 obj`)).toBe(true));
  });

  it("passes only an even count of at least 24 pages at 6.25 × 9.25 in", () => {
    const box: [number, number] = [450, 666];
    const pages = (n: number, b = box) => ({ count: n, boxes: Array.from({ length: n }, () => b) });
    expect(checkInterior(pages(24))).toBeNull();
    expect(checkInterior(pages(22))).toBe("too_few_pages");
    expect(checkInterior(pages(25))).toBe("odd_pages");
    expect(checkInterior(pages(802))).toBe("too_many_pages");
    expect(checkInterior(pages(24, [432, 648]))).toBe("wrong_size");
    expect(checkInterior(pages(0))).toBe("empty");
  });
});

describe("prepareBookPdfs and renderAndUploadBookPdfs", () => {
  it("sets the book with the print profile and lays the cover for the bound count", async () => {
    const { r, seen } = fakeRasterizer(31);
    const out = await prepareBookPdfs(story(), { cover: { color: "forest" } }, { rasterizer: r });
    expect(seen.interior).toContain("size: 6.25in 9.25in");
    expect(out.plan).toMatchObject({ rendered: 31, pages: 32, blanks: 1, spineIn: 0.25 });
    expect(seen.coverIn).toEqual([14, 10.75]);
    expect(seen.cover).toContain("32 pages");
    expect(readPdfPages(await blob(out.interior)).count).toBe(32);
    expect(readPdfPages(await blob(out.cover))).toEqual({ count: 1, boxes: [[1008, 774]] });
  });

  it("files both PDFs at the phone's paths in book-orders", async () => {
    storage.upload.mockResolvedValue({ error: null });
    const { r } = fakeRasterizer(24);
    const out = await renderAndUploadBookPdfs(story(), null, "ord-1", { rasterizer: r });
    expect(storage.bucket).toBe("book-orders");
    expect(storage.upload.mock.calls.map((c) => [c[0], c[2]])).toEqual([
      ["ord-1.pdf", { contentType: "application/pdf", upsert: true }],
      ["ord-1-cover.pdf", { contentType: "application/pdf", upsert: true }],
    ]);
    expect(out).toMatchObject({ ok: true, ...orderPdfPaths("ord-1") });
  });

  it("uploads nothing for a book the printer can't bind", async () => {
    const { r } = fakeRasterizer(900);
    await expect(renderAndUploadBookPdfs(story(), null, "ord-2", { rasterizer: r })).resolves.toMatchObject({ ok: false, problem: "too_many_pages" });
    await expect(prepareBookPdfs(story(), null, { rasterizer: r })).rejects.toMatchObject({ problem: "too_many_pages" });
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it("says so when a file doesn't upload", async () => {
    storage.upload.mockResolvedValue({ error: { message: "denied" } });
    const { r } = fakeRasterizer(24);
    await expect(renderAndUploadBookPdfs(story(), null, "ord-3", { rasterizer: r })).resolves.toMatchObject({ ok: false, problem: "upload_failed" });
  });

  it("turns a drawing failure into render_failed", async () => {
    const r: Rasterizer = { interior: async () => Promise.reject(new Error("tainted")), single: async () => page };
    await expect(prepareBookPdfs(story(), null, { rasterizer: r })).rejects.toMatchObject({ problem: "render_failed" });
  });
});
