/**
 * Speaking instead of typing, through the browser's own speech recognition
 * (Chrome, Edge and Safari have it; Firefox does not). Nothing leaves the
 * page except what the browser itself sends to its recognition service.
 * Final phrases are handed to `onFinal`; what is still being heard to
 * `onInterim`, so the page can show the words arriving.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const canDictate = (): boolean => ctor() !== null;

export function useDictation(onFinal: (text: string) => void, lang = navigator.language || "en-US") {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const final = useRef(onFinal);
  useEffect(() => {
    final.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    wanted.current = false;
    rec.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C) return;
    setProblem(null);
    const r = new C();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0].transcript;
        if (res.isFinal) final.current(t.trim());
        else heard += t;
      }
      setInterim(heard);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech") return;
      setProblem(e.error === "not-allowed" ? "The browser needs permission to use the microphone." : "Dictation stopped. You can keep typing.");
      wanted.current = false;
      setListening(false);
    };
    r.onend = () => {
      // Browsers end a session after a silence; keep going while the person still wants to talk.
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    wanted.current = true;
    try {
      r.start();
      setListening(true);
    } catch {
      setProblem("Dictation couldn't start. You can keep typing.");
    }
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);

  return { available: canDictate(), listening, interim, problem, start, stop, toggle: () => (listening ? stop() : start()) };
}
