/**
 * /read — what the printed book's codes open (T18). A code at a chapter's opener brings the chapter's memories
 * as the book prints them: the chapter's name on the cloth, then each memory with its title, its date, its
 * photograph, "Hear it" where there is a recording, the words, and the family's kept sides. The older code
 * beside one memory brings that memory alone. No sign-in: the key in the code is the credential, and the
 * server answers only with what the book already prints.
 *
 * No navigation, no footer, no plan or price words. One quiet "Keep this in A Story" at the foot.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { listenSrc, loadBook, parseReadQuery, type LoadResult, type ReadMemory, type ReadQuery } from "../../lib/bookRead";
import { headline, isEnd, pageTitle, reduce, startState } from "./machine";
import "../answer/answer.css";
import "../memory-link/memoryLink.css";
import "./read.css";

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="6" y="5" width="4.5" height="14" rx="1.2" fill="currentColor" />
    <rect x="13.5" y="5" width="4.5" height="14" rx="1.2" fill="currentColor" />
  </svg>
);

/** Their voice behind one button; autoplay is blocked everywhere, so a tap is the only way in. */
function HearIt({ src, who }: { src: string; who: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const label = who ? `Hear ${who} tell it` : "Hear it";
  return (
    <div className="ml-voice">
      <button type="button" className="ans-btn ans-primary rd-hear" onClick={toggle} aria-pressed={playing} disabled={broken}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span>{playing ? "Pause" : label}</span>
      </button>
      {broken && <p className="ans-note ans-center ans-warn">The recording could not be played. Try again in a moment.</p>}
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setBroken(true);
        }}
      />
    </div>
  );
}

const paragraphsOf = (text: string) =>
  text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

function MemoryBlock({ m, bookKey, single }: { m: ReadMemory; bookKey: string; single: boolean }) {
  const voice = m.hasVoice ? listenSrc(m.id, bookKey) : "";
  const Title = single ? "h1" : "h2";
  return (
    <article className="rd-memory">
      <div className="ml-head">
        <Title className={single ? "ans-q" : "rd-title"}>{m.title || "A memory"}</Title>
        {m.period && <p className="ml-when">{m.period}</p>}
      </div>
      {m.photoUrl && <img className="ml-photo" src={m.photoUrl} alt={m.title ? `Photograph: ${m.title}` : "Photograph"} loading="lazy" />}
      {voice && <HearIt src={voice} who={m.tellerName} />}
      {m.body && (
        <div className="ml-words">
          {paragraphsOf(m.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {m.sides.length > 0 && (
        <div className="rd-sides">
          {m.sides.map((s, i) => (
            <blockquote key={i} className="rd-side">
              {paragraphsOf(s.body).map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.name && <footer>{s.name}</footer>}
            </blockquote>
          ))}
        </div>
      )}
    </article>
  );
}

/**
 * One read per page load, whatever React does with effects (StrictMode runs them twice in development), so the
 * server is asked once for a code; "Try again" asks afresh.
 */
const reads = new Map<string, Promise<LoadResult>>();
function readOnce(search: string, q: ReadQuery, fresh = false): Promise<LoadResult> {
  if (fresh) reads.delete(search);
  let p = reads.get(search);
  if (!p) {
    p = loadBook(q);
    reads.set(search, p);
  }
  return p;
}

export default function ReadPage() {
  const { search } = useLocation();
  const q = useMemo(() => parseReadQuery(search), [search]);
  const [s, dispatch] = useReducer(reduce, q, startState);
  const statusRef = useRef<HTMLDivElement>(null);

  // load once (and afresh after "Try again")
  const retried = useRef(false);
  useEffect(() => {
    if (s.phase !== "loading") return;
    let live = true;
    const fresh = retried.current;
    retried.current = false;
    readOnce(search, q, fresh).then((result) => live && dispatch({ type: "LOADED", result }));
    return () => {
      live = false;
    };
  }, [s.phase, q, search]);
  const retry = () => {
    retried.current = true;
    dispatch({ type: "RETRY_LOAD" });
  };

  useEffect(() => {
    document.title = s.phase === "shown" ? pageTitle(q, s.memories) : "A Story";
  }, [s.phase, s.memories, q]);

  // each new step is read out, and keyboard focus follows it
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    statusRef.current?.focus({ preventScroll: true });
  }, [s.phase]);

  const bookKey = q.kind === "invalid" ? "" : q.key;

  // ── one message, nothing to read ──
  if (s.phase === "loading" || s.phase === "loadError" || isEnd(s.phase)) {
    let body: React.ReactNode;
    if (s.phase === "loading") body = <p className="ans-note">Opening the book…</p>;
    else if (s.phase === "loadError")
      body = (
        <>
          <p className="ans-note">
            {s.loadReason === "server" ? "Something went wrong on our side. Try again in a moment." : "The book could not be opened. Check the internet, then try again."}
          </p>
          <button type="button" className="ans-btn ans-primary" onClick={retry}>
            Try again
          </button>
        </>
      );
    else if (s.phase === "notReady")
      body = (
        <>
          <p className="ans-say ans-say-sm">This page isn’t switched on yet.</p>
          <p className="ans-note">Try the code again later.</p>
        </>
      );
    else
      body = (
        <>
          <p className="ans-say ans-say-sm">This code doesn’t match a book we know.</p>
          <p className="ans-note">Ask the family for a new copy.</p>
        </>
      );
    return (
      <main className={`ans ans-end ml rd is-${s.phase}`} aria-busy={s.phase === "loading"}>
        <header className="ans-cloth">
          <p className="ans-asked rd-mark">A Story</p>
        </header>
        <section className="ans-sheet">
          <div className="ans-status" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>
            {body}
          </div>
          {s.phase !== "loading" && (
            <a className="ml-keep" href="/welcome">
              Keep your family’s memories in A Story
            </a>
          )}
        </section>
      </main>
    );
  }

  // ── the chapter, or the one memory ──
  const single = q.kind === "memory";
  return (
    <main className="ans ml rd is-shown">
      <header className="ans-cloth">
        <p className="ans-asked rd-mark">A Story</p>
        {q.kind === "chapter" ? (
          <h1 className="rd-chapter">{headline(q, s.memories)}</h1>
        ) : (
          <p className="ans-asked">{headline(q, s.memories)}</p>
        )}
      </header>
      <section className="ans-sheet">
        <div className="rd-list" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>
          {s.memories.map((m) => (
            <MemoryBlock key={m.id} m={m} bookKey={bookKey} single={single} />
          ))}
        </div>
        <a className="ml-keep" href="/welcome">
          Keep this in A Story
        </a>
      </section>
    </main>
  );
}
