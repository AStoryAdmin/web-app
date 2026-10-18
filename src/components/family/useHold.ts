/**
 * Undo over confirm (hallmark interaction): a reversible "no" (setting aside
 * what the family sent, declining a request, taking back a code) is held for
 * six seconds as one line with an Undo, and only then sent. Leaving the page
 * before then sends nothing, so the item is still there next time. Once it is
 * being sent the line says so and the Undo goes: an Undo that can no longer
 * undo is a lie.
 *
 * The six seconds belong to the person, not the clock: they stop while the
 * tab is hidden or the pointer rests on the line. Focus is handed back only
 * when the keyboard has nowhere else to be (it was on the line, now gone):
 * to the control that made the "no" after an Undo or a failed send, through
 * `returnRef(id)` on that control, and to `fallback` (the section) after a
 * send lands and the item has gone.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export const HOLD_MS = 6000;

/** One held "no": the line while it can be undone, the line while it is sent, and whether it is being sent. */
export type Held = { line: string; going: string; sending: boolean };

type Timer = { t: number; left: number; at: number; why: Set<string>; fire: () => void };

/** The keyboard has lost its place: on nothing, or on an element that has just left the page. */
const lost = () => {
  const a = document.activeElement;
  return !a || a === document.body || !a.isConnected;
};

export function useHold(onFail: (err: unknown, id: string) => void, fallback?: RefObject<HTMLElement | null>) {
  const [held, setHeld] = useState<Record<string, Held>>({});
  const timers = useRef(new Map<string, Timer>());
  const wantBack = useRef(new Set<string>());
  const landed = useRef(false);

  const drop = useCallback(
    (id: string) =>
      setHeld((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }),
    [],
  );
  const run = (x: Timer) => {
    x.at = Date.now();
    x.t = window.setTimeout(x.fire, Math.max(0, x.left));
  };
  const pause = useCallback((id: string, why = "pointer") => {
    const x = timers.current.get(id);
    if (!x) return;
    if (!x.why.size && x.t) {
      window.clearTimeout(x.t);
      x.t = 0;
      x.left -= Date.now() - x.at;
    }
    x.why.add(why);
  }, []);
  const resume = useCallback((id: string, why = "pointer") => {
    const x = timers.current.get(id);
    if (!x || !x.why.delete(why) || x.why.size || x.t) return;
    run(x);
  }, []);

  useEffect(() => {
    const all = timers.current;
    const onVisible = () => all.forEach((_, id) => (document.hidden ? pause(id, "hidden") : resume(id, "hidden")));
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      all.forEach((x) => window.clearTimeout(x.t));
    };
  }, [pause, resume]);

  // after a send lands and its item has gone, a keyboard that was on the line goes to the section, not the page’s top
  useLayoutEffect(() => {
    if (!landed.current) return;
    landed.current = false;
    if (lost()) fallback?.current?.focus();
  }, [held, fallback]);

  const release = useCallback(
    (id: string) => {
      const x = timers.current.get(id);
      if (!x) return; // already being sent
      window.clearTimeout(x.t);
      timers.current.delete(id);
      wantBack.current.add(id);
      drop(id);
    },
    [drop],
  );

  /** Hold `id` with its line ("Set aside Claire’s memory") and the words while it goes ("Setting aside Claire’s memory…"),
      then run `send`; `done` follows a send that landed. */
  const hold = useCallback(
    (id: string, line: string, going: string, send: () => Promise<unknown>, done: () => void) => {
      setHeld((prev) => ({ ...prev, [id]: { line, going, sending: false } }));
      const x: Timer = {
        t: 0,
        left: HOLD_MS,
        at: 0,
        why: new Set(document.hidden ? ["hidden"] : []),
        fire: async () => {
          timers.current.delete(id);
          setHeld((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], sending: true } } : prev));
          try {
            await send();
            landed.current = true;
            done();
          } catch (err) {
            onFail(err, id);
            wantBack.current.add(id);
          } finally {
            drop(id);
          }
        },
      };
      timers.current.set(id, x);
      if (!x.why.size) run(x);
    },
    [onFail, drop],
  );

  /** A ref for the control that made the "no": it takes focus back after an Undo or a failed send, if nothing else has it. */
  const returnRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (!el || !wantBack.current.has(id)) return;
      wantBack.current.delete(id);
      if (lost()) el.focus();
    },
    [],
  );

  return { held, hold, undo: release, pause, resume, returnRef };
}
