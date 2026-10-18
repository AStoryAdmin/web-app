/**
 * How a memory opens, set as the printed book sets a memory's first page
 * (astoryapp.com/samples; docs/research/reading-2026.md §3.6–3.9): the
 * chapter as a sage pill, the title on the
 * paper with no box, the dateline in terracotta ink ("1966 · AGE 6"), who
 * told it as a face and a name, and the head's three quiet tools. Beside
 * it the plate: the photograph as a straight print at its own ratio, never
 * cropped, held to the page by black-paper photo corners, the date printed
 * under it, the others as small straight prints; a click opens it full
 * screen.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePhotoUrl } from "../../lib/photoUrls";
import { Avatar } from "../ui";
import { realChapter } from "./photos";
import WaxSeal from "./WaxSeal";
import type { Person } from "../../data/family";

function Face({ person }: { person: Person }) {
  const src = usePhotoUrl(person.photo);
  return <Avatar src={src} name={person.givenName || person.familyName || "?"} size={24} />;
}

export function MemoryHead({
  title,
  chapter,
  date,
  dated,
  editTo,
  told,
  toldName,
  toldRest,
  toldPhoto,
  people,
  stillWriting,
  actions,
  kept,
  treasured,
}: {
  title: string;
  chapter: string;
  date: string;
  dated: boolean;
  editTo: string;
  /** "Told by", "Written by", "From". */
  told: string;
  toldName: string;
  /** " on a call · 6 minutes", or "". */
  toldRest: string;
  toldPhoto: string | null;
  people: Person[];
  stillWriting: boolean;
  /** The head's three quiet tools: treasure, public or private, share. */
  actions?: ReactNode;
  /** The kept line: one sentence of their own words, set large under the title (rule 32). */
  kept?: string;
  treasured?: boolean;
}) {
  const pill = realChapter(chapter);
  return (
    <header className="mv-head" data-rise>
      {pill && (
        <div className="mv-kick">
          <span className="mv-pill">{pill}</span>
        </div>
      )}
      <div className="mv-titlerow">
        <h1 className="mv-title" id="mv-title">
          {title}
        </h1>
        {treasured && <WaxSeal size={56} className="mv-seal" label="Treasured" />}
      </div>
      <p className="mv-date">
        {dated ? <span className="dated">{date}</span> : <Link to={editTo}>Add when it was</Link>}
        {stillWriting && <span>Still being written up</span>}
      </p>
      {kept && (
        <p className="mv-kept">
          <span>“{kept}”</span>
        </p>
      )}
      <div className="mv-by">
        <span className="mv-teller">
          <Avatar src={toldPhoto} name={toldName} size={32} />
          <span>
            {told} <b>{toldName}</b>
            {toldRest}
          </span>
        </span>
        {people.length > 0 && (
          <span className="mv-people" aria-label="Who is in this memory">
            <span className="mv-in">with</span>
            {people.map((p) => (
              <Link key={p.id} to={`/family/${p.id}`} className="mv-person">
                <Face person={p} />
                <span>{p.givenName || p.familyName || "Someone"}</span>
              </Link>
            ))}
          </span>
        )}
        {actions && (
          <span className="mv-state" role="group" aria-label="About this memory">
            {actions}
          </span>
        )}
      </div>
    </header>
  );
}

/** The plate's box takes the photograph's own ratio, held between 16:10 and 4:5; a taller or wider picture is shown whole inside it. */
const boxRatio = (r: number) => Math.min(1.6, Math.max(0.8, r));

/**
 * The photograph as a print: a straight plate at its natural ratio, a 12px
 * white border (16 at the foot), square-cornered but for 2px, black-paper
 * corners. It fades in when it has loaded (no grey "developing" on every
 * visit). Under it the date, then the other photographs as small straight
 * prints; the arrow keys move between them.
 */
