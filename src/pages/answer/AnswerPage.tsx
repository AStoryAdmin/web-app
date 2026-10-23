/**
 * /a/:token — the elder's door. One question per link, opened from
 * Messages, WhatsApp or Zalo on any phone or tablet, with nothing to
 * install and nothing to sign in to. The asker's face, "Sam asked you" in
 * her language, the question large, Sam's voice behind one tap, and one
 * huge "Answer in your voice" button. If the microphone is refused or
 * missing, a plain place to write instead. Then "Sent to Sam."
 *
 * No navigation, no footer, no plan or price words: this page is the
 * whole of A Story for the person holding it.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { loadQuestion, sendText, sendVoice, SendError } from "../../lib/answerLink";
import { initialState, isEnd, reduce } from "./machine";
import { MicError, recordingSupported, useRecorder } from "./recorder";
import { pickLang, wordsFor, type Words } from "./words";
import "./answer.css";

const MAX_MS = 15 * 60 * 1000;

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
const MicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const StopIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
  </svg>
);

/** One sound behind one large button; autoplay is blocked everywhere, so a tap is the only way in. */
function PlayButton({ src, label, pauseLabel, className = "" }: { src: string; label: string; pauseLabel: string; className?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      document.querySelectorAll<HTMLAudioElement>(".ans audio").forEach((o) => o !== a && o.pause());
      a.play().catch(() => setPlaying(false));
    } else a.pause();
  };
  return (
    <>
      <button type="button" className={`ans-btn ans-play ${className}`} onClick={toggle} aria-pressed={playing}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span>{playing ? pauseLabel : label}</span>
      </button>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </>
  );
}

function Face({ name, photo, alt }: { name: string; photo: string | null; alt: string }) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim()[0] || "A").toLocaleUpperCase();
  return photo && !broken ? (
    <img className="ans-face" src={photo} alt={alt} onError={() => setBroken(true)} />
  ) : (
    <div className="ans-face ans-seal" aria-hidden="true">
      <span>{initial}</span>
    </div>
  );
}

/** A calm level meter: one soft halo that swells with her voice. No clock. */
function Meter({ level, label }: { level: number; label: string }) {
  return (
    <div className="ans-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
      <i style={{ transform: `scale(${0.72 + Math.min(1, level) * 0.28})` }} />
      <MicIcon />
    </div>
  );
}

function Cloth({ w, name, photo, line }: { w: Words; name?: string; photo?: string | null; line?: string }) {
  return (
    <header className="ans-cloth">
      {name !== undefined && <Face name={name} photo={photo ?? null} alt={w.photoAlt} />}
      {line && <p className="ans-asked">{line}</p>}
    </header>
  );
}

