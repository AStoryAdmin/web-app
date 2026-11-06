/**
 * /m/:token — the link to one memory (T19). Daniel sends his father, who is
 * not in A Story, one memory: this page opens it on his phone with nothing
 * to install and nothing to sign in to. The sender's initial on the cloth,
 * "Daniel sent you this memory", the title large, the photograph, one big
 * "Hear it" button for the voice, then the words. It opens once: a link
 * opened before says so and names who to ask for a new one.
 *
 * No navigation, no footer, no plan or price words. One quiet "Keep this in
 * A Story" at the foot, and nothing else.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { listenSrc, loadMemory, type LoadResult } from "../../lib/memoryLink";
import { closedLine, initialState, isEnd, lengthWords, reduce } from "./machine";
import "../answer/answer.css";
import "./memoryLink.css";

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

/** Their voice behind one large button; autoplay is blocked everywhere, so a tap is the only way in. */
function HearIt({ src, who, length }: { src: string; who: string; length: string }) {
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
      <button type="button" className="ans-btn ans-primary ans-record ml-hear" onClick={toggle} aria-pressed={playing} disabled={broken}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span>{playing ? "Pause" : label}</span>
        {length && !broken && <small>{length}</small>}
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

/**
 * One read per page load, whatever React does with effects (StrictMode runs them twice in development):
 * a second read of a link would mark it opened and show "opened already" before the memory was ever seen.
 * "Try again" clears it.
 */
const reads = new Map<string, Promise<LoadResult>>();
function readOnce(token: string, fresh = false): Promise<LoadResult> {
  if (fresh) reads.delete(token);
  let p = reads.get(token);
  if (!p) {
    p = loadMemory(token);
    reads.set(token, p);
  }
  return p;
}

function Seal({ name }: { name: string }) {
  const initial = (name.trim()[0] || "A").toLocaleUpperCase();
  return (
    <div className="ans-face ans-seal" aria-hidden="true">
      <span>{initial}</span>
    </div>
  );
}

export default function MemoryLinkPage() {
  const { token = "" } = useParams();
  const [s, dispatch] = useReducer(reduce, initialState);
  const statusRef = useRef<HTMLDivElement>(null);

  // load once (and afresh after "Try again")
  const retried = useRef(false);
  useEffect(() => {
    if (s.phase !== "loading") return;
    let live = true;
    const fresh = retried.current;
    retried.current = false;
    readOnce(token, fresh).then((result) => live && dispatch({ type: "LOADED", result }));
    return () => {
      live = false;
    };
  }, [s.phase, token]);
  const retry = () => {
    retried.current = true;
    dispatch({ type: "RETRY_LOAD" });
  };

  useEffect(() => {
    document.title = s.memory?.title ? `${s.memory.title} · A Story` : "A Story";
  }, [s.memory]);

  // each new step is read out, and keyboard focus follows it
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    statusRef.current?.focus({ preventScroll: true });
  }, [s.phase]);

  const sender = s.senderName || s.memory?.senderName || "";
  const paragraphs = (s.memory?.body || "")
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // ── one message, nothing to play ──
  if (s.phase === "loading" || s.phase === "loadError" || isEnd(s.phase)) {
    let body: React.ReactNode;
    if (s.phase === "loading") body = <p className="ans-note">Opening the memory…</p>;
    else if (s.phase === "loadError")
      body = (
        <>
          <p className="ans-note">
            {s.loadReason === "server" ? "Something went wrong on our side. Try again in a moment." : "The memory could not be opened. Check the internet, then try again."}
          </p>
          <button type="button" className="ans-btn ans-primary" onClick={retry}>
            Try again
          </button>
        </>
      );
    else if (s.phase === "notReady")
      body = (
        <>
          <p className="ans-say ans-say-sm">This link isn’t switched on yet.</p>
          <p className="ans-note">{closedLine(sender).replace("to send a new one", "to try again later")}</p>
        </>
      );
    else
      body = (
        <>
          <p className="ans-say ans-say-sm">This link has been opened already.</p>
          <p className="ans-note">{closedLine(sender)}</p>
        </>
      );
    return (
      <main className={`ans ans-end ml is-${s.phase}`} aria-busy={s.phase === "loading"}>
        <header className="ans-cloth">{sender && <Seal name={sender} />}</header>
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

  // ── the memory, and its voice ──
  const m = s.memory!;
  const teller = m.tellerName.trim();
  const line = sender ? `${sender} sent you this memory${teller ? ` from ${teller}’s story` : ""}` : teller ? `A memory from ${teller}’s story` : "A memory";
  const voice = m.hasVoice ? listenSrc(token) : "";
  return (
    <main className="ans ml is-shown">
      <header className="ans-cloth">
        {sender && <Seal name={sender} />}
        <p className="ans-asked">{line}</p>
      </header>
      <section className="ans-sheet">
        <div className="ml-head" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>
          <h1 className="ans-q">{m.title || "A memory"}</h1>
          {m.period && <p className="ml-when">{m.period}</p>}
        </div>
        {m.photoUrl && <img className="ml-photo" src={m.photoUrl} alt={m.title ? `Photograph: ${m.title}` : "Photograph"} />}
        {voice && <HearIt src={voice} who={teller} length={lengthWords(m.audioSeconds)} />}
        {paragraphs.length > 0 && (
          <div className="ml-words">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        <p className="ml-once">This link opens once. The memory stays with {teller ? `${teller}’s` : "the"} family on A Story.</p>
        <a className="ml-keep" href="/welcome">
          Keep this in A Story
        </a>
      </section>
    </main>
  );
}
