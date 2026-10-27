/**
 * M7, desktop extras after the first book (docs/overnight/AUDIT.md §4, gap rows 20-22, 25, 31, 32, 35 and 50), against
 * the in-memory Supabase: /import reads pasted writing, a WhatsApp export, a memoir (.txt and .docx) and a GEDCOM
 * tree with the app-core readers, shows what it found and keeps the ticked ones as the phone's ImportReviewScreen and
 * FamilyImportScreen do; the Archive has a calendar with birthdays, remembrances, anniversaries and dated memories
 * (ArchiveCalendarScreen); /family prints the tree on one sheet and lets an admin make another admin; a story merge
 * the other owner asked for is put together and undone, or declined (sameStory.js); /friend/:token opens the phone's
 * friend link and sends what a friend remembers to the keeper; and a memory's page asks someone to add their side
 * with the memory's own link (memoryLinks.js), shown with a QR and copied, never emailed.
 *
 * Every screen is photographed at both widths into docs/overnight/shots/M7/ and held to the floor and the copy rules
 * (e2e/support/screen.ts).
 *   npx playwright test --config playwright.config.ts e2e/flow/m7.spec.ts
 */
import { expect, test, type Page } from "@playwright/test";
import { fixtures, id, mockSupabase, type MockSupabase, type MockUser, type Row } from "../support/mockSupabase";
import { bigEnough, checkCopy, checkFloor, shot } from "../support/screen";

const SHOTS = "docs/overnight/shots/M7";

/** Look, check, photograph. */
async function screen(page: Page, name: string) {
  await checkCopy(page, name);
  await checkFloor(page, name);
  await shot(page, SHOTS, name);
}

/** What the page last put on the clipboard. */
const clipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

/** Nothing left the machine, and no edge function (the ones that send email) was called. */
function nothingSent(mock: MockSupabase) {
  expect(mock.blocked, "requests that left the machine").toEqual([]);
  expect(mock.sent("/functions/v1/").map((c) => c.path), "edge functions called (email goes through these)").toEqual([]);
}

/**
 * Sam keeps his mother Rose's story, in one family tree with Jamie (Sam's daughter, who has an account). Sam started
 * the tree, so he is its admin.
 */
async function rosesFamily(page: Page) {
  const mock = await mockSupabase(page);
  const sam = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Hartley" });
  const jamieUser = mock.addUser({ email: "jamie@example.com", firstName: "Jamie", lastName: "Hartley" });
  const household = id("b");
  const [story] = mock.insert("stories", fixtures.story(sam.id, { household_id: household }));
  mock.insert("households", { id: household, created_by: sam.id });
  const rose = fixtures.person(household, { given_name: "Rose", family_name: "Hartley", sex: "F", story_id: story.id, birth_year: 1945, birth_day: 14, birth_month: 10 });
  const walter = fixtures.person(household, { given_name: "Walter", family_name: "Hartley", sex: "M", birth_year: 1940, death_year: 2001, death_day: 3, death_month: 10 });
  const me = fixtures.person(household, { given_name: "Sam", family_name: "Hartley", sex: "M", user_id: sam.id, birth_year: 1970 });
  const jamie = fixtures.person(household, { given_name: "Jamie", family_name: "Hartley", sex: "F", user_id: jamieUser.id, birth_year: 1998 });
  mock.insert("people", rose, walter, me, jamie);
  mock.insert(
    "relationships",
    { id: id("r"), household_id: household, from_person: walter.id, to_person: rose.id, kind: "spouse" },
    { id: id("r"), household_id: household, from_person: rose.id, to_person: me.id, kind: "parent" },
    { id: id("r"), household_id: household, from_person: me.id, to_person: jamie.id, kind: "parent" },
  );
  const [memory] = mock.insert("memories", fixtures.memory(String(story.id)));
  Object.assign(mock.tables.profiles.find((p) => p.id === sam.id)!, { active_story_id: story.id, onboarding_complete: true });
  await mock.signedIn(page, sam);
  return { mock, sam, jamieUser, household, story, memory, rose, walter, me, jamie };
}

const memoriesOf = (mock: MockSupabase, storyId: unknown) => (mock.tables.memories ?? []).filter((m) => m.story_id === storyId);

