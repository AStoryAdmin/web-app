/**
 * A fictional family for looking at the tree with more than three people:
 * four generations, a second marriage, late parents, two invited, three
 * listed, a friend not placed yet. Dev-only (`/family?preview=tree`),
 * built on the client, never written anywhere.
 */
import type { Family, Person } from "../../../data/family";
import type { Memory, Story } from "../../../data/stories";

const ME = "sample-user-daniel";
const STORY = "sample-story-rose";

type Seed = { id: string; given: string; family: string; sex?: "M" | "F"; born?: number; died?: number; photo?: string; state?: "active" | "invited" | "listed"; me?: boolean };

const SEED: Seed[] = [
  { id: "walter", given: "Walter", family: "Carey", sex: "M", born: 1912, died: 1979, photo: "/photos/27-1200.webp" },
  { id: "edith", given: "Edith", family: "Carey", sex: "F", born: 1915, died: 2001, photo: "/photos/31-1200.webp" },
  { id: "rose", given: "Rose", family: "Hartley", sex: "F", born: 1941, photo: "/photos/33-1200.webp", state: "active" },
  { id: "frank", given: "Frank", family: "Hartley", sex: "M", born: 1938, died: 1998, photo: "/photos/02-1200.webp" },
  { id: "tom", given: "Tom", family: "Whitfield", sex: "M", born: 1944, state: "listed" },
  { id: "peggy", given: "Margaret", family: "Doyle", sex: "F", born: 1944, state: "invited" },
  { id: "jim", given: "Jim", family: "Doyle", sex: "M", born: 1940, state: "active" },
  { id: "arthur", given: "Arthur", family: "Carey", sex: "M", born: 1947, state: "active" },
  { id: "daniel", given: "Daniel", family: "Hartley", sex: "M", born: 1966, state: "active", me: true },
  { id: "anne", given: "Anne", family: "Keller", sex: "F", born: 1969, state: "invited" },
  { id: "mark", given: "Mark", family: "Keller", sex: "M", born: 1967, state: "listed" },
  { id: "claire", given: "Claire", family: "Doyle", sex: "F", born: 1972, state: "active" },
  { id: "maya", given: "Maya", family: "Hartley", sex: "F", born: 1998, state: "active" },
  { id: "leo", given: "Leo", family: "Hartley", sex: "M", born: 2002, state: "listed" },
  { id: "sam", given: "Sam", family: "Keller", sex: "M", born: 2001, state: "active" },
  { id: "nora", given: "Nora", family: "Pell", sex: "F", born: 1943, state: "listed" },
];

const edge = (from: string, to: string, kind: "parent" | "spouse") => ({ from, to, kind, label: "" });

const EDGES = [
  edge("walter", "edith", "spouse"),
  edge("walter", "rose", "parent"), edge("edith", "rose", "parent"),
  edge("walter", "peggy", "parent"), edge("edith", "peggy", "parent"),
  edge("walter", "arthur", "parent"), edge("edith", "arthur", "parent"),
  edge("rose", "frank", "spouse"), edge("rose", "tom", "spouse"),
  edge("peggy", "jim", "spouse"),
  edge("rose", "daniel", "parent"), edge("frank", "daniel", "parent"),
  edge("rose", "anne", "parent"), edge("frank", "anne", "parent"),
  edge("anne", "mark", "spouse"),
  edge("peggy", "claire", "parent"), edge("jim", "claire", "parent"),
  edge("daniel", "maya", "parent"), edge("daniel", "leo", "parent"),
  edge("anne", "sam", "parent"), edge("mark", "sam", "parent"),
];

function person(s: Seed): Person {
  return {
    id: `sample-${s.id}`,
    householdId: "sample-household",
    givenName: s.given,
    familyName: s.family,
    sex: s.sex || "",
    source: "manual",
    createdAt: "2026-09-01T00:00:00Z",
    ...(s.born ? { birthYear: s.born } : {}),
    ...(s.died ? { deathYear: s.died } : {}),
    ...(s.photo ? { photo: s.photo } : {}),
    ...(s.id === "rose" ? { storyId: STORY } : {}),
    ...(s.state === "active" ? { userId: s.me ? ME : `sample-user-${s.id}` } : {}),
    ...(s.state === "invited" ? { invitedAt: "2026-10-01T00:00:00Z", email: `${s.id}@example.com` } : {}),
  } as Person;
}

const memory = (i: number, o: Partial<Memory>): Memory =>
  ({ id: `sample-memory-${i}`, title: "", body: "", excerpt: "", era: "", period: "", rating: 0, ratingNote: "", privacy: "shared", status: "saved", photos: [], cover: null, audio: [], color: "", contributor: "", authorPersonId: null, createdBy: null, familyCallId: null, createdAt: "2026-09-10T00:00:00Z", ...o }) as Memory;

export function sampleFamily(): { family: Family; story: Story; meId: string } {
  const people = SEED.map(person);
  const id = (k: string) => `sample-${k}`;
  const edges = EDGES.map((e) => ({ ...e, from: id(e.from), to: id(e.to) }));
  const memories: Memory[] = [
    ...Array.from({ length: 5 }, (_, i) => memory(i, { familyCallId: `call-${i}`, personIds: i < 2 ? [id("frank")] : i === 2 ? [id("edith"), id("walter")] : [] })),
    ...Array.from({ length: 3 }, (_, i) => memory(10 + i, { personIds: i === 0 ? [id("peggy")] : [] })),
    memory(20, { contributor: "Daniel Hartley", authorPersonId: id("daniel"), personIds: [id("rose")] }),
    memory(21, { contributor: "Daniel Hartley", authorPersonId: id("daniel") }),
    memory(22, { contributor: "Arthur Carey", authorPersonId: id("arthur"), personIds: [id("walter")] }),
    memory(23, { contributor: "Claire Doyle", authorPersonId: id("claire") }),
  ];
  const story = {
    id: STORY,
    ownerId: ME,
    householdId: "sample-household",
    name: "Rose",
    lastName: "Hartley",
    relationship: "Mother",
    relationshipOther: "",
    nickname: "",
    directory: null,
    birthDay: "",
    birthMonth: "",
    birthYear: "1941",
    hasAccount: null,
    connectedEmail: "",
    photo: "/photos/33-1200.webp",
    bookDesign: null,
    callStyle: null,
    cover: null,
    intro: "",
    isPublic: false,
    publicSlug: null,
    contributionsOpen: false,
    contributeSlug: null,
    memories,
    sessionsCompleted: 5,
    streakDays: 0,
    lastMemoryDate: "",
    doneTopicsToday: { date: "", eras: [] },
    createdAt: "2026-09-01T00:00:00Z",
  } as Story;
  return { family: { people, edges, households: [{ id: "sample-household", createdBy: ME, admins: [] }] }, story, meId: ME };
}
