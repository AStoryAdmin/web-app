import { act, useCallback, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOLD_MS, useHold } from "./useHold";
import HeldLine from "./HeldLine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** One item with a "no" that is held: a button that makes it, and the held line in its place. */
function One({ send, onFailed }: { send: () => Promise<unknown>; onFailed?: () => void }) {
  const onFail = useCallback(() => onFailed?.(), [onFailed]);
  const box = useRef<HTMLDivElement>(null);
  const { held, hold, undo, pause, resume, returnRef } = useHold(onFail, box);
  return (
    <div ref={box} tabIndex={-1} data-testid="box">
      {held.a ? (
        <HeldLine held={held.a} onUndo={() => undo("a")} onPause={() => pause("a")} onResume={() => resume("a")} />
      ) : (
        <button type="button" ref={returnRef("a")} onClick={() => hold("a", "Set aside", "Setting aside…", send, () => {})}>
          Not this one
        </button>
      )}
    </div>
  );
}

let root: Root;
let host: HTMLDivElement;
const press = (text: string) => {
  const b = [...host.querySelectorAll("button")].find((x) => x.textContent === text)!;
  b.focus();
  act(() => b.click());
};

describe("a held no", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.useRealTimers();
  });

  it("sends nothing when undone, and gives focus back to the control that made it", () => {
    const send = vi.fn(() => Promise.resolve());
    act(() => root.render(<One send={send} />));
    press("Not this one");
    expect(host.textContent).toContain("Set aside");
    expect(document.activeElement?.textContent).toBe("Undo");
    press("Undo");
    act(() => vi.advanceTimersByTime(HOLD_MS * 2));
    expect(send).not.toHaveBeenCalled();
    expect(document.activeElement?.textContent).toBe("Not this one");
  });

  it("waits while the pointer rests on the line, then sends", async () => {
    const send = vi.fn(() => Promise.resolve());
    act(() => root.render(<One send={send} />));
    press("Not this one");
    const line = host.querySelector(".held")!;
    act(() => line.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
    act(() => vi.advanceTimersByTime(HOLD_MS * 3));
    expect(send).not.toHaveBeenCalled();
    act(() => line.dispatchEvent(new PointerEvent("pointerout", { bubbles: true })));
    await act(async () => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("waits while the tab is hidden", () => {
    const send = vi.fn(() => Promise.resolve());
    act(() => root.render(<One send={send} />));
    press("Not this one");
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(HOLD_MS * 3));
    expect(send).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(send).toHaveBeenCalledTimes(1);
    hidden.mockRestore();
  });

  it("drops the Undo while it sends, and leaves focus alone if the keyboard has moved on", async () => {
    let finish: (v?: unknown) => void = () => {};
    const send = vi.fn(() => new Promise((r) => (finish = r)));
    const elsewhere = document.createElement("input");
    document.body.appendChild(elsewhere);
    act(() => root.render(<One send={send} />));
    press("Not this one");
    elsewhere.focus();
    await act(async () => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    expect(host.textContent).toContain("Setting aside…");
    expect(host.textContent).not.toContain("Undo");
    await act(async () => finish());
    expect(document.activeElement).toBe(elsewhere);
    elsewhere.remove();
  });
});
