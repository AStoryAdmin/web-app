/**
 * A face for somebody: your own picture on the account, or the face of
 * anyone on the family tree, the living and the late alike. Ported from the
 * app's ProfilePictureScreen and the tree's setPhoto (lib/avatarUpload.js,
 * lib/personPhotoUpload.js, AppContext saveAvatar, useFamilyTree setPhoto).
 *
 * Two buckets, as on the phone:
 * - "avatars" (public): the account's picture, always at `{userId}/avatar.jpg`
 *   with upsert, so a new picture replaces the old one; the URL written to
 *   profiles.avatar_url carries `?t=` so a cached copy is not shown again.
 * - "family-photos" (private, family_photos.sql): a face on the tree, at
 *   `{householdId}/{personId}/{uuid}.jpg`, its object URL written to
 *   people.avatar_url and signed when shown (lib/photoUrls.ts).
 *
 * One picture is chosen once: your own picture goes on your tree row too
 * (the private copy, never the public URL), and a picture set on your own
 * tree row becomes the account's. The second write is a courtesy; if it
 * fails, the one asked for has still changed.
 *
 * The picture is cut to a square in the browser and made no larger than
 * PORTRAIT_EDGE, as the phone crops its 1:1 picker; a face is a circle, and
 * a 12-megapixel photograph is several megabytes nobody needs for one.
 */
import { supabase } from "../lib/supabase";
import { uuid } from "../lib/uuid";

export const AVATAR_BUCKET = "avatars";
export const PERSON_PHOTO_BUCKET = "family-photos";
/** The longest side of a portrait, in pixels. */
export const PORTRAIT_EDGE = 800;
const JPEG_QUALITY = 0.86;

/* ── The square ────────────────────────────────────────────────────────── */

export type PortraitCrop = { sx: number; sy: number; side: number; out: number };

/**
 * The square cut from a width × height picture, and the size it is drawn at.
 * A wide picture is cut from the middle; a tall one a little above the
 * middle, because a face in a portrait sits in its upper part, never at its
 * centre. Never enlarged.
 */
export function portraitCrop(width: number, height: number, edge = PORTRAIT_EDGE): PortraitCrop {
  const w = Math.max(1, Math.round(width) || 1);
  const h = Math.max(1, Math.round(height) || 1);
  const side = Math.min(w, h);
  const sx = Math.round((w - side) / 2);
  const sy = Math.round((h - side) * 0.3);
  return { sx, sy, side, out: Math.min(side, Math.max(1, Math.round(edge))) };
}

/** Words a person can act on, for a picture that will not open or will not go. */
export class PortraitError extends Error {}

const NOT_A_PICTURE = "That file isn’t a picture. Choose a photo (JPEG or PNG).";
const WONT_OPEN = "That picture won’t open in this browser. Try a JPEG or PNG.";
const TOO_BIG = 40 * 1024 * 1024;

/** Whether a picked file is worth trying: an image, and not absurdly large. Null when it is, else why not. */
export function pictureProblem(file: { type: string; size: number } | null | undefined): string | null {
  if (!file) return "Choose a picture first.";
  if (file.type && !/^image\//.test(file.type)) return NOT_A_PICTURE;
  if (file.size > TOO_BIG) return "That picture is very large. Choose one under 40 MB.";
  return null;
}

/**
 * The picture as a square JPEG, PORTRAIT_EDGE at most, turned the right way
 * up (the camera's orientation is applied). Throws a PortraitError with the
 * reason when the browser cannot open it (HEIC outside Safari, a broken file).
 */
export async function resizePortrait(file: Blob, edge = PORTRAIT_EDGE): Promise<Blob> {
  const problem = pictureProblem(file);
  if (problem) throw new PortraitError(problem);
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) throw new PortraitError(WONT_OPEN);
  try {
    const crop = portraitCrop(bitmap.width, bitmap.height, edge);
    const canvas = document.createElement("canvas");
    canvas.width = crop.out;
    canvas.height = crop.out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PortraitError(WONT_OPEN);
    // a transparent PNG is set on white paper, never on black
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, crop.out, crop.out);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, crop.sx, crop.sy, crop.side, crop.side, 0, 0, crop.out, crop.out);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new PortraitError(WONT_OPEN);
    return blob;
  } finally {
    bitmap.close?.();
  }
}

/* ── Where it goes ─────────────────────────────────────────────────────── */

export const avatarPath = (userId: string): string => `${userId}/avatar.jpg`;
export const personPhotoPath = (householdId: string, personId: string, id: string = uuid()): string => `${householdId}/${personId}/${id}.jpg`;

