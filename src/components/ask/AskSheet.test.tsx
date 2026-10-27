import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newStory } from "../../data/memories";
import type { Person } from "../../data/family";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Only the two server calls are mocked; the deck, the words and the links are the real ones.
const server = vi.hoisted(() => ({ ask: vi.fn(), rota: vi.fn() }));
vi.mock("../../data/dailyQuestions", async (orig) => ({
  ...(await orig<typeof import("../../data/dailyQuestions")>()),
  askQuestion: server.ask,
  storyRota: server.rota,
}));
vi.mock("../../lib/analytics", () => ({ track: vi.fn() }));

import AskSheet from "./AskSheet";
import { AskButton } from "./AskButton";

const LINK = "https://app.example.test/a/AbCdEfGhIjKlMnOpQrStUvWxYz0";
const story = newStory({ id: "s1", name: "Rose", relationship: "Grandmother", ownerId: "u1" });
const rose = { id: "p-rose", givenName: "Rose", familyName: "", sex: "", householdId: "h1", source: "manual", storyId: "s1" } as Person;

let root: Root;
let host: HTMLDivElement;
const buttons = () => [...document.querySelectorAll("button, a.btn")] as HTMLElement[];
const byText = (text: string) => buttons().find((b) => b.textContent?.trim() === text);
const flush = () => act(async () => {});
// The sheet is portalled to the body, over the whole page.
const page = document.body;

beforeEach(() => {
  server.ask.mockReset();
  server.rota.mockReset().mockResolvedValue(null);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("AskSheet", () => {
  it("is nothing while closed", () => {
    act(() => root.render(<AskSheet open={false} onClose={() => {}} story={story} person={rose} />));
    expect(host.innerHTML).toBe("");
  });

  it("offers today's question first, makes the link, and shows it with copy, a QR and a way to send", async () => {
    server.ask.mockResolvedValue({ ok: true, id: "d1", sendOn: "2026-10-27", today: true, day: "2026-10-27", linkUrl: LINK });
    act(() => root.render(<AskSheet open onClose={() => {}} story={story} person={rose} />));
    await flush();
    expect(page.querySelector("h2")?.textContent).toBe("Ask Rose a question");
    expect(host.querySelector(".asksheet")).toBeNull();
    expect(page.querySelector(".asksheet")?.closest(".scrim")?.parentElement).toBe(document.body);
    const radios = [...page.querySelectorAll<HTMLInputElement>("input[type=radio]")];
    expect(radios.length).toBe(4);
    expect(radios[0].checked).toBe(true);
    expect(page.querySelector(".asksheet-pick .k")?.textContent).toBe("Today’s question");

    // Choose another one.
    act(() => radios[2].click());
    const chosen = radios[2].closest("label")!.querySelector(".q")!.textContent;
    await act(async () => byText("Make the link")!.click());
    expect(server.ask).toHaveBeenCalledWith(expect.objectContaining({ storyId: "s1", tellerPersonId: "p-rose", text: chosen, questionId: radios[2].value }));

    expect(page.querySelector("h2")?.textContent).toBe("Send Rose the link");
    expect(page.querySelector(".asksheet-url")?.textContent).toBe(LINK.replace("https://", ""));
    expect(page.querySelector("svg.qr-code")).not.toBeNull();
    expect(byText("Copy link")).toBeTruthy();
    // jsdom has no share sheet: a text and an email the asker sends.
    expect((byText("Send by text") as HTMLAnchorElement).href).toMatch(/^sms:/);
    expect((byText("Send by email") as HTMLAnchorElement).href).toMatch(/^mailto:/);
  });

  it("walks to other questions and keeps today's", async () => {
    act(() => root.render(<AskSheet open onClose={() => {}} story={story} person={rose} />));
    const first = () => [...page.querySelectorAll(".asksheet-pick .q")].map((n) => n.textContent);
    const before = first();
    act(() => byText("Show others")!.click());
    const after = first();
    expect(after[0]).toBe(before[0]);
    expect(after.slice(1)).not.toEqual(before.slice(1));
  });

  it("says when somebody already has today, and what went wrong", async () => {
    server.rota.mockResolvedValue({ today: "2026-10-27", next: "2026-10-28", days: [{ sendOn: "2026-10-27", askerName: "Linh", mine: false }] });
    server.ask.mockResolvedValue({ error: "too_many" });
    act(() => root.render(<AskSheet open onClose={() => {}} story={story} person={rose} />));
    await flush();
    expect(page.textContent).toContain("Linh already asked today’s, so in the app this one comes tomorrow.");
    await act(async () => byText("Make the link")!.click());
    expect(page.querySelector("[role=alert]")?.textContent).toContain("Try again tomorrow");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    act(() => root.render(<AskSheet open onClose={onClose} story={story} person={rose} />));
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("AskButton", () => {
  it("opens the sheet, and is nothing for someone who has passed", async () => {
    act(() => root.render(<AskButton story={story} person={rose} />));
    act(() => byText("Ask Rose today’s question")!.click());
    await flush();
    expect(document.querySelector("[role=dialog]")).not.toBeNull();
    act(() => root.render(<AskButton story={story} person={{ ...rose, deathYear: 1999 } as Person} />));
    expect(host.innerHTML).toBe("");
  });

  it("is nothing for a living relative who isn't this story's storyteller", () => {
    act(() => root.render(<AskButton story={story} person={{ ...rose, id: "p-linh", givenName: "Linh", storyId: "s2" } as Person} />));
    expect(host.innerHTML).toBe("");
    act(() => root.render(<AskButton story={story} person={{ ...rose, id: "p-aunt", givenName: "Mai", storyId: undefined } as unknown as Person} />));
    expect(host.innerHTML).toBe("");
  });
});