/* ── A Word file, made here: a zip holding word/document.xml (stored, as unzipText reads it) ── */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zipStored(files: { name: string; data: string }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name);
    const data = Buffer.from(f.data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const para = (text: string, style = "") =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

const DOCX = zipStored([
  { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>` },
  {
    name: "word/document.xml",
    data:
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>` +
      para("The Farm on Miller Road", "Heading1") +
      para("We grew up on forty acres outside Dayton. Father kept bees, and the honey went to church on Sundays.") +
      para("Leaving for the City", "Heading1") +
      para("In 1963 I took the bus to Columbus with one suitcase and a letter from Aunt May.") +
      `</w:body></w:document>`,
  },
]);

const MEMOIR_TXT = `CHAPTER ONE: THE FARM

We grew up on forty acres outside Dayton. Father kept bees, and the honey went to church on Sundays.

CHAPTER TWO: LEAVING

In 1963 I took the bus to Columbus with one suitcase and a letter from Aunt May.
`;

const WHATSAPP = `[14/03/2021, 09:15:03] Rose Hartley: Good morning love. The pear tree is full of blossom today, the way it was the spring you were born.
[14/03/2021, 09:20:11] Sam Hartley: Tell me more about that spring!
[02/05/2021, 18:02:45] Rose Hartley: Your grandfather built the back fence by hand in 1958, with wood from the old barn on Miller Road.
`;

const GEDCOM = `0 HEAD
1 SOUR Ancestry.com
1 GEDC
2 VERS 5.5.1
1 CHAR UTF-8
0 @I1@ INDI
1 NAME Rose /Hartley/
1 SEX F
1 BIRT
2 DATE 14 OCT 1945
0 @I2@ INDI
1 NAME Walter /Hartley/
1 SEX M
1 BIRT
2 DATE 1940
1 DEAT
2 DATE 2001
0 @I3@ INDI
1 NAME Ellen /Hartley/
1 SEX F
1 BIRT
2 DATE 3 JUN 1968
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I1@
1 CHIL @I3@
0 TRLR
`;

/** /import, with nothing in the family yet (only the household the story sits in). */
async function importPage(page: Page) {
  const mock = await mockSupabase(page);
  const sam = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Hartley" });
  const household = id("b");
  const [story] = mock.insert("stories", fixtures.story(sam.id, { household_id: household }));
  mock.insert("households", { id: household, created_by: sam.id });
  mock.insert("memories", fixtures.memory(String(story.id)));
  Object.assign(mock.tables.profiles.find((p) => p.id === sam.id)!, { active_story_id: story.id, onboarding_complete: true });
  // people_permissions.sql: ties a place in the tree to a story, as the server does
  mock.rpcs.link_person_story = (args) => {
    const person = mock.table("people").find((p) => p.id === args.pid);
    if (person) person.story_id = args.sid;
    return null;
  };
  await mock.signedIn(page, sam);
  await page.goto("/import");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bring in what’s already written", { timeout: 15_000 });
  return { mock, sam, story, household };
}

/** The two file cards: the memoir, and everything else (a diary, a chat, a tree). */
const fileInput = (page: Page, which: 0 | 1) => page.locator(".im-file").nth(which).locator("input[type=file]");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
});

/* ── /import ────────────────────────────────────────────────────────────── */

test("/import reads pasted writing, shows what it found, and keeps the ticked memories", async ({ page }) => {
  const { mock, story } = await importPage(page);
  await screen(page, "01-import-choose");
  await bigEnough(page, ".im-file .btn", "Choose a file");

  const before = memoriesOf(mock, story.id).length;
  await page.locator("textarea.im-paste").fill(
    "1962: We left Huế on the morning train. Mother packed rice cakes in banana leaves for the whole family.\n\n1975: The year we came to Ohio. The snow was the first any of us had seen, and we stood in it laughing.",
  );
  await page.getByRole("button", { name: "Read it" }).click();
  await expect(page.getByRole("heading", { name: "2 memories found" })).toBeVisible();
  await expect(page.locator(".im-entry")).toHaveCount(2);
  await expect(page.locator(".im-entry").first()).toContainText("1962");
  await expect(page.getByRole("button", { name: "Keep 2 memories" })).toBeVisible();
  // nothing is written while they look it over
  expect(mock.sent("/rest/v1/memories", "POST")).toHaveLength(0);
  await screen(page, "02-import-paste-review");

  // untick one, keep the other
  await page.locator(".im-entry").nth(1).locator("input[type=checkbox]").uncheck();
  await page.getByRole("button", { name: "Keep this memory" }).click();
  await expect(page.getByRole("heading", { name: "One memory is in Rose’s story." })).toBeVisible({ timeout: 15_000 });
  const kept = memoriesOf(mock, story.id);
  expect(kept.length).toBe(before + 1);
  const added = kept.find((m) => String(m.body).includes("morning train"))!;
  expect(added, "the pasted memory is kept").toBeTruthy();
  expect(added.privacy).toBe("shared");
  expect(added.status).toBe("saved");
  expect(kept.some((m) => String(m.body).includes("Ohio")), "the unticked one is not kept").toBe(false);
  await screen(page, "03-import-done");
  nothingSent(mock);
});

