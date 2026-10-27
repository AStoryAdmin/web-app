/**
 * The archive, month by month (phone ArchiveCalendarScreen): every day the
 * family put something down, as a grid, with the days the family keeps
 * every year marked on it (birthdays and the days somebody died, from the
 * tree; memories dated to the day; the days marked on the phone). A dot
 * under a day means a memory was kept on it; a gold rule means a day the
 * family keeps. Every mark is also said in words under the month, so
 * nothing on the grid is a symbol only.
 *
 * On a laptop the month and the chosen day sit side by side; on a phone
 * the day follows the month. The grid is one tab stop: the arrow keys move
 * the day, Page Up and Page Down the month. "See them in the list" hands
 * the day back to the Archive's list (?day=).
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "../icons";
import { dayKeyOf } from "../../app-core/lib/weekStrip.js";
import { allMarks, dateOfKey, dayMonth, keptByDay, loadKeptDays, marksOn, monthGrid, monthLine, monthTitle, type DayMark, type KeptDayRow } from "./calendarDays";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";
import "./Calendar.css";

const WEEKDAYS = [
  ["S", "Sunday"],
  ["M", "Monday"],
  ["T", "Tuesday"],
  ["W", "Wednesday"],
  ["T", "Thursday"],
  ["F", "Friday"],
  ["S", "Saturday"],
];

const keyOf = (d: Date) => dayKeyOf(d) as string;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const longDay = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const kept = (n: number) => `${n} ${n === 1 ? "memory" : "memories"} kept`;

/** A mark's second line: when it began, said plainly. */
function markYear(m: DayMark): string {
  if (!m.year) return "";
  if (m.kind === "birthday") return `Born ${m.year}`;
  if (m.kind === "remembrance") return `Died ${m.year}`;
  if (m.kind === "happened") return `In ${m.year}`;
  return `Since ${m.year}`;
}

/** Where a mark leads: the memory it is, or the person it belongs to. */
function markTo(m: DayMark): string | null {
  if (m.memoryId) return `/archive/${m.memoryId}`;
  if (m.personId) return `/family/${m.personId}`;
  return null;
}

