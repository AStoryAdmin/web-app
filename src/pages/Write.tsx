/**
 * The writing desk. The question (if one brought them here) sits on the
 * cloth; the page is one wide sheet in the serif: a title, the words, the
 * photographs. While the page is empty, a few sentence starters wait under
 * it. Beside the page, a quiet rail: when this was, the chapter, the
 * photographs, and Keep it. Focus mode hides everything but the page (Esc
 * leaves it). Speak instead of typing where the browser can listen.
 *
 * The draft autosaves to this browser; nothing is lost to a closed tab.
 * Ctrl/Cmd+Enter keeps it. Keeping confirms in place and offers the next
 * question; it never dumps the person in the Archive.
 *
 * Walls (Free): the daily questions are counted when a question is CHOSEN,
 * the weekly photos when the picker opens; never at Keep. Writing in your
 * own words is never metered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { CloseIcon, ExpandIcon, MicIcon, PhotoIcon, ShrinkIcon, SparkIcon } from "../components/icons";
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
import { track } from "../lib/analytics";
import type { Memory } from "../data/stories";

type Draft = { title: string; body: string; period: string; era: string; photos: string[]; questionId: string | null; memoryId: string };

const draftKey = (storyId: string, memoryId?: string | null) => `astory-draft-${storyId}${memoryId ? `-${memoryId}` : ""}`;

function readDraft(key: string): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

/** Sentence starters for an empty page: the question's own hint first, then the ones that work for anything. */
function startersFor(question: Prompt | null, own: boolean): string[] {
  const they = own ? "I" : "they";
  const generic = own
    ? ["It was the year ", "We were living in ", "I remember the smell of ", "The first thing I'd tell you is "]
    : [`${they} were living in `, "It was the year ", "The way it was told to me, ", "What I remember most is "];
  const fromQ = question?.hint ? [question.hint.replace(/[.?!]\s*$/, "") + " "] : [];
  return [...fromQ, ...generic].slice(0, 4);
}

const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function Photo({ url, onRemove }: { url: string; onRemove: () => void }) {
  const src = usePhotoUrl(url);
  return (
    <figure className="wphoto">
      {src ? <img src={src} alt="" /> : <span className="ph" />}
      <button type="button" className="x" onClick={onRemove} aria-label="Remove this photograph">
        <CloseIcon width={16} height={16} />
      </button>
    </figure>
  );
}

