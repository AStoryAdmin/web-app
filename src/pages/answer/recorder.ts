/**
 * The microphone for the answer page: MediaRecorder for the recording and
 * an AnalyserNode for a calm level meter (no clock). audio/mp4 wherever the
 * browser can make it (Safari, Chrome 126+), because the asker hears it on an
 * iPhone and iOS cannot play WebM; WebM/Opus otherwise. 64 kbps keeps fifteen
 * minutes well under the server's 10 MB.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Take } from "./machine";

export class MicError extends Error {
  kind: "refused" | "unsupported" | "failed";
  constructor(kind: "refused" | "unsupported" | "failed") {
    super(kind);
    this.kind = kind;
  }
}

export function recordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.MediaRecorder !== "undefined"
  );
}

function pickMime(): string | undefined {
  const MR = window.MediaRecorder;
  if (!MR?.isTypeSupported) return undefined;
  return ["audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((m) => MR.isTypeSupported(m));
}

type Live = {
  stream: MediaStream;
  rec: MediaRecorder;
  chunks: Blob[];
  mime: string | undefined;
  t0: number;
  ctx: AudioContext | null;
  raf: number;
};

export function useRecorder() {
  const [level, setLevel] = useState(0);
  const live = useRef<Live | null>(null);

  const release = useCallback(() => {
    const l = live.current;
    live.current = null;
    if (!l) return;
    cancelAnimationFrame(l.raf);
    l.stream.getTracks().forEach((t) => t.stop());
    l.ctx?.close().catch(() => {});
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (!recordingSupported()) throw new MicError("unsupported");
    release();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      const name = (e as DOMException)?.name;
      throw new MicError(name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError" ? "refused" : "failed");
    }
    const mime = pickMime();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 64_000 });
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      throw new MicError("unsupported");
    }
    const l: Live = { stream, rec, chunks: [], mime, t0: performance.now(), ctx: null, raf: 0 };
    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size) l.chunks.push(ev.data);
    };
    rec.start(1000);
    live.current = l;

    // The meter: loudness smoothed and sampled a dozen times a second, so it breathes rather than flickers.
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        l.ctx = ctx;
        ctx.resume?.().catch(() => {});
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        let smooth = 0;
        let last = 0;
        const tick = (now: number) => {
          if (live.current !== l) return;
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          smooth = smooth * 0.8 + Math.min(1, rms * 5) * 0.2;
          if (now - last > 80) {
            last = now;
            setLevel(Math.round(smooth * 100) / 100);
          }
          l.raf = requestAnimationFrame(tick);
        };
        l.raf = requestAnimationFrame(tick);
      }
    } catch {
      // no meter is fine; the recording still runs
    }
  }, [release]);

  const stop = useCallback(
    () =>
      new Promise<Take>((resolve, reject) => {
        const l = live.current;
        if (!l) {
          reject(new MicError("failed"));
          return;
        }
        const finish = () => {
          const type = l.rec.mimeType || l.mime || l.chunks[0]?.type || "audio/webm";
          const blob = new Blob(l.chunks, { type });
          const durationMs = performance.now() - l.t0;
          release();
          resolve({ blob, url: blob.size ? URL.createObjectURL(blob) : "", durationMs });
        };
        if (l.rec.state === "inactive") finish();
        else {
          l.rec.onstop = finish;
          l.rec.stop();
        }
      }),
    [release],
  );

  useEffect(() => () => release(), [release]);

  return { start, stop, level, release };
}
