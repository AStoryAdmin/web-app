/**
 * Writing a memory, in two steps that never share a screen.
 *
 * 1. The words. The question sits on the cloth, large, where the eye lands
 *    first. Under it the family book lies open on the desk, like a journal:
 *    the leaf in its cloth board with gold corners, a ribbon between the
 *    pages, the family dog asleep on the board's edge (it looks up once the
 *    words start). The page holds a title line, "Dear family,", ruled lines
 *    and the storyteller's sign-off; the seal under the book keeps it. On a
 *    wide window the margins of the desk carry the rest: on the left today's
 *    questions and ways to begin, on the right a pencil note and the help
 *    (Speak instead, Tidy my words, Suggest a title, What am I not saying?).
 * 2. Afterwards, if they like: when it was, who was there, the chapter, a
 *    photograph, beside the page just kept. Each is kept the moment it is
 *    chosen; nothing else is asked. Then the next question.
 *
 * Drafts autosave to this browser, one per question, so moving between
 * today's questions never loses a page. Ctrl/Cmd+Enter keeps it. Focus mode
 * (Esc leaves) keeps only the book. Speak instead of typing where the
 * browser can listen.
 *
 * Walls (Free): the daily questions are counted when a question is CHOSEN,
 * the weekly photos when the picker opens; never at Keep. Writing in your
 * own words is never metered.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { firstName, personName, realPeople, storytellerOf } from "../components/family/familyView";
import gsap from "gsap";
import Shell from "../components/Shell";
import WhereNext, { Stop, type NextRow } from "../components/book/WhereNext";
import { Avatar, Problem } from "../components/ui";
import { CheckIcon, CloseIcon, ExpandIcon, HelpIcon, MicIcon, PenIcon, PhotoIcon, ShrinkIcon, SparkIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { newMemory, uploadMemoryPhoto } from "../data/memories";
import { nextQuestions, suggestTitle, tidy } from "../data/ai";
import { ERAS, FAITH_CHAPTER, eraForAge } from "../app-core/data/eras.js";
import { ageAt, parseYear } from "../app-core/lib/timeline.js";
import { decadesForLife, formatDecade, suggestYearsForEra } from "../app-core/lib/memoryDateInput.js";
import { todaysDeck, noteFor, type Prompt } from "../lib/today";
import { isPaid } from "../lib/plan";
import { dailyPromptsLeft, incrementDailyPrompts, weeklyPhotosLeft, incrementWeeklyPhotos, FREE_WEEKLY_PHOTOS } from "../lib/usage";
import { usePhotoUrl } from "../lib/photoUrls";
import { useDictation } from "../lib/dictation";
import { inkStamp } from "../lib/stamp";
import { MOVE, OUT } from "../lib/ease";
import { track } from "../lib/analytics";
import type { Memory, Story } from "../data/stories";

type Draft = { title: string; body: string; era: string; questionId: string | null; memoryId: string };

/** One draft per page: the memory being edited, a question, or writing in your own words. */
const draftKey = (storyId: string, memoryId?: string | null, questionId?: string | null) =>
  memoryId ? `astory-draft-${storyId}-${memoryId}` : questionId ? `astory-draft-${storyId}-q-${questionId}` : `astory-draft-${storyId}`;

function readDraft(key: string): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

/** A question's draft: its own key, or (written before drafts were kept per question) the story's, if it was for this question. */
function questionDraft(storyId: string, questionId: string): Partial<Draft> | null {
  const own = readDraft(draftKey(storyId, null, questionId));
  if (own) return own;
  const legacy = readDraft(draftKey(storyId));
  return legacy && legacy.questionId === questionId ? legacy : null;
}

/** Sentence starters for an empty page (the question's hint is an instruction, so it stays under the question, not here). */
function startersFor(own: boolean): string[] {
  return own
    ? ["It was the year ", "We were living in ", "I remember the smell of ", "The first thing I’d tell you is "]
    : ["They were living in ", "It was the year ", "The way it was told to me, ", "What I remember most is "];
}