test("/import reads a WhatsApp export, asks whose messages are the memories, and keeps one per day", async ({ page }) => {
  const { mock, story } = await importPage(page);
  const before = memoriesOf(mock, story.id).length;
  await fileInput(page, 1).setInputFiles({ name: "WhatsApp Chat with Mum.txt", mimeType: "text/plain", buffer: Buffer.from(WHATSAPP) });

  await expect(page.getByRole("heading", { name: "Whose messages are the memories?" })).toBeVisible();
  // Rose's own messages are ticked for her story; Sam's are not
  await expect(page.getByRole("checkbox", { name: /Rose Hartley/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Sam Hartley/ })).not.toBeChecked();
  await screen(page, "04-import-whatsapp-senders");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "2 memories found" })).toBeVisible();
  await expect(page.locator(".im-review")).toContainText("pear tree");
  await expect(page.locator(".im-review")).not.toContainText("Tell me more");
  await screen(page, "05-import-whatsapp-review");

  await page.getByRole("button", { name: "Keep 2 memories" }).click();
  await expect(page.getByRole("heading", { name: "2 memories are in Rose’s story." })).toBeVisible({ timeout: 15_000 });
  expect(memoriesOf(mock, story.id).length).toBe(before + 2);
  nothingSent(mock);
});

test("/import reads a memoir by chapter, from a text file and from a Word file", async ({ page }) => {
  const { mock, story } = await importPage(page);
  const before = memoriesOf(mock, story.id).length;

  await fileInput(page, 0).setInputFiles({ name: "Rose memoir.txt", mimeType: "text/plain", buffer: Buffer.from(MEMOIR_TXT) });
  await expect(page.getByRole("heading", { name: "2 chapters found" })).toBeVisible();
  await expect(page.locator(".im-review")).toContainText("forty acres");
  await expect(page.locator(".im-review")).toContainText("one suitcase");
  await screen(page, "06-import-memoir-txt");
  await page.getByRole("button", { name: "Choose something else" }).click();

  await fileInput(page, 0).setInputFiles({
    name: "Rose memoir.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: DOCX,
  });
  await expect(page.getByRole("heading", { name: "2 chapters found" })).toBeVisible();
  await expect(page.locator(".im-entry").first()).toContainText("The Farm on Miller Road");
  await expect(page.locator(".im-entry").nth(1)).toContainText("Leaving for the City");
  await screen(page, "07-import-memoir-docx");

  await page.getByRole("button", { name: "Keep 2 memories" }).click();
  await expect(page.getByRole("heading", { name: "2 memories are in Rose’s story." })).toBeVisible({ timeout: 15_000 });
  const kept = memoriesOf(mock, story.id);
  expect(kept.length).toBe(before + 2);
  expect(kept.map((m) => m.title)).toEqual(expect.arrayContaining(["The Farm on Miller Road", "Leaving for the City"]));
  nothingSent(mock);
});

