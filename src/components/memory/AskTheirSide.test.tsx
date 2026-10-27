// "Ask someone to add their side": the link is made for the memory (named for somebody in the tree when the name is theirs), then shown with its QR and copied; nothing is sent.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { memoryLinkFor } = vi.hoisted(() => ({ memoryLinkFor: vi.fn() }));
vi.mock("../../data/memoryLinks", async (orig) => ({ ...(await orig<typeof import("../../data/memoryLinks")>()), memoryLinkFor }));
vi.mock("../../lib/supabase", () => ({ getSupabase: () => null, supabase: () => ({}) }));

import AskTheirSide from "./AskTheirSide";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const story = { id: "s1", name: "Rose", lastName: "Miller", relationship: "Mother", householdId: "h1", memories: [] } as unknown as Story;
const memory = { id: "m1", title: "The wedding, in the rain", status: "saved" } as unknown as Memory;
const people = [{ id: "p-linh", householdId: "h1", givenName: "Linh", familyName: "Tran", source: "manual" }] as unknown as Person[];
const me = { id: "me", firstName: "Jamie", email: "jamie@example.com" };

let root: Root;
let host: HTMLDivElement;
const writeText = vi.fn(async (text: string) => void text);
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  memoryLinkFor.mockReset();
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const button = (text: string) => Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
const type = (input: HTMLInputElement, value: string) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("AskTheirSide", () => {
  it("opens from one quiet row, makes the link for the person named, and copies it or a message", async () => {
    memoryLinkFor.mockResolvedValue({ token: "K7PX2QHM4D", link: "https://astoryapp.com/m/K7PX2QHM4D" });
    act(() => root.render(<AskTheirSide story={story} memory={memory} people={people} me={me} />));
    expect(host.querySelector("form")).toBeNull();
    act(() => button("Ask someone to add their side").click());

    // the tree's people are offered as the field's suggestions
    expect(Array.from(host.querySelectorAll("datalist option")).map((o) => o.getAttribute("value"))).toEqual(["Linh Tran"]);
    act(() => type(host.querySelector("input")!, "linh tran"));
    await act(async () => button("Make the link").click());

    expect(memoryLinkFor).toHaveBeenCalledWith({ memoryId: "m1", forName: "Linh Tran", personId: "p-linh" });
    expect(host.textContent).toContain("astoryapp.com/m/K7PX2QHM4D");
    expect(host.querySelector("svg.qr-code")).not.toBeNull();

    await act(async () => button("Copy the link").click());
    expect(writeText).toHaveBeenLastCalledWith("https://astoryapp.com/m/K7PX2QHM4D");
    await act(async () => button("Copy a message with it").click());
    expect(writeText.mock.calls.at(-1)?.[0]).toMatch(/^Linh, I’m keeping Rose’s stories on A Story\. Were you there for “The wedding, in the rain”\?/);
    expect(writeText.mock.calls.at(-1)?.[0]).toContain("— Jamie");
  });

  it("makes an open link with no name, and says plainly when links aren't switched on", async () => {
    memoryLinkFor.mockResolvedValue({ error: "not_ready" });
    act(() => root.render(<AskTheirSide story={story} memory={memory} people={[]} me={me} />));
    act(() => button("Ask someone to add their side").click());
    await act(async () => button("Make the link").click());
    expect(memoryLinkFor).toHaveBeenCalledWith({ memoryId: "m1", forName: "", personId: null });
    expect(host.querySelector('[role="alert"]')?.textContent).toBe("Links to one memory aren’t switched on yet.");
    expect(host.querySelector("svg.qr-code")).toBeNull();
  });
});
