/**
 * Writing a memory. One wide page: the question at the top (if one brought
 * them here), a title, the page itself, photographs, "Help me write", and
 * at the end one row of decade chips for when it was. The draft autosaves
 * to this browser; nothing is lost to a closed tab. Saving confirms in
 * place and offers the next question. It never dumps the person in the
 * Archive.
 *
 * Walls (Free): the daily questions are counted when a question is CHOSEN,
 * the weekly photos when the picker opens; never at Save. Writing in your
 * own words is never metered.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { CloseIcon, PhotoIcon, SparkIcon } from "../components/icons";
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
  const navigate = useNavigate();
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
    const base: Draft = { title: question?.question && !saved?.title ? "" : "", body: "", period: "", era: question?.era || "", photos: [], questionId: question?.id || null, memoryId: crypto.randomUUID() };
    return saved && (!question || saved.questionId === question.id) ? { ...base, ...saved } : base;
  }, [key, editing, question]);

  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState<"" | "save" | "tidy" | "title" | "ask" | "photo">("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Memory | null>(null);
  const [asks, setAsks] = useState<string[]>([]);
  const [undo, setUndo] = useState<string | null>(null);
  const [counted, setCounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Autosave the draft to this browser.
  useEffect(() => {
    if (!key || saved) return;
    const t = setTimeout(() => {
      try {
        if (d.body || d.title || d.photos.length) localStorage.setItem(key, JSON.stringify(d));
      } catch {
        /* storage blocked */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [d, key, saved]);

  // A guided question counts against the day when it is chosen, not at Save.
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
    el.style.height = `${Math.max(240, el.scrollHeight)}px`;
  }, [d.body]);

  const set = useCallback((patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch })), []);

  if (account === undefined) return <Shell compact><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;

  const decades = decadesForLife(story) as number[];
  const era = d.era || (parseYear(d.period) ? (eraForAge(ageAt(story, parseYear(d.period))) as string | null) || "" : "") || "Anything else";
  const yearsHint = suggestYearsForEra(story, era) as { from: number; to: number; ages: [number, number] } | null;

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
    const about = story.relationship === "Myself" ? "" : story.name;
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
      setSaved(memory);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(`This memory hasn't been saved yet (${(err as Error)?.message || "no connection"}). Your words are still here; try again.`);
    } finally {
      setBusy("");
    }
  };

  if (saved) {
    const deck = todaysDeck(story, { unlimited });
    const remaining = deck.filter((p) => p.id !== question?.id).length;
    const next = deck.find((p) => p.id !== question?.id) || null;
    return (
      <Shell compact title="Saved" back="/">
        <div className="page">
          <div className="savedbox rise">
            <p className="label">Saved to {story.name}'s story</p>
            <h1 className="story-title">{saved.title}</h1>
            <p className="meta" style={{ marginTop: 8 }}>{era}{saved.period ? ` · ${saved.period}` : ""}{saved.photos.length ? ` · ${saved.photos.length} ${saved.photos.length === 1 ? "photograph" : "photographs"}` : ""}</p>
            {next && !editing ? (
              <>
                <p style={{ marginTop: "var(--s-6)" }}>{unlimited ? "There's time for another." : `There's time for another — ${remaining} more ${remaining === 1 ? "question" : "questions"} waiting today.`}</p>
                <p className="story-q" style={{ fontSize: 24, margin: "var(--s-3) 0 var(--s-5)" }}>{next.question}</p>
              </>
            ) : (
              <p style={{ marginTop: "var(--s-6)" }}>{editing ? "The changes are in." : "That's today's questions. Three new ones in the morning."}</p>
            )}
            <div className="acts" style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              {next && !editing && <ButtonLink to={`/write?q=${encodeURIComponent(next.id)}`} onClick={() => setSaved(null)}>Answer it</ButtonLink>}
              <ButtonLink to={`/archive/${saved.id}`} variant="outline">Read it</ButtonLink>
              <ButtonLink to="/" variant="quiet">Home</ButtonLink>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell compact title={editing ? "Edit memory" : "Write a memory"} back={true}>
      <div className="page writer">
        <div className="pagehead desk-only">
          <h1 className="grow" style={{ fontSize: "var(--t-h2)" }}>{editing ? "Edit this memory" : `A memory for ${story.name}'s story`}</h1>
          <Button variant="quiet" small onClick={() => navigate(-1)}>Close</Button>
        </div>
        {error && <Problem message={error} onDismiss={() => setError(null)} />}

        {question && (
          <div className="qline">
            <p className="label">The question</p>
            <p className="story-q" style={{ fontSize: 24 }}>{question.question}</p>
            {noteFor(question) && <p className="meta">{noteFor(question)}</p>}
            {question.hint && <p className="meta">{question.hint}</p>}
          </div>
        )}

        <div className="paper">
          <input className="wtitle" placeholder="A title, if one comes to mind" value={d.title} onChange={(e) => set({ title: e.target.value })} aria-label="Title" />
          <textarea
            ref={bodyRef}
            className="wbody story"
            placeholder={question ? "Start anywhere. A room, a smell, who was there." : "What would you like to keep today?"}
            value={d.body}
            onChange={(e) => set({ body: e.target.value })}
            aria-label="The memory"
            autoFocus={!wantsPhoto}
          />
          {d.photos.length > 0 && (
            <div className="wphotos">
              {d.photos.map((u) => (
                <Photo key={u} url={u} onRemove={() => set({ photos: d.photos.filter((x) => x !== u) })} />
              ))}
            </div>
          )}
          <div className="wtools">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
            <Button variant="outline" small icon={<PhotoIcon />} loading={busy === "photo"} onClick={() => fileRef.current?.click()}>
              Add a photograph
            </Button>
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
              <Button variant="quiet" small onClick={() => { set({ body: undo }); setUndo(null); }}>
                Keep mine
              </Button>
            )}
          </div>
          {asks.length > 0 && (
            <div className="asks">
              {asks.map((a) => (
                <button key={a} type="button" className="chip big" onClick={() => { set({ body: `${d.body.trimEnd()}\n\n` }); setAsks([]); bodyRef.current?.focus(); }}>
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="when" aria-labelledby="when-title">
          <h2 id="when-title" style={{ fontSize: "var(--t-lead)" }}>When was this?</h2>
          <p className="meta">Only the year matters, and a decade will do.{yearsHint ? ` ${story.name} would have been ${yearsHint.ages[0]} to ${yearsHint.ages[1]}, so ${yearsHint.from}–${yearsHint.to}.` : ""}</p>
          <div className="chiprow" style={{ marginTop: "var(--s-3)" }}>
            {decades.map((dec) => (
              <button key={dec} type="button" className="chip big" aria-pressed={d.period === formatDecade(dec)} onClick={() => set({ period: d.period === formatDecade(dec) ? "" : (formatDecade(dec) as string) })}>
                {formatDecade(dec) as string}
              </button>
            ))}
          </div>
          <label className="field" style={{ marginTop: "var(--s-4)", maxWidth: 360 }}>
            <span>Or the date, in your words</span>
            <span className="input">
              <input placeholder="June 1975, or Summer of '68" value={d.period} onChange={(e) => set({ period: e.target.value })} />
            </span>
          </label>
          <details className="chapter">
            <summary>Chapter: <b>{era}</b> {d.era ? "" : "(chosen for you; change it if you like)"}</summary>
            <div className="chiprow" style={{ marginTop: "var(--s-3)" }}>
              {(ERAS as string[]).map((e) => (
                <button key={e} type="button" className="chip big" aria-pressed={era === e} onClick={() => set({ era: e })}>
                  {e}{e === FAITH_CHAPTER && !unlimited ? " · always open" : ""}
                </button>
              ))}
            </div>
          </details>
        </section>

        <div className="savebar">
          <Button loading={busy === "save"} onClick={save} disabled={busy === "photo"}>
            {editing ? "Save changes" : `Save to ${story.name}'s story`}
          </Button>
          <Link to="/" className="meta" style={{ marginLeft: "var(--s-4)" }}>Not now</Link>
        </div>
      </div>
    </Shell>
  );
}
