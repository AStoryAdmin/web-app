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
  isPrintCapableBrowser,
  orderPdfPaths,
  prepareBookPdfs,
  PRINT_BROWSER_MESSAGE,
  PRINT_PROFILE,
  PrintPdfError,
  profileName,
  readPdfPages,
  renderAndUploadBookPdfs,
  revokeBookPages,
  uploadVersionPdfs,
  versionPdfPaths,
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

// a block, not an arrow that returns the mock: vitest calls a function beforeEach returns as the test's cleanup
beforeEach(() => {
  storage.upload.mockReset();
});

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

describe("the print profile as a parameter", () => {
  it("defaults to the order page's profile, so the old flow is unchanged", () => {
    expect(PRINT_PROFILE).toBe("lulu-6x9-hardcover");
    expect(profileName()).toBe(PRINT_PROFILE);
    expect(profileName(null)).toBe(PRINT_PROFILE);
    expect(bookPlan(9, null)).toEqual(bookPlan(9));
    const [a, b] = [interiorGeometry(undefined), interiorGeometry(PRINT_PROFILE)];
    expect({ ...a, left: [a.left(1), a.left(2)] }).toEqual({ ...b, left: [b.left(1), b.left(2)] });
  });

  it("plans, measures and checks another profile when named", () => {
    // stands in for the server's profile (prodigi-square-hc-8 arrives from prepareVersion at run time)
    const square = "square-8x8-layflat";
    expect(bookPlan(9, square)).toMatchObject({ pages: 20, blanks: 11, pageIn: [8.25, 8.25] });
    expect(interiorGeometry(square).pageW).toBe(792);
    const box: [number, number] = [594, 594];
    expect(checkInterior({ count: 20, boxes: Array.from({ length: 20 }, () => box) }, square)).toBeNull();
    expect(checkInterior({ count: 24, boxes: Array.from({ length: 24 }, () => [450, 666] as [number, number]) }, square)).toBe("wrong_size");
  });

  it("refuses a profile this page doesn't know, in plain words", () => {
    expect(() => profileName("not-a-profile")).toThrow(PrintPdfError);
    expect(() => bookPlan(9, "not-a-profile")).toThrow(/reload the page/);
  });

  it("sets and checks the whole book with the named profile", async () => {
    const { r, seen } = fakeRasterizer(21);
    const out = await prepareBookPdfs(story(), null, { rasterizer: r, profile: "square-8x8-layflat" });
    expect(seen.interior).toContain("size: 8.25in 8.25in");
    expect(out.plan).toMatchObject({ rendered: 21, pages: 22, blanks: 1 });
    expect(readPdfPages(await blob(out.interior))).toMatchObject({ count: 22 });
    expect(readPdfPages(await blob(out.interior)).boxes[0]).toEqual([594, 594]);
  });
});

describe("uploadVersionPdfs", () => {
  const files = { interior: new Blob(["i"]), cover: new Blob(["c"]) };

  it("files both PDFs in book-versions at the version's two paths, replacing an earlier try", async () => {
    storage.upload.mockResolvedValue({ error: null });
    await expect(uploadVersionPdfs("v-1", files)).resolves.toEqual({ interior: "v-1/interior.pdf", cover: "v-1/cover.pdf" });
    expect(storage.bucket).toBe("book-versions");
    expect(storage.upload.mock.calls.map((c) => [c[0], c[1], c[2]])).toEqual([
      ["v-1/interior.pdf", files.interior, { contentType: "application/pdf", upsert: true }],
      ["v-1/cover.pdf", files.cover, { contentType: "application/pdf", upsert: true }],
    ]);
    expect(versionPdfPaths("v-1")).toEqual({ interior: "v-1/interior.pdf", cover: "v-1/cover.pdf" });
  });

  it("says so plainly when a file doesn't save, or the connection drops", async () => {
    storage.upload.mockResolvedValue({ error: { message: "new row violates row-level security policy" } });
    await expect(uploadVersionPdfs("v-1", files)).rejects.toMatchObject({ problem: "upload_failed", message: "We couldn’t save your book’s pages. Please check your connection and try again." });
    storage.upload.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(uploadVersionPdfs("v-1", files)).rejects.toMatchObject({ problem: "upload_failed" });
  });

  it("uploads nothing without a version or both files", async () => {
    await expect(uploadVersionPdfs("", files)).rejects.toMatchObject({ problem: "upload_failed" });
    await expect(uploadVersionPdfs("v-1", { interior: files.interior } as never)).rejects.toMatchObject({ problem: "upload_failed" });
    expect(storage.upload).not.toHaveBeenCalled();
  });
});