export default function Calendar({
  story,
  stories,
  people,
  initialDay,
  onSeeDay,
}: {
  story: Story;
  stories: Story[];
  people: Person[] | null | undefined;
  initialDay?: string | null;
  onSeeDay: (key: string) => void;
}) {
  const [selected, setSelected] = useState<Date>(() => dateOfKey(initialDay) || new Date());
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [rows, setRows] = useState<KeptDayRow[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // the days marked on the phone (anniversaries), the whole family's, read once
  useEffect(() => {
    let live = true;
    loadKeptDays().then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, []);

  const byDay = useMemo(() => keptByDay(story.memories), [story.memories]);
  const marks = useMemo(() => allMarks(story, people, rows, stories), [story, people, rows, stories]);
  const weeks = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  // the marks in the month on screen, in order, each said in words
  const monthMarks = useMemo(() => {
    const out: { date: Date; m: DayMark }[] = [];
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      for (const m of marksOn(marks, date)) out.push({ date, m });
    }
    return out;
  }, [cursor, marks]);

  // the arrow keys move focus with the day; a click or a mark leaves focus where it was
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  }, [selected]);

  const pick = (d: Date, focus = false) => {
    moved.current = focus;
    setSelected(d);
    if (d.getMonth() !== cursor.getMonth() || d.getFullYear() !== cursor.getFullYear()) setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const shiftMonth = (by: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + by, 1);
    setCursor(next);
    // the chosen day follows into the month, on the same date where it exists
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    setSelected(new Date(next.getFullYear(), next.getMonth(), Math.min(selected.getDate(), last)));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: Date | null = null;
    if (e.key in step) next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + step[e.key]);
    else if (e.key === "Home") next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - selected.getDay());
    else if (e.key === "End") next = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() + 6 - selected.getDay());
    else if (e.key === "PageUp" || e.key === "PageDown") {
      const by = e.key === "PageUp" ? -1 : 1;
      const last = new Date(selected.getFullYear(), selected.getMonth() + by + 1, 0).getDate();
      next = new Date(selected.getFullYear(), selected.getMonth() + by, Math.min(selected.getDate(), last));
    }
    if (!next) return;
    e.preventDefault();
    pick(next, true);
  };

  const today = new Date();
  const away = cursor.getFullYear() !== today.getFullYear() || cursor.getMonth() !== today.getMonth();
  const pickedKey = keyOf(selected);
  const pickedKept = byDay.get(pickedKey) || [];
  const pickedMarks = marksOn(marks, selected);

  return (
    <div className="cal">
      <section className="cal-month" aria-labelledby="cal-title">
        <div className="cal-head">
          <h2 id="cal-title" className="cal-title" aria-live="polite">
            {monthTitle(cursor)}
          </h2>
          <div className="cal-nav">
            {away && (
              <button type="button" className="cal-today" onClick={() => pick(today)}>
                Today
              </button>
            )}
            <button type="button" className="cal-arrow" onClick={() => shiftMonth(-1)} aria-label="The month before">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="cal-arrow" onClick={() => shiftMonth(1)} aria-label="The month after">
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="cal-grid" role="grid" aria-labelledby="cal-title" ref={grid} onKeyDown={onKey}>
          <div className="cal-row" role="row">
            {WEEKDAYS.map(([short, full]) => (
              <span key={full} className="cal-wd" role="columnheader" aria-label={full}>
                {short}
              </span>
            ))}
          </div>
          {weeks.map((week) => (
            <div className="cal-row" role="row" key={keyOf(week[0])}>
              {week.map((d) => {
                const key = keyOf(d);
                const n = byDay.get(key)?.length || 0;
                const on = marksOn(marks, d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const chosen = sameDay(d, selected);
                const said = [dayMonth(d), n ? kept(n) : "", ...on.map((m) => m.words)].filter(Boolean).join(", ");
                return (
                  <span role="gridcell" key={key} aria-selected={chosen}>
                    <button
                      type="button"
                      className={["cal-day", inMonth ? "" : "out", chosen ? "on" : "", sameDay(d, today) ? "today" : ""].filter(Boolean).join(" ")}
                      tabIndex={chosen ? 0 : -1}
                      aria-label={said}
                      aria-current={sameDay(d, today) ? "date" : undefined}
                      onClick={() => pick(d)}
                    >
                      <span className="cal-n" aria-hidden="true">
                        {d.getDate()}
                      </span>
                      <span className="cal-marks" aria-hidden="true">
                        {on.length > 0 && <i className={`cal-mark ${on[0].kind}`} />}
                        {n > 0 && <i className="cal-dot" />}
                      </span>
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <p className="cal-line">{monthLine(byDay, cursor.getFullYear(), cursor.getMonth())}</p>
        <p className="cal-key">
          <span>
            <i className="cal-dot" aria-hidden="true" /> a memory kept that day
          </span>
          <span>
            <i className="cal-mark" aria-hidden="true" /> a day the family keeps
          </span>
        </p>

        {monthMarks.length > 0 && (
          <ul className="cal-kept" aria-label={`Days the family keeps in ${monthTitle(cursor)}`}>
            {monthMarks.map(({ date, m }) => (
              <li key={`${m.id}-${date.getDate()}`}>
                <button type="button" className="cal-kept-row" aria-pressed={sameDay(date, selected)} onClick={() => pick(date)}>
                  <span className="cal-kept-day">{dayMonth(date)}</span>
                  <span className="cal-kept-words">{m.words}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cal-day-page" aria-labelledby="cal-day-title">
        <h3 id="cal-day-title" className="cal-day-title" aria-live="polite">
          {longDay(selected)}
        </h3>

        {pickedMarks.length > 0 && (
          <ul className="cal-day-marks">
            {pickedMarks.map((m) => {
              const to = markTo(m);
              const when = markYear(m);
              const inner = (
                <>
                  <i className={`cal-mark ${m.kind}`} aria-hidden="true" />
                  <span className="cal-day-words">{m.words}</span>
                  {when && <span className="cal-day-when">{when}</span>}
                </>
              );
              return (
                <li key={m.id}>
                  {to ? (
                    <Link to={to} className="cal-day-mark">
                      {inner}
                    </Link>
                  ) : (
                    <span className="cal-day-mark">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {pickedKept.length > 0 ? (
          <>
            <p className="cal-day-kick">{kept(pickedKept.length)} on this day</p>
            <ul className="cal-day-kept">
              {pickedKept.map((m: Memory) => (
                <li key={m.id}>
                  <Link to={`/archive/${m.id}`} className="cal-day-memory">
                    {String(m.title || "").trim() || "Untitled"}
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" className="more cal-see" onClick={() => onSeeDay(pickedKey)}>
              See them in the list
            </button>
          </>
        ) : (
          pickedMarks.length === 0 && <p className="cal-day-none">Nothing kept on this day yet.</p>
        )}
      </section>
    </div>
  );
}
