/**
 * Read it back to me: the browser's own voice reads a memory aloud, in the
 * same quiet player as a recording. The words are read a sentence or two at
 * a time (long utterances stop early in some browsers), and the paragraph
 * being read is told to the page so it can mark it. Pause is a stop that
 * remembers its place; the browser's own pause is unreliable on phones.
 * Nothing here runs when the browser cannot speak; the player is simply
 * not there.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "../icons";
import { canSpeak, chunksOf } from "../../lib/readAloud";

const BARS = 40;
const HEIGHTS = Array.from({ length: BARS }, (_, k) => 30 + ((k * 37 + 11) % 55));
const WORDS_PER_SECOND = 2.3;

const fmt = (s: number) => {
  const n = Math.max(0, Math.round(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const want = (document.documentElement.lang || navigator.language || "en").toLowerCase();
  const base = want.split("-")[0];
  const score = (v: SpeechSynthesisVoice) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    let s = 0;
    if (lang === want) s += 8;
    else if (lang.startsWith(base)) s += 4;
    else return -1;
    if (/natural|premium|enhanced|neural/i.test(v.name)) s += 3;
    if (v.localService) s += 1;
    if (v.default) s += 1;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a)).find((v) => score(v) >= 0) ?? null;
}

export default function ReadAloud({ paragraphs, label, onPosition, autoStart = false }: { paragraphs: string[]; label: string; onPosition?: (paragraph: number | null) => void; /** Start reading as soon as it appears (it was asked for from a menu). */ autoStart?: boolean }) {
  const chunks = useMemo(() => chunksOf(paragraphs), [paragraphs]);
  const [status, setStatus] = useState<"idle" | "reading" | "paused" | "done" | "failed">("idle");
  const [at, setAt] = useState(0);
  const [tick, setTick] = useState(0);
  const run = useRef(0);
  const [chunkStarted, setChunkStarted] = useState(0);
  const total = useMemo(() => chunks.reduce((a, c) => a + c.words, 0) / WORDS_PER_SECOND, [chunks]);
  const inChunk = status === "reading" && chunks[at] ? Math.min(chunks[at].words / WORDS_PER_SECOND, (tick - chunkStarted) / 1000) : 0;
  const before = chunks.slice(0, at).reduce((a, c) => a + c.words, 0) / WORDS_PER_SECOND + Math.max(0, inChunk);

  // The estimate moves once a second while the voice reads.
  useEffect(() => {
    if (status !== "reading") return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const stop = useCallback(() => {
    run.current += 1;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* nothing to stop */
    }
  }, []);

  const speakFrom = useCallback(
    (index: number) => {
      stop();
      const token = run.current;
      const voice = pickVoice();
      const say = (i: number) => {
        if (token !== run.current) return;
        if (i >= chunks.length) {
          setStatus("done");
          setAt(0);
          onPosition?.(null);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i].text);
        if (voice) u.voice = voice;
        u.lang = voice?.lang || document.documentElement.lang || "en";
        u.rate = 0.95;
        u.onstart = () => {
          if (token !== run.current) return;
          setChunkStarted(Date.now());
          setTick(Date.now());
          setAt(i);
          onPosition?.(chunks[i].paragraph);
        };
        u.onend = () => say(i + 1);
        u.onerror = (e) => {
          if (token !== run.current || e.error === "interrupted" || e.error === "canceled") return;
          setStatus("failed");
          onPosition?.(null);
        };
        window.speechSynthesis.speak(u);
      };
      setStatus("reading");
      say(index);
    },
    [chunks, onPosition, stop],
  );

  // Leaving the page stops the voice.
  useEffect(() => () => stop(), [stop]);

  // Asked for from the page's menu: begin at once, a single time.
  const started = useRef(false);
  useEffect(() => {
    if (!autoStart || started.current || !canSpeak() || !chunks.length) return;
    started.current = true;
    speakFrom(0);
  }, [autoStart, chunks.length, speakFrom]);

  // Some browsers hand the voice list over late; asking once warms it.
  useEffect(() => {
    if (!canSpeak()) return;
    window.speechSynthesis.getVoices();
  }, []);

  if (!canSpeak() || !chunks.length) return null;

  const reading = status === "reading";
  const toggle = () => {
    if (reading) {
      stop();
      setStatus("paused");
      onPosition?.(null);
    } else {
      speakFrom(status === "paused" ? at : 0);
    }
  };
  const frac = reading || status === "paused" ? Math.min(1, before / Math.max(1, total)) : status === "done" ? 1 : 0;
  const minutes = Math.max(1, Math.round(total / 60));
  const about = total < 45 ? "under a minute" : `about ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const line = status === "failed" ? "The browser's voice stopped. Try again." : reading ? "Reading now" : status === "paused" ? "Paused" : status === "done" ? "Read to the end" : `${about[0].toUpperCase()}${about.slice(1)}, in the browser's own voice`;
  const showTime = reading || status === "paused";

  return (
    <div className="mp-player reader">
      <div className="player" aria-label={`Read ${label} aloud`}>
        <button type="button" className="play" onClick={toggle} aria-label={reading ? "Pause the reading" : "Read it back to me"} aria-pressed={reading}>
          {reading ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="who-reads">
          <b>Listen</b>
          <small>{line}</small>
        </span>
        <div className="bars" aria-hidden="true">
          {HEIGHTS.map((h, k) => (
            <i key={k} className={k / BARS < frac ? "on" : undefined} style={{ ["--h" as string]: `${h}%` }} />
          ))}
        </div>
        {showTime && (
          <time aria-label="Where the reading is">
            {fmt(before)} / {fmt(total)}
          </time>
        )}
      </div>
    </div>
  );
}
