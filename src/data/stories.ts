/**
 * Stories and memories: the read side, mirroring phone-app/src/data/store.js
 * (rowToMemory, rowToStory, loadState) column for column. The web and the
 * app must read the same rows into the same shapes, or a date filed on one
 * reads differently on the other.
 *
 * Writes are per record (src/data/memories.ts), not a whole-tree save as in
 * the app; ids are client-made uuids on both, so the two never collide.
 */
import { supabase } from "../lib/supabase";
import { normaliseEra } from "../app-core/data/eras.js";

export type Clip = {
  id: string | number;
  bucket: string;
  /** A storage path, never a URL: the audio buckets are private and a URL is signed at play time. */
  path: string;
  speaker: "narrator" | "assistant" | string;
  duration: number;
  transcript: string;
};

export type Memory = {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  era: string;
  /** Free text as the family typed it: "June 1975", "the 60s". timeline.js reads the year. */
  period: string;
  rating: number;
  ratingNote: string;
  privacy: "shared" | "private" | string;
  status: "saved" | "in_progress" | string;
  photos: string[];
  cover: string | null;
  audio: Clip[];
  /** The paper colour chosen for it; "" means never chosen. */
  color: string;
  /** Who told it, when it is not the subject. */
  contributor: string;
  authorPersonId: string | null;
  createdBy: string | null;
  familyCallId: string | null;
  personIds?: string[];
  source?: string;
  createdAt: string;
};

export type Story = {
  id: string;
  ownerId: string | null;
  householdId: string | null;
  name: string;
  lastName: string;
  relationship: string;
  relationshipOther: string;
  nickname: string;
  directory: string | null;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  hasAccount: string | null;
  connectedEmail: string;
  photo: string | null;
  bookDesign: unknown | null;
  callStyle: unknown | null;
  cover: string | null;
  intro: string;
  isPublic: boolean;
  publicSlug: string | null;
  contributionsOpen: boolean;
  contributeSlug: string | null;
  memories: Memory[];
  /**
   * Read as family, not kept: the account has its own row in this story's family tree and is not one of its
   * keepers (family_readers.sql). It reads the shared memories and sends its side; nothing on the page changes the
   * story. Absent on every story the account keeps.
   */
  readOnly?: boolean;
  sessionsCompleted: number;
  streakDays: number;
  lastMemoryDate: string;
  doneTopicsToday: { date: string; eras: string[] };
  createdAt: string;
};

