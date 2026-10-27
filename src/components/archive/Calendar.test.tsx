// The archive's calendar: the month with its kept days and marks said in words, the arrow keys, and the day handed back to the list.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({ getSupabase: () => null, supabase: () => ({}) }));

import Calendar from "./Calendar";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const memory = (over: Partial<Memory>) => ({ id: "m", title: "", body: "", period: "", status: "saved", createdAt: "2026-10-21T10:00:00", ...over }) as Memory;
const story = {
  id: "s1",
  name: "Rose",
  lastName: "Miller",
  relationship: "Mother",
  householdId: "h1",
  birthDay: "",
  birthMonth: "",
  memories: [memory({ id: "a", title: "The kitchen", createdAt: "2026-10-21T09:00:00" }), memory({ id: "b", title: "The wedding", period: "24 October 1966", createdAt: "2026-10-02T09:00:00" })],
} as unknown as Story;
const people = [{ id: "w", householdId: "h1", givenName: "Walter", familyName: "Miller", source: "manual", birthDay: 21, birthMonth: 10, birthYear: 1920 }] as unknown as Person[];

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (onSeeDay = vi.fn()) => {
  act(() =>
    root.render(
      <MemoryRouter>
        <Calendar story={story} stories={[story]} people={people} initialDay="2026-10-21" onSeeDay={onSeeDay} />
      </MemoryRouter>,
    ),
  );
  return onSeeDay;
};
const chosen = () => host.querySelector<HTMLButtonElement>('.cal-day[tabindex="0"]')!;

describe("Calendar", () => {
  it("opens on the day handed over, with what was kept and what the family keeps said in words", () => {
    const onSeeDay = render();
    expect(host.querySelector(".cal-title")?.textContent).toBe("October 2026");
    expect(chosen().getAttribute("aria-label")).toBe("21 October, 1 memory kept, Walter’s birthday");
    expect(host.querySelector(".cal-line")?.textContent).toBe("2 memories kept on 2 days this month");
    const marks = Array.from(host.querySelectorAll(".cal-kept-row")).map((b) => b.textContent);
    expect(marks).toEqual(["21 OctoberWalter’s birthday", "24 October“The wedding”"]);
    expect(host.querySelector(".cal-day-memory")?.getAttribute("href")).toBe("/archive/a");

    act(() => (Array.from(host.querySelectorAll("button")).find((b) => b.textContent === "See them in the list") as HTMLButtonElement).click());
    expect(onSeeDay).toHaveBeenCalledWith("2026-10-21");
  });

  it("moves the day with the arrow keys, into the next month when it must", () => {
    render();
    act(() => chosen().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
    expect(chosen().getAttribute("aria-label")).toMatch(/^28 October/);
    expect(document.activeElement).toBe(chosen());
    act(() => chosen().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
    expect(host.querySelector(".cal-title")?.textContent).toBe("November 2026");
    expect(chosen().getAttribute("aria-label")).toBe("4 November");
    expect(host.querySelector(".cal-line")?.textContent).toBe("Nothing kept this month yet");
  });
});