const LINE = 36;
const shortDate = (d = new Date()) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
/** The catch-all chapter is never printed as a chapter's name. */
const CATCH_ALL = "Anything else";
const chapterName = (era?: string | null) => (era && era !== CATCH_ALL ? era : "");
/** The part of the day, for the running head: the page knows when it is being written. */
const partOfDay = (d = new Date()) => {
  const h = d.getHours();
  return h < 5 ? "late at night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 22 ? "evening" : "late at night";
};
const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Whether a media query matches, kept current as the window changes. */
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (on) => {
      const mq = matchMedia(query);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

function bookNameOf(story: Story): string {
  const own = story.relationship === "Myself";
  return story.lastName ? `The ${story.lastName} book` : own ? "Your book" : `${story.name}'s book`;
}

/* ── Small pieces ─────────────────────────────────────────────────────── */

/** The family dog, asleep on the edge of the book; once there are words on the page it covers its eyes: the letter is yours. */
function Dog({ awake }: { awake: boolean }) {
  return (
    <span className="w-dog" data-awake={awake ? "" : undefined} aria-hidden="true">
      <img className="sleep" src="/dog/sleep-paper.webp" alt="" width={762} height={640} decoding="async" />
      <img className="awake" src="/dog/cover-paper.webp" alt="" width={849} height={640} decoding="async" />
    </span>
  );
}

/** The wax seal that keeps the page: a pool of red wax, pressed with the book's initial. */
function WaxSeal() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64">
      <path className="wax" d="M32 3.5c4.2 0 6.4 2.6 10 3.6 3.7 1 7.6-.3 10.2 2.6 2.6 2.9 1.4 6.6 3 10 1.5 3.3 5 5.3 5 9.6 0 4.2-3.2 6.2-4.2 9.8-1 3.6.6 7.4-2.2 10.3-2.8 2.9-6.6 1.8-10 3.4-3.4 1.6-5.5 5.2-9.8 5.2s-6.6-3.3-10.2-4.4c-3.6-1.1-7.5.4-10.2-2.3-2.7-2.7-1.6-6.6-3-10C9.2 38.6 5.5 36.4 5.5 32c0-4.4 3.6-6.4 4.8-9.9 1.2-3.5-.3-7.4 2.5-10.1 2.8-2.7 6.6-1.4 10-2.9C26.2 7.6 27.8 3.5 32 3.5Z" />
      <circle className="ring" cx="32" cy="32" r="19.5" />
      <circle className="ring inner" cx="32" cy="32" r="16.5" />
      <text className="mark" x="32" y="40.5" textAnchor="middle">A</text>
    </svg>
  );
}

/** Gold corner pieces on the book's cloth board, the way a journal's corners are protected. */
function Corners() {
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <svg key={c} className={`w-corner ${c}`} viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
          <path d="M0 0 H28 L0 28 Z" />
          <path className="rule" d="M5 3.5 H19 M3.5 5 V19" />
        </svg>
      ))}
    </>
  );
}

function Print({ url, tilt, onRemove }: { url: string; tilt: number; onRemove?: () => void }) {
  const src = usePhotoUrl(url);
  return (
    <figure className="wphoto" style={{ ["--tilt" as string]: `${tilt}deg` }}>
      {src ? <img src={src} alt="" /> : <span className="ph" />}
      {onRemove && (
        <button type="button" className="x" onClick={onRemove} aria-label="Remove this photograph">
          <CloseIcon />
        </button>
      )}
    </figure>
  );
}

function PersonChip({ person, label, pressed, onToggle }: { person: { id: string; photo?: string | null }; label: string; pressed: boolean; onToggle: () => void }) {
  const src = usePhotoUrl(person.photo || null);
  return (
    <button type="button" className="w-person" aria-pressed={pressed} onClick={onToggle}>
      <Avatar src={src} name={label} size={30} />
      <span>{label}</span>
      {pressed && <CheckIcon className="tick" />}
    </button>
  );
}