test("/import reads a GEDCOM tree, lists who can still be asked, and adds the family with a story for each one picked", async ({ page }) => {
  const { mock, story, household } = await importPage(page);
  const storiesBefore = (mock.tables.stories ?? []).length;
  await fileInput(page, 1).setInputFiles({ name: "hartley-tree.ged", mimeType: "application/octet-stream", buffer: Buffer.from(GEDCOM) });

  await expect(page.getByRole("heading", { name: "2 people in this tree can still be asked." })).toBeVisible();
  await expect(page.locator(".im-review")).toContainText("We read 3 people and 1 family");
  await expect(page.getByRole("checkbox", { name: /Ellen Hartley/ })).toBeVisible();
  await expect(page.locator(".im-review")).toContainText("Walter Hartley");
  // nothing written yet
  expect(mock.sent("/rest/v1/people", "POST")).toHaveLength(0);
  expect(mock.sent("/rest/v1/stories", "POST")).toHaveLength(0);
  await screen(page, "08-import-gedcom-review");

  await page.getByRole("checkbox", { name: /Ellen Hartley/ }).check();
  await page.getByRole("button", { name: "Start 1 story" }).click();
  await expect(page.getByRole("heading", { name: "The family is in." })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".im-done")).toContainText("3 people from the tree joined your family, and Ellen’s story has started.");

  const people = mock.tables.people ?? [];
  expect(people.map((p) => p.given_name).sort()).toEqual(["Ellen", "Rose", "Walter"]);
  expect(people.every((p) => p.household_id === household)).toBe(true);
  // Rose in the file is the story's own Rose, tied to it; Ellen gets a story of her own
  expect(people.find((p) => p.given_name === "Rose")?.story_id).toBe(story.id);
  const stories = mock.tables.stories ?? [];
  expect(stories.length).toBe(storiesBefore + 1);
  const ellens = stories.find((s) => s.name === "Ellen")!;
  expect(ellens).toBeTruthy();
  expect(people.find((p) => p.given_name === "Ellen")?.story_id).toBe(ellens.id);
  expect((mock.tables.relationships ?? []).length).toBeGreaterThanOrEqual(2);
  await screen(page, "09-import-gedcom-done");
  nothingSent(mock);
});

/* ── The archive's calendar ─────────────────────────────────────────────── */

test("/archive has a calendar with birthdays, remembrances, anniversaries and memory dates", async ({ page }) => {
  const { mock, story } = await rosesFamily(page);
  mock.insert("story_milestones", { id: id("c"), story_id: story.id, kind: "anniversary", label: "Wedding", day: 20, month: 10, year: 1968 });
  mock.insert(
    "memories",
    fixtures.memory(String(story.id), { title: "The christening", body: "The church on Elm was full.", period: "9 October 1975", created_at: "2026-10-21T12:00:00.000Z" }),
  );

  await page.goto("/archive?day=2026-10-14");
  const calendarChip = page.getByRole("button", { name: "Calendar", exact: true });
  await expect(calendarChip).toBeVisible({ timeout: 15_000 });
  await calendarChip.click();
  await expect(calendarChip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#cal-title")).toHaveText("October 2026");

  // every mark on the month is said in words
  const kept = page.locator(".cal-kept");
  await expect(kept).toContainText("Walter");
  await expect(kept).toContainText("Remembering Walter");
  await expect(kept).toContainText("Rose’s birthday");
  await expect(kept).toContainText(/Rose’s wedding anniversary/);
  await expect(kept).toContainText("“The christening”");

  // the chosen day says what it keeps
  const day = page.locator(".cal-day-page");
  await expect(day.locator("#cal-day-title")).toContainText("14 October 2026");
  await expect(day).toContainText("Rose’s birthday");
  await expect(day).toContainText("Born 1945");
  await screen(page, "10-archive-calendar");

  // a day a memory was kept on: its memory, and the way back to the list
  await page.getByRole("button", { name: /^21 October, 1 memory kept/ }).click();
  await expect(day).toContainText("1 memory kept on this day");
  await expect(day.getByRole("link", { name: "The christening" })).toBeVisible();
  await screen(page, "11-archive-calendar-day");
  await day.getByRole("button", { name: "See them in the list" }).click();
  await expect(page).toHaveURL(/day=2026-10-21/);
  await expect(page.getByRole("button", { name: "List", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Written on/)).toBeVisible();
  nothingSent(mock);
});

/* ── /family: print, admins, merges ─────────────────────────────────────── */

test("/family has 'Print the tree', a print-friendly sheet of the family", async ({ page }) => {
  const { mock } = await rosesFamily(page);
  await page.goto("/family");
  const link = page.getByRole("link", { name: /Print the tree/ }).first();
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();
  await expect(page).toHaveURL(/\/family\/print$/);

  const sheet = page.locator(".tpr-sheet");
  await expect(sheet).toBeVisible();
  for (const name of ["Rose Hartley", "Walter Hartley", "Sam Hartley", "Jamie Hartley"]) await expect(sheet).toContainText(name);
  await expect(sheet).toContainText("Kept on A Story");
  await page.evaluate(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => void ((window as unknown as { printed: number }).printed += 1);
  });
  const print = page.getByRole("button", { name: "Print the tree" });
  await bigEnough(page, ".tpr-bar .btn, .tpr-bar a", "the print bar");
  await screen(page, "12-family-print");
  await print.click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);

  // on paper: only the sheet, black on white
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".tpr-bar")).toBeHidden();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector(".tpr-sheet")!).backgroundColor)).toBe("rgb(255, 255, 255)");
  await shot(page, SHOTS, "13-family-print-paper");
  await page.emulateMedia({ media: "screen" });
  nothingSent(mock);
});