describe("isPrintCapableBrowser", () => {
  const UA = {
    chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0",
    firefoxMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:131.0) Gecko/20100101 Firefox/131.0",
    chromeAndroid: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1",
  };

  it("says yes to Chrome, Edge and Firefox, and to Chrome on Android", () => {
    for (const ua of [UA.chromeWin, UA.edge, UA.firefoxMac, UA.chromeAndroid]) expect(isPrintCapableBrowser({ userAgent: ua, maxTouchPoints: 0 })).toBe(true);
  });

  it("says no to Safari, any browser on an iPhone, and an iPad that calls itself a Mac", () => {
    expect(isPrintCapableBrowser({ userAgent: UA.safariMac, vendor: "Apple Computer, Inc.", maxTouchPoints: 0 })).toBe(false);
    expect(isPrintCapableBrowser({ userAgent: UA.safariIphone, maxTouchPoints: 5 })).toBe(false);
    expect(isPrintCapableBrowser({ userAgent: UA.chromeIphone, maxTouchPoints: 5 })).toBe(false);
    expect(isPrintCapableBrowser({ userAgent: UA.safariMac, vendor: "Apple Computer, Inc.", maxTouchPoints: 5 })).toBe(false);
  });

  it("refuses nothing on a guess when there is no browser to ask", () => {
    expect(isPrintCapableBrowser(null)).toBe(true);
  });

  it("points the family to Chrome or the app, in plain words", () => {
    expect(PRINT_BROWSER_MESSAGE).toBe("To prepare the book for printing, please order from the A Story app, or open this page in Chrome on a computer.");
  });
});

describe("the pages the family looks through, and the photos preflight reads", () => {
  it("hands back every drawn page as a picture, a null for each blank page, and the cover", async () => {
    const { r } = fakeRasterizer(31);
    let n = 0;
    const made: Blob[] = [];
    const out = await prepareBookPdfs(story(), null, { rasterizer: r, objectUrl: (b) => (made.push(b), `blob:page-${++n}`), measurePhoto: async () => null });
    expect(out.pages).toHaveLength(32);
    expect(out.pages.slice(0, 2)).toEqual(["blob:page-1", "blob:page-2"]);
    expect(out.pages[31]).toBeNull();
    expect(out.coverPage).toBe("blob:page-32");
    expect(made.every((b) => b.type === "image/jpeg")).toBe(true);
  });

  it("makes no pictures where the browser can't, and the files still come", async () => {
    const { r } = fakeRasterizer(24);
    const out = await prepareBookPdfs(story(), null, { rasterizer: r, objectUrl: null, measurePhoto: async () => null });
    expect([out.pages, out.coverPage]).toEqual([[], null]);
    expect(out.plan.pages).toBe(24);
  });

  it("measures each printed memory's photos once, named for the memory, and leaves out one it can't read", async () => {
    const s = story();
    s.memories[0].photos = ["https://x.test/a.jpg", "https://x.test/b.jpg"];
    s.memories.push(newMemory({ id: "m2", title: "Our wedding", era: "Love & family", body: "June.", createdAt: "2026-09-02T10:00:00.000Z" }));
    s.memories[1].photos = ["https://x.test/a.jpg"];
    const asked: string[] = [];
    const measurePhoto = async (u: string) => (asked.push(u), u.endsWith("b.jpg") ? null : { width: 400, height: 300 });
    const out = await prepareBookPdfs(s, null, { rasterizer: fakeRasterizer(24).r, objectUrl: null, measurePhoto });
    expect(asked.sort()).toEqual(["https://x.test/a.jpg", "https://x.test/b.jpg"]);
    expect(out.photos).toEqual([
      expect.objectContaining({ memoryId: "m1", label: "Nora’s kitchen", pixelsW: 400, pixelsH: 300 }),
      expect.objectContaining({ memoryId: "m2", label: "Our wedding", pixelsW: 400, pixelsH: 300 }),
    ]);
  });

  it("lets go of every page picture, and nothing else", () => {
    const gone: string[] = [];
    revokeBookPages({ pages: ["blob:1", null, "blob:2"], coverPage: "blob:3" }, (u) => gone.push(u));
    revokeBookPages(null, (u) => gone.push(u));
    revokeBookPages({ pages: ["https://x.test/p.jpg"], coverPage: null }, (u) => gone.push(u));
    expect(gone).toEqual(["blob:1", "blob:2", "blob:3"]);
  });
});
