import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useRefreshOnReturn } from "./refreshOnReturn";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

function mount(refresh: () => Promise<unknown>, opts?: { enabled?: boolean; gap?: number }) {
  function Probe() {
    useRefreshOnReturn(refresh, opts);
    return null;
  }
  act(() => root.render(createElement(Probe)));
}

const focus = () => act(() => void window.dispatchEvent(new Event("focus")));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T10:00:00Z"));
  host = document.createElement("div");
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("useRefreshOnReturn", () => {
  it("does not read again on a return right after the page opened", () => {
    const refresh = vi.fn(() => Promise.resolve());
    mount(refresh, { gap: 1000 });
    focus();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("reads again on a return after the gap, once per gap", () => {
    const refresh = vi.fn(() => Promise.resolve());
    mount(refresh, { gap: 1000 });
    vi.advanceTimersByTime(1500);
    focus();
    expect(refresh).toHaveBeenCalledTimes(1);
    focus();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("never starts a second read while one is under way", async () => {
    let finish: () => void = () => {};
    const refresh = vi.fn(() => new Promise<void>((r) => (finish = r)));
    mount(refresh, { gap: 1000 });
    vi.advanceTimersByTime(1500);
    focus();
    vi.advanceTimersByTime(1500);
    focus();
    expect(refresh).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    vi.advanceTimersByTime(1500);
    focus();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does nothing when turned off", () => {
    const refresh = vi.fn(() => Promise.resolve());
    mount(refresh, { enabled: false, gap: 1000 });
    vi.advanceTimersByTime(1500);
    focus();
    expect(refresh).not.toHaveBeenCalled();
  });
});
