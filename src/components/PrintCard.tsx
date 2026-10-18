/**
 * One memory as a print: the photograph is the card, tall or wide, with
 * the chapter and the title set on it like a caption, and the date when
 * there is one (an undated memory says nothing; the Archive asks for the
 * years once). The whole print is the link, its white edge by era. A
 * memory with no photograph is a typed card instead: a ruled cream index
 * card with the person's kept line as its picture and the title under.
 *
 * The cues that make a print worth opening are small and true, never more
 * than three on one print, in this order: a dot of terracotta ink and
 * "New from Linh" when the family added a side the viewer hasn't seen;
 * "Kept today", "Yesterday" or "a year ago today" when it applies; the
 * faces of the people in it; a mic when it was a call. A treasured memory wears a wax seal on its corner and gilt
 * edges instead of a badge (decoration D4, D2). No badges, no streaks.
 */
import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { cardMeta } from "../app-core/lib/memoryCard.js";
import { useAccount } from "../state/accountContext";
import { Mark } from "./Brand";
import { MicIcon } from "./icons";
import WaxSeal from "./archive/WaxSeal";
import { realChapter } from "./archive/photos";
import Face from "./archive/Face";
import { loadedRef, usePrintPhoto } from "./archive/develop";
import { isTreasured } from "../lib/treasured";
import { memoryDate } from "../app-core/lib/timeline.js";
import { smarten } from "../lib/typography";
import { cardWords } from "../lib/memoryDisplay";
import { markSeen, newFromLine, seenCount } from "../lib/seenSides";
import type { Contribution } from "../data/contributions";
import type { Memory, Story } from "../data/stories";

export type PrintSize = "lead" | "tall";


const yearsAgo = (n: number) => (n === 1 ? "a year ago today" : n === 2 ? "two years ago today" : n === 3 ? "three years ago today" : `${n} years ago today`);

/** "Kept today", "Yesterday", "a year ago today", or null when the day is nothing special. */
function freshness(memory: Memory, now = new Date()): string | null {
  const kept = new Date(memory.createdAt);
  if (Number.isNaN(kept.getTime())) return null;
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(kept)) / 86400000);
  if (days === 0) return "Kept today";
  if (days === 1) return "Yesterday";
  if (days > 300 && kept.getMonth() === now.getMonth() && kept.getDate() === now.getDate()) return yearsAgo(now.getFullYear() - kept.getFullYear());
  return null;
}

/** "New from Bao Ngo Gia Vo" → "New from Bao": the phone's cue, first names only (the full line is in the card's name). */
function firstNames(line: string): string {
  const who = line.replace(/^New from /, "").split(" and ");
  return `New from ${who.map((n) => (n === "the family" || /^\d+ others$/.test(n) ? n : n.split(/\s+/)[0])).join(" and ")}`;
}

/** The type steps a typed print's words take on the smallest phones, size and ruled line, until they fit its 3:4. */
const FIT_STEPS: [number, number][] = [[15, 21], [14, 20], [13.5, 19], [13, 18]];
const SMALLEST = "(max-width: 359.98px)";

/**
 * Below 360px a typed print's words are never clamped: they step down to fit the print at its 3:4, as the titles do,
 * and only when they still do not fit at 13px does the print grow (its row's prints grow with it, level).
 */
function useFitWords(text: string) {
  const said = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const words = said.current;
    const frame = words?.closest<HTMLElement>(".frame");
    const inner = words?.parentElement;
    const cap = frame?.querySelector<HTMLElement>(".cap");
    if (!text || !words || !frame || !inner || !cap || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(SMALLEST);
    const clear = () => { frame.style.removeProperty("--lh"); frame.style.removeProperty("--said-size"); };
    const fit = () => {
      clear();
      if (!mq.matches) return;
      const room = (frame.offsetWidth * 4) / 3;
      const pad = parseFloat(getComputedStyle(inner).paddingTop) + parseFloat(getComputedStyle(inner).paddingBottom);
      for (const [size, lh] of FIT_STEPS) {
        frame.style.setProperty("--said-size", `${size}px`);
        frame.style.setProperty("--lh", `${lh}px`);
        if (pad + words.offsetHeight + cap.offsetHeight <= room + 0.5) return;
      }
    };
    fit();
    let width = frame.offsetWidth;
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => { if (frame.offsetWidth !== width) { width = frame.offsetWidth; fit(); } });
    ro?.observe(frame);
    mq.addEventListener?.("change", fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => { ro?.disconnect(); mq.removeEventListener?.("change", fit); clear(); };
  }, [text]);
  return said;
}

