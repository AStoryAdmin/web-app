// Faces: the square cut from a picture, and where your picture and a relative's go (the phone's buckets, paths and columns).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Call = { table: string; patch: Record<string, unknown>; id: string };
const uploads: { bucket: string; path: string; opts: Record<string, unknown> }[] = [];
const writes: Call[] = [];
const fail: { upload?: string; people?: { code?: string; message: string } | "none" } = {};

function table(name: string) {
  return {
    update(patch: Record<string, unknown>) {
      return {
        eq(_col: string, id: string) {
          writes.push({ table: name, patch, id });
          const done = { error: null as null | { code?: string; message: string } };
          return Object.assign(Promise.resolve(done), {
            select: () => {
              if (name === "people" && fail.people === "none") return Promise.resolve({ data: [], error: null });
              if (name === "people" && fail.people) return Promise.resolve({ data: null, error: fail.people });
              return Promise.resolve({ data: [{ id }], error: null });
            },
          });
        },
      };
    },
  };
}

const sb = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, _blob: Blob, opts: Record<string, unknown>) => {
        uploads.push({ bucket, path, opts });
        return { error: fail.upload && fail.upload === bucket ? { message: "no" } : null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x/storage/v1/object/public/${bucket}/${path}` } }),
    }),
  },
  from: table,
};
vi.mock("../lib/supabase", () => ({ supabase: () => sb }));
vi.mock("../lib/uuid", () => ({ uuid: () => "u1" }));

import { avatarPath, clearPortrait, personPhotoPath, pictureProblem, portraitCrop, resizePortrait, uploadOwnPortrait, uploadPersonPortrait, PortraitError } from "./portraits";

const drawn: number[][] = [];
let canvasSize = "";
beforeEach(() => {
  uploads.length = 0;
  writes.length = 0;
  drawn.length = 0;
  delete fail.upload;
  delete fail.people;
  vi.stubGlobal("createImageBitmap", async (b: Blob) => {
    if (b.type === "image/heic") throw new Error("unsupported");
    return { width: 3000, height: 4000, close: () => {} };
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: () => {},
    drawImage: (...a: unknown[]) => drawn.push(a.slice(1) as number[]),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, cb: BlobCallback) {
    canvasSize = `${this.width}x${this.height}`;
    cb(new Blob(["jpeg"], { type: "image/jpeg" }));
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const photo = (type = "image/jpeg") => new File(["x"], "face.jpg", { type });

describe("portraitCrop", () => {
  it("cuts a wide picture from the middle and shrinks it to 800", () => {
    expect(portraitCrop(4000, 3000)).toEqual({ sx: 500, sy: 0, side: 3000, out: 800 });
  });
  it("cuts a tall picture a little above the middle, where the face is", () => {
    expect(portraitCrop(3000, 4000)).toEqual({ sx: 0, sy: 300, side: 3000, out: 800 });
  });
  it("never enlarges a small picture", () => {
    expect(portraitCrop(320, 240)).toEqual({ sx: 40, sy: 0, side: 240, out: 240 });
  });
  it("survives nonsense sizes", () => {
    expect(portraitCrop(0, Number.NaN).out).toBe(1);
  });
});

describe("pictureProblem", () => {
  it("lets a photo through and says why anything else is not", () => {
    expect(pictureProblem({ type: "image/png", size: 10 })).toBeNull();
    expect(pictureProblem({ type: "application/pdf", size: 10 })).toMatch(/isn’t a picture/);
    expect(pictureProblem({ type: "image/jpeg", size: 50 * 1024 * 1024 })).toMatch(/very large/);
    expect(pictureProblem(null)).toMatch(/Choose a picture/);
  });
});

describe("resizePortrait", () => {
  it("draws the square at 800 as a JPEG", async () => {
    const out = await resizePortrait(photo());
    expect(out.type).toBe("image/jpeg");
    expect(canvasSize).toBe("800x800");
    expect(drawn[0]).toEqual([0, 300, 3000, 3000, 0, 0, 800, 800]);
  });
  it("says so when the browser cannot open it", async () => {
    await expect(resizePortrait(photo("image/heic"))).rejects.toBeInstanceOf(PortraitError);
    await expect(resizePortrait(photo("text/plain"))).rejects.toThrow(/isn’t a picture/);
  });
});

describe("paths", () => {
  it("are the phone's", () => {
    expect(avatarPath("me")).toBe("me/avatar.jpg");
    expect(personPhotoPath("h", "p", "abc")).toBe("h/p/abc.jpg");
  });
});

describe("uploadOwnPortrait", () => {
  it("replaces the account's picture and puts a private copy on your tree row", async () => {
    const r = await uploadOwnPortrait({ userId: "me", file: photo(), me: { id: "p-me", householdId: "h1" } });
    expect(r.mirrored).toBe(true);
    expect(r.url).toMatch(/^https:\/\/x\/storage\/v1\/object\/public\/avatars\/me\/avatar\.jpg\?t=\d+$/);
    expect(uploads).toEqual([
      { bucket: "avatars", path: "me/avatar.jpg", opts: { contentType: "image/jpeg", upsert: true } },
      { bucket: "family-photos", path: "h1/p-me/u1.jpg", opts: { contentType: "image/jpeg" } },
    ]);
    expect(writes).toEqual([
      { table: "profiles", patch: { avatar_url: r.url }, id: "me" },
      { table: "people", patch: { avatar_url: "https://x/storage/v1/object/public/family-photos/h1/p-me/u1.jpg" }, id: "p-me" },
    ]);
  });

  it("with no tree row, only the account's", async () => {
    const r = await uploadOwnPortrait({ userId: "me", file: photo(), me: null });
    expect(r.mirrored).toBe(false);
    expect(uploads.map((u) => u.bucket)).toEqual(["avatars"]);
  });

  it("keeps the account's picture when the tree's copy fails", async () => {
    fail.upload = "family-photos";
    const r = await uploadOwnPortrait({ userId: "me", file: photo(), me: { id: "p-me" }, householdId: "h1" });
    expect(r.mirrored).toBe(false);
    expect(writes.map((w) => w.table)).toEqual(["profiles"]);
  });

  it("throws when the account's picture did not go", async () => {
    fail.upload = "avatars";
    await expect(uploadOwnPortrait({ userId: "me", file: photo() })).rejects.toBeTruthy();
    expect(writes).toEqual([]);
  });
});

describe("uploadPersonPortrait", () => {
  it("puts a face on somebody's row in the family's private bucket", async () => {
    const url = await uploadPersonPortrait({ personId: "p-bao", householdId: "h1", file: photo() });
    expect(url).toBe("https://x/storage/v1/object/public/family-photos/h1/p-bao/u1.jpg");
    expect(writes).toEqual([{ table: "people", patch: { avatar_url: url }, id: "p-bao" }]);
  });

  it("on your own row, the account's picture follows", async () => {
    await uploadPersonPortrait({ personId: "p-me", householdId: "h1", file: photo(), selfUserId: "me" });
    expect(uploads.map((u) => u.bucket)).toEqual(["family-photos", "avatars"]);
    expect(writes.map((w) => w.table)).toEqual(["people", "profiles"]);
  });

  it("says so when the row cannot be changed from this account", async () => {
    fail.people = "none";
    await expect(uploadPersonPortrait({ personId: "p-x", householdId: "h1", file: photo() })).rejects.toThrow(/can’t be changed/);
  });

  it("says so when the database has no faces yet", async () => {
    fail.people = { code: "42703", message: "column avatar_url does not exist" };
    await expect(uploadPersonPortrait({ personId: "p-x", householdId: "h1", file: photo() })).rejects.toThrow(/switched on/);
  });

  it("needs a household", async () => {
    await expect(uploadPersonPortrait({ personId: "p-x", householdId: "", file: photo() })).rejects.toThrow(/family tree/);
    expect(uploads).toEqual([]);
  });
});

describe("clearPortrait", () => {
  it("takes your picture off the account and your row", async () => {
    await clearPortrait({ userId: "me", personId: "p-me" });
    expect(writes).toEqual([
      { table: "profiles", patch: { avatar_url: null }, id: "me" },
      { table: "people", patch: { avatar_url: null }, id: "p-me" },
    ]);
  });
  it("for somebody else, a refusal is said", async () => {
    fail.people = "none";
    await expect(clearPortrait({ personId: "p-x" })).rejects.toThrow(/can’t be changed/);
  });
});
