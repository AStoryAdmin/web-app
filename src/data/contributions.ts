/**
 * What the family sent: memories, notes and photographs waiting for a
 * keeper's review. Mirrors phone-app/src/data/contributions.js.
 *
 * Two ways in, both landing as 'pending':
 * - signed in (a keeper, or a relative in the tree): a direct insert, which
 *   contributions_insert_member / contributions_insert_household allow;
 * - no account, from /c/:slug: the submit_contribution() RPC (an anonymous
 *   visitor has no insert policy of their own).
 *
 * Approving a memory lands it in the archive under its sender's name. The
 * memory takes the contribution's own id, so approving twice (a retry, two
 * keepers) lands on the same row. The contribution is marked approved only
 * after the memory has reached the server.
 */
import { supabase } from "../lib/supabase";
import { writeDroppingMissing } from "../app-core/lib/saveErrors.js";
import { yearFromText } from "../app-core/lib/spokenDate.js";
import { FAMILY_CHAPTER } from "../app-core/data/eras.js";
import { newMemory } from "./memories";
import type { Memory, Story } from "./stories";

export type Contribution = {
  id: string;
  kind: "testimonial" | "memory" | string;
  contributorName: string;
  relationship: string;
  title: string;
  body: string;
  photos: string[];
  /** Set when it is context for one memory; null when it stands alone. */
  memoryId: string | null;
  contributorEmail: string;
  personId: string | null;
  personIds: string[] | null;
  via: string | null;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string;
};

type Row = Record<string, unknown>;

export function rowToContribution(row: Row): Contribution {
  return {
    id: row.id as string,
    kind: (row.kind as string) || "testimonial",
    contributorName: (row.contributor_name as string) || "",
    relationship: (row.relationship as string) || "",
    title: (row.title as string) || "",
    body: (row.body as string) || "",
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    memoryId: (row.memory_id as string) || null,
    contributorEmail: (row.contributor_email as string) || "",
    personId: (row.person_id as string) || null,
    personIds: Array.isArray(row.person_ids) ? (row.person_ids as string[]) : null,
    via: (row.via as string) || null,
    status: (row.status as string) || "pending",
    createdAt: row.created_at as string,
  };
}

/**
 * What the family sent for a story. Throws when the server can't be reached, so a page can say so instead of
 * showing an empty list (the Family and person pages); listContributions below keeps the old quiet behaviour.
 */
export async function fetchContributions(storyId: string, status?: Contribution["status"] | Contribution["status"][]): Promise<Contribution[]> {
  let q = supabase().from("contributions").select("*").eq("story_id", storyId).order("created_at", { ascending: false });
  if (Array.isArray(status)) q = q.in("status", status);
  else if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) {
    console.warn("listContributions:", error.message);
    throw error;
  }
  return (data || []).map(rowToContribution);
}

/** The same, empty on a failure: for places where nothing is better than a message. */
export async function listContributions(storyId: string, status?: Contribution["status"] | Contribution["status"][]): Promise<Contribution[]> {
  return fetchContributions(storyId, status).catch(() => []);
}

export async function countPending(storyId: string): Promise<number> {
  const { count, error } = await supabase().from("contributions").select("id", { count: "exact", head: true }).eq("story_id", storyId).eq("status", "pending");
  if (error) return 0;
  return count || 0;
}

/**
 * A signed-in relative's memory or note for a story. Inserted without
 * reading the row back: a relative who is not a keeper cannot read the
 * story's contributions, and asking would turn a success into an error.
 */
export async function sendContribution(input: {
  storyId: string;
  contributorName: string;
  relationship: string;
  title?: string;
  body: string;
  photos?: string[];
  personIds?: string[];
  /** Their side of one memory they read; it goes under that memory, not as its own. */
  memoryId?: string | null;
}): Promise<void> {
  const text = input.body.trim();
  if (!text) throw new Error("Write what you remember first.");
  const sb = supabase();
  await writeDroppingMissing(
    {
      story_id: input.storyId,
      kind: input.memoryId ? "testimonial" : "memory",
      ...(input.memoryId ? { memory_id: input.memoryId } : {}),
      contributor_name: input.contributorName.slice(0, 120),
      relationship: input.relationship.slice(0, 120),
      title: (input.title || "").slice(0, 200),
      body: text.slice(0, 10000),
      photos: input.photos || [],
      status: "pending",
      via: "web",
      ...(Array.isArray(input.personIds) ? { person_ids: input.personIds } : {}),
    },
    (row: Row | Row[]) => sb.from("contributions").insert(row),
    ["person_ids", "via"],
  );
}

/** Anyone with the link, no account: submit_contribution(slug, …). */
export async function submitAnonymous(input: {
  slug: string;
  contributorName: string;
  relationship: string;
  kind: "memory" | "testimonial";
  title?: string;
  body: string;
  photos?: string[];
  contributorEmail?: string;
}): Promise<boolean> {
  const { data, error } = await supabase().rpc("submit_contribution", {
    slug: input.slug,
    contributor_name: input.contributorName,
    relationship: input.relationship,
    kind: input.kind,
    title: input.title || "",
    body: input.body,
    photos: input.photos || [],
    contributor_email: (input.contributorEmail || "").trim().toLowerCase() || null,
  });
  if (error) throw error;
  return Boolean(data);
}

async function setStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  const sb = supabase();
  const { data: { session } } = await sb.auth.getSession();
  const { data, error } = await sb
    .from("contributions")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: session?.user?.id || null })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  // Row-level security answers a refused update with no error and no rows.
  if (!data?.length) throw new Error("That contribution couldn't be changed from this account.");
}

export const approveContribution = (id: string) => setStatus(id, "approved");
export const rejectContribution = (id: string) => setStatus(id, "rejected");

/**
 * The memory an approved 'memory' contribution becomes: in "From the
 * family", dated from its own words when it can be, credited to its sender
 * ("Linda, her daughter" is what a book prints). The caller saves it with
 * saveMemory, then calls approveContribution; that order means a dropped
 * connection can never leave it approved and in nobody's archive.
 */
export function memoryFromContribution(item: Contribution, story: Story): Memory {
  const who = item.contributorName || "family";
  const text = [item.title, item.body].filter(Boolean).join("\n");
  const dated = yearFromText(text, story) as { year: number } | null;
  const mem = newMemory({
    id: item.id,
    title: item.title?.trim() || `A memory shared by ${who}`,
    body: item.body || "",
    excerpt: (item.body || "").slice(0, 200),
    era: FAMILY_CHAPTER,
    period: dated ? String(dated.year) : "",
    privacy: "shared",
    status: "saved",
    contributor: [item.contributorName, item.relationship].map((s) => (s || "").trim()).filter(Boolean).join(", "),
    authorPersonId: item.personId || null,
    photos: item.photos || [],
    ...(Array.isArray(item.personIds) ? { personIds: item.personIds } : {}),
  });
  return mem;
}