test("a tree admin makes another admin, as on the phone", async ({ page }) => {
  const { mock, household, jamieUser } = await rosesFamily(page);
  const asked: Row[] = [];
  mock.rpcs.add_tree_admin = (args) => {
    asked.push(args);
    mock.insert("household_admins", { household_id: args.hid, user_id: args.uid });
    return true;
  };

  await page.goto("/family");
  const admins = page.getByRole("region", { name: "Who looks after the tree" });
  await expect(admins).toBeVisible({ timeout: 15_000 });
  await expect(admins.getByRole("list", { name: "The tree’s admins" })).toContainText("You");
  await expect(admins).toContainText("Started the tree");
  await admins.getByRole("button", { name: "Add an admin" }).click();
  const make = admins.getByRole("button", { name: "Make Jamie Hartley an admin" });
  await expect(make).toBeVisible();
  await bigEnough(page, ".keepers .btn", "the admin buttons");
  await admins.scrollIntoViewIfNeeded();
  await screen(page, "14-family-admins-pick");

  await make.click();
  await expect(admins.getByRole("status")).toContainText("Jamie Hartley is an admin of the tree now.");
  expect(asked).toEqual([{ hid: household, uid: jamieUser.id }]);
  await expect(admins.getByRole("list", { name: "The tree’s admins" })).toContainText("Jamie Hartley");
  await expect(admins.getByRole("button", { name: "Take Jamie Hartley off the admins" })).toBeVisible();
  await screen(page, "15-family-admins-made");
  nothingSent(mock);
});

/** The other owner (Ellen) asked to put her story about Rose together with Sam's. */
function mergeAsked(mock: MockSupabase, storyId: unknown) {
  const mergeId = id("d");
  const other = id("5");
  let status = "proposed";
  const answers: Row[] = [];
  const undos: Row[] = [];
  mock.rpcs.my_duplicate_stories = () =>
    status === "proposed"
      ? [{ mine: storyId, other, name: "Rose", last_name: "Hartley", other_keeper: "Ellen", mine_memories: 1, other_memories: 3, merge_id: mergeId, merge_status: "proposed", proposed_by_me: false }]
      : [];
  mock.rpcs.answer_story_merge = (args) => {
    answers.push(args);
    status = args.yes ? "done" : "declined";
    if (args.yes) mock.insert("story_merges", { id: mergeId, status: "done", done_at: new Date().toISOString(), keep: { name: "Rose" }, fold: { name: "Rose", owner_id: "ellen" } });
    return status;
  };
  mock.rpcs.undo_story_merge = (args) => {
    undos.push(args);
    mock.tables.story_merges = (mock.tables.story_merges ?? []).filter((m) => m.id !== args.mid);
    return true;
  };
  return { mergeId, answers, undos };
}

test("a proposed story merge is put together, then undone", async ({ page }) => {
  const { mock, story } = await rosesFamily(page);
  const { mergeId, answers, undos } = mergeAsked(mock, story.id);

  await page.goto("/family");
  const merges = page.getByRole("region", { name: "Two stories about one person" });
  await expect(merges).toBeVisible({ timeout: 15_000 });
  await expect(merges).toContainText("Ellen asks to put Rose’s stories together");
  await expect(merges).toContainText("Either of you can undo it for 30 days.");
  await bigEnough(page, ".dupes .btn", "the merge answers");
  await screen(page, "16-family-merge-asked");

  await merges.getByRole("button", { name: "Put them together" }).click();
  await expect.poll(() => answers).toEqual([{ mid: mergeId, yes: true }]);
  // the note names whose stories they are
  await expect(merges.getByRole("status")).toContainText("stories are together now");
  expect.soft(await merges.getByRole("status").innerText(), "the note after a yes reads as a possessive").toContain("Rose’s stories are together now");
  const undo = merges.getByRole("button", { name: "Undo", exact: true });
  await expect(undo).toBeVisible();
  await screen(page, "17-family-merge-done");

  await undo.click();
  // a pointer resting on the held line stops its clock, so it moves away
  await page.mouse.move(1, 1);
  // held six seconds with an Undo of its own, then sent
  await expect.poll(() => undos, { timeout: 15_000 }).toEqual([{ mid: mergeId }]);
  await expect(merges).toBeHidden({ timeout: 15_000 });
  nothingSent(mock);
});