type Failure = { code?: string; message?: string } | null;
// a column a database a migration behind does not have yet
const missingColumn = (e: Failure) => !!e && ["42703", "PGRST204"].includes(e.code || "");

/** Uploads the account's picture and returns its public URL, cache-busted (avatarUpload.js). */
async function putAvatar(userId: string, blob: Blob, now = Date.now()): Promise<string> {
  const sb = supabase();
  const path = avatarPath(userId);
  const { error } = await sb.storage.from(AVATAR_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  return `${sb.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl}?t=${now}`;
}

/** Uploads a face for the tree and returns the object URL people.avatar_url keeps (personPhotoUpload.js). */
async function putPersonPhoto(householdId: string, personId: string, blob: Blob): Promise<string> {
  const sb = supabase();
  const path = personPhotoPath(householdId, personId);
  const { error } = await sb.storage.from(PERSON_PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return sb.storage.from(PERSON_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function writeAvatarUrl(userId: string, url: string | null): Promise<void> {
  const { error } = await supabase().from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) throw error;
}

/**
 * Writes one person's face. Row-level security answers a row this account
 * may not change with no rows rather than an error, so that is said too.
 */
async function writePersonPhoto(personId: string, url: string | null): Promise<void> {
  const { data, error } = await supabase().from("people").update({ avatar_url: url }).eq("id", personId).select("id");
  if (error) {
    if (missingColumn(error)) throw new PortraitError("Faces on the tree aren’t switched on for this family yet.");
    throw error;
  }
  if (!data || !data.length) throw new PortraitError("This person’s picture can’t be changed from this account.");
}

/* ── The two ways in ───────────────────────────────────────────────────── */

export type OwnPortrait = {
  /** The account's new picture (profiles.avatar_url). */
  url: string;
  /** Whether your row on the tree has it too; false when you have no row, or that copy did not go. */
  mirrored: boolean;
};

/**
 * Your own picture: the account's (avatars) and, when you are on the tree,
 * your row's (family-photos), as saveAvatar does. Throws only when the
 * account's picture did not change.
 */
export async function uploadOwnPortrait(input: { userId: string; file: Blob; me?: { id: string; householdId?: string | null } | null; householdId?: string | null }): Promise<OwnPortrait> {
  const blob = await resizePortrait(input.file);
  const url = await putAvatar(input.userId, blob);
  await writeAvatarUrl(input.userId, url);
  const household = input.me?.householdId || input.householdId || null;
  if (!input.me || !household) return { url, mirrored: false };
  try {
    const photo = await putPersonPhoto(household, input.me.id, blob);
    await writePersonPhoto(input.me.id, photo);
    return { url, mirrored: true };
  } catch (err) {
    console.warn("uploadOwnPortrait: tree photo:", (err as Error)?.message || err);
    return { url, mirrored: false };
  }
}

/**
 * A face for somebody on the tree. Anyone in the family may set one, for
 * the reason the phone gives: the photo of Great-uncle Bao is in whichever
 * drawer it is in. When the person is you (`selfUserId`), the account's
 * picture follows. Returns the stored URL; throws when it did not save.
 */
export async function uploadPersonPortrait(input: { personId: string; householdId: string; file: Blob; selfUserId?: string | null }): Promise<string> {
  if (!input.householdId) throw new PortraitError("This person isn’t in a family tree yet.");
  const blob = await resizePortrait(input.file);
  const photo = await putPersonPhoto(input.householdId, input.personId, blob);
  await writePersonPhoto(input.personId, photo);
  if (input.selfUserId) {
    try {
      await writeAvatarUrl(input.selfUserId, await putAvatar(input.selfUserId, blob));
    } catch (err) {
      console.warn("uploadPersonPortrait: account photo:", (err as Error)?.message || err);
    }
  }
  return photo;
}

/**
 * Takes a face away, leaving the monogram. For yourself it is the account's
 * picture and your tree row's; for anyone else, their row's. The file stays
 * in Storage, as on the phone.
 */
export async function clearPortrait(input: { userId?: string | null; personId?: string | null }): Promise<void> {
  if (input.userId) await writeAvatarUrl(input.userId, null);
  if (input.personId) {
    try {
      await writePersonPhoto(input.personId, null);
    } catch (err) {
      // your own picture is gone from the account; the tree's copy is the courtesy
      if (!input.userId) throw err;
      console.warn("clearPortrait: tree photo:", (err as Error)?.message || err);
    }
  }
}
