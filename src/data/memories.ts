/**
 * Writing stories and memories, one record at a time.
 *
 * The app saves its whole tree and diffs it against the last copy from the
 * server (rows.js planSave). The web writes the record that changed: the
 * memory row, then its photo list and clip list. The rows themselves come
 * from the same rows.js the app uses (src/app-core/data/rows.js), so both
 * products write the same columns with the same meanings.
 *
 * Two things carried over on purpose:
 * - Photo and clip rows are rewritten wholesale (delete, then insert) because
 *   order and membership both matter and there is no stable key to upsert on.
 * - A column the database does not have yet (an older migration) is dropped
 *   and the rest of the row saved, rather than the save failing for good
 *   (writeDroppingMissing, copied from the app).
 *
 * Every function here throws on failure. A screen must catch and say so:
 * this holds recordings that exist nowhere else.
 */
import { supabase } from "../lib/supabase";
import { uuid } from "../lib/uuid";
import { memoryToRow, storyToRow } from "../app-core/data/rows.js";
import { writeDroppingMissing } from "../app-core/lib/saveErrors.js";
import { privatePhotoRef } from "../app-core/lib/photoRefs.js";
import type { Memory, Story } from "./stories";

// The app's lists (store.js): newer optional columns that an older database
// may not have, dropped from a write rather than failing it.
const OPTIONAL_STORY_COLUMNS = ["book_design", "call_style", "cover_url", "nickname", "directory"];
const OPTIONAL_MEMORY_COLUMNS = ["person_ids", "family_call_id", "color", "author_person_id", "cover_url", "contributor", "source"];

type Row = Record<string, unknown>;
type Write = (rows: Row | Row[]) => PromiseLike<{ error: { code?: string; message?: string } | null }>;

async function write(rows: Row | Row[], run: Write, optional: string[]) {
  const dropped: string[] = await writeDroppingMissing(rows, run, optional);
  if (dropped.length) console.warn(`a newer column isn't there yet (${dropped.join(", ")}); saved without it`);
}

/* ── Memories ──────────────────────────────────────────────────────────── */