/** The page just kept, in miniature: its words on paper, the prints tucked onto it as they are added. */
function KeptPage({ story, kept, number }: { story: Story; kept: Memory; number: number }) {
  const own = story.relationship === "Myself";
  return (
    <figure className="w-kept" aria-label={`Memory No. ${number}, as it is in the book`}>
      <div className="w-kept-page">
        <span className="page-frame" aria-hidden="true" />
        {(chapterName(kept.era) || kept.period) && (
          <p className="w-kept-head" aria-hidden="true">
            {chapterName(kept.era) && <span>{chapterName(kept.era)}</span>}
            {chapterName(kept.era) && kept.period && <i>✦</i>}
            {kept.period && <span>{kept.period}</span>}
          </p>
        )}
        <h2 className="w-kept-title">{kept.title}</h2>
        <p className="w-kept-words">{kept.body}</p>
        <p className="w-kept-sign" aria-hidden="true">
          {own ? "Yours," : "As told by"}
          <span>{story.name}</span>
        </p>
        {kept.photos.length > 0 && (
          <div className="w-kept-prints" aria-hidden="true">
            {kept.photos.slice(0, 3).map((u, i) => (
              <Print key={u} url={u} tilt={[-5, 4, -2][i]} />
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}

/* ── Step 2: when, who, chapter, photographs ──────────────────────────── */

function Afterwards({
  story,
  kept,
  number,
  question,
  editing,
  photoFirst,
  unlimited,
  email,
  onKept,
}: {
  story: Story;
  kept: Memory;
  number: number;
  question: Prompt | null;
  editing: boolean;
  photoFirst: boolean;
  unlimited: boolean;
  email: string;
  onKept: (m: Memory) => void;
}) {
  const { saveMemory, family } = useAccount();
  const [period, setPeriod] = useState(kept.period);
  const [state, setState] = useState<"" | "saving" | "saved">("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const own = story.relationship === "Myself";
  const decades = decadesForLife(story) as number[];
  const yearsHint = suggestYearsForEra(story, kept.era) as { from: number; to: number; ages: [number, number] } | null;

  const keep = useCallback(
    async (patch: Partial<Memory>) => {
      const next = { ...kept, ...patch };
      setState("saving");
      setError(null);
      try {
        await saveMemory(next, story.id);
        onKept(next);
        setState("saved");
      } catch (err) {
        setState("");
        setError(`That didn't save (${(err as Error)?.message || "no connection"}). Try once more.`);
      }
    },
    [kept, saveMemory, story.id, onKept],
  );

  // The date in their words saves on a pause, the chips at once.
  useEffect(() => {
    if (period === kept.period) return;
    const t = setTimeout(() => {
      const year = /^\s*\d{4}\s*$/.test(period) ? parseYear(period) : null;
      const era = year ? (eraForAge(ageAt(story, year)) as string | null) || kept.era : kept.era;
      void keep({ period: period.trim(), era });
    }, 700);
    return () => clearTimeout(t);
  }, [period, kept.period, kept.era, keep, story]);

  const pickDecade = (dec: number) => {
    const label = formatDecade(dec) as string;
    const next = kept.period === label ? "" : label;
    setPeriod(next);
    void keep({ period: next });
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    let allowed = files.length;
    if (!unlimited) {
      const left = weeklyPhotosLeft(email);
      if (left <= 0) {
        setError(`Five photographs a week on Free. Plans include unlimited photographs, from $119 a year.`);
        return;
      }
      allowed = Math.min(files.length, left);
    }
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, allowed)) urls.push(await uploadMemoryPhoto(story.id, kept.id, f));
      if (!unlimited) incrementWeeklyPhotos(email, urls.length);
      const photos = [...kept.photos, ...urls];
      await keep({ photos, cover: kept.cover && photos.includes(kept.cover) ? kept.cover : photos[0] || null });
      if (allowed < files.length) setError(`That's ${FREE_WEEKLY_PHOTOS} photographs for this week on Free; the rest didn't go in.`);
    } catch (err) {
      setError(`A photograph didn't upload (${(err as Error)?.message || "unknown"}). The words are safe; try the picture again.`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Who was there: everyone in the family but the storyteller, whose memory it is.
  const teller = storytellerOf(family, story);
  const people = realPeople(family).filter((p) => p.id !== teller?.id);
  // First names, unless two people share one; then the whole name tells them apart.
  const chipName = (p: (typeof people)[number]) => (people.filter((o) => firstName(o) === firstName(p)).length > 1 ? personName(p) : firstName(p));
  const there = kept.personIds || [];
  const togglePerson = (id: string) => keep({ personIds: there.includes(id) ? there.filter((x) => x !== id) : [...there, id] });

  const deck = todaysDeck(story, { unlimited });
  const next = deck.find((p) => p.id !== question?.id) || null;
  const nextRows: NextRow[] = [
    next && !editing
      ? { to: `/write?q=${encodeURIComponent(next.id)}`, title: next.question, line: unlimited ? "Another of today’s questions" : "The next of today’s questions" }
      : { to: "/write", title: "Write another", line: editing ? "The changes are in the book" : "Today’s questions are answered; anything else is welcome" },
    { to: `/archive/${kept.id}`, title: `Read memory No. ${number}`, line: "As it is set in the book" },
    { to: "/", title: "Home", line: "Today, the week and the family" },
  ];

  const whenBlock = (
    <div className="w-choice" key="when">
      <h3>When it was</h3>
      <div className="chiprow">
        {decades.map((dec) => (
          <button key={dec} type="button" className="chip big" aria-pressed={kept.period === formatDecade(dec)} onClick={() => pickDecade(dec)}>
            {(formatDecade(dec) as string).replace(/^the /, "")}
          </button>
        ))}
      </div>
      <label className="w-line">
        <span className="sr-only">Or the date in your words</span>
        <input placeholder="or June 1975, the summer of ’68…" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </label>
      {yearsHint && (
        <p className="w-note">
          {own ? "You" : story.name} would have been {yearsHint.ages[0]} to {yearsHint.ages[1]}, so {yearsHint.from}–{yearsHint.to}.
        </p>
      )}
    </div>
  );

  const whoBlock = (
    <div className="w-choice" key="who">
      <h3>Who was there</h3>
      {people.length > 0 ? (
        <div className="chiprow">
          {people.map((p) => (
            <PersonChip key={p.id} person={p} label={chipName(p)} pressed={there.includes(p.id)} onToggle={() => togglePerson(p.id)} />
          ))}
        </div>
      ) : (
        <p className="w-note">
          Nobody is in the family yet. <Link to="/family">Add someone</Link> and they can be named here.
        </p>
      )}
    </div>
  );

  const chapterBlock = (
    <div className="w-choice chapter" key="chapter">
      <h3>The chapter</h3>
      <div className="chiprow">
        {(ERAS as string[]).map((e) => (
          <button key={e} type="button" className="chip big" aria-pressed={kept.era === e} onClick={() => keep({ era: e })}>
            {e}
            {e === FAITH_CHAPTER && !unlimited ? " · always open" : ""}
          </button>
        ))}
      </div>
    </div>
  );

  const photoBlock = (
    <div className={`w-choice photo${photoFirst ? " first" : ""}`} key="photo">
      <h3>A photograph</h3>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
      {kept.photos.length > 0 && (
        <div className="wphotos">
          {kept.photos.map((u, i) => (
            <Print key={u} url={u} tilt={[-3, 2, -1, 3][i % 4]} onRemove={() => keep({ photos: kept.photos.filter((x) => x !== u), cover: kept.cover === u ? null : kept.cover })} />
          ))}
        </div>
      )}
      <button type="button" className="w-attach" onClick={() => fileRef.current?.click()} disabled={busy} aria-busy={busy || undefined}>
        <PhotoIcon /> {busy ? "Putting it in…" : kept.photos.length ? "Add another" : "Add a photograph"}
      </button>
    </div>
  );

  const blocks = photoFirst ? [photoBlock, whenBlock, whoBlock, chapterBlock] : [whenBlock, whoBlock, photoBlock, chapterBlock];

  return (
    <div className="w-after">
      {error && <Problem message={error} onDismiss={() => setError(null)} />}
      <div className="w-after-grid">
        <KeptPage story={story} kept={kept} number={number} />
        <section className="w-choices" aria-labelledby="after-h">
          <header className="w-choices-head">
            <div>
              <h2 id="after-h">
                A few more things, if you like
                <Stop />
              </h2>
              <p className="w-note">Each is kept the moment you choose it. Skip any of them; the words are already in the book.</p>
            </div>
            <p className={`w-state ${state}`} aria-live="polite">
              {state === "saving" ? "Keeping…" : state === "saved" ? (
                <>
                  <CheckIcon /> Kept
                </>
              ) : (
                ""
              )}
            </p>
          </header>
          <div className="w-choice-grid">{blocks}</div>
        </section>
      </div>

      <WhereNext rows={nextRows} />
    </div>
  );
}

/* ── The page ─────────────────────────────────────────────────────────── */

/**
 * The writer mounts only once the story is loaded, keyed on the story, the
 * memory being edited and the question, so the draft and the step are read
 * from a story that exists (opening /write?edit=… in a fresh tab used to
 * capture an empty draft before the account had arrived).
 */
export default function Write() {
  const { account, activeStory: story } = useAccount();
  const [params] = useSearchParams();
  if (account === undefined) return <Shell compact><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;
  return <Writer key={`${story.id}|${params.get("edit") || ""}|${params.get("q") || ""}`} story={story} />;
}

type Help = "tidy" | "title" | "ask";

function Writer({ story }: { story: Story }) {
  const { user } = useAuth();
  const { saveMemory, family } = useAccount();
  const [params] = useSearchParams();
  const qid = params.get("q");
  const editId = params.get("edit");
  const wantsPhoto = params.get("photo") === "1";
  const wantsDetails = params.get("details") === "1" || wantsPhoto;
  const withId = params.get("with");
  const unlimited = isPaid(user?.plan ?? "free");
  const email = user?.email || "";

  const editing = useMemo(() => (editId ? story.memories.find((m) => m.id === editId) || null : null), [story, editId]);
  const question = useMemo<Prompt | null>(() => {
    if (!qid) return null;
    const deck = todaysDeck(story, { unlimited: true });
    return deck.find((p) => p.id === qid) || null;
  }, [story, qid]);

  const key = draftKey(story.id, editId, question?.id);
  const initial = useMemo<Draft>(() => {
    if (editing) {
      const saved = readDraft(key);
      return { title: editing.title, body: editing.body, era: editing.era, questionId: null, memoryId: editing.id, ...(saved && saved.memoryId === editing.id ? saved : {}) };
    }
    const base: Draft = { title: "", body: "", era: question?.era || "", questionId: question?.id || null, memoryId: crypto.randomUUID() };
    const saved = question ? questionDraft(story.id, question.id) : readDraft(key);
    return saved ? { ...base, ...saved } : base;
  }, [key, editing, question, story.id]);

  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState<"" | "save" | Help>("");
  const [helped, setHelped] = useState<Help | "">("");
  const [error, setError] = useState<string | null>(null);
  const [kept, setKept] = useState<Memory | null>(() => (editing && wantsDetails ? editing : null));
  const [asks, setAsks] = useState<string[]>([]);
  const [asked, setAsked] = useState<string | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [counted, setCounted] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [keptNumber, setKeptNumber] = useState<number | null>(null);
  const [draftState, setDraftState] = useState<"" | "saving" | "saved">("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  // the keep's timers and its tween, cleared if the writer goes away mid-press
  const timers = useRef<number[]>([]);
  const pressCtx = useRef<gsap.Context | null>(null);
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      pressCtx.current?.revert();
    },
    [],
  );

  const set = useCallback((patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch })), []);
  // the open journal needs a laptop's width; the margin beside it a large window's
  const spread = useMedia("(min-width: 1280px)");
  const rail = useMedia("(min-width: 1560px)");

  // Speaking: final phrases land at the end of the page.
  const dictation = useDictation((text) => {
    if (!text) return;
    setD((prev) => {
      const body = prev.body.trimEnd();
      const joiner = body ? (/[.!?]$/.test(body) ? " " : ". ") : "";
      return { ...prev, body: body + joiner + text.charAt(0).toUpperCase() + text.slice(1) };
    });
  });

  // Autosave the draft to this browser.
  useEffect(() => {
    if (!key || kept) return;
    if (!(d.body || d.title)) return;
    queueMicrotask(() => setDraftState("saving"));
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(d));
        setDraftState("saved");
      } catch {
        /* storage blocked */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [d, key, kept]);

  // A guided question counts against the day when it is chosen, not at Keep.
  useEffect(() => {
    if (!question || counted || unlimited || editing) return;
    if (dailyPromptsLeft(email) <= 0) return;
    incrementDailyPrompts(email);
    queueMicrotask(() => setCounted(true));
    track("question_shown", { question_id: question.id, depth: question.depth ?? 0, mode_offered: "write" });
  }, [question, counted, unlimited, editing, email]);

  // The pen is ready on the page, without scrolling the question off the cloth; on a phone the keyboard waits for a tap.
  useEffect(() => {
    if (kept) return;
    if (matchMedia("(pointer: fine)").matches) bodyRef.current?.focus({ preventScroll: true });
  }, [kept]);

  // W puts the pen on the page from anywhere on the writer that is not already a field (the keyboard layer, BAOS rule 43).
  useEffect(() => {
    if (kept) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "w" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || t.isContentEditable)) return;
      e.preventDefault();
      const el = bodyRef.current;
      if (!el) return;
      el.focus({ preventScroll: false });
      el.setSelectionRange(el.value.length, el.value.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kept]);

  // The page grows with the words, in whole ruled lines; the title line grows too.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    // one ruled line, as the stylesheet sets it for this width (36px, 32px on a phone)
    const line = parseFloat(getComputedStyle(el).lineHeight) || LINE;
    const lines = Math.ceil(el.scrollHeight / line) + 1;
    el.style.height = `${Math.max(focus ? 16 : 10, lines) * line}px`;
  }, [d.body, focus, dictation.interim, kept]);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [d.title, focus, kept]);

  // Focus mode: only the book; Esc leaves.
  useEffect(() => {
    document.body.classList.toggle("writing-focus", focus);
    if (!focus) return;
    bodyRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("writing-focus");
    };
  }, [focus]);

  // The book is laid on the desk, the running head and the sign-off are inked in, the ribbon settles, the margins follow.
  useEffect(() => {
    const book = bookRef.current;
    const desk = deskRef.current;
    if (!book || !desk) return;
    // in development the clock can be stepped by hand where the pane draws no frames
    if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const blank = { clipPath: "inset(-30% 100% -30% 0)" };
      const inked = { clipPath: "inset(-30% 0% -30% 0)", ease: MOVE, clearProps: "clipPath" };
      const margins = desk.querySelectorAll<HTMLElement>(".w-side > *, .leaf-left > :not(.page-frame), .w-tools-row");
      gsap
        .timeline({ defaults: { ease: OUT } })
        .fromTo(book, { y: 22, rotation: -0.5, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.7, clearProps: "transform,opacity" })
        .fromTo(book.querySelectorAll(".running-head"), blank, { ...inked, duration: 0.55 }, 0.25)
        .fromTo(book.querySelectorAll(".signoff span"), blank, { ...inked, duration: 0.6 }, 0.4)
        // the ribbon's tail swings once and hangs still, as it does when a book is laid open
        .fromTo(book.querySelectorAll(".w-ribbon"), { rotation: 6 }, { keyframes: { rotation: [6, -3, 1.2, 0], ease: MOVE }, duration: 0.9, clearProps: "transform" }, 0.15)
        .fromTo(margins, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, clearProps: "transform,opacity" }, 0.3);
    });
    return () => mm.revert();
  }, [kept]);

  const own = story.relationship === "Myself";
  const era = d.era || "Anything else";
  const words = countWords(d.body);
  const empty = !d.body.trim();
  const starters = startersFor(own);
  const number = editing ? Math.max(1, [...story.memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((m) => m.id === editing.id) + 1) : story.memories.length + 1;
  const bookName = bookNameOf(story);
  const withPerson = withId ? realPeople(family).find((p) => p.id === withId) || null : null;
  // Today's questions, the one on the page among them (a paid plan's walk is long; three is a page's worth).
  const deck = useMemo(() => {
    const all = todaysDeck(story, { unlimited });
    const three = all.slice(0, 3);
    return question && !three.some((p) => p.id === question.id) ? [question, ...three.slice(0, 2)] : three;
  }, [story, unlimited, question]);
  const drafted = useMemo(() => new Set(deck.filter((p) => p.id !== question?.id && questionDraft(story.id, p.id)?.body?.trim()).map((p) => p.id)), [deck, question, story.id]);

  const insertStarter = (s: string) => {
    set({ body: d.body.trimEnd() ? `${d.body.trimEnd()}\n\n${s}` : s });
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const help = async (mode: Help) => {
    const about = own ? "" : story.name;
    setBusy(mode);
    setHelped("");
    try {
      if (mode === "tidy") {
        const text = await tidy(d.body, about);
        if (text !== d.body) {
          setUndo(d.body);
          set({ body: text });
        }
      } else if (mode === "title") {
        const title = await suggestTitle(d.body, about);
        if (title) set({ title });
      } else {
        setAsks(await nextQuestions(d.body, about, { topic: question?.topic, followUp: question?.followUp }));
        setAsked(null);
      }
      setHelped(mode);
    } finally {
      setBusy("");
    }
  };

  const answerAsk = (a: string) => {
    setAsked(a);
    // on a laptop the slip above the bar is put away; the question stays in pencil in the left page's margin
    if (spread && !rail) {
      setAsks([]);
      setHelped("");
    }
    if (asked === a) return;
    set({ body: d.body.trimEnd() ? `${d.body.trimEnd()}\n\n` : "" });
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const save = async () => {
    const body = d.body.trim();
    if (!body) {
      setError("Write a line or two first, even a short one.");
      bodyRef.current?.focus();
      return;
    }
    if (dictation.listening) dictation.stop();
    setBusy("save");
    setError(null);
    const memory = newMemory({
      ...(editing || {}),
      id: d.memoryId,
      title: d.title.trim() || question?.question || body.split(/[.!?\n]/)[0].slice(0, 80),
      body,
      excerpt: body.slice(0, 200),
      era,
      period: editing?.period || "",
      photos: editing?.photos || [],
      cover: editing?.cover || null,
      status: "saved",
      createdAt: editing?.createdAt,
      ...(editing?.personIds ? { personIds: editing.personIds } : withId ? { personIds: [withId] } : {}),
    });
    try {
      await saveMemory(memory, story.id);
      try {
        localStorage.removeItem(key);
        // a draft for this question written before drafts were kept per question
        if (question && readDraft(draftKey(story.id))?.questionId === question.id) localStorage.removeItem(draftKey(story.id));
      } catch {
        /* fine */
      }
      track("memory_saved", { mode: 1, chapter: era, has_photo: memory.photos.length > 0, from_question: Boolean(question) });
      if (question) track("question_answered", { question_id: question.id, mode: "write" });
      // The seal presses, the ink stamp lands, then the next step.
      setPressed(true);
      setKeptNumber(number);
      const seal = sealRef.current?.querySelector(".seal") as HTMLElement | null;
      if (seal) {
        // the wax is pressed (D4: scale 1.18, a turn, then still), then the stamp lands beside it (D5)
        if (!reduced()) {
          pressCtx.current?.revert();
          pressCtx.current = gsap.context(() => {
            gsap.fromTo(seal, { scale: 1.18, rotation: -14, opacity: 0.4 }, { scale: 1, rotation: -8, opacity: 1, duration: 0.28, ease: OUT });
          });
        }
        const r = seal.getBoundingClientRect();
        timers.current.push(window.setTimeout(() => inkStamp(r.left + r.width / 2, r.top + r.height / 2, "Kept", 150), reduced() ? 0 : 260));
      }
      setFocus(false);
      timers.current.push(
        window.setTimeout(
          () => {
            setKept(memory);
            setBusy("");
            window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
          },
          reduced() ? 700 : 1300,
        ),
      );
    } catch (err) {
      setError(`This memory hasn't been kept yet (${(err as Error)?.message || "no connection"}). Your words are still here; try again.`);
      setBusy("");
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  };

  /* ── Step 2 ── */
  if (kept) {
    const n = keptNumber ?? number;
    return (
      <Shell
        back="/"
        wide
        hero={
          <div className="whero">
            <p className="label" data-rise>
              Memory No. {n}
            </p>
            <h1 className="story-q wq">
              Kept in {bookName}
              <Stop />
            </h1>
          </div>
        }
      >
        <div className="page desk w-desk after-step">
          <Afterwards
            story={story}
            kept={kept}
            number={n}
            question={question}
            editing={Boolean(editing) && !keptNumber}
            photoFirst={wantsPhoto}
            unlimited={unlimited}
            email={email}
            onKept={setKept}
          />
        </div>
      </Shell>
    );
  }

  /* ── Step 1 ── */
  const keepLabel = editing ? "Keep the changes" : "Keep it";
  const hint = question ? noteFor(question) || question.hint : "";
  const kicker = editing
    ? `Editing memory No. ${number}`
    : `${question ? (own ? "Today’s question" : `A question for ${story.name}`) : wantsPhoto ? "A photograph" : "In your own words"}${withPerson ? ` · with ${firstName(withPerson)}` : ""}`;
  const heading = question
    ? question.question
    : editing
      ? editing.title || "This memory"
      : wantsPhoto
        ? "Which photograph, and what was happening?"
        : own
          ? "What would you like to keep today?"
          : `What would you like to keep of ${story.name}’s?`;
  const sub = question ? hint : editing ? "" : wantsPhoto ? "A few lines first. The photograph goes in on the next page." : "Anything at all. A kitchen, a road, a song on the radio.";
  const helpsOff = empty || busy !== "";
  const toolState =
    helped === "tidy"
      ? undo
        ? "Tidied: spelling and full stops. Your words, your order."
        : "Nothing needed tidying."
      : helped === "title"
        ? "A title is on the page. Change it as you like."
        : helped === "ask" && asks.length
          ? "In pencil, for you to answer or not:"
          : "";

  const questionHead = (
    <header className="w-qhead">
      <p className="w-qkick">{kicker}</p>
      <h1 className="w-question" data-len={heading.length > 65 ? "long" : heading.length > 40 ? "mid" : undefined}>
        {heading}
      </h1>
      {sub && <p className="w-sub">{sub}</p>}
    </header>
  );
  const others = deck.filter((p) => p.id !== question?.id);
  const context = (
    <>
      {(others.length > 0 || question || editing) && (
        <section className="w-qs">
          <h2 className="w-kick">{question || editing ? "Or another of today’s questions" : own ? "Or one of today’s questions" : `Or one of today’s questions for ${story.name}`}</h2>
          <ul>
            {others.map((p) => (
              <li key={p.id}>
                <Link className="w-q" to={`/write?q=${encodeURIComponent(p.id)}`}>
                  {p.question}
                  {drafted.has(p.id) && <small>a page begun</small>}
                </Link>
              </li>
            ))}
            {(question || editing) && (
              <li>
                <Link className="w-q own" to="/write">
                  Or something else, in your own words
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </>
  );
  const pencil = (
    <p className={`w-pencil${asked ? " asked" : ""}`} aria-live="polite">
      <span>{asked ? asked : "A few lines is plenty."}</span>
      <svg viewBox="0 0 70 34" width="70" height="34">
        <path d="M4 6 C18 22 36 30 62 26 M62 26 L54 19 M62 26 L55 32" />
      </svg>
    </p>
  );
  const tools = (
    <section className="w-help">
      <h2 className="w-kick">If you’d like a hand</h2>
      <div className="w-tool-list">
        {dictation.available && (
          <button type="button" className={`w-tool speak${dictation.listening ? " listening" : ""}`} aria-pressed={dictation.listening} onClick={dictation.toggle}>
            <MicIcon />
            <span>
              <b>{dictation.listening ? "Stop listening" : "Speak instead"}</b>
              <small>{dictation.listening ? "The words land on the page as you talk." : "Talk, and the words land on the page."}</small>
            </span>
          </button>
        )}
        <button type="button" className="w-tool" onClick={() => help("tidy")} disabled={helpsOff} aria-busy={busy === "tidy" || undefined}>
          <SparkIcon />
          <span>
            <b>{busy === "tidy" ? "Tidying…" : "Tidy my words"}</b>
          </span>
        </button>
        <button type="button" className="w-tool" onClick={() => help("title")} disabled={helpsOff} aria-busy={busy === "title" || undefined}>
          <PenIcon />
          <span>
            <b>{busy === "title" ? "Finding a title…" : "Suggest a title"}</b>
          </span>
        </button>
        <button type="button" className="w-tool" onClick={() => help("ask")} disabled={helpsOff} aria-busy={busy === "ask" || undefined}>
          <HelpIcon />
          <span>
            <b>{busy === "ask" ? "Reading it…" : "What am I not saying?"}</b>
          </span>
        </button>
      </div>
      {empty && <p className="w-note w-help-off">Write a line and these can help.</p>}
      <div className="w-help-out" aria-live="polite">
        {spread && !rail && (toolState || asks.length > 0 || undo) && (
          <button
            type="button"
            className="w-slip-close"
            onClick={() => {
              setAsks([]);
              setHelped("");
              setUndo(null);
            }}
          >
            Done
          </button>
        )}
        {toolState && <p className="w-note done">{toolState}</p>}
        {asks.length > 0 && (
          <ul className="w-asks">
            {asks.map((a) => (
              <li key={a}>
                <button type="button" aria-pressed={asked === a} onClick={() => answerAsk(a)}>
                  {a}
                </button>
              </li>
            ))}
          </ul>
        )}
        {undo && (
          <button
            type="button"
            className="w-undo"
            onClick={() => {
              set({ body: undo });
              setUndo(null);
              setHelped("");
            }}
          >
            Put my own words back
          </button>
        )}
      </div>
    </section>
  );
  const keep = (
    <>
      <div className="w-keep-seal">
        <button ref={sealRef} type="button" className={`seal-button${pressed ? " pressed" : ""}`} onClick={save} disabled={busy === "save" || empty} aria-busy={busy === "save" || undefined}>
          <span className="seal" aria-hidden="true">
            <WaxSeal />
          </span>
          {busy === "save" ? "Keeping…" : keepLabel}
        </button>
        <p className="w-keep-note">
          {empty ? (
            <span>A line or two is enough to keep · </span>
          ) : (
            <span className="w-kbd-hint">
              {focus && (
                <>
                  <kbd>Esc</kbd> leaves focus,{" "}
                </>
              )}
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> keeps it ·{" "}
            </span>
          )}
          <Link to="/">Not now</Link>
        </p>
      </div>
      {spread && !rail && <div className="w-tools-row">{tools}</div>}
    </>
  );
  // the open journal (two pages) where the window has room for it; the help in the margin beside it on a large window
  const layout = spread ? (rail ? "spread rail" : "spread") : "single";

  return (
    <Shell bare wide>
      <div className={`page desk w-desk${focus ? " focus" : ""}`} ref={deskRef}>
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        {dictation.problem && <Problem message={dictation.problem} />}

        <div className={`w-grid ${layout}`}>
          {/* the book, open on the desk */}
          <div className="w-center">
            {!spread && questionHead}
            <div className="w-book" ref={bookRef}>
              <Dog awake={!empty || dictation.listening} />
              <Corners />
              <div className="w-pages">
                {spread && (
                  <section className="leaf-left" aria-label="Today">
                    <span className="page-frame" aria-hidden="true" />
                    <p className="running-head verso" aria-hidden="true">
                      <span>{bookName}</span>
                      <span>Memory No. {number}</span>
                    </p>
                    {questionHead}
                    <p className="w-orn" aria-hidden="true">
                      <i>✦</i>
                    </p>
                    {context}
                    {pencil}
                  </section>
                )}
                <article className="leaf-one" aria-label="The page">
                  <span className="page-frame" aria-hidden="true" />
                  <button type="button" className="w-focus" aria-pressed={focus} title={focus ? "Leave focus (Esc)" : "Focus: only the page"} onClick={() => setFocus((f) => !f)}>
                    {focus ? <ShrinkIcon /> : <ExpandIcon />}
                    <span>{focus ? "Leave focus" : "Focus"}</span>
                  </button>
                  <p className="running-head" aria-hidden="true">
                    {chapterName(d.era) && (
                      <>
                        <span className="rh-chapter">{chapterName(d.era)}</span>
                        <i>✦</i>
                      </>
                    )}
                    <span className="rh-date">
                      {shortDate()} · {partOfDay()}
                    </span>
                  </p>
                  {/* with the cloth put away, the question comes onto the page */}
                  {focus && question && <p className="w-focus-q">{question.question}</p>}
                  <textarea
                    ref={titleRef}
                    className="wtitle"
                    rows={1}
                    placeholder="A title, if one comes to mind"
                    value={d.title}
                    onChange={(e) => set({ title: e.target.value.split(String.fromCharCode(10)).join(" ") })}
                    aria-label="Title"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        bodyRef.current?.focus();
                      } else onKey(e);
                    }}
                  />
                  <p className="dear" aria-hidden="true">
                    Dear family,
                  </p>
                  {/* the ways to begin sit on the page itself, under "Dear family," */}
                  {empty && !dictation.listening && (
                    <div className="w-begin-inpage" aria-label="Ways to begin">
                      {starters.map((s) => (
                        <button key={s} type="button" onClick={() => insertStarter(s)}>
                          {s.trim()}…
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={bodyRef}
                    className="wbody"
                    placeholder={question ? "Start anywhere. A room, a smell, who was there." : "Start anywhere."}
                    value={d.body}
                    onChange={(e) => set({ body: e.target.value })}
                    onKeyDown={onKey}
                    aria-label="The memory"
                  />
                  {dictation.listening && (
                    <p className="heard" aria-live="polite">
                      {dictation.interim || "Listening…"}
                    </p>
                  )}
                  <p className="signoff" aria-hidden="true">
                    {own ? "Yours," : "As told by"}
                    <span>{story.name}</span>
                  </p>
                  <p className="folio">
                    <span>
                      {words} {words === 1 ? "word" : "words"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span aria-live="polite">{draftState === "saved" ? "Draft kept in this browser" : draftState === "saving" ? "Keeping the draft…" : "Nothing written yet"}</span>
                  </p>
                  <span className="leaf-ear" aria-hidden="true" />
                </article>
              </div>
              {/* the ribbon between the pages, its tail hanging below the book */}
              <span className="w-ribbon" aria-hidden="true" />
            </div>

            {!rail && <div className="w-keep">{keep}</div>}
          </div>

          {/* the margins: the help beside the book on a large window; below it, with the questions, on a smaller one */}
          {!spread && (
            <aside className="w-side w-context" aria-label="Today’s questions">
              {context}
            </aside>
          )}
          {(rail || !spread) && (
            <aside className="w-side w-tools" aria-label="Help with the words">
              {tools}
              {/* on a large window the seal lives in the margin, held in view with the help */}
              {rail && <div className="w-keep in-rail">{keep}</div>}
            </aside>
          )}
        </div>
      </div>
    </Shell>
  );
}