export default function AnswerPage() {
  const { token = "" } = useParams();
  const [s, dispatch] = useReducer(reduce, initialState);
  const rec = useRecorder();
  const statusRef = useRef<HTMLDivElement>(null);
  const canRecord = useMemo(() => recordingSupported(), []);

  const lang = pickLang(s.q?.language ?? (typeof navigator !== "undefined" ? navigator.language : "en"));
  const w = wordsFor(lang, {
    asker: s.q?.askerName || "",
    teller: s.q?.tellerName || "",
    title: s.q?.tellerTitle,
    askerKin: s.q?.askerKin,
    sentTo: s.sentTo,
  });

  // load (and load again after "Try again")
  useEffect(() => {
    if (s.phase !== "loading") return;
    let live = true;
    loadQuestion(token).then((result) => live && dispatch({ type: "LOADED", result }));
    return () => {
      live = false;
    };
  }, [s.phase, token]);

  // a browser that cannot record goes straight to the written answer
  useEffect(() => {
    if (s.phase === "ask" && !canRecord) dispatch({ type: "NO_MIC" });
  }, [s.phase, canRecord]);

  // her language on the document, for the screen reader and the browser's own words
  useEffect(() => {
    const html = document.documentElement;
    const before = html.lang;
    html.lang = lang;
    return () => {
      html.lang = before;
    };
  }, [lang]);
  useEffect(() => {
    document.title = s.q ? w.pageTitle : "A Story";
  }, [s.q, w.pageTitle]);

  // each new step is read out, and keyboard focus follows it
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (s.phase !== "starting") statusRef.current?.focus({ preventScroll: true });
  }, [s.phase]);

  // the take's object URL goes when the take does
  const takeUrl = s.take?.url;
  useEffect(
    () => () => {
      if (takeUrl) URL.revokeObjectURL(takeUrl);
    },
    [takeUrl],
  );

  const begin = useCallback(async () => {
    document.querySelectorAll<HTMLAudioElement>(".ans audio").forEach((a) => a.pause());
    try {
      await rec.start();
      dispatch({ type: "MIC_OK" });
    } catch (e) {
      if (!(e instanceof MicError)) console.warn("answer: mic:", e);
      dispatch({ type: "MIC_REFUSED" });
    }
  }, [rec]);

  const onRecord = () => {
    dispatch({ type: "RECORD" });
    if (s.micNoted) void begin();
  };
  const onMicGo = () => {
    dispatch({ type: "MIC_GO" });
    void begin();
  };
  const onStop = async () => {
    try {
      const take = await rec.stop();
      dispatch({ type: "STOPPED", take });
    } catch {
      dispatch({ type: "MIC_REFUSED" });
    }
  };
  // fifteen minutes is a long answer; stop there so it stays under the server's 10 MB, and let her listen and send
  const stopRef = useRef(onStop);
  useEffect(() => {
    stopRef.current = onStop;
  });
  useEffect(() => {
    if (s.phase !== "recording") return;
    const t = window.setTimeout(() => void stopRef.current(), MAX_MS);
    return () => window.clearTimeout(t);
  }, [s.phase]);
  const onRedoYes = () => {
    dispatch({ type: "REDO_YES" });
    void begin();
  };
  const onTryMic = () => {
    dispatch({ type: "TRY_MIC" });
    void begin();
  };
  const onSend = async () => {
    const kind = s.phase === "sendFailed" ? s.sending : s.take && s.phase === "review" ? "voice" : "text";
    dispatch({ type: "SEND" });
    try {
      const r = kind === "voice" && s.take ? await sendVoice(token, s.take.blob, s.take.durationMs) : await sendText(token, s.text);
      dispatch({ type: "SENT", sentTo: r.sentTo });
    } catch (e) {
      if (e instanceof SendError && e.kind !== "failed") dispatch({ type: "CLOSED", kind: e.kind });
      else dispatch({ type: "SEND_FAILED" });
    }
  };

  const q = s.q;
  const face = q ? { name: q.askerName, photo: q.askerPhotoUrl } : {};

  // ── one message, nothing else to do ──
  if (s.phase === "loading" || s.phase === "loadError" || isEnd(s.phase)) {
    let body: React.ReactNode;
    if (s.phase === "loading") body = <p className="ans-note">{w.loading}</p>;
    else if (s.phase === "loadError")
      body = (
        <>
          <p className="ans-note">{s.loadReason === "server" ? w.serverError : w.loadError}</p>
          <button type="button" className="ans-btn ans-primary" onClick={() => dispatch({ type: "RETRY_LOAD" })}>
            {w.tryAgain}
          </button>
        </>
      );
    else if (s.phase === "sent")
      body = (
        <>
          <h1 className="ans-say">{w.sentTitle}</h1>
          <p className="ans-thanks">{w.thanks}</p>
          <p className="ans-note">{s.sending === "text" ? w.sentText : w.sentVoice}</p>
        </>
      );
    else body = <p className="ans-say ans-say-sm">{s.phase === "expired" ? w.expired : s.phase === "answered" ? w.answered : w.notFound}</p>;
    return (
      <main className={`ans ans-end is-${s.phase}`} lang={lang} aria-busy={s.phase === "loading"}>
        <Cloth w={w} {...face} />
        <section className="ans-sheet">
          <div className="ans-status" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>
            {body}
          </div>
        </section>
      </main>
    );
  }

  // ── the question, and the one way to answer it ──
  const p = s.phase;
  let act: React.ReactNode = null;
  if (p === "ask")
    act = (
      <>
        <button type="button" className="ans-btn ans-primary ans-record" onClick={onRecord}>
          <MicIcon />
          <span>{w.record}</span>
        </button>
        <button type="button" className="ans-quiet" onClick={() => dispatch({ type: "WRITE" })}>
          {w.writeInstead}
        </button>
      </>
    );
  else if (p === "micNote")
    act = (
      <>
        <p className="ans-note">{w.micNote}</p>
        <button type="button" className="ans-btn ans-primary ans-record" onClick={onMicGo}>
          <MicIcon />
          <span>{w.micGo}</span>
        </button>
      </>
    );
  else if (p === "starting")
    act = (
      <button type="button" className="ans-btn ans-primary ans-record" disabled aria-busy="true">
        <MicIcon />
        <span>{w.record}</span>
      </button>
    );
  else if (p === "recording")
    act = (
      <>
        <Meter level={rec.level} label={w.level} />
        <p className="ans-note ans-center">{w.recording}</p>
        <button type="button" className="ans-btn ans-primary ans-record ans-stop" onClick={onStop}>
          <StopIcon />
          <span>{w.stop}</span>
        </button>
      </>
    );
  else if (p === "review" && s.take)
    act = (
      <>
        <div className="ans-pair">
          <PlayButton src={s.take.url} label={w.listen} pauseLabel={w.pause} />
          <button type="button" className="ans-btn" onClick={() => dispatch({ type: "REDO" })}>
            <span>{w.again}</span>
          </button>
        </div>
        <button type="button" className="ans-btn ans-primary ans-send" onClick={onSend}>
          <span>{w.send}</span>
        </button>
      </>
    );
  else if (p === "confirmRedo")
    act = (
      <>
        <p className="ans-note">{w.againAsk}</p>
        <div className="ans-pair">
          <button type="button" className="ans-btn" onClick={onRedoYes}>
            <span>{w.againYes}</span>
          </button>
          <button type="button" className="ans-btn ans-primary" onClick={() => dispatch({ type: "REDO_NO" })}>
            <span>{w.againNo}</span>
          </button>
        </div>
      </>
    );
  else if (p === "write")
    act = (
      <>
        {s.micRefused && <p className="ans-note">{w.micRefused}</p>}
        <label className="ans-label" htmlFor="ans-text">
          {w.writeLabel}
        </label>
        <textarea
          id="ans-text"
          className="ans-text"
          rows={6}
          maxLength={8000}
          placeholder={w.writePlaceholder}
          value={s.text}
          onChange={(e) => dispatch({ type: "TEXT", text: e.target.value })}
        />
        <button type="button" className="ans-btn ans-primary ans-send" onClick={onSend} disabled={!s.text.trim()}>
          <span>{w.send}</span>
        </button>
        {canRecord && (
          <button type="button" className="ans-quiet" onClick={onTryMic}>
            {s.micRefused ? w.tryMic : w.record}
          </button>
        )}
      </>
    );
  else if (p === "sending")
    act = (
      <button type="button" className="ans-btn ans-primary ans-send" disabled aria-busy="true">
        <span>{w.sending}</span>
      </button>
    );
  else if (p === "sendFailed")
    act = (
      <>
        <p className="ans-note ans-warn">{w.sendFailed}</p>
        <button type="button" className="ans-btn ans-primary ans-send" onClick={onSend}>
          <span>{w.tryAgain}</span>
        </button>
      </>
    );

  return (
    <main className={`ans is-${p}`} lang={lang}>
      <Cloth w={w} {...face} line={w.askedYou} />
      <section className="ans-sheet">
        <h1 className="ans-q">{q?.question}</h1>
        {q?.voiceUrl && p !== "recording" && p !== "starting" && (
          <PlayButton src={q.voiceUrl} label={w.hear} pauseLabel={w.pause} className="ans-hear" />
        )}
        <div className="ans-act" role="group" aria-live="polite" tabIndex={-1} ref={statusRef}>
          {act}
        </div>
      </section>
    </main>
  );
}
