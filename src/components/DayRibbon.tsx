/**
 * The days you sat down and kept something, as a ribbon across the top of
 * Home. It starts from the phone app's strip (only today gets a disc, a
 * dot under every day something was kept, the dots strengthening towards
 * today, no streak number) and uses the width the web has: as many days
 * as fit the row, back to the first thing ever kept, scrolled with a
 * drag, the arrows or the keyboard a week at a time; a hairline before
 * each Monday like a ledger; the month's short name where a month begins;
 * and above the ribbon, the month and one quiet line that says what was
 * kept on the day under the pointer. A day with something on it opens
 * those memories; an empty day or one still to come is only a date.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import WeekInk from "./delight/WeekInk";
import { dayLabel, dotStrength } from "../app-core/lib/weekStrip.js";
import type { Memory } from "../data/stories";

export type StripDay = { key: string; label: string; day: number; count: number; today: boolean; future: boolean; offset: number };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayKey = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const longDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};
const isMonday = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 1;
};

export default function DayRibbon({ days, memories, onPick }: { days: StripDay[]; memories: Memory[]; onPick: (key: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: false, end: true });
  const [hover, setHover] = useState<string | null>(null);

  // what was kept on each day, newest first, for the line above the ribbon
  const kept = useMemo(() => {
    const by = new Map<string, string[]>();
    for (const m of [...memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      if (m.status === "in_progress") continue;
      const k = dayKey(m.createdAt);
      if (!k) continue;
      const list = by.get(k) || [];
      list.push((m.title || "").trim() || "a memory");
      by.set(k, list);
    }
    return by;
  }, [memories]);

  const today = days.find((d) => d.today) || days[days.length - 1];
  const [y, mo] = (today?.key || "").split("-").map(Number);
  const month = MONTHS[(mo || 1) - 1];

  const lastKept = useMemo(() => [...days].reverse().find((d) => d.count > 0 && !d.future) || null, [days]);
  const line = (key: string | null): string => {
    if (key) {
      const titles = kept.get(key) || [];
      if (!titles.length) return `${longDay(key)}: nothing kept.`;
      const first = `“${titles[0]}”`;
      return `${longDay(key)}: ${first}${titles.length > 1 ? ` and ${titles.length - 1} more` : ""}.`;
    }
    if (!lastKept) return "The days you keep something get a dot.";
    const titles = kept.get(lastKept.key) || [];
    const when = lastKept.today ? "Today" : `Last kept ${longDay(lastKept.key)}`;
    return titles.length ? `${when}: “${titles[0]}”${titles.length > 1 ? ` and ${titles.length - 1} more` : ""}.` : when + ".";
  };

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  // open on today: the end of the ribbon (today sits three days from the right, the days to come faint after it)
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    measure();
  }, [days.length, measure]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const step = (dir: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    const dayW = (el.firstElementChild as HTMLElement | null)?.offsetWidth || 56;
    el.scrollBy({ left: dir * dayW * 7, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div className="ribbon" role="group" aria-label="The days you kept something">
      <div className="ribbon-head">
        <span className="ribbon-month">
          {month} <span className="ribbon-year">{y}</span>
        </span>
        <span className="ribbon-line" aria-live="polite">
          {line(hover)}
        </span>
      </div>
      <button type="button" className="ribbon-step prev" aria-label="Earlier week" disabled={edge.start} onClick={() => step(-1)}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="ribbon-track" ref={track} onScroll={measure} onMouseLeave={() => setHover(null)}>
        {days.map((d) => {
          const has = d.count > 0 && !d.future;
          const monthStart = d.day === 1;
          const cls = ["ribbon-day", d.today && "today", has && "has", d.future && "future", !has && !d.today && "empty", isMonday(d.key) && "monday"].filter(Boolean).join(" ");
          return (
            <button
              key={d.key}
              type="button"
              className={cls}
              aria-label={dayLabel(d) as string}
              aria-current={d.today ? "date" : undefined}
              aria-disabled={!has}
              tabIndex={has || d.today ? 0 : -1}
              onClick={() => has && onPick(d.key)}
              onMouseEnter={() => setHover(d.key)}
              onFocus={() => setHover(d.key)}
              onBlur={() => setHover(null)}
            >
              <span className={`wd${monthStart ? " mo" : ""}`}>{d.today ? "Today" : monthStart ? MONTHS[Number(d.key.slice(5, 7)) - 1].slice(0, 3) : d.label}</span>
              <span className="num">
                {d.day}
                {d.today && <WeekInk key={d.count} day={d.key} count={d.count} />}
              </span>
              <i className="dot" aria-hidden="true" style={has ? { opacity: Math.max(0.45, Number(dotStrength(d)) || 1) } : undefined} />
            </button>
          );
        })}
      </div>
      <button type="button" className="ribbon-step next" aria-label="Later week" disabled={edge.end} onClick={() => step(1)}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