export default function Write() {
  const { user } = useAuth();
  const { account, activeStory: story, saveMemory } = useAccount();
  const [params] = useSearchParams();
  const qid = params.get("q");
  const editId = params.get("edit");
  const wantsPhoto = params.get("photo") === "1";
  const unlimited = isPaid(user?.plan ?? "free");
  const email = user?.email || "";

  const editing = useMemo(() => (story && editId ? story.memories.find((m) => m.id === editId) || null : null), [story, editId]);
  const question = useMemo<Prompt | null>(() => {
    if (!story || !qid) return null;
    const deck = todaysDeck(story, { unlimited: true });
    return deck.find((p) => p.id === qid) || null;
  }, [story, qid]);

  const key = story ? draftKey(story.id, editId) : "";
  const initial = useMemo<Draft>(() => {
    const saved = key ? readDraft(key) : null;
    if (editing) {
      return { title: editing.title, body: editing.body, period: editing.period, era: editing.era, photos: editing.photos, questionId: null, memoryId: editing.id, ...(saved && saved.memoryId === editing.id ? saved : {}) };
    }
    const base: Draft = { title: "", body: "", period: "", era: question?.era || "", photos: [], questionId: question?.id || null, memoryId: crypto.randomUUID() };
    return saved && (!question || saved.questionId === question.id) ? { ...base, ...saved } : base;
  }, [key, editing, question]);

  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState<"" | "save" | "tidy" | "title" | "ask" | "photo">("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Memory | null>(null);
  const [asks, setAsks] = useState<string[]>([]);
  const [undo, setUndo] = useState<string | null>(null);
  const [counted, setCounted] = useState(false);
  const [focus, setFocus] = useState(false);
  const [draftState, setDraftState] = useState<"" | "saving" | "saved">("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  const set = useCallback((patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch })), []);

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
    if (!key || saved) return;
    if (!(d.body || d.title || d.photos.length)) return;
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
  }, [d, key, saved]);

  // A guided question counts against the day when it is chosen, not at Keep.
  useEffect(() => {
    if (!question || counted || unlimited || editing) return;
    if (dailyPromptsLeft(email) <= 0) return;
    incrementDailyPrompts(email);
    queueMicrotask(() => setCounted(true));
    track("question_shown", { question_id: question.id, depth: question.depth ?? 0, mode_offered: "write" });
  }, [question, counted, unlimited, editing, email]);

  useEffect(() => {
    if (wantsPhoto) setTimeout(() => fileRef.current?.click(), 300);
  }, [wantsPhoto]);

  // Autosize the page as they write.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(focus ? 420 : 280, el.scrollHeight)}px`;
  }, [d.body, focus, dictation.interim]);

  // Focus mode: only the page; Esc leaves.
  useEffect(() => {
    document.body.classList.toggle("writing-focus", focus);
    if (!focus) return;
    bodyRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("writing-focus");
    };
  }, [focus]);

  if (account === undefined) return <Shell compact><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;

  const own = story.relationship === "Myself";
  const decades = decadesForLife(story) as number[];
  const era = d.era || (parseYear(d.period) ? (eraForAge(ageAt(story, parseYear(d.period))) as string | null) || "" : "") || "Anything else";
  const yearsHint = suggestYearsForEra(story, era) as { from: number; to: number; ages: [number, number] } | null;
  const words = countWords(d.body);
  const starters = startersFor(question, own);

  const insertStarter = (s: string) => {
    set({ body: d.body.trimEnd() ? `${d.body.trimEnd()}\n\n${s}` : s });
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
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
    setBusy("photo");
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, allowed)) urls.push(await uploadMemoryPhoto(story.id, d.memoryId, f));
      if (!unlimited) incrementWeeklyPhotos(email, urls.length);
      set({ photos: [...d.photos, ...urls] });
      if (allowed < files.length) setError(`That's ${FREE_WEEKLY_PHOTOS} photographs for this week on Free; the rest didn't go in.`);
    } catch (err) {
      setError(`A photograph didn't upload (${(err as Error)?.message || "unknown"}). The words are safe; try the picture again.`);
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const help = async (mode: "tidy" | "title" | "ask") => {
    const about = own ? "" : story.name;
    setBusy(mode);
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
      }
    } finally {
      setBusy("");
    }
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
      period: d.period.trim(),
      photos: d.photos,
      cover: editing?.cover && d.photos.includes(editing.cover) ? editing.cover : d.photos[0] || null,
      status: "saved",
      createdAt: editing?.createdAt,
    });
    try {
      await saveMemory(memory, story.id);
      try {
        localStorage.removeItem(key);
      } catch {
        /* fine */
      }
      track("memory_saved", { mode: 1, chapter: era, has_photo: d.photos.length > 0, from_question: Boolean(question) });
      if (question) track("question_answered", { question_id: question.id, mode: "write" });
      const r = keepRef.current?.getBoundingClientRect();
      if (r) inkStamp(r.left + r.width / 2, r.top + r.height / 2);
      setFocus(false);
      setTimeout(() => {
        setSaved(memory);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 520);
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

  if (saved) {
    const deck = todaysDeck(story, { unlimited });
    const remaining = deck.filter((p) => p.id !== question?.id).length;
    const next = deck.find((p) => p.id !== question?.id) || null;
    return (
      <Shell
        back="/"
        hero={
          <>
            <p className="label" data-rise>
              Kept in {own ? "your" : `${story.name}'s`} story
            </p>
            <h1 className="story-title">{saved.title}</h1>
            <p className="meta" data-rise style={{ marginTop: "var(--s-3)" }}>
              {era}
              {saved.period ? ` · ${saved.period}` : ""}
              {saved.photos.length ? ` · ${saved.photos.length} ${saved.photos.length === 1 ? "photograph" : "photographs"}` : ""}
            </p>
          </>
        }
      >
        <div className="page">
          <div className="savedbox">
            {next && !editing ? (
              <>
                <p className="label">{unlimited ? "There's time for another." : `There's time for another. ${remaining} more ${remaining === 1 ? "question" : "questions"} waiting today.`}</p>
                <p className="story-q" style={{ fontSize: 28, margin: "var(--s-3) 0 0", maxWidth: "24ch" }}>
                  {next.question}
                </p>
              </>
            ) : (
              <p className="story-q" style={{ fontSize: 24 }}>
                {editing ? "The changes are in." : "That's today's questions. Three new ones in the morning."}
              </p>
            )}
            <div className="acts" style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              {next && !editing && (
                <ButtonLink to={`/write?q=${encodeURIComponent(next.id)}`} onClick={() => setSaved(null)}>
                  Answer it
                </ButtonLink>
              )}
              <ButtonLink to={`/archive/${saved.id}`} variant="outline">
                Read it
              </ButtonLink>
              <ButtonLink to="/" variant="quiet">
                Home
              </ButtonLink>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const hero = question ? (
    <>
      <p className="label" data-rise>
        {own ? "A question for you" : `A question for ${story.name}`}
      </p>
      <h1 className="story-title" style={{ maxWidth: "22ch", fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 1.18 }}>
        {question.question}
      </h1>
      {(noteFor(question) || question.hint) && (
        <p className="meta" data-rise style={{ marginTop: "var(--s-3)", maxWidth: "60ch" }}>
          {noteFor(question) || question.hint}
        </p>
      )}
    </>
  ) : (
    <>
      <p className="label" data-rise>
        {editing ? "Editing" : "In your own words"}
      </p>
      <h1 className="hero-title">{editing ? "Edit this memory" : own ? "A memory for your story" : `A memory for ${story.name}'s story`}</h1>
    </>
  );

  const keepLabel = editing ? "Keep the changes" : own ? "Keep it" : `Keep it in ${story.name}'s story`;

  return (
    <Shell compact back={true} hero={hero}>
      <div className="page">
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        {dictation.problem && <Problem message={dictation.problem} onDismiss={() => {}} />}

        <div className="desk">
          <div className="pageside">
            <div className="runhead">
              <span className="date">
                {longDate()} · {own ? "Your story" : `${story.name}'s story`}
              </span>
              <div className="tools">
                <button type="button" className="iconbtn" aria-pressed={focus} aria-label={focus ? "Leave focus mode" : "Focus mode: only the page"} title={focus ? "Leave focus (Esc)" : "Focus mode"} onClick={() => setFocus((f) => !f)}>
                  {focus ? <ShrinkIcon /> : <ExpandIcon />}
                </button>
              </div>
            </div>

            <input className="wtitle" placeholder="A title, if one comes to mind" value={d.title} onChange={(e) => set({ title: e.target.value })} aria-label="Title" onKeyDown={onKey} />
            <textarea
              ref={bodyRef}
              className="wbody"
              placeholder={question ? "Start anywhere. A room, a smell, who was there." : "What would you like to keep today?"}
              value={d.body}
              onChange={(e) => set({ body: e.target.value })}
              onKeyDown={onKey}
              aria-label="The memory"
              autoFocus={!wantsPhoto}
            />
            {dictation.listening && <p className="heard" aria-live="polite">{dictation.interim || "Listening…"}</p>}

            {!d.body.trim() && !dictation.listening && (
              <div className="starters" aria-label="Ways to begin">
                <span className="label">Ways to begin</span>
                {starters.map((s) => (
                  <button key={s} type="button" onClick={() => insertStarter(s)}>
                    {s.trim()}…
                  </button>
                ))}
              </div>
            )}

            {d.photos.length > 0 && (
              <div className="wphotos">
                {d.photos.map((u) => (
                  <Photo key={u} url={u} onRemove={() => set({ photos: d.photos.filter((x) => x !== u) })} />
                ))}
              </div>
            )}

            <div className="helprow">
              <span className="label">Help</span>
              {dictation.available && (
                <Button variant="outline" small icon={<MicIcon />} className={dictation.listening ? "listening" : ""} onClick={dictation.toggle} aria-pressed={dictation.listening}>
                  {dictation.listening ? "Stop listening" : "Speak instead"}
                </Button>
              )}
              <Button variant="outline" small icon={<SparkIcon />} loading={busy === "tidy"} onClick={() => help("tidy")} disabled={!d.body.trim()}>
                Tidy my words
              </Button>
              <Button variant="outline" small loading={busy === "title"} onClick={() => help("title")} disabled={!d.body.trim()}>
                Suggest a title
              </Button>
              <Button variant="outline" small loading={busy === "ask"} onClick={() => help("ask")} disabled={!d.body.trim()}>
                What am I not saying?
              </Button>
              {undo && (
                <Button
                  variant="quiet"
                  small
                  onClick={() => {
                    set({ body: undo });
                    setUndo(null);
                  }}
                >
                  Keep mine
                </Button>
              )}
            </div>
            {asks.length > 0 && (
              <div className="asks">
                {asks.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="chip big"
                    onClick={() => {
                      set({ body: `${d.body.trimEnd()}\n\n` });
                      setAsks([]);
                      bodyRef.current?.focus();
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            <p className="folio">
              <span>
                {words} {words === 1 ? "word" : "words"}
              </span>
              <span>{draftState === "saved" ? "Draft kept in this browser" : draftState === "saving" ? "Keeping the draft…" : "Nothing written yet"}</span>
            </p>
          </div>

          <aside className="rail" aria-label="About this memory">
            <section className="keep keepbar">
              <Button ref={keepRef} loading={busy === "save"} onClick={save} disabled={busy === "photo"} block>
                {keepLabel}
              </Button>
              <p className="status">
                <b>Ctrl+Enter</b> keeps it · <Link to="/">Not now</Link>
              </p>
            </section>

            <section>
              <h2>When was this?</h2>
              <p className="meta" style={{ marginBottom: "var(--s-3)" }}>
                Only the year matters, and a decade will do.{yearsHint ? ` ${own ? "You" : story.name} would have been ${yearsHint.ages[0]} to ${yearsHint.ages[1]}, so ${yearsHint.from}–${yearsHint.to}.` : ""}
              </p>
              <div className="chiprow">
                {decades.map((dec) => (
                  <button key={dec} type="button" className="chip big" aria-pressed={d.period === formatDecade(dec)} onClick={() => set({ period: d.period === formatDecade(dec) ? "" : (formatDecade(dec) as string) })}>
                    {formatDecade(dec) as string}
                  </button>
                ))}
              </div>
              <label className="field" style={{ marginTop: "var(--s-4)", marginBottom: 0 }}>
                <span>Or in your words</span>
                <span className="input">
                  <input placeholder="June 1975, or Summer of '68" value={d.period} onChange={(e) => set({ period: e.target.value })} />
                </span>
              </label>
            </section>

            <section>
              <h2>Chapter</h2>
              <details>
                <summary>
                  <b>{era}</b>
                  {d.era ? "" : <span className="meta"> · chosen for you</span>}
                </summary>
                <div className="chiprow" style={{ marginTop: "var(--s-3)" }}>
                  {(ERAS as string[]).map((e) => (
                    <button key={e} type="button" className="chip big" aria-pressed={era === e} onClick={() => set({ era: e })}>
                      {e}
                      {e === FAITH_CHAPTER && !unlimited ? " · always open" : ""}
                    </button>
                  ))}
                </div>
              </details>
            </section>

            <section>
              <h2>Photographs</h2>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
              <Button variant="outline" small icon={<PhotoIcon />} loading={busy === "photo"} onClick={() => fileRef.current?.click()}>
                {d.photos.length ? "Add another" : "Add a photograph"}
              </Button>
              <p className="meta" style={{ marginTop: "var(--s-3)" }}>
                {d.photos.length ? `${d.photos.length} with this memory.` : "The first one becomes its cover in the book."}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
