// The wall's "Elsewhere" row (phone-app plan 2026-11-07, task 1.4, criterion 6): their links, in the phone's words,
// after "From the family" and before Where next; nothing when there are none; never on the cloth.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, rpc } = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn() }));
vi.mock("../lib/supabase", () => ({ getSupabase: () => null, supabase: () => ({ functions: { invoke }, rpc }) }));
// the arrival is gsap on a real layout; here the page is simply there
vi.mock("../lib/arrive", () => ({ arrive: () => undefined }));

import Wall from "./Wall";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const story = (elsewhere?: unknown) => ({
  name: "Rose",
  last_name: "Miller",
  photo_url: null,
  intro: "Baker, gardener, grandmother.",
  relationship: "Mother",
  memories: [{ id: "m1", title: "The bakery", body: "We opened at five.", era: "", period: "1974", created_at: "2026-10-01T00:00:00Z", photos: [] }],
  testimonials: [{ id: "t1", contributor_name: "Linh", relationship: "Daughter", body: "She always had flour on her sleeve.", created_at: "2026-10-02T00:00:00Z" }],
  ...(elsewhere === undefined ? {} : { elsewhere }),
});

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  invoke.mockReset();
  rpc.mockReset();
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function show(data: unknown) {
  invoke.mockResolvedValue({ data, error: null });
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/p/rose-miller"]}>
        <Routes>
          <Route path="/p/:slug" element={<Wall />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
  expect(host.querySelector("h1")?.textContent).toContain("Rose Miller");
}

const row = () => host.querySelector(".wall-elsewhere");
const after = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Wall: Elsewhere", () => {
  it("shows their links in order, in the phone's words, each opening in a new tab", async () => {
    await show(
      story([
        { kind: "press", title: "Miller Bakery in the 2011 newsletter", url: "https://parish.example.org/news/2011" },
        { kind: "instagram", title: null, url: "https://www.instagram.com/rosemiller" },
        { kind: "facebook", title: "", url: "https://facebook.com/rose.miller" },
      ]),
    );
    const r = row();
    expect(r).not.toBeNull();
    expect(r!.querySelector(".wall-elsewhere-label")?.textContent).toBe("Elsewhere");
    const links = Array.from(r!.querySelectorAll("a"));
    // their own pages first, in the networks' order, then what was written about them (app-core elsewhereLinks)
    expect(links.map((a) => a.textContent)).toEqual(["Facebook", "Instagram", "The 2011 newsletter"]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://facebook.com/rose.miller",
      "https://www.instagram.com/rosemiller",
      "https://parish.example.org/news/2011",
    ]);
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")?.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
    }
  });

  it("comes after From the family and before Where next, and never on the cloth", async () => {
    await show(story([{ kind: "website", title: "Miller Bakery", url: "https://millerbakery.com" }]));
    const r = row()!;
    const family = host.querySelector("#from-the-family")!;
    const next = host.querySelector(".wall-next")!;
    expect(family).not.toBeNull();
    expect(next).not.toBeNull();
    expect(after(family, r)).toBe(true);
    expect(after(r, next)).toBe(true);
    expect(family.contains(r)).toBe(false);
    expect(host.querySelector(".wall-cloth")!.contains(r)).toBe(false);
    expect(host.querySelector(".wall-hero")!.textContent).not.toContain("Elsewhere");
  });

  it("shows no row when there are no links, or the server sends none", async () => {
    await show(story([]));
    expect(row()).toBeNull();
    expect(host.textContent).not.toContain("Elsewhere");
    act(() => root.unmount());
    root = createRoot(host);
    await show(story());
    expect(row()).toBeNull();
    act(() => root.unmount());
    root = createRoot(host);
    // an entry that isn't a web address shows nothing either
    await show(story([{ kind: "website", title: "Somewhere", url: "javascript:alert(1)" }]));
    expect(row()).toBeNull();
  });
});
