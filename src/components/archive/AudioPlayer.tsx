/**
 * The voice on a memory: the clips of a call, played in order through one
 * native <audio>. The buckets are private, so each clip is signed for an
 * hour when the page opens; a clip that will not sign says so and offers
 * to try again. Keyboard: the bars are a slider (arrows seek 5 seconds).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../ui";
import { PauseIcon, PlayIcon } from "../icons";
import { supabase } from "../../lib/supabase";
import type { Clip } from "../../data/stories";

const BARS = 40;
const SIGN_TTL = 60 * 60;
// The same quiet waveform every time: a drawing, not a measurement.
const HEIGHTS = Array.from({ length: BARS }, (_, k) => 30 + ((k * 37 + 11) % 55));

const fmt = (s: number) => {
  const n = Math.max(0, Math.round(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};

async function signClips(clips: Clip[]): Promise<string[]> {
  const sb = supabase();
  return Promise.all(
    clips.map(async (clip) => {
      const { data, error } = await sb.storage.from(clip.bucket || "memory-audio").createSignedUrl(clip.path, SIGN_TTL);
      if (error || !data?.signedUrl) throw new Error(error?.message || "no signed URL");
      return data.signedUrl;
    }),
  );
}

export default function AudioPlayer({ clips, name, photo }: { clips: Clip[]; name: string; photo?: string | null }) {
  const audio = useRef<HTMLAudioElement>(null);
  const seekTo = useRef<number | null>(null);
  const [urls, setUrls] = useState<string[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [known, setKnown] = useState<Record<number, number>>({});

  useEffect(() => {
    let live = true;
    signClips(clips)
      .then((u) => live && setUrls(u))
      .catch((err: Error) => {
        console.warn("recording not signed", err);
        if (live) setFailed("load");
      });
    return () => {
      live = false;
    };
  }, [clips, tries]);

  // A new clip while playing: carry on.
  useEffect(() => {
    const el = audio.current;
    if (!el || !playing) return;
    el.play().catch(() => {});
  }, [i, playing, urls]);

  const durations = clips.map((c, k) => known[k] ?? c.duration ?? 0);
  const total = durations.reduce((a, b) => a + b, 0);
  const before = durations.slice(0, i).reduce((a, b) => a + b, 0);
  const elapsed = Math.min(total, before + t);
  const frac = total ? elapsed / total : 0;
  const ready = !!urls && !failed;

  const toggle = () => {
    const el = audio.current;
    if (!el || !ready) return;
    if (el.paused) el.play().catch(() => setFailed("play"));
    else el.pause();
  };

  const seek = useCallback(
    (seconds: number) => {
      const target = Math.max(0, Math.min(total, seconds));
      let acc = 0;
      for (let k = 0; k < durations.length; k++) {
        const d = durations[k];
        if (target < acc + d || k === durations.length - 1) {
          const offset = Math.max(0, target - acc);
          if (k === i && audio.current) {
            audio.current.currentTime = offset;
            setT(offset);
          } else {
            seekTo.current = offset;
            setI(k);
            setT(offset);
          }
          return;
        }
        acc += d;
      }
    },
    [durations, i, total],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      seek(elapsed + 5);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      seek(elapsed - 5);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  const label = `${name}’s recording`;
  return (
    <div className="mp-player">
      <div className="player" aria-label={label}>
        <Avatar src={photo} name={name} size={40} className="who" />
        <button type="button" className="play" onClick={toggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`} disabled={!ready}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="who-reads">
          <b>Hear {name} tell it</b>
          <small>{total >= 60 ? `${Math.round(total / 60)} min` : total > 0 ? "under a minute" : "The recording"}</small>
        </span>
        <div
          className="bars"
          role="slider"
          tabIndex={0}
          aria-label="Where you are in the recording"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(elapsed)}
          aria-valuetext={`${fmt(elapsed)} of ${fmt(total)}`}
          onKeyDown={onKey}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            if (r.width > 0) seek(((e.clientX - r.left) / r.width) * total);
          }}
        >
          {HEIGHTS.map((h, k) => (
            <i key={k} className={k / BARS < frac ? "on" : undefined} style={{ ["--h" as string]: `${h}%` }} />
          ))}
        </div>
        <time>
          {fmt(elapsed)} / {fmt(total)}
        </time>
        {urls && (
          <audio
            ref={audio}
            src={urls[i]}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (Number.isFinite(el.duration) && el.duration > 0) setKnown((k) => (k[i] === el.duration ? k : { ...k, [i]: el.duration }));
              if (seekTo.current != null) {
                el.currentTime = seekTo.current;
                seekTo.current = null;
              }
            }}
            onEnded={() => {
              if (i + 1 < clips.length) {
                setI(i + 1);
                setT(0);
                setPlaying(true);
              } else {
                setPlaying(false);
                setT(durations[i] || 0);
              }
            }}
            onError={() => setFailed("play")}
          />
        )}
      </div>
      {failed && (
        <p className="note" role="alert">
          {failed === "play" ? "The recording wouldn’t play here." : "The recording couldn’t be loaded."} Check the connection and try again.{" "}
          <button
            type="button"
            className="mv-retry"
            onClick={() => {
              setFailed(null);
              setUrls(null);
              setTries((n) => n + 1);
            }}
          >
            Try again
          </button>
        </p>
      )}
      {!urls && !failed && <p className="note">Loading the recording…</p>}
    </div>
  );
}
