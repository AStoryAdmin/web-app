import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImportReview from "./ImportReview";
import type { ImportEntry } from "../../data/imports";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const entries: ImportEntry[] = [
  { id: "a", title: "Leaving Huế", body: "We left in 1962 on the morning train.", year: 1962, dateText: "1962", era: "Childhood", include: true },
  { id: "b", title: "The shop", body: "It smelled of star anise.", year: null, dateText: "", era: "Anything else", include: true },
  { id: "c", title: "Again", body: "Already kept once.", year: null, dateText: "", era: "Anything else", include: false, duplicate: true },
];

let root: Root;
let host: HTMLDivElement;
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const draw = (list: ImportEntry[], over: { memoir?: boolean } = {}) => {
  const props = { entries: list, sourceName: "Pasted text", truncated: false, memoir: false, busy: false, progress: "", onChange: vi.fn(), onKeep: vi.fn(), onBack: vi.fn(), ...over };
  act(() => root.render(<ImportReview {...props} />));
  return props;
};

describe("ImportReview", () => {
  it("lists every entry with a box, the repeat unticked and said so, and keeps the ticked count", () => {
    const props = draw(entries);
    const boxes = [...host.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
    expect(boxes.map((b) => b.checked)).toEqual([true, true, false]);
    expect(host.textContent).toContain("Already in the archive");
    expect(host.textContent).toContain("One of these has no year yet");
    act(() => button("Keep 2 memories")!.click());
    expect(props.onKeep).toHaveBeenCalled();
  });

  it("ticks one off, and ticks all without the repeat", () => {
    const props = draw(entries);
    act(() => host.querySelectorAll<HTMLInputElement>("input[type=checkbox]")[0].click());
    expect(props.onChange.mock.calls[0][0].map((e: ImportEntry) => e.include)).toEqual([false, true, false]);
    act(() => button("Tick all")!.click());
    expect(props.onChange.mock.calls[1][0].map((e: ImportEntry) => e.include)).toEqual([true, true, false]);
  });

  it("can't keep nothing, and says chapters for a memoir", () => {
    draw(entries.map((e) => ({ ...e, include: false })), { memoir: true });
    expect(host.querySelector("h2")?.textContent).toBe("3 chapters found");
    expect(button("Keep 0 memories")?.disabled).toBe(true);
  });
});
