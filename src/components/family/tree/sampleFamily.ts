/**
 * A fictional family for looking at the tree with more than three people:
 * four generations, a second marriage, late parents, two invited, three
 * listed, a friend not placed yet, a dozen memories with their words and
 * photographs, and three lines the family sent. Dev-only
 * (`/family?preview=tree`, `/family/sample-rose?preview=tree`), built on
 * the client, never written anywhere, labelled as a sample on the page.
 * The portraits and scenes are the mockup crops of the founder's master
 * library (docs/mockups/tree/img); four people have none, so the seal shows.
 */
import type { Family, Person } from "../../../data/family";
import type { Memory, Story } from "../../../data/stories";

const IMG = import.meta.glob<string>("../../../../docs/mockups/tree/img/*.webp", { eager: true, query: "?url", import: "default" });
const img = (name: string) => IMG[`../../../../docs/mockups/tree/img/${name}.webp`] || "";

const ME = "sample-user-daniel";
const STORY = "sample-story-rose";

type Seed = { id: string; given: string; family: string; sex?: "M" | "F"; born?: number; died?: number; photo?: string; state?: "active" | "invited" | "listed"; me?: boolean };

const SEED: Seed[] = [
  { id: "walter", given: "Walter", family: "Carey", sex: "M", born: 1912, died: 1979, photo: img("p-walter") },
  { id: "edith", given: "Edith", family: "Carey", sex: "F", born: 1915, died: 2001, photo: img("p-edith") },
  { id: "rose", given: "Rose", family: "Hartley", sex: "F", born: 1941, photo: img("p-rose"), state: "active" },
  { id: "frank", given: "Frank", family: "Hartley", sex: "M", born: 1938, died: 1998, photo: img("p-frank") },
  { id: "tom", given: "Tom", family: "Whitfield", sex: "M", born: 1944, state: "listed" },
  { id: "peggy", given: "Margaret", family: "Doyle", sex: "F", born: 1944, photo: img("p-peggy"), state: "invited" },
  { id: "jim", given: "Jim", family: "Doyle", sex: "M", born: 1940, photo: img("p-jim"), state: "active" },
  { id: "arthur", given: "Arthur", family: "Carey", sex: "M", born: 1947, photo: img("p-arthur"), state: "active" },
  { id: "daniel", given: "Daniel", family: "Hartley", sex: "M", born: 1966, photo: img("p-daniel"), state: "active", me: true },
  { id: "anne", given: "Anne", family: "Keller", sex: "F", born: 1969, photo: img("p-anne"), state: "invited" },
  { id: "mark", given: "Mark", family: "Keller", sex: "M", born: 1967, state: "listed" },
  { id: "claire", given: "Claire", family: "Doyle", sex: "F", born: 1972, photo: img("p-claire"), state: "active" },
  { id: "maya", given: "Maya", family: "Hartley", sex: "F", born: 1998, photo: img("p-maya"), state: "active" },
  { id: "leo", given: "Leo", family: "Hartley", sex: "M", born: 2002, state: "listed" },
  { id: "sam", given: "Sam", family: "Keller", sex: "M", born: 2001, photo: img("p-sam"), state: "active" },
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
  ({ id: `sample-memory-${i}`, title: "", body: "", excerpt: "", era: "", period: "", rating: 0, ratingNote: "", privacy: "shared", status: "saved", photos: [], cover: null, audio: [], color: "", contributor: "", authorPersonId: null, createdBy: null, familyCallId: null, createdAt: `2026-09-${String(10 + (i % 18)).padStart(2, "0")}T00:00:00Z`, ...o }) as Memory;

export function sampleFamily(): { family: Family; story: Story; meId: string } {
  const people = SEED.map(person);
  const id = (k: string) => `sample-${k}`;
  const edges = EDGES.map((e) => ({ ...e, from: id(e.from), to: id(e.to) }));
  const memories: Memory[] = [
    memory(1, { title: "The porch on Elm Street", period: "1952", era: "Childhood", photos: [img("porch-1952")], personIds: [id("walter"), id("edith")], body: "Dad would stand in the doorway like he was deciding whether to come out at all. Mother said he was letting the flies in." }),
    memory(2, { title: "Washing day", period: "1956", era: "Childhood", photos: [img("laundry-1956")], personIds: [id("edith"), id("peggy")], familyCallId: "call-2", body: "Mother hung the sheets so the neighbours could see how white they were. Margaret and I had to hold the pegs." }),
    memory(3, { title: "The day we were married", period: "June 1961", era: "Love", photos: [img("wedding-1961")], personIds: [id("frank"), id("arthur")], body: "We had the cake on a card table because the proper one wouldn't fit through the door. Nobody minded. Frank's mother cried through the whole first dance." }),
    memory(4, { title: "Card nights", period: "1962", era: "Home", photos: [img("cards-1962")], personIds: [id("frank"), id("jim")], familyCallId: "call-4", body: "Frank cheated and everyone knew and nobody said. Jim kept the score on the back of the gas bill." }),
    memory(5, { title: "After the picnic", period: "1964", era: "Family", photos: [img("picnic-1964")], personIds: [id("walter"), id("edith"), id("tom")], body: "That was the summer Daniel was on the way and I couldn't sit on the grass, so Dad carried a kitchen chair all the way down to the lake." }),
    memory(6, { title: "The first house", period: "1973", era: "Home", photos: [img("house-1973")], personIds: [id("frank"), id("daniel"), id("anne")], body: "We moved in with a station wagon and three trips. Anne slept in a drawer the first night because the cot was still in the car." }),
    memory(7, { title: "Sunday dinner, the long version", period: "1980", era: "Family", photos: [img("dinner-1980")], personIds: [id("arthur"), id("peggy"), id("claire")], familyCallId: "call-7", body: "He told the one about the goat every single Sunday and it got longer every time." }),
    memory(8, { title: "The phone in the hall", period: "1981", era: "Home", photos: [img("phone-1981")], personIds: [id("anne")], body: "Anne could talk for an hour standing on one leg. The cord reached the third stair and not one step further." }),
    memory(9, { title: "The box from the attic", period: "2022", era: "Family", photos: [img("oldphotos-2022")], personIds: [id("daniel"), id("anne")], familyCallId: "call-9", body: "They found the wedding ones and rang me to ask who everybody was. Half of them I had to guess." }),
    memory(10, { title: "Today", period: "2026", era: "Family", photos: [img("conversation-2026")], personIds: [id("daniel")], body: "I'll tell you about the goat if you've got all afternoon." }),
    memory(20, { title: "The card table", period: "1961", era: "Love", contributor: "Daniel Hartley", authorPersonId: id("daniel"), personIds: [id("rose")], body: "Mum still has the card table. It's in the garage under the paint tins, and she won't let anyone throw it out." }),
    memory(22, { title: "Carrying the cake", period: "1961", era: "Love", contributor: "Arthur Carey", authorPersonId: id("arthur"), personIds: [id("walter")], body: "I carried that cake from the car. It was heavier than it looked, and I was fourteen and terrified." }),
    memory(23, { title: "The waltz", period: "1990", era: "Family", contributor: "Claire Doyle", authorPersonId: id("claire"), personIds: [id("rose")], body: "Aunt Rose taught me the waltz in her kitchen, for my own wedding, with the radio turned right up." }),
  ];  const story = {
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
    photo: img("p-rose"),
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
