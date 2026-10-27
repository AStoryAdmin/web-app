/**
 * Bringing in what's already written (/import), the web's half of the
 * phone's ImportScreen, ImportReviewScreen and FamilyImportScreen.
 *
 * The reading is the phone's own, from app-core: importers.js for exports
 * and pastes (diaries, notes, Facebook and Instagram JSON, CSV, WhatsApp),
 * memoir.js for a memoir by chapter (Word or text), gedcom.js for a family
 * tree. Nothing here decides what a memory is; it only gets the words out of
 * the file and the results into the database.
 *
 * What the web adds is the unzipping: a .docx and a WhatsApp export are zip
 * files, and the phone uses fflate for them. The browser can inflate on its
 * own (DecompressionStream), so a small reader for the zip's directory does
 * the rest without a dependency.
 *
 * Saving: memories go through createMemory and saveMemoryRow (memories.ts),
 * exactly as one written by hand. A tree goes in as the phone's does
 * (familyRows.js mergeImportedTree): everyone in the file joins the family,
 * nobody twice, and each person picked gets a story of their own.
 */
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";
import { uuid } from "../lib/uuid";
import { parseImport, parsePasted, detectFormat, markDuplicates } from "../app-core/lib/importers.js";
import { memoirKind, docxParagraphs, textParagraphs, splitMemoir, memoirLabel } from "../app-core/lib/memoir.js";
import { parseWhatsApp, whatsAppSenders } from "../app-core/lib/whatsapp.js";
import { isGedcom, parseGedcom, importPriorities } from "../app-core/lib/gedcom.js";
import { fullName } from "../app-core/lib/familyGraph.js";
import { mergeImportedTree, personToRow } from "../app-core/data/familyRows.js";
import { CATCH_ALL_CHAPTER } from "../app-core/data/eras.js";
import { writeDroppingMissing } from "../app-core/lib/saveErrors.js";
import { createMemory, newStory, saveMemoryRow, saveStory } from "./memories";
import { OPTIONAL_PEOPLE_COLUMNS, attachStory } from "./familyWrites";
import { linkPersonStory } from "./session";
import { foldName, type Edge, type Family, type Person } from "./family";
import type { Memory, Story } from "./stories";

/* ── What a read gives back ────────────────────────────────────────────── */

/** One memory found in a file, as importers.js and memoir.js shape it. */
export type ImportEntry = {
  id: string;
  title: string;
  body: string;
  year: number | null;
  month?: number | null;
  dateText: string;
  era: string;
  include: boolean;
  duplicate?: boolean;
  source?: string;
};

export type Sender = { name: string; count: number };

export type GedcomPerson = {
  id: string;
  externalRef: string;
  givenName: string;
  familyName: string;
  sex: string;
  birthYear: number | null;
  deathYear: number | null;
  source: string;
};

export type ImportedTree = {
  people: GedcomPerson[];
  edges: Edge[];
  truncated: boolean;
  stats: { people: number; families: number; living: number; remembered: number; withoutDates: number; skippedRedacted: number; source: string };
};

export type ReadResult =
  | { kind: "memories"; entries: ImportEntry[]; format: string; sourceName: string; truncated: boolean }
  | { kind: "senders"; text: string; fileName: string; senders: Sender[]; chosen: string[] }
  | { kind: "tree"; tree: ImportedTree; sourceName: string }
  | { kind: "nothing"; message: string };

const NOTHING = "We couldn’t find any writing in that. Try another file?";
const NO_TREE = "That looks like a family tree, but we couldn’t read anybody out of it.";

// A WhatsApp day that was only voice notes reads "Voice messages" (importers.js
// shapeEntries); the recordings themselves can't come in from a browser yet,
// so a day with nothing but those is left out rather than kept as two words.
const VOICE_ONLY = "Voice messages";

type StoryLike = Pick<Story, "name" | "birthYear"> & { memories?: Pick<Memory, "body" | "excerpt">[] };

function memoriesResult(raw: { entries: ImportEntry[]; format: string; truncated: boolean }, sourceName: string): ReadResult {
  const entries = raw.entries.filter((e) => e.body.trim() && e.body !== VOICE_ONLY);
  if (!entries.length) return { kind: "nothing", message: NOTHING };
  return { kind: "memories", entries, format: raw.format, sourceName, truncated: raw.truncated };
}

/* ── Reading ───────────────────────────────────────────────────────────── */

/**
 * The text of an export, a tree or a chat, read the phone's way: a family
 * tree is a file of PEOPLE and gets its own reader; a chat with several
 * people in it asks whose messages are the memories first (pass `senders`
 * once they have said); everything else is parseImport.
 */
