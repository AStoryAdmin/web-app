/**
 * The family tree: people, how they are related, and the household (tree)
 * they belong to. Read side, mirroring phone-app/src/data/family.js
 * loadFamily(); the row mappers are the app's own (app-core/data/familyRows.js).
 *
 * Row-level security lets anyone on one of a household's stories read and
 * add to its tree, which is what lets co-managers see the same people.
 */
import { supabase } from "../lib/supabase";
import { rowToPerson, rowToEdge } from "../app-core/data/familyRows.js";

export type Person = ReturnType<typeof rowToPerson>;
export type Edge = ReturnType<typeof rowToEdge>;

export type Household = { id: string; createdBy: string | null; admins: string[] };

export type Family = { people: Person[]; edges: Edge[]; households: Household[] };

// The table isn't there: family.sql hasn't been run on this database.
const missingTable = (e: { code?: string } | null) => !!e && ["42P01", "PGRST205"].includes(e.code || "");

/** Null when the family tables are absent, so the Family page keeps its empty state. */
export async function loadFamily(): Promise<Family | null> {
  const sb = supabase();
  const [people, edges, households, admins] = await Promise.all([
    sb.from("people").select("*").order("created_at", { ascending: true }),
    sb.from("relationships").select("*"),
    sb.from("households").select("id, created_by"),
    // A database without tree_admins.sql answers with an error; the organizer alone is admin.
    sb.from("household_admins").select("household_id, user_id"),
  ]);
  const err = people.error || edges.error;
  if (err) {
    if (!missingTable(err)) console.warn("loadFamily:", err.message || err);
    return null;
  }
  type AdminRow = { household_id: string; user_id: string };
  const adminRows = (admins.data || []) as AdminRow[];
  return {
    people: (people.data || []).map(rowToPerson),
    edges: (edges.data || []).map(rowToEdge),
    households: ((households.data || []) as { id: string; created_by: string | null }[]).map((h) => ({
      id: h.id,
      createdBy: h.created_by || null,
      admins: adminRows.filter((a) => a.household_id === h.id).map((a) => a.user_id),
    })),
  };
}
