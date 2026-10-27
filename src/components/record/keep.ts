/**
 * Keeping a recorded answer the way the phone keeps one (RecordAnswerScreen
 * save, lib/memoryAudio.js uploadMemoryAudio): the voice into the private
 * memory-audio bucket at <story>/<memory>/<file>, then a memory whose title
 * is the question, with the question's words and id on it (so the same
 * question is not dealt again, dailyQuestion.js answeredBy), "recorded" as
 * how it came, and the writer credited when they are not the storyteller
 * (data/memories.ts createMemory). The clip row goes in with the memory
 * (saveMemory → syncMemoryAudio).
 */
import { supabase } from "../../lib/supabase";
import { createMemory, type Teller } from "../../data/memories";
import { tellerFor } from "../../app-core/lib/teller.js";
import type { Clip, Memory, Story } from "../../data/stories";
import type { Prompt } from "../../lib/today";
import type { Take } from "./machine";

export const AUDIO_BUCKET = "memory-audio";

/** The file's extension from what the browser recorded: m4a from Safari and Chrome 126+, WebM or Ogg elsewhere. */
export function audioExt(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (/mp4|m4a|aac/.test(m)) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  return "webm";
}

/** The content type stored with it: the bare type, without the codecs a browser adds ("audio/webm;codecs=opus"). */
export function audioType(mime: string): string {
  const base = (mime || "").split(";")[0].trim().toLowerCase();
  return base.startsWith("audio/") ? base : audioExt(mime) === "m4a" ? "audio/mp4" : "audio/webm";
}

/** One recording per memory from this page, so a retry lands on the same object. */
export const audioPath = (storyId: string, memoryId: string, mime: string) => `${storyId}/${memoryId}/voice.${audioExt(mime)}`;

/**
 * Uploads the take and returns the clip as the memory holds it. An object
 * already at the path (a retry after the answer to the first try was lost)
 * counts as uploaded, as on the phone; the bucket has no update policy, so
 * it is never overwritten.
 */
export async function uploadVoice(storyId: string, memoryId: string, take: Take, { speaker = "narrator", transcript = "" } = {}): Promise<Clip> {
  const type = take.blob.type || "audio/webm";
  const path = audioPath(storyId, memoryId, type);
  const { error } = await supabase()
    .storage.from(AUDIO_BUCKET)
    .upload(path, take.blob, { contentType: audioType(type), upsert: false });
  const status = String((error as { statusCode?: string | number } | null)?.statusCode ?? "");
  const already = !!error && (status === "409" || /already exists|duplicate/i.test(error.message || ""));
  if (error && !already) throw error;
  return {
    id: `voice-${memoryId}`,
    bucket: AUDIO_BUCKET,
    path,
    speaker,
    duration: Math.max(1, Math.round(take.durationMs / 1000)),
    transcript,
  };
}

/** The memory's title: the question as asked, else whose voice it is (phone lib/recordAnswer.js voiceTitle). */
export function voiceTitle({ question = "", name = "", writer = "" }: { question?: string; name?: string; writer?: string } = {}): string {
  const q = question.replace(/\s+/g, " ").trim();
  if (q) return q.length > 90 ? `${q.slice(0, 87).trimEnd()}…` : q;
  if (name && writer) return `What ${writer} remembers of ${name}`;
  return name ? `In ${name}’s own voice` : "In my own voice";
}

type Who = { id: string; firstName?: string } | null | undefined;
type People = { id: string; storyId?: string | null; userId?: string | null; givenName?: string | null }[];

/** Who is telling: the storyteller themself, or somebody remembering them (app-core teller.js). */
// (teller.js's destructured defaults read to TypeScript as `{ people?: never[] }`, hence the cast)
export const tellerOf = (story: Story, user: Who, people: People = []): Teller =>
  tellerFor({ story, user, people } as unknown as Parameters<typeof tellerFor>[0]);

/** Whose name goes on the clip: the person who spoke, as the phone writes it. */
export const speakerOf = (teller: Teller, user: Who) => String(user?.firstName || teller.storytellerName || "").trim() || "narrator";

/** The memory a recorded answer becomes, with its clip on it; saved whole by saveMemory. */
export function voiceMemory({
  memoryId,
  story,
  question,
  words,
  clip,
  teller,
}: {
  memoryId: string;
  story: Story;
  question: Prompt | null;
  words: string;
  clip: Clip;
  teller: Teller;
}): Memory {
  const body = words.trim();
  return createMemory({
    id: memoryId,
    title: voiceTitle({
      question: question?.question,
      name: teller.isStoryteller ? "" : story.name.split(/\s+/)[0],
      writer: teller.isStoryteller ? "" : teller.name || "Someone in the family",
    }),
    body,
    era: question?.era || "",
    status: "saved",
    // said, not written ("told" on the memory)
    via: "recorded",
    audio: [{ ...clip, transcript: body }],
    // the question as asked, with the deck's id, so it is not dealt again
    prompt: question ? { id: question.id, question: question.question } : null,
    teller,
  });
}