export function readText(text: string, fileName: string, story: StoryLike | null, senders?: string[]): ReadResult {
  if (isGedcom(text, { name: fileName })) {
    const tree = parseGedcom(text) as ImportedTree;
    if (!tree.people.length) return { kind: "nothing", message: NO_TREE };
    return { kind: "tree", tree, sourceName: tree.stats.source || fileName || "your family tree" };
  }
  if (!senders && detectFormat(text, { name: fileName }) === "whatsapp") {
    const found = whatsAppSenders(parseWhatsApp(text)) as Sender[];
    if (found.length > 1) {
      // The storyteller's own messages when one of the names is theirs; otherwise whoever wrote the most.
      const name = foldName(story?.name);
      const theirs = found.find((s) => name && foldName(s.name).includes(name));
      return { kind: "senders", text, fileName, senders: found, chosen: [(theirs || found[0]).name] };
    }
  }
  const read = parseImport(text, { name: fileName }, { story, whatsappSenders: senders || [] }) as {
    entries: ImportEntry[];
    format: string;
    truncated: boolean;
  };
  return memoriesResult(read, fileName || "Your file");
}

/** Words pasted in one go: a blank line, or a line that opens with a date, starts the next memory. */
export function readPaste(text: string, story: StoryLike | null): ReadResult {
  if (!text.trim()) return { kind: "nothing", message: "Paste something in first." };
  if (isGedcom(text)) return readText(text, "", story);
  const read = parsePasted(text, { story }) as { entries: ImportEntry[]; format: string; truncated: boolean };
  return memoriesResult(read, "Pasted text");
}

/** A memoir by chapter, one memory each, marked as theirs ("From Hưng's memoir"). */
export function readMemoirParagraphs(paragraphs: { text: string; heading: number }[], story: StoryLike | null): ReadResult {
  // (memoir.js defaults story to null, so its inferred type is null alone)
  const entries = markDuplicates(splitMemoir(paragraphs, { story: story as null }), story?.memories || []) as ImportEntry[];
  return memoriesResult({ entries, format: "memoir", truncated: false }, memoirLabel(story?.name));
}

/**
 * A picked file. `asMemoir` is the "a memoir I wrote" way in: Word and text
 * are read by chapter. Without it, a Word file is still a memoir (nothing
 * else exports one), a .zip is looked into for a WhatsApp chat, and the rest
 * is read as text.
 */
export async function readImportFile(file: File, story: StoryLike | null, { asMemoir = false } = {}): Promise<ReadResult> {
  const name = file.name || "";
  const kind = memoirKind({ name, mimeType: file.type });
  if (kind === "pdf") return { kind: "nothing", message: "PDFs can’t be read here yet. Save it from Word or Google Docs as a .docx, and that works." };
  if (kind === "doc") return { kind: "nothing", message: "Older Word files (.doc) can’t be read. Open it in Word, save it as .docx, then choose it again." };
  if (kind === "image") return { kind: "nothing", message: "Photos of pages can’t be read here yet. A Word or text file works." };

  if (kind === "docx") {
    const xml = await unzipText(new Uint8Array(await file.arrayBuffer()), (n) => n === "word/document.xml");
    if (!xml) return { kind: "nothing", message: "That doesn’t look like a Word file we can open." };
    track("memoir_read", { kind: "docx" });
    return readMemoirParagraphs(docxParagraphs(xml), story);
  }

  if (/\.zip$/i.test(name) || file.type === "application/zip") {
    // A WhatsApp export with its media: only the chat itself is read.
    const text = await unzipText(new Uint8Array(await file.arrayBuffer()), (n) => /(^|\/)_chat\.txt$/i.test(n) || /whatsapp.*\.txt$/i.test(n));
    if (!text) {
      return {
        kind: "nothing",
        message: "We can read a WhatsApp chat from a .zip. For Facebook, Instagram or Day One, open the .zip and pick the file of posts or entries inside it.",
      };
    }
    return readText(text, name, story);
  }

  const text = await file.text();
  if (asMemoir && kind === "text" && !isGedcom(text, { name })) {
    track("memoir_read", { kind: "text" });
    return readMemoirParagraphs(textParagraphs(text), story);
  }
  return readText(text, name, story);
}

/* ── Zip, just enough of it ────────────────────────────────────────────── */