export type Account = {
  onboardingComplete: boolean;
  activeStoryId: string | null;
  stories: Story[];
};

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function rowToMemory(row: Row): Memory {
  const photos: string[] = (row.memory_photos || [])
    .slice()
    .sort((a: Row, b: Row) => a.sort_order - b.sort_order)
    .map((p: Row) => p.public_url);
  const audio: Clip[] = (row.memory_audio || [])
    .slice()
    .sort((a: Row, b: Row) => a.sort_order - b.sort_order)
    .map((a: Row) => ({
      id: a.id,
      bucket: a.bucket || "memory-audio",
      path: a.storage_path,
      speaker: a.speaker || "narrator",
      duration: Number(a.duration_seconds) || 0,
      transcript: a.transcript || "",
    }));
  return {
    id: row.id,
    title: row.title || "",
    body: row.body || "",
    excerpt: row.excerpt || "",
    era: normaliseEra(row.era),
    period: row.period || "",
    rating: row.rating || 0,
    ratingNote: row.rating_note || "",
    privacy: row.privacy || "shared",
    status: row.status || "saved",
    photos,
    cover: row.cover_url || null,
    audio,
    color: row.color || "",
    contributor: row.contributor || "",
    authorPersonId: row.author_person_id || null,
    createdBy: row.created_by || null,
    familyCallId: row.family_call_id || null,
    ...(Array.isArray(row.person_ids) ? { personIds: row.person_ids as string[] } : {}),
    ...(row.source ? { source: row.source as string } : {}),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/** A birth year the archive can count with; anything else (the app lets people type freely) is left blank. */
export function yearOnly(v: unknown): string {
  const t = String(v ?? "").trim();
  return /^\d{4}$/.test(t) ? t : "";
}

export function rowToStory(row: Row): Story {
  const memories = (row.memories || [])
    .slice()
    .sort((a: Row, b: Row) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(rowToMemory);
  return {
    id: row.id,
    ownerId: row.owner_id || null,
    householdId: row.household_id || null,
    name: row.name || "",
    lastName: row.last_name || "",
    relationship: row.relationship || "Relative",
    relationshipOther: row.relationship_other || "",
    nickname: row.nickname || "",
    directory: row.directory || null,
    birthDay: row.birth_day || "",
    birthMonth: row.birth_month || "",
    birthYear: yearOnly(row.birth_year),
    hasAccount: row.has_account || null,
    connectedEmail: row.connected_email || "",
    photo: row.photo_url || null,
    bookDesign: row.book_design || null,
    callStyle: row.call_style || null,
    cover: row.cover_url || null,
    intro: row.intro || "",
    isPublic: row.is_public || false,
    publicSlug: row.public_slug || null,
    contributionsOpen: row.contributions_open || false,
    contributeSlug: row.contribute_slug || null,
    memories,
    sessionsCompleted: row.sessions_completed || 0,
    streakDays: row.streak_days || 0,
    lastMemoryDate: row.last_memory_date || "",
    doneTopicsToday: row.done_topics_today || { date: "", eras: [] },
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/** The app's exact select: stories with their memories, photos and clips, in one trip. */
export const STORY_SELECT = `
      *,
      memories (
        *,
        memory_photos (*),
        memory_audio (*)
      )
    `;

/**
 * The stories this account reads as family (family_readers.sql's family_reader_stories()). Null when the
 * database doesn't have the function yet: then row-level security shows no such story, and there is nothing to
 * mark. Any other failure answers "unknown", and the caller treats every story it doesn't own as read-only for
 * this load, so a page never offers a change the database would refuse.
 */
async function familyReaderStoryIds(): Promise<Set<string> | null | "unknown"> {
  const { data, error } = await supabase().rpc("family_reader_stories");
  if (error) {
    if (["PGRST202", "42883"].includes(error.code || "")) return null;
    console.warn("family_reader_stories:", error.message);
    return "unknown";
  }
  return new Set(((data || []) as { story_id: string }[]).map((r) => r.story_id));
}

/**
 * Every story this account can see: the ones it owns, the ones it
 * co-manages, and the ones it reads as family, flagged readOnly (RLS
 * decides; no owner filter). A story merged into another stays in the
 * database for 30 days but is empty and hidden.
 */
export async function loadAccount(userId: string): Promise<Account> {
  const sb = supabase();
  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("onboarding_complete, active_story_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) throw new Error(`We couldn’t load the account: ${profileErr.message}`);

  const [{ data: stories, error: storiesErr }, readers] = await Promise.all([
    sb.from("stories").select(STORY_SELECT).order("created_at", { ascending: true }),
    familyReaderStoryIds(),
  ]);
  if (storiesErr) throw new Error(`We couldn’t load the stories: ${storiesErr.message}`);
  const readOnly = (s: Story) => (readers === "unknown" ? !!s.ownerId && s.ownerId !== userId : !!readers?.has(s.id));

  return {
    onboardingComplete: profile?.onboarding_complete ?? false,
    activeStoryId: profile?.active_story_id ?? null,
    stories: ((stories || []) as Row[])
      .filter((r) => !r.merged_into)
      .map(rowToStory)
      .map((s) => (readOnly(s) ? { ...s, readOnly: true } : s)),
  };
}

/** One story, fresh, for a page that needs the latest copy (a memory just saved elsewhere). */
export async function loadStory(storyId: string): Promise<Story | null> {
  const { data, error } = await supabase().from("stories").select(STORY_SELECT).eq("id", storyId).maybeSingle();
  if (error) throw new Error(`We couldn’t load the story: ${error.message}`);
  return data ? rowToStory(data as Row) : null;
}