export function Plate({ photos, current, onPick, when, alt }: { photos: string[]; current: string; onPick: (url: string) => void; when: string; alt: string }) {
  const src = usePhotoUrl(current);
  const [ratio, setRatio] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const r = src ? ratio[src] : undefined;
  const ready = r != null;
  const shown = photos.slice(0, 6);
  const more = photos.length - shown.length;
  const strip = useRef<HTMLDivElement>(null);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = shown.indexOf(current);
    const next = shown[(i + (e.key === "ArrowRight" ? 1 : shown.length - 1)) % shown.length];
    onPick(next);
    window.requestAnimationFrame(() => strip.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus());
  };

  return (
    <div className="mv-plate-in" style={{ ["--r" as string]: String(boxRatio(r ?? 4 / 3)) }}>
      <button type="button" className="mv-print-btn" onClick={() => setOpen(true)} aria-label={`${alt}. Open it full size`}>
        <figure className={`mv-print${ready ? " ready" : ""}`}>
          <span className="mv-print-box">
            <img
              src={src ?? undefined}
              alt=""
              onLoad={(e) => {
                const img = e.currentTarget;
                if (src && img.naturalWidth && img.naturalHeight) setRatio((m) => ({ ...m, [src]: img.naturalWidth / img.naturalHeight }));
              }}
            />
          </span>
          {/* held on the page by four black-paper photo corners, as in an album */}
          <i className="mv-pc tl" aria-hidden="true" />
          <i className="mv-pc tr" aria-hidden="true" />
          <i className="mv-pc bl" aria-hidden="true" />
          <i className="mv-pc br" aria-hidden="true" />
        </figure>
      </button>
      {when && <p className="mv-when">{when}</p>}
      {photos.length > 1 && (
        <div className="mv-thumbs" role="group" aria-label={`${photos.length} photographs; the arrow keys move between them`} ref={strip} onKeyDown={onKey}>
          {shown.map((p, i) => (
            <Thumb key={p} url={p} on={p === current} onPick={() => onPick(p)} label={`Photograph ${i + 1} of ${photos.length}`} />
          ))}
          {more > 0 && <span className="mv-thumbs-more">+{more}</span>}
        </div>
      )}
      {open && src && <Lightbox src={src} when={when} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}

function Thumb({ url, on, onPick, label }: { url: string; on: boolean; onPick: () => void; label: string }) {
  const src = usePhotoUrl(url);
  return (
    <button type="button" className="mv-thumb" aria-pressed={on} onClick={onPick} aria-label={label} tabIndex={on ? 0 : -1}>
      <img src={src ?? undefined} alt="" loading="lazy" />
    </button>
  );
}

/** The photograph full screen on a dark ground, contained, with its date; Esc or Close puts it back. */
function Lightbox({ src, when, alt, onClose }: { src: string; when: string; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const close = () => onClose();
    d.addEventListener("close", close);
    return () => d.removeEventListener("close", close);
  }, [onClose]);
  return (
    <dialog className="mv-lightbox" ref={ref} aria-label={alt} onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
      <figure>
        <img src={src} alt={alt} />
        {when && <figcaption>{when}</figcaption>}
      </figure>
      <button type="button" className="mv-lightbox-close" onClick={() => ref.current?.close()} autoFocus>
        Close
      </button>
    </dialog>
  );
}

/** Turning the page: "‹ The klomp · Memory 8 of 9 · Tulip Time, 1968 ›", one line, named, as the book turns (rule 38). */
export function PageTurn({ prev, next, pos }: { prev: { id: string; title: string } | null; next: { id: string; title: string } | null; pos?: string }) {
  if (!prev && !next) return null;
  return (
    <nav className="mv-turn" aria-label="Turn the page">
      {!prev && <span className="mv-turn-end" />}
      {prev && (
        <Link to={`/archive/${prev.id}`} className="mv-turn-link prev" rel="prev">
          <span className="mv-turn-k">
            <span aria-hidden="true">‹</span> Previous
          </span>
          <i>{prev.title}</i>
        </Link>
      )}
      {pos && <span className="mv-turn-pos">{pos}</span>}
      {next ? (
        <Link to={`/archive/${next.id}`} className="mv-turn-link next" rel="next">
          <span className="mv-turn-k">Next</span>
          <i>{next.title}</i>
          <span className="mv-turn-arrow" aria-hidden="true">
            ›
          </span>
        </Link>
      ) : (
        <span className="mv-turn-end" />
      )}
    </nav>
  );
}