export default function PrintCard({
  memory,
  story,
  size = "tall",
  sides = [],
  index = 0,
  rise = false,
}: {
  memory: Memory;
  story: Story;
  size?: PrintSize;
  sides?: Contribution[];
  index?: number;
  /** Its own CSS arrival. Off by default: the page owns each card's entrance (lib/arrive on Home, the scroll hook on the Archive). */
  rise?: boolean;
}) {
  const { family } = useAccount();
  const meta = cardMeta(story, memory) as { title: string; chapter: string; date: string; photo: string | null; photoCount: number };
  const { src: photo, frameRef, onLoad: onPhotoLoad, onError: onPhotoError } = usePrintPhoto(meta.photo);
  const dated = meta.date !== "No date yet";
  const said = meta.photo ? "" : cardWords(memory);
  const people = (memory.personIds || [])
    .map((id) => family?.people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const newLine = sides.length ? newFromLine(sides, seenCount(memory.id)) : null;
  const fresh = freshness(memory);
  const treasured = isTreasured(memory);
  // the print's edge follows its era (decoration D7): a scalloped snapshot before 1975, a plain white border after
  const { year } = memoryDate(memory) as { year: number | null };
  const era = year != null && year < 1975 ? "archival" : year != null && year >= 2000 ? "modern" : "plain";

  // never more than three cues on one print, the truest first
  const cues: string[] = [];
  if (newLine) cues.push("new");
  if (fresh) cues.push("fresh");
  if (people.length) cues.push("faces");
  if (memory.audio?.length) cues.push("mic");
  const show = new Set(cues.slice(0, 3));
  const marks = show.has("faces") || show.has("mic");
  const saidRef = useFitWords(said);

  return (
    <Link
      className={`print-card ${size}${meta.photo ? "" : " typed"}${treasured ? " treasured gilt" : ""}${rise ? " rise" : ""}`}
      data-era={meta.photo ? era : undefined}
      to={`/archive/${memory.id}`}
      style={rise ? { animationDelay: `${Math.min(index, 6) * 60}ms` } : undefined}
      onClick={() => markSeen(memory.id, sides.length)}
      aria-label={`${smarten(meta.title)}${dated ? `, ${meta.date}` : ""}${treasured ? ", treasured" : ""}${show.has("new") && newLine ? `, ${newLine}` : ""}`}
    >
      {treasured && <i className="glint" aria-hidden="true" />}
      {treasured && <WaxSeal size={34} className="print-seal" />}
      <span className={`frame${marks ? " has-marks" : ""}`} aria-hidden="true" ref={frameRef}>
        {meta.photo ? (
          <>
            <img className="pic" src={photo ?? undefined} alt="" loading="lazy" decoding="async" ref={loadedRef} onLoad={onPhotoLoad} onError={onPhotoError} />
            <span className="veil" />
          </>
        ) : (
          <span className="typed-in">
            <Mark className="wm" height={140} />
            {said && (
              <span className="said" ref={saidRef}>
                {said}
              </span>
            )}
          </span>
        )}
        {(show.has("new") || show.has("fresh")) && (
          <span className="cues">
            {show.has("new") && (
              <span className="cue new">
                <i className="dot" />
                <span className="cue-long">{newLine}</span>
                <span className="cue-short">{newLine && firstNames(newLine)}</span>
              </span>
            )}
            {show.has("fresh") && <span className="cue fresh">{fresh}</span>}
          </span>
        )}
        <span className="cap">
          {realChapter(meta.chapter) && <span className="kicker">{meta.chapter}</span>}
          <span className={`title${meta.title.length > 45 ? " long" : ""}`}>{smarten(meta.title)}</span>
          {dated && <span className="dateline dated">{meta.date}</span>}
        </span>
        {marks && (
          <span className="marks">
            {show.has("mic") && (
              <span className="mark mic" title="Told on a call">
                <MicIcon width={14} height={14} />
              </span>
            )}
            {show.has("faces") && (
              <span className="faces" title={people.map((p) => p.givenName).join(", ")}>
                {people.slice(0, 3).map((p) => (
                  <Face key={p.id} person={p} size={24} />
                ))}
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}