const u16 = (b: Uint8Array, at: number) => b[at] | (b[at + 1] << 8);
const u32 = (b: Uint8Array, at: number) => (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16) | (b[at + 3] << 24)) >>> 0;

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * The first file in a zip whose name passes `want`, as text; null when there
 * is none or the zip can't be read. Reads the central directory (the end of
 * the file), so it never walks the media a WhatsApp export carries. Stored
 * and deflated entries only, which is everything Word and WhatsApp write.
 */
export async function unzipText(bytes: Uint8Array, want: (name: string) => boolean): Promise<string | null> {
  // The end-of-directory record: 22 bytes, plus a comment of up to 64 KB.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (u32(bytes, i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const count = u16(bytes, end + 10);
  let at = u32(bytes, end + 16);
  const names = new TextDecoder();
  for (let n = 0; n < count && at + 46 <= bytes.length; n++) {
    if (u32(bytes, at) !== 0x02014b50) return null;
    const method = u16(bytes, at + 10);
    const size = u32(bytes, at + 20);
    const nameLen = u16(bytes, at + 28);
    const skip = nameLen + u16(bytes, at + 30) + u16(bytes, at + 32);
    const local = u32(bytes, at + 42);
    const name = names.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    at += 46 + skip;
    if (!want(name)) continue;
    if (u32(bytes, local) !== 0x04034b50) return null;
    const start = local + 30 + u16(bytes, local + 26) + u16(bytes, local + 28);
    const data = bytes.subarray(start, start + size);
    try {
      if (method === 0) return new TextDecoder().decode(data);
      if (method === 8) return new TextDecoder().decode(await inflateRaw(data));
    } catch (err) {
      console.warn("unzip:", (err as Error)?.message || err);
    }
    return null;
  }
  return null;
}

/* ── Keeping memories ──────────────────────────────────────────────────── */

/** The ticked entries as memories, the way ImportReviewScreen makes them: the family's to read, in the catch-all until dated. */
export function entriesToMemories(entries: ImportEntry[]): Memory[] {
  return entries
    .filter((e) => e.include)
    .map((e) =>
      createMemory({
        title: e.title?.trim() || "Untitled memory",
        body: e.body,
        era: e.era || CATCH_ALL_CHAPTER,
        period: e.dateText || (e.year ? String(e.year) : ""),
        privacy: "shared",
        status: "saved",
        ...(e.source ? { source: e.source } : {}),
      }),
    );
}

/**
 * Runs `work` over `items`, a few at a time, saying how many are done. On the
 * first failure no lane takes another item, and it throws only once every
 * lane has settled, so what was reported done is exactly what was written.
 */
export async function inTurn<T>(items: T[], work: (item: T) => Promise<void>, onProgress?: (done: number, item: T) => void, at = 4): Promise<void> {
  let next = 0;
  let done = 0;
  let failed = null as { err: unknown } | null;
  const lane = async () => {
    while (!failed && next < items.length) {
      const item = items[next++];
      try {
        await work(item);
      } catch (err) {
        failed ??= { err };
        return;
      }
      onProgress?.(++done, item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(at, items.length) }, lane));
  if (failed) throw failed.err;
}

/** Each memory's row, as one written by hand (a new memory has no photos or clips to write). Says which are in as it goes; throws on the first refusal. */
export async function saveImportedMemories(memories: Memory[], storyId: string, onProgress?: (done: number, memory: Memory) => void): Promise<void> {
  await inTurn(memories, (m) => saveMemoryRow(m, storyId), onProgress);
}

/* ── Keeping a family tree ─────────────────────────────────────────────── */

export type TreePlan = {
  /** New rows for the people table: everyone in the file not already in the family. */
  people: Person[];
  /** New relationships between them. */
  edges: Edge[];
  /** People picked for a story of their own (our ids), and whether their row is new. */
  starts: { person: Person; isNew: boolean }[];
  /** The storyteller found in the tree by name, to be tied to their story. */
  anchor: { personId: string; isNew: boolean } | null;
};

/** The person in the file who is the story's subject, by name; null when nobody matches. */
export function findAnchor(tree: ImportedTree, story: Pick<Story, "name" | "lastName"> | null): string | null {
  if (!story?.name) return null;
  const want = foldName(`${story.name} ${story.lastName || ""}`);
  return tree.people.find((p) => foldName(fullName(p)) === want)?.id ?? null;
}

/** Who in the file can still be asked (oldest first), and who is within living memory. */
export function treePriorities(tree: ImportedTree): { living: (GedcomPerson & { age: number })[]; remembered: (GedcomPerson & { diedAgo: number })[] } {
  return importPriorities(tree);
}

/**
 * The phone's FamilyImportScreen keep(), as a plan: the tree folded into the
 * family already here (an earlier import of the same file adds nobody twice),
 * the storyteller found in it tied to their story when that story isn't tied
 * to anybody yet, and the people picked (by their ids in the file) each
 * marked for a story of their own.
 */
