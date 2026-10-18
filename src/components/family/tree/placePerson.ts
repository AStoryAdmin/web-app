/**
 * Putting somebody who is already in the family into the tree: one edge to
 * the person they were dropped on (or the storyteller), in the same terms
 * the app stores (parent and spouse edges, docs/PRD.md §3.3a). A sibling
 * shares the anchor’s parents; an anchor with none gets a placeholder
 * parent first, exactly as planRelative does for a new person.
 */
import type { Family, Person } from "../../../data/family";
import { newPerson, saveEdge, savePerson } from "../../../data/familyWrites";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import { PLACEHOLDER } from "../../../app-core/lib/familyTree.js";
import { firstName } from "../familyView";
import type { GhostKind } from "./treeModel";

type Index = ReturnType<typeof buildIndex>;

export async function placePerson(o: { family: Family; person: Person; anchor: Person; kind: GhostKind; householdId: string }): Promise<void> {
  const { person, anchor, kind, householdId } = o;
  if (person.id === anchor.id) throw new Error("That’s the same person.");
  const index = buildIndex(o.family) as Index;
  const parentsOf = (id: string) => (index.parentsOf.get(id) || []) as string[];
  if (kind === "parent") {
    if (parentsOf(anchor.id).length >= 2) throw new Error(`${firstName(anchor)} already has two parents in the tree.`);
    if (parentsOf(person.id).includes(anchor.id)) throw new Error(`${firstName(anchor)} is already ${firstName(person)}’s parent.`);
    await saveEdge(householdId, person.id, anchor.id, "parent");
    return;
  }
  if (kind === "child") {
    if (parentsOf(person.id).length >= 2) throw new Error(`${firstName(person)} already has two parents in the tree.`);
    await saveEdge(householdId, anchor.id, person.id, "parent");
    return;
  }
  if (kind === "spouse") {
    await saveEdge(householdId, anchor.id, person.id, "spouse");
    return;
  }
  // sibling: the anchor’s parents become theirs
  if (parentsOf(person.id).length) throw new Error(`${firstName(person)} already has parents in the tree.`);
  let parents = parentsOf(anchor.id);
  if (!parents.length) {
    const held = { ...newPerson({ givenName: "" }), source: PLACEHOLDER } as Person;
    await savePerson(held, householdId);
    await saveEdge(householdId, held.id, anchor.id, "parent");
    parents = [held.id];
  }
  for (const pid of parents) await saveEdge(householdId, pid, person.id, "parent");
}