test("a proposed story merge can be answered no", async ({ page }) => {
  const { mock, story } = await rosesFamily(page);
  const { mergeId, answers } = mergeAsked(mock, story.id);
  await page.goto("/family");
  const merges = page.getByRole("region", { name: "Two stories about one person" });
  await expect(merges.getByRole("button", { name: "No, two people" })).toBeVisible({ timeout: 15_000 });
  await merges.getByRole("button", { name: "No, two people" }).click();
  await expect(merges).toContainText("Kept Rose as two people");
  await screen(page, "18-family-merge-declined");
  await expect.poll(() => answers, { timeout: 15_000 }).toEqual([{ mid: mergeId, yes: false }]);
  nothingSent(mock);
});

/* ── /friend/:token ─────────────────────────────────────────────────────── */

/** Peggy, Rose's friend, signed in, holding the friend link Jamie shared from the phone. */
async function peggy(page: Page) {
  const mock = await mockSupabase(page);
  const owner = mock.addUser({ email: "sam@example.com", firstName: "Sam", lastName: "Hartley" });
  const [story] = mock.insert("stories", fixtures.story(owner.id));
  const peggyUser = mock.addUser({ email: "peggy@example.com", firstName: "Peggy", lastName: "Moss" });
  const [own] = mock.insert("stories", fixtures.story(peggyUser.id, { name: "Peggy", last_name: "Moss", relationship: "Myself" }));
  Object.assign(mock.tables.profiles.find((p) => p.id === peggyUser.id)!, { active_story_id: own.id, onboarding_complete: true });
  const reads: Row[] = [];
  const accepts: Row[] = [];
  mock.rpcs.friend_link_read = (args) => {
    reads.push(args);
    return args.p_token === "RM7Q2KWD" ? [{ teller_name: "Rose", teller_last_name: "Hartley", sender_name: "Jamie", friend_name: "Peggy", story_id: story.id }] : [];
  };
  mock.rpcs.friend_link_accept = (args) => {
    accepts.push(args);
    return story.id;
  };
  await mock.signedIn(page, peggyUser);
  return { mock, story, reads, accepts };
}

test("/friend/:token opens the phone's friend link and sends what a friend remembers to the keeper", async ({ page }) => {
  const { mock, story, reads, accepts } = await peggy(page);
  // the phone shares it in lower case sometimes; the token is read as the server keeps it
  await page.goto("/friend/rm7q2kwd");
  await expect(page.getByRole("heading", { name: "What do you remember about Rose?" })).toBeVisible({ timeout: 15_000 });
  // who sent it is said in the line under the question (the kicker above it is laptop-only)
  await expect(page.getByText(/Jamie would love your side. It goes to Jamie first, with your name on it./)).toBeVisible();
  await expect(page.getByText(/Friends aren’t in the family tree/)).toBeVisible();
  expect(reads[0]).toEqual({ p_token: "RM7Q2KWD" });
  await screen(page, "19-friend-link");

  // nothing written: it asks for the words first
  await page.getByRole("button", { name: "Send it to Jamie" }).click();
  await expect(page.getByRole("alert")).toContainText("Write what you remember about Rose first.");
  expect(accepts).toHaveLength(0);

  await page.getByLabel("What you remember about Rose").fill("Rose taught me to make pear jam in her kitchen on Elm Street, the summer of 1979.");
  await page.getByRole("button", { name: "Send it to Jamie" }).click();
  await expect(page.getByRole("heading", { name: "Sent to Jamie." })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/It joins Rose’s story when Jamie says yes/)).toBeVisible();
  expect(accepts).toEqual([{ p_token: "RM7Q2KWD" }]);
  const sent = (mock.tables.contributions ?? []).filter((c) => c.story_id === story.id);
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ relationship: "Friend", status: "pending", contributor_name: "Peggy" });
  expect(String(sent[0].body)).toContain("pear jam");
  await screen(page, "20-friend-sent");

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: "Thank you, Peggy." })).toBeVisible();
  await screen(page, "21-friend-thanks");
  nothingSent(mock);
});

