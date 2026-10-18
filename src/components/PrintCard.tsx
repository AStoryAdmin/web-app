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
import { markSeen, newFromLine, newSides, seenCount } from "../lib/seenSides";
import type { Contribution } from "../data/contributions";
import type { Person } from "../data/family";
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

/** A folded name, for matching a side's name to a person in the family. */
const fold = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * The phone's cue, "New from Lan": each new side by its writer's given name, from the family (the person the side is
 * linked to, or the one whose full name it carries, in either order). Never the first word of a full name: "Nguyen Thi
 * Lan" is "Lan", and a name the family doesn't know stays whole. The card's accessible name carries the full line.
 */
function newFromGiven(sides: Contribution[], seen: number, people: Person[]): string | null {
  const fresh = newSides(sides, seen);
  if (!fresh.length) return null;
  const given = (c: Contribution) => {
    const full = (c.contributorName || "").split(",")[0].trim();
    const linked = c.personId ? people.find((p) => p.id === c.personId) : undefined;
    const named = linked ?? people.find((p) => p.givenName && [`${p.givenName} ${p.familyName}`, `${p.familyName} ${p.givenName}`].some((n) => fold(n) === fold(full)));
    return named?.givenName?.trim() || full;
  };
  const names = [...new Set(fresh.map(given).filter(Boolean))];
  if (!names.length) return "New from the family";
  if (names.length === 1) return `New from ${names[0]}`;
  if (names.length === 2) return `New from ${names[0]} and ${names[1]}`;
  return `New from ${names[0]} and ${names.length - 1} others`;
}

/** The type steps a typed print's words take on a phone, size and ruled line, until they fit its 3:4. */
const FIT_STEPS: [number, number][] = [[15, 21], [14, 20], [13.5, 19], [13, 18]];
const PHONE = "(max-width: 760.98px)";

/**
 * On a phone a typed print's words are never clamped: they step down to fit the print at its 3:4, as the titles do, and
 * only when they still do not fit at 13px does the print grow (its row's prints grow with it, level). Every typed print
 * on the page is fitted in one pass: each step is written to all the prints still waiting, then all are read, so a pass
 * costs at most four layouts however many prints there are. One ResizeObserver and one media query start a pass.
 */
const fitting = new Set<HTMLElement>();
let fitQueued = false;
const fitWidths = new WeakMap<HTMLElement, number>();
let fitRO: ResizeObserver | null = null;
let fitMQ: MediaQueryList | null = null;

/** The height a typed print's content needs: the cue in the flow, the words with their padding, and the caption. */
function fitNeed(frame: HTMLElement): number {
  const inner = frame.querySelector<HTMLElement>(".typed-in");
  const words = frame.querySelector<HTMLElement>(".said");
  const cap = frame.querySelector<HTMLElement>(".cap");
  const cues = frame.querySelector<HTMLElement>(":scope > .cues");
  if (!inner || !words || !cap) return 0;
  const box = getComputedStyle(inner);
  let need = parseFloat(box.paddingTop) + parseFloat(box.paddingBottom) + words.offsetHeight + cap.offsetHeight;
  if (cues && getComputedStyle(cues).position !== "absolute") need += cues.offsetHeight + parseFloat(getComputedStyle(cues).marginTop);
  return need;
}

function fitPass() {
  fitQueued = false;
  const frames = [...fitting].filter((f) => f.isConnected);
  for (const f of frames) {
    f.style.removeProperty("--said-size");
    f.style.removeProperty("--lh");
  }
  if (!fitMQ?.matches) return;
  let waiting = frames;
  for (const [size, lh] of FIT_STEPS) {
    for (const f of waiting) {
      f.style.setProperty("--said-size", `${size}px`);
      f.style.setProperty("--lh", `${lh}px`);
    }
    waiting = waiting.filter((f) => fitNeed(f) > (f.offsetWidth * 4) / 3 + 0.5);
    if (!waiting.length) break;
  }
  for (const f of frames) fitWidths.set(f, f.offsetWidth);
}

/** Queue one pass for everything registered: it runs before the next paint. */
function queueFit() {
  if (fitQueued) return;
  fitQueued = true;
  queueMicrotask(fitPass);
}

function startFitting() {
  if (fitMQ || typeof window.matchMedia !== "function") return;
  fitMQ = window.matchMedia(PHONE);
  fitMQ.addEventListener?.("change", queueFit);
  fitRO =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((entries) => {
          if (entries.some((e) => fitWidths.get(e.target as HTMLElement) !== (e.target as HTMLElement).offsetWidth)) queueFit();
        });
  document.fonts?.ready.then(queueFit).catch(() => {});
}

/** Registers a typed print for the fit; it re-fits when its words, cue, date or chapter change. */
function useFitWords(text: string, ...also: unknown[]) {
  const said = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const frame = said.current?.closest<HTMLElement>(".frame");
    if (!text || !frame) return;
    startFitting();
    fitting.add(frame);
    fitRO?.observe(frame);
    queueFit();
    return () => {
      fitting.delete(frame);
      fitRO?.unobserve(frame);
      fitWidths.delete(frame);
      frame.style.removeProperty("--said-size");
      frame.style.removeProperty("--lh");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, ...also]);
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
  const shortLine = show.has("new") ? newFromGiven(sides, seenCount(memory.id), family?.people ?? []) : null;
  const saidRef = useFitWords(said, show.has("new"), shortLine, dated, meta.date, meta.chapter, meta.title);

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
                <span className="cue-short">{shortLine}</span>
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
