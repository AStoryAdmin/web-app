/**
 * The recorder's small pieces: the calm level meter (no clock, as on the
 * answer page) and one button to listen back to the take. Autoplay is
 * blocked everywhere, so a tap is the only way in, and nothing plays by
 * itself.
 */
import { useRef, useState } from "react";
import { MicIcon, PauseIcon, PlayIcon } from "../icons";

/** One soft halo that swells with their voice. */
export function Meter({ level }: { level: number }) {
  return (
    <div className="rec-meter" role="meter" aria-label="How loud the microphone hears you" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
      <i style={{ transform: `scale(${0.72 + Math.min(1, level) * 0.28})` }} />
      <MicIcon width={34} height={34} />
    </div>
  );
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** "Listen back · 1:12", then "Pause" while it plays. */
export function ListenBack({ src, durationMs }: { src: string; durationMs: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  return (
    <>
      <button type="button" className="btn outline rec-listen" onClick={toggle} aria-pressed={playing}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span>{playing ? "Pause" : `Listen back · ${clock(durationMs)}`}</span>
      </button>
      <audio ref={audio} src={src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </>
  );
}