export function planTreeImport(
  family: Family | null,
  tree: ImportedTree,
  { story = null, chosen = [], newId = uuid }: { story?: Pick<Story, "id" | "name" | "lastName"> | null; chosen?: string[]; newId?: () => string } = {},
): TreePlan {
  const before = family?.people ?? [];
  const merged = mergeImportedTree({ people: before, edges: family?.edges ?? [] }, tree, newId) as {
    family: { people: Person[]; edges: Edge[] };
    idFor: Map<string, string>;
  };
  const people = merged.family.people.slice(before.length);
  const edges = merged.family.edges.slice((family?.edges ?? []).length);
  const isNew = new Set(people.map((p) => p.id));
  const byId = new Map(merged.family.people.map((p) => [p.id, p]));

  let anchor: TreePlan["anchor"] = null;
  const fileAnchor = findAnchor(tree, story);
  const storyTaken = !!story && before.some((p) => p.storyId === story.id);
  if (story && fileAnchor && !storyTaken) {
    const ours = byId.get(merged.idFor.get(fileAnchor) || "");
    if (ours && !ours.storyId) anchor = { personId: ours.id, isNew: isNew.has(ours.id) };
  }

  const starts: TreePlan["starts"] = [];
  for (const fileId of chosen) {
    const person = byId.get(merged.idFor.get(fileId) || "");
    if (!person || person.storyId || person.id === anchor?.personId) continue;
    if (starts.some((s) => s.person.id === person.id)) continue;
    starts.push({ person, isNew: isNew.has(person.id) });
  }
  return { people, edges, starts, anchor };
}

const CHUNK = 200;

type Row = Record<string, unknown>;

/**
 * Writes a tree plan: everyone new in chunks, then their relationships, and
 * only then a story for each person picked, tied to them through
 * link_person_story. Stories go last so a failed chunk leaves none behind:
 * on a retry the people already in are matched rather than re-added, and
 * anybody tied to a story by then is not picked again. The storyteller's own
 * story exists already, so their row carries it from the start. Returns the
 * stories it started.
 */
export async function saveTreeImport(
  plan: TreePlan,
  { userId, householdId, story }: { userId: string; householdId: string; story: Story | null },
  onProgress?: (done: number, total: number) => void,
): Promise<Story[]> {
  const sb = supabase();
  const total = plan.people.length + plan.edges.length + plan.starts.length;
  let done = 0;
  const step = (n: number) => onProgress?.((done += n), total);

  const anchorId = story && plan.anchor ? plan.anchor.personId : null;
  const rows = plan.people.map((p) => personToRow({ ...p, ...(p.id === anchorId ? { storyId: story!.id } : {}) }, householdId) as Row);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await writeDroppingMissing(chunk, (r: Row[]) => sb.from("people").upsert(r, { onConflict: "id" }), OPTIONAL_PEOPLE_COLUMNS, OPTIONAL_PEOPLE_COLUMNS.length);
    step(chunk.length);
  }

  const edgeRows = plan.edges.map((e) => ({ household_id: householdId, from_person: e.from, to_person: e.to, kind: e.kind, label: e.label || "" }));
  for (let i = 0; i < edgeRows.length; i += CHUNK) {
    const chunk = edgeRows.slice(i, i + CHUNK);
    const { error } = await sb.from("relationships").upsert(chunk, { onConflict: "from_person,to_person,kind", ignoreDuplicates: true });
    if (error) throw error;
    step(chunk.length);
  }

  // Somebody already in the family (an earlier import) is the storyteller now.
  if (story && plan.anchor && !plan.anchor.isNew) await tie(plan.anchor.personId, story.id);

  const started: Story[] = [];
  for (const { person } of plan.starts) {
    const made = newStory({
      ownerId: userId,
      name: person.givenName || "",
      lastName: person.familyName || "",
      // the phone's word for a story started from a tree, until somebody says more
      relationship: "Relative",
      birthYear: person.birthYear ? String(person.birthYear) : "",
    });
    await saveStory(made, userId, { isNew: true });
    await attachStory(made.id, householdId);
    started.push({ ...made, householdId });
    await tie(person.id, made.id);
    step(1);
  }
  return started;
}

async function tie(personId: string, storyId: string): Promise<void> {
  try {
    await linkPersonStory(personId, storyId);
  } catch (err) {
    // the story is kept either way; the tie can be made from the Family page
    console.warn("link_person_story:", (err as Error)?.message || err);
  }
}