test("a friend link that doesn't open says so and offers Home", async ({ page }) => {
  const { mock } = await peggy(page);
  await page.goto("/friend/ZZZZ2222");
  await expect(page.getByRole("heading", { name: /This link doesn’t work/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Ask whoever sent it for a new one/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to Home" })).toBeVisible();
  await screen(page, "22-friend-broken");
  nothingSent(mock);
});

test("a signed-out friend link goes to sign in and comes back to it", async ({ page }) => {
  const mock = await mockSupabase(page);
  await page.goto("/friend/RM7Q2KWD");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Ffriend%2FRM7Q2KWD/, { timeout: 15_000 });
  nothingSent(mock);
});

/* ── Ask someone to add their side ──────────────────────────────────────── */

test("a memory page asks someone to add their side with the memory's own link, QR and copy, and sends nothing", async ({ page }) => {
  const { mock, memory, jamie, sam } = await rosesFamily(page);
  const made: Row[] = [];
  mock.rpcs.memory_link_create = (args) => {
    made.push(args);
    return [{ token: "K7PX2QHM4D" }];
  };

  await page.goto(`/archive/${memory.id}`);
  const open = page.getByRole("button", { name: "Ask someone to add their side" });
  await expect(open).toBeVisible({ timeout: 15_000 });
  await bigEnough(page, ".ats-open", "Ask someone to add their side");
  const askedAt = mock.calls.length;
  await open.click();

  const panel = page.locator("section.ats");
  await expect(panel.getByRole("heading", { name: "Who else was there?" })).toBeVisible();
  await expect(panel).toContainText("It comes to the family’s keeper first.");
  // the tree's living people are offered, never the storyteller or the asker
  const options = await panel.locator("datalist option").evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
  expect(options).toEqual(["Jamie Hartley"]);
  await panel.getByLabel(/Who is it for\?/).fill("Jamie Hartley");
  await panel.scrollIntoViewIfNeeded();
  await screen(page, "23-memory-ask-form");

  await panel.getByRole("button", { name: "Make the link" }).click();
  await expect(panel.getByText("The link for Jamie. It opens this memory and nothing else.")).toBeVisible();
  expect(made).toEqual([{ p_memory: memory.id, p_for_name: "Jamie Hartley", p_person: jamie.id, p_friend: null }]);
  await expect(panel.getByRole("link", { name: "astoryapp.com/m/K7PX2QHM4D" })).toHaveAttribute("href", "https://astoryapp.com/m/K7PX2QHM4D");
  const qr = panel.getByRole("img", { name: /QR code for the link to “The kitchen on Elm Street”/ });
  await expect(qr).toBeVisible();
  expect((await qr.boundingBox())?.width ?? 0, "a QR big enough to scan").toBeGreaterThanOrEqual(96);

  await panel.getByRole("button", { name: "Copy the link" }).click();
  await expect(panel.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await clipboard(page)).toBe("https://astoryapp.com/m/K7PX2QHM4D");

  await panel.getByRole("button", { name: "Copy a message with it" }).click();
  await expect.poll(() => clipboard(page)).toContain("Were you there for “The kitchen on Elm Street”?");
  const message = await clipboard(page);
  expect(message).toMatch(/^Jamie, I’m keeping Rose’s stories on A Story\./);
  expect(message).toContain("https://astoryapp.com/m/K7PX2QHM4D");
  expect(message).toContain(`— ${String((sam as MockUser).metadata.first_name)}`);
  expect.soft(message, "the message names no countdown or price").not.toMatch(/days?\s+left|trial|\$\d/i);
  await expect(panel.getByRole("status")).toContainText("send it yourself");
  await bigEnough(page, ".ats-acts .btn", "the copy buttons");
  await screen(page, "24-memory-ask-link");

  // nothing sent: no email, no function, no message rows
  nothingSent(mock);
  // the only thing the ask wrote was the link itself
  const writes = mock.calls.slice(askedAt).filter((c) => !["GET", "HEAD", "OPTIONS"].includes(c.method));
  expect(writes.map((c) => c.path.split("?")[0]).filter((x) => !x.endsWith("/rpc/touch_active"))).toEqual(["/rest/v1/rpc/memory_link_create"]);
});
