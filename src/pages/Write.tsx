/**
 * Writing a memory in the family book itself. The book lies open on the
 * desk: the verso holds the memory's number, when it was, the question as
 * an epigraph, the chapter, the photographs and the wax seal that keeps
 * it; the recto is ruled for the words, with a title line, sentence
 * starters while it is empty, and the storyteller's sign-off. Focus mode
 * keeps only the recto (Esc leaves it). Speak instead of typing where the
 * browser can listen.
 *
 * The draft autosaves to this browser; nothing is lost to a closed tab.
 * Ctrl/Cmd+Enter keeps it. Keeping presses the seal and confirms in place
 * with the next question; it never dumps the person in the Archive.
 *
 * Walls (Free): the daily questions are counted when a question is CHOSEN,
 * the weekly photos when the picker opens; never at Keep. Writing in your
 * own words is never metered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import Shell from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { CheckIcon, CloseIcon, ExpandIcon, MicIcon, PhotoIcon, ShrinkIcon, SparkIcon } from "../components/icons";
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
  const generic = own
    ? ["It was the year ", "We were living in ", "I remember the smell of ", "The first thing I'd tell you is "]
    : ["They were living in ", "It was the year ", "The way it was told to me, ", "What I remember most is "];
  const fromQ = question?.hint ? [question.hint.replace(/[.?!]\s*$/, "") + " "] : [];
  return [...fromQ, ...generic].slice(0, 4);
}

const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function Photo({ url, tilt, onRemove }: { url: string; tilt: number; onRemove: () => void }) {
  const src = usePhotoUrl(url);
  return (
    <figure className="wphoto" style={{ ["--tilt" as string]: `${tilt}deg` }}>
      {src ? <img src={src} alt="" /> : <span className="ph" />}
      <button type="button" className="x" onClick={onRemove} aria-label="Remove this photograph">
        <CloseIcon />
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
  const wantsDetails = params.get("details") === "1" || wantsPhoto;
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
  const [pressed, setPressed] = useState(false);
  const [keptNumber, setKeptNumber] = useState<number | null>(null);
  const [draftState, setDraftState] = useState<"" | "saving" | "saved">("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const spreadRef = useRef<HTMLElement>(null);

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

  // The page grows with the words, in whole ruled lines; the title line grows too.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lines = Math.ceil(el.scrollHeight / 36) + 1;
    el.style.height = `${Math.max(focus ? 14 : 11, lines) * 36}px`;
  }, [d.body, focus, dictation.interim]);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [d.title, focus]);

  // Focus mode: only the recto; Esc leaves.
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

  // The book settles on the desk, then the running heads and the sign-off are inked in with the pen.
  useEffect(() => {
    const el = spreadRef.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const blank = { clipPath: "inset(-30% 100% -30% 0)" };
      const inked = { clipPath: "inset(-30% 0% -30% 0)", ease: "power2.inOut", clearProps: "clipPath" };
      gsap
        .timeline()
        .fromTo(el, { y: 16, rotation: -0.6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.6, ease: "power3.out", clearProps: "transform,opacity" })
        .fromTo(el.querySelectorAll(".folio-top, .running-head"), blank, { ...inked, duration: 0.7, stagger: 0.1 }, "-=0.2")
        .fromTo(el.querySelectorAll(".signoff span"), blank, { ...inked, duration: 0.8 }, "-=0.3");
    });
    return () => mm.revert();
  }, [saved]);

  if (account === undefined) return <Shell compact><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;

  const own = story.relationship === "Myself";
  const decades = decadesForLife(story) as number[];
  const era = d.era || (parseYear(d.period) ? (eraForAge(ageAt(story, parseYear(d.period))) as string | null) || "" : "") || "Anything else";
  const yearsHint = suggestYearsForEra(story, era) as { from: number; to: number; ages: [number, number] } | null;
  const words = countWords(d.body);
  const starters = startersFor(question, own);
  const number = editing ? Math.max(1, [...story.memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).findIndex((m) => m.id === editing.id) + 1) : story.memories.length + 1;
  const bookName = story.lastName ? `The ${story.lastName} book` : own ? "Your book" : `${story.name}'s book`;
  const periodYear = /^\s*\d{4}\s*$/.test(d.period) ? parseYear(d.period) : null;

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
      // The seal presses, the ink stamp lands, then the page confirms.
      setPressed(true);
      setKeptNumber(number);
      const seal = sealRef.current?.querySelector(".seal") as HTMLElement | null;
      if (seal && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(seal, { scale: 2.4, rotation: -40, opacity: 0 }, { scale: 1, rotation: -8, opacity: 1, duration: 0.42, ease: "back.out(1.4)" });
        const r = seal.getBoundingClientRect();
        setTimeout(() => inkStamp(r.left + r.width / 2 + 120, r.top + r.height / 2), 260);
      }
      setFocus(false);
      setTimeout(() => {
        setSaved(memory);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1100);
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
              Kept in {bookName}
            </p>
            <h1 className="story-title">{saved.title}</h1>
            <p className="meta" data-rise style={{ marginTop: "var(--s-3)" }}>
              Memory No. {keptNumber ?? number} · {era}
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
                <span className="pill gold">{unlimited ? "There's time for another" : `${remaining} more ${remaining === 1 ? "question" : "questions"} waiting today`}</span>
                <p className="story-q" style={{ fontSize: 28, margin: "var(--s-4) 0 0", maxWidth: "24ch" }}>
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
              <ButtonLink to={`/write?edit=${saved.id}&details=1`} variant="quiet" onClick={() => setSaved(null)}>
                {saved.photos.length || saved.period ? "Add to it" : "Add when it was, or a photograph"}
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

  const keepLabel = editing ? "Keep the changes" : "Keep it";
  const todayLine = longDate();

  return (
    <Shell compact back={true} title={editing ? "Edit this memory" : own ? "A memory for your story" : `A memory for ${story.name}'s story`}>
      <div className="page">
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        {dictation.problem && <Problem message={dictation.problem} onDismiss={() => {}} />}

        <div className="bookdesk">
          <div className="cover">
            <article className="spread" ref={spreadRef}>
              <section className="leaf verso" aria-label="About this memory">
                <div className="verso-in">
                <p className="folio-top">
                  <span>{bookName}</span>
                  <span>Memory No. {number}</span>
                </p>
                <header className="masthead">
                  <span className="big" aria-hidden="true">
                    {number}
                  </span>
                  <div>
                    <h2>{periodYear ? String(periodYear) : d.period || "When was this?"}</h2>
                    <p>{era}</p>
                  </div>
                </header>
                <p className="ornament" aria-hidden="true">
                  <span>✦</span>
                </p>
                {question ? (
                  <blockquote className="epigraph">
                    <p>{question.question}</p>
                    <cite>{own ? "Today's question" : `A question for ${story.name}`}</cite>
                  </blockquote>
                ) : (
                  <blockquote className="epigraph">
                    <p>Anything at all. A kitchen, a road, a song on the radio.</p>
                    <cite>In your own words</cite>
                  </blockquote>
                )}
                {question && (noteFor(question) || question.hint) && <p className="meta" style={{ fontSize: 14 }}>{noteFor(question) || question.hint}</p>}

                <details className="more" open={wantsDetails || Boolean(editing) || undefined}>
                  <summary>
                    {d.period || d.photos.length || d.era ? [d.period, d.era, d.photos.length ? `${d.photos.length} ${d.photos.length === 1 ? "photograph" : "photographs"}` : ""].filter(Boolean).join(" · ") : "When it was, the chapter, a photograph"}
                  </summary>
                <div className="block">
                  <span>When was this</span>
                  <div className="chiprow">
                    {decades.map((dec) => (
                      <button key={dec} type="button" className="chip big" aria-pressed={d.period === formatDecade(dec)} onClick={() => set({ period: d.period === formatDecade(dec) ? "" : (formatDecade(dec) as string) })}>
                        {(formatDecade(dec) as string).replace(/^the /, "")}
                      </button>
                    ))}
                  </div>
                  <label className="field" style={{ margin: "var(--s-3) 0 0", maxWidth: 300 }}>
                    <span className="sr-only">Or the date in your words</span>
                    <span className="input">
                      <input placeholder="or June 1975, Summer of '68…" value={d.period} onChange={(e) => set({ period: e.target.value })} />
                    </span>
                  </label>
                  {yearsHint && (
                    <p className="meta" style={{ fontSize: 13, marginTop: 6 }}>
                      {own ? "You" : story.name} would have been {yearsHint.ages[0]} to {yearsHint.ages[1]}, so {yearsHint.from}–{yearsHint.to}.
                    </p>
                  )}
                </div>

                <div className="block">
                  <span>Chapter</span>
                  <details>
                    <summary>
                      {era}
                      {d.era ? "" : <span className="meta" style={{ fontSize: 13 }}> · chosen for you</span>}
                    </summary>
                    <div className="chiprow" style={{ marginTop: "var(--s-2)" }}>
                      {(ERAS as string[]).map((e) => (
                        <button key={e} type="button" className="chip big" aria-pressed={era === e} onClick={() => set({ era: e })}>
                          {e}
                          {e === FAITH_CHAPTER && !unlimited ? " · always open" : ""}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>

                <div className="block">
                  <span>Photographs</span>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
                  <button type="button" className="attach" onClick={() => fileRef.current?.click()} disabled={busy === "photo"}>
                    <PhotoIcon /> {busy === "photo" ? "One moment…" : d.photos.length ? "Add another photograph" : "Attach a photograph"}
                  </button>
                  {d.photos.length > 0 && (
                    <div className="wphotos">
                      {d.photos.map((u, i) => (
                        <Photo key={u} url={u} tilt={[-3, 2, -1, 3][i % 4]} onRemove={() => set({ photos: d.photos.filter((x) => x !== u) })} />
                      ))}
                    </div>
                  )}
                </div>

                </details>
                <footer className="verso-foot">
                  <button ref={sealRef} type="button" className={`seal-button${pressed ? " pressed" : ""}`} onClick={save} disabled={busy === "photo" || busy === "save" || !d.body.trim()}>
                    <span className="seal" aria-hidden="true">
                      <CheckIcon />
                    </span>
                    {busy === "save" ? "Keeping…" : keepLabel}
                  </button>
                  <small>
                    <b>Ctrl+Enter</b> keeps it · <Link to="/">Not now</Link>
                  </small>
                </footer>
                </div>
                <p className="page-no" aria-hidden="true">
                  {number * 2 - 1}
                </p>
                <span className="page-frame" aria-hidden="true" />
              </section>

              <section className="leaf recto">
                <button type="button" className="focusbtn" aria-pressed={focus} aria-label={focus ? "Leave focus mode" : "Focus mode: only the page"} title={focus ? "Leave focus (Esc)" : "Focus mode"} onClick={() => setFocus((f) => !f)}>
                  {focus ? <ShrinkIcon /> : <ExpandIcon />}
                </button>
                <p className="running-head" aria-hidden="true">
                  <span>{era}</span>
                  <i>✦</i>
                  <span>{d.period || todayLine}</span>
                </p>
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
                <p className="signoff" aria-hidden="true">
                  {own ? "Yours," : "As told by"}
                  <span>{story.name}</span>
                </p>
                <p className="folio">
                  <span>
                    {words} {words === 1 ? "word" : "words"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{draftState === "saved" ? "Draft kept in this browser" : draftState === "saving" ? "Keeping the draft…" : "Nothing written yet"}</span>
                </p>
                <p className="page-no" aria-hidden="true">
                  {number * 2}
                </p>
                <span className="page-frame" aria-hidden="true" />
              </section>
            </article>
          </div>
          <span className="ribbon" aria-hidden="true" />
        </div>

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
      </div>
    </Shell>
  );
}