export function newMemory(input: Partial<Memory> & { title?: string; body?: string; era?: string }): Memory {
  const body = input.body || "";
  return {
    id: input.id || uuid(),
    title: input.title || "",
    body,
    excerpt: input.excerpt || body.slice(0, 140),
    era: input.era || "Anything else",
    period: input.period || "",
    rating: input.rating || 0,
    ratingNote: input.ratingNote || "",
    privacy: input.privacy || "shared",
    status: input.status || "saved",
    photos: input.photos || [],
    cover: input.cover || null,
    audio: input.audio || [],
    color: input.color || "",
    contributor: input.contributor || "",
    authorPersonId: input.authorPersonId || null,
    createdBy: null,
    familyCallId: input.familyCallId || null,
    ...(input.personIds ? { personIds: input.personIds } : {}),
    ...(input.source ? { source: input.source } : {}),
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

/** Upserts the memory row; photos and clips are written by the two below. */
export async function saveMemoryRow(memory: Memory, storyId: string): Promise<void> {
  const sb = supabase();
  const row = memoryToRow(memory, storyId) as Row;
  await write(row, (r) => sb.from("memories").upsert(r, { onConflict: "id" }), OPTIONAL_MEMORY_COLUMNS);
}

export async function syncMemoryPhotos(memory: Memory): Promise<void> {
  const sb = supabase();
  const del = await sb.from("memory_photos").delete().eq("memory_id", memory.id);
  if (del.error) throw del.error;
  const rows = (memory.photos || []).map((url, i) => ({
    memory_id: memory.id,
    public_url: url,
    storage_path: url.startsWith("data:") ? `inline/${memory.id}/${i}` : privatePhotoRef(url)?.path || url,
    sort_order: i,
  }));
  if (!rows.length) return;
  const ins = await sb.from("memory_photos").insert(rows);
  if (ins.error) throw ins.error;
}

export async function syncMemoryAudio(memory: Memory): Promise<void> {
  const sb = supabase();
  const del = await sb.from("memory_audio").delete().eq("memory_id", memory.id);
  if (del.error) throw del.error;
  const rows = (memory.audio || [])
    // A clip with no path is a recording that never finished uploading.
    .filter((clip) => !!clip?.path)
    .map((clip, i) => ({
      memory_id: memory.id,
      bucket: clip.bucket || "memory-audio",
      storage_path: clip.path,
      speaker: clip.speaker || "narrator",
      duration_seconds: clip.duration || 0,
      transcript: clip.transcript || "",
      sort_order: i,
    }));
  if (!rows.length) return;
  const ins = await sb.from("memory_audio").insert(rows);
  if (ins.error) throw ins.error;
}

/** The whole memory: row, then photos, then clips. */
export async function saveMemory(memory: Memory, storyId: string): Promise<void> {
  await saveMemoryRow(memory, storyId);
  await syncMemoryPhotos(memory);
  await syncMemoryAudio(memory);
}

/** Photos and clips cascade with the row (schema.sql). */
export async function deleteMemory(memoryId: string): Promise<void> {
  const { error } = await supabase().from("memories").delete().eq("id", memoryId);
  if (error) throw error;
}

/* ── Stories ───────────────────────────────────────────────────────────── */

export const RELATIONSHIPS = [
  "Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle",
  "Partner", "Sibling", "Child", "Friend", "Myself", "Someone else",
];

export function newStory(input: Partial<Story> & { name: string; relationship: string }): Story {
  return {
    id: input.id || uuid(),
    ownerId: input.ownerId || null,
    householdId: null,
    name: input.name.trim(),
    lastName: (input.lastName || "").trim(),
    relationship: input.relationship,
    relationshipOther: input.relationshipOther || "",
    nickname: input.nickname || "",
    directory: null,
    birthDay: input.birthDay || "",
    birthMonth: input.birthMonth || "",
    birthYear: input.birthYear || "",
    hasAccount: input.hasAccount || null,
    connectedEmail: input.connectedEmail || "",
    photo: null,
    bookDesign: null,
    callStyle: null,
    cover: null,
    intro: input.intro || "",
    isPublic: false,
    publicSlug: null,
    contributionsOpen: false,
    contributeSlug: null,
    memories: [],
    sessionsCompleted: 0,
    streakDays: 0,
    lastMemoryDate: "",
    doneTopicsToday: { date: "", eras: [] },
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

/**
 * A story somebody else owns is theirs to create: upserting it sends an
 * INSERT whose row names their owner_id, which the owner-only insert policy
 * refuses. A co-manager only ever UPDATEs (rows.js planSave says the same).
 */
export async function saveStory(story: Story, userId: string, { isNew = false } = {}): Promise<void> {
  const sb = supabase();
  const row = storyToRow(story, userId) as Row;
  if (story.ownerId && story.ownerId !== userId) {
    const { id, ...fields } = row;
    delete (fields as Row).owner_id;
    await write(fields, (f) => sb.from("stories").update(f as Row).eq("id", id as string), OPTIONAL_STORY_COLUMNS);
    return;
  }
  if (isNew) {
    await write(row, async (r) => {
      const res = await sb.from("stories").insert(r);
      // Already there (a retry after a lost answer): fall back to an upsert.
      return res.error?.code === "23505" ? sb.from("stories").upsert(r, { onConflict: "id" }) : res;
    }, OPTIONAL_STORY_COLUMNS);
    return;
  }
  await write(row, (r) => sb.from("stories").upsert(r, { onConflict: "id" }), OPTIONAL_STORY_COLUMNS);
}

/** profiles.active_story_id has a foreign key to stories, so the story must exist first. */
export async function setActiveStory(userId: string, storyId: string | null, onboardingComplete = true): Promise<void> {
  const { error } = await supabase()
    .from("profiles")
    .update({ active_story_id: storyId, onboarding_complete: onboardingComplete })
    .eq("id", userId);
  if (error) throw error;
}

/* ── Photos ────────────────────────────────────────────────────────────── */

const PHOTO_BUCKET = "memory-photos";
const MAX_EDGE = 2048;

/**
 * Shrinks a picked image in the browser before upload, as the app does on
 * the phone: a 12-megapixel photograph is 5 MB nobody needs for a card.
 * Keeps PNG as PNG (drawings, screenshots); everything else becomes JPEG.
 */
export async function shrinkImage(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  if (!/^image\//.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), type, 0.86));
}

/**
 * Uploads one photo for a memory and returns the URL the app stores as the
 * photo's identity (photoRefs.js): the public-style object URL, even though
 * the bucket is private and viewing it means signing it (lib/photoUrls.ts).
 */
export async function uploadMemoryPhoto(storyId: string, memoryId: string, file: File): Promise<string> {
  const sb = supabase();
  const blob = await shrinkImage(file);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${storyId}/${memoryId}/${uuid()}.${ext}`;
  const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg" });
  if (error) throw error;
  return sb.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
