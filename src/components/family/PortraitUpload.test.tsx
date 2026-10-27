// Choosing a face: your own goes to the account (and your tree row), somebody else's to their row; a refusal is said beside it.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { uploadOwnPortrait, uploadPersonPortrait, clearPortrait } = vi.hoisted(() => ({ uploadOwnPortrait: vi.fn(), uploadPersonPortrait: vi.fn(), clearPortrait: vi.fn() }));
vi.mock("../../data/portraits", async (orig) => ({ ...(await orig<typeof import("../../data/portraits")>()), uploadOwnPortrait, uploadPersonPortrait, clearPortrait }));
vi.mock("../../data/familyWrites", () => ({ householdFor: vi.fn(async () => "h-made") }));
vi.mock("../../lib/analytics", () => ({ track: vi.fn() }));
vi.mock("../../lib/supabase", () => ({ getSupabase: () => null, supabase: () => ({}) }));

import PortraitUpload from "./PortraitUpload";
import { AuthContext, type AuthState } from "../../state/authContext";
import { AccountContext, type AccountState } from "../../state/accountContext";
import { PortraitError } from "../../data/portraits";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const refresh = vi.fn(async () => null);
const reload = vi.fn(async () => {});
const people = [
  { id: "p-me", householdId: "h1", givenName: "Ann", familyName: "Lee", userId: "me", source: "manual", sex: "" },
  { id: "p-bao", householdId: "h1", givenName: "Bao", familyName: "Lee", source: "manual", sex: "" },
];
const auth = { user: { id: "me", firstName: "Ann", lastName: "Lee" }, refresh, signOut: vi.fn(), effects: null } as unknown as AuthState;
const account = { account: null, family: { people, edges: [], households: [] }, reload } as unknown as AccountState;

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:preview", revokeObjectURL: () => {} }));
  vi.spyOn(console, "warn").mockImplementation(() => {});
  for (const f of [uploadOwnPortrait, uploadPersonPortrait, clearPortrait, refresh, reload]) f.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

function mount(props: Parameters<typeof PortraitUpload>[0]) {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AccountContext.Provider value={account}>
          <PortraitUpload {...props} />
        </AccountContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

async function choose(file: File) {
  const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

const photo = new File(["x"], "face.jpg", { type: "image/jpeg" });

describe("PortraitUpload", () => {
  it("sets your own picture on the account and your tree row, then reads both again", async () => {
    uploadOwnPortrait.mockResolvedValue({ url: "https://x/avatars/me/avatar.jpg?t=1", mirrored: true });
    const onChange = vi.fn();
    mount({ forProfile: true, currentUrl: null, onChange });
    expect(host.textContent).toContain("Add a picture");
    await choose(photo);
    expect(uploadOwnPortrait).toHaveBeenCalledWith({ userId: "me", file: photo, me: expect.objectContaining({ id: "p-me" }) });
    expect(onChange).toHaveBeenCalledWith("https://x/avatars/me/avatar.jpg?t=1");
    expect(refresh).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
    expect(host.querySelector('[role="status"]')?.textContent).toBe("Your picture is set.");
  });

  it("sets somebody else's face on their row, and only the tree is read again", async () => {
    uploadPersonPortrait.mockResolvedValue("https://x/family-photos/h1/p-bao/u.jpg");
    const onChange = vi.fn();
    mount({ personId: "p-bao", currentUrl: null, onChange });
    expect(host.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Bao’s picture");
    await choose(photo);
    expect(uploadPersonPortrait).toHaveBeenCalledWith({ personId: "p-bao", householdId: "h1", file: photo, selfUserId: null });
    expect(onChange).toHaveBeenCalledWith("https://x/family-photos/h1/p-bao/u.jpg");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("on your own row, says it is yours and lets the account follow", async () => {
    uploadPersonPortrait.mockResolvedValue("u");
    mount({ personId: "p-me", currentUrl: null, onChange: vi.fn() });
    await choose(photo);
    expect(uploadPersonPortrait).toHaveBeenCalledWith(expect.objectContaining({ selfUserId: "me" }));
  });

  it("says why a picture did not go, and keeps the old face", async () => {
    uploadPersonPortrait.mockRejectedValue(new PortraitError("This person’s picture can’t be changed from this account."));
    const onChange = vi.fn();
    mount({ personId: "p-bao", currentUrl: "https://x/old.jpg", onChange });
    await choose(photo);
    expect(onChange).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/can’t be changed/);
    expect(host.querySelector("img")?.getAttribute("src")).toBe("https://x/old.jpg");
  });

  it("turns away a file that is not a picture before anything is sent", async () => {
    mount({ forProfile: true, currentUrl: null, onChange: vi.fn() });
    await choose(new File(["x"], "notes.pdf", { type: "application/pdf" }));
    expect(uploadOwnPortrait).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toMatch(/isn’t a picture/);
  });

  it("takes a face away", async () => {
    clearPortrait.mockResolvedValue(undefined);
    const onChange = vi.fn();
    mount({ forProfile: true, currentUrl: "https://x/avatars/me/avatar.jpg", onChange });
    const away = [...host.querySelectorAll("button")].find((b) => b.textContent === "Take it away")!;
    await act(async () => away.click());
    expect(clearPortrait).toHaveBeenCalledWith({ userId: "me", personId: "p-me" });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
