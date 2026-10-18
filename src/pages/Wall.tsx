/**
 * The wall: one person's story the way the family sends it round, at
 * /p/<slug>. Anyone with the link, no account. The server decides what is
 * shown (get_public_story: nothing unless the story is shared, and never a
 * memory marked private or still being written up).
 *
 * Set like the family book opened at its frontispiece: on the cloth their
 * portrait (or a monogram seal), their name and a line about them; on the
 * paper the chapters as a contents column that stays beside you on a wide
 * window, and every memory they chose to show as a leaf of the book, two or
 * three to a row in reading order with their tops aligned, the photograph a
 * white-bordered print, the words in their own voice. The chapters are the printed book's own (app-core
 * bookStructure and printedChapterName), so the wall and the Book never
 * disagree. What the family added closes the page as notecards.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { useLight } from "../components/delight/Light";
import LoadingMark from "../components/delight/LoadingMark";
import { usePhotoUrl } from "../lib/photoUrls";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { arrive } from "../lib/arrive";
import { smarten } from "../lib/typography";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { bookStructure } from "../app-core/lib/legacyBook.js";
import { printedChapterName } from "../app-core/lib/bookDesign.js";

type WallMemory = { id: string; title: string; body: string; era: string; period: string; created_at: string; photos: string[] };
type Testimonial = { id: string; contributor_name: string; relationship: string; body: string; created_at: string };
type WallStory = { name: string; last_name: string; photo_url: string | null; intro: string; relationship: string; memories: WallMemory[]; testimonials: Testimonial[] };
type Chapter = { name: string; items: WallMemory[] };

const paragraphs = (t: string) =>
  smarten(String(t || ""))
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const anchor = (name: string) => `ch-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const memories = (n: number) => `${n} ${n === 1 ? "memory" : "memories"}`;

/** The chapters exactly as the printed book files them: the same structure function, the same printed names. */
function chaptersOf(story: WallStory): Chapter[] {
  const s = bookStructure({ name: story.name, lastName: story.last_name, memories: story.memories.map((m) => ({ ...m, createdAt: m.created_at, status: "complete" })) } as never) as unknown as {
    chapters: { era: string; items: WallMemory[] }[];
  };
  return s.chapters.map((c) => ({ name: printedChapterName(c.era) as string, items: c.items }));
}

/**
 * The story as a visitor may see it, from the public-story Edge Function: the same object get_public_story returns,
 * with every photograph's address already signed (six hours), so somebody with no account sees the prints. A 404
 * means the story isn't shared. If the function can't be reached, the page falls back to the RPC (words only).
 */
async function loadWall(slug: string): Promise<WallStory | null> {
  if (!slug) return null;
  try {
    const { data, error } = await supabase().functions.invoke(`public-story?slug=${encodeURIComponent(slug)}`, { method: "GET" });
    if (!error) return (data as WallStory | null) ?? null;
    if (error instanceof FunctionsHttpError && error.context?.status === 404) return null;
  } catch {
    /* fall through to the RPC */
  }
  try {
    const { data, error } = await supabase().rpc("get_public_story", { slug });
    return error ? null : ((data as WallStory | null) ?? null);
  } catch {
    return null;
  }
}

/** A photograph's address: one the function already signed is used as it is; anything else goes through the app's signing. */
const isSigned = (u: string | null | undefined) => !!u && /\/storage\/v1\/object\/sign\//.test(u) && /[?&]token=/.test(u);
function usePrint(u: string | null | undefined): string | null {
  const signedHere = usePhotoUrl(isSigned(u) ? null : u);
  return isSigned(u) ? (u as string) : signedHere;
}

/** Lines a clamped leaf always keeps, and how few hidden lines are worth a button (fewer are simply shown). */
const BASE_LINES = 6;
const WORTH_A_BUTTON = 2;
/** The button's own height and the gap above it, in CSS px (min-height 44, margin-top s-1, the leaf's gap s-2). */
const MORE_RESERVE = 44 + 4 + 8;
/** A leaf of words that all fit is set larger, a letter filling its leaf, from the house 18px up to this. */
const LETTER_MAX = 22;

/**
 * Words are clamped to fill the leaf's row, not to a fixed count: a leaf of words beside a photograph runs down to
 * where the photograph leaves end, and the button shows only when words are really hidden (more than a couple of
 * lines; one or two hidden lines are simply shown). A leaf of words beside photographs whose whole text fits with
 * room to spare is set a little larger instead (18px up to 22px), so the row is words, not blank paper. Measured
 * after layout, and again, all leaves together and in
 * reading order, when the width changes, the fonts arrive or a print loads, so the result never depends on which
 * leaf happened to measure first.
 */
type Fill = { clear: () => void; measure: () => boolean };
const fills = new Set<Fill>();
let refillFrame = 0;
/** Measure every leaf again. A leaf that gains or loses its button changes its row's height, so a pass that changed
 * a button is followed by one more (at most two more), once React has drawn the buttons. */
function refill(passes = 2) {
  cancelAnimationFrame(refillFrame);
  refillFrame = requestAnimationFrame(() => {
    fills.forEach((f) => f.clear());
    let changed = false;
    fills.forEach((f) => {
      if (f.measure()) changed = true;
    });
    if (changed && passes > 0) setTimeout(() => refill(passes - 1), 0);
  });
}

function useFill(leaf: React.RefObject<HTMLElement | null>, words: React.RefObject<HTMLDivElement | null>, open: boolean) {
  const [more, setMore] = useState(false);
  const shown = useRef(false);
  useLayoutEffect(() => {
    const el = leaf.current;
    const w = words.current;
    if (!el || !w) return;
    const clear = () => {
      w.style.removeProperty("font-size");
      w.style.removeProperty("-webkit-line-clamp");
      w.style.removeProperty("display");
      w.style.removeProperty("overflow");
    };
    /** Returns true when the leaf's button appeared or went. */
    const measure = (): boolean => {
      clear();
      if (open) return false;
      // styles first, then the two boxes back to back: a scroll-driven rise can move the leaf between reads, so
      // everything is measured from the leaf's own top
      const lh = parseFloat(getComputedStyle(w).lineHeight) || 28.8;
      const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      const box = el.getBoundingClientRect();
      const top = w.getBoundingClientRect().top - box.top;
      if (!el.offsetHeight || !box.height) return false;
      const k = box.height / el.offsetHeight; // screen px per CSS px (html zoom)
      const floor = box.height - pad * k;
      const reserve = MORE_RESERVE * k;
      const below = () => {
        const l = el.getBoundingClientRect().top;
        return w.getBoundingClientRect().bottom - l;
      };
      let n = Math.max(BASE_LINES, Math.floor((floor - reserve - top) / (lh * k)));
      w.style.setProperty("-webkit-line-clamp", String(n));
      // paragraph gaps take room too: step back until the words and the button sit inside the leaf
      while (n > BASE_LINES && below() + reserve > floor + 0.5) {
        n -= 1;
        w.style.setProperty("-webkit-line-clamp", String(n));
      }
      const fits = w.scrollHeight - w.clientHeight <= lh * WORTH_A_BUTTON + 1;
      if (fits) {
        w.style.setProperty("display", "block");
        w.style.setProperty("overflow", "visible");
        // all of it shows: on a leaf of words alone, step the type up a pixel at a time while it still sits inside
        if (!el.classList.contains("has-photo")) {
          const base = parseFloat(getComputedStyle(w).fontSize) || 18;
          let size = base;
          while (size < LETTER_MAX) {
            w.style.setProperty("font-size", `${size + 1}px`);
            if (below() > floor + 0.5) {
              if (size === base) w.style.removeProperty("font-size");
              else w.style.setProperty("font-size", `${size}px`);
              break;
            }
            size += 1;
          }
        }
      }
      const changed = shown.current === fits;
      shown.current = !fits;
      setMore(!fits);
      return changed;
    };
    const fill = { clear, measure };
    fills.add(fill);
    const again = () => refill();
    if (measure()) again();
    let width = el.parentElement?.getBoundingClientRect().width ?? 0;
    const ro = new ResizeObserver(() => {
      const now = el.parentElement?.getBoundingClientRect().width ?? 0;
      if (Math.abs(now - width) > 0.5) {
        width = now;
        again();
      }
    });
    if (el.parentElement) ro.observe(el.parentElement);
    // fonts.ready is already settled after the first load, so this also runs on every later effect run: it is what
    // fills the neighbours again when a leaf opens or folds, not only a one-time wait for the fonts
    document.fonts?.ready.then(again).catch(() => {});
    const imgs = Array.from(el.parentElement?.querySelectorAll("img") ?? []);
    imgs.forEach((i) => i.addEventListener("load", again));
    return () => {
      fills.delete(fill);
      ro.disconnect();
      imgs.forEach((i) => i.removeEventListener("load", again));
      clear();
    };
  }, [leaf, words, open]);
  return more || open;
}

function Leaf({ m }: { m: WallMemory }) {
  const [open, setOpen] = useState(false);
  const paras = paragraphs(m.body);
  const photo = usePrint(m.photos?.[0] ?? null);
  const id = `leaf-${m.id}`;
  const leaf = useRef<HTMLElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const more = useFill(leaf, words, open);
  return (
    <article ref={leaf} className={`wall-leaf${photo ? " has-photo" : ""}`} aria-labelledby={`${id}-t`}>
      {photo && (
        <span className="wall-print">
          <img src={photo} alt={m.title ? `A photograph for “${smarten(m.title)}”` : "A photograph from the story"} loading="lazy" />
        </span>
      )}
      {m.period && <p className="wall-date">{m.period}</p>}
      <h3 id={`${id}-t`}>{m.title ? smarten(m.title) : "Untitled"}</h3>
      {/* a drop cap needs a long first line to wrap around; words kept line by line start plain */}
      <div ref={words} id={`${id}-w`} className={`wall-words${open ? "" : " closed"}${(paras[0] || "").length > 140 ? " drop" : ""}`}>
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {more && (
        <button type="button" className="wall-more" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-w`}>
          {open ? "Fold it away" : "Read the whole thing"}
        </button>
      )}
    </article>
  );
}

/** The cloth and its one sheet, for the pages that are not the story itself (loading, not shared). */
function Bench({ children }: { children: React.ReactNode }) {
  const ground = useRef<HTMLDivElement>(null);
  useLight(ground);
  return (
    <div className="wall wall-bench on-dark" ref={ground}>
      <span className="lamp" aria-hidden="true" />
      <div className="wall-top">
        <Link className="brand" to="/welcome" aria-label="A Story">
          <Lockup height={28} />
        </Link>
      </div>
      {children}
    </div>
  );
}

/**
 * The counts under the name, and the tail that says who shared it. Each count stays whole with its dot. Below 1100px
 * the counts hold a fixed number of lines per band and the tail is its own line (shortened below 375), so the line
 * count never depends on the numbers; the waiting frame holds the same markup, so the two are always the same height.
 */
function WallCounts({ count, chapters, family }: { count: number; chapters: number; family: number }) {
  return (
    <>
      <span className="wall-counts-nums">
        <span className="nw">{memories(count)}</span>
        {chapters > 1 && (
          <>
            {" "}
            <span className="nw">· {chapters} chapters</span>
          </>
        )}
        {family > 0 && (
          <>
            {" "}
            <span className="nw">· {family} from the family</span>
          </>
        )}
      </span>{" "}
      <span className="wall-counts-tail">
        <span className="nw">
          <span className="wall-counts-dot">· </span>shared by the family
        </span>
        <span className="wall-counts-more">, for anyone with the link</span>
      </span>
    </>
  );
}

/**
 * While the story is fetched: the wall's own frame in hairlines, the portrait ring and two lines on the cloth, the
 * contents column and a row of leaf outlines on the sheet, with the mark drawing over them (Bao's Standard rule 42).
 */
function WallWait({ onShown }: { onShown: () => void }) {
  const ground = useRef<HTMLDivElement>(null);
  useLight(ground);
  useLayoutEffect(onShown, [onShown]);
  return (
    <div className="wall wall-skel">
      <div className="wall-cloth cloth on-dark" ref={ground}>
        <span className="lamp" aria-hidden="true" />
        <div className="wall-top">
          <Link className="brand" to="/welcome" aria-label="A Story">
            <Lockup height={28} />
          </Link>
        </div>
        <div className="hero wall-hero" aria-hidden="true">
          <div className="hero-in wall-hero-in">
            <span className="wall-portrait wall-sk-ring" />
            <div className="wall-hero-words">
              {/* the arrived hero's own lines, held invisible and ruled: a one-line name, the line about them, the counts */}
              <div className="wall-sk-words">
                <h1>&nbsp;</h1>
                <p className="wall-intro">A life, in their own words.</p>
                <p className="wall-counts">
                  <WallCounts count={8} chapters={2} family={1} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="sheet-page wall-sheet">
        <div className="page wall-page">
          <div className="wall-contents" aria-hidden="true">
            <i className="bka-sk-label" />
            <i className="bka-sk-line wall-sk-row" />
            <i className="bka-sk-line wall-sk-row" />
            <i className="bka-sk-line wall-sk-row" />
            <i className="bka-sk-line wall-sk-row" />
          </div>
          {/* the outlines are empty, so nothing here is read but the mark's own status line */}
          <div className="wall-main">
            <div className="wall-chapter">
              <i className="bka-sk-line tall w40 wall-sk-head" />
              <div className="wall-leaves">
                {/* the heart draws inside the first outline, where the first words will land, on clear paper */}
                <span className="wall-sk-leaf">
                  <LoadingMark />
                </span>
                <span className="wall-sk-leaf" />
                <span className="wall-sk-leaf" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Wall() {
  const { slug } = useParams();
  const [story, setStory] = useState<WallStory | null | undefined>(undefined);
  // whether the waiting frame was shown (set from its layout effect), so the arrival knows the sheet already stands
  const waited = useRef(false);
  const markWaited = useCallback(() => {
    waited.current = true;
  }, []);
  const root = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  useLight(ground);

  useEffect(() => {
    let live = true;
    loadWall(slug || "").then((s) => live && setStory(s));
    return () => {
      live = false;
    };
  }, [slug]);

  const chapters = useMemo(() => (story ? chaptersOf(story) : []), [story]);

  // One authored arrival: the name rises line by line, the sheet settles (lib/arrive). The leaves below are never
  // held back for it: they move on the scroll's own timeline (CSS), so nothing waits on an observer.
  // (a layout effect, so the from-state is set before the first paint)
  // When the waiting frame was on screen, its sheet already stood at full strength: the story's own sheet takes its
  // place where it stands, and only what is inside rises (no second rise from nothing).
  useLayoutEffect(() => {
    if (!story || !root.current) return;
    return arrive(root.current, { inside: waited.current });
  }, [story]);

  const photo = usePrint(story?.photo_url ?? null);

  if (story === undefined) return <WallWait onShown={markWaited} />;

  if (story === null) {
    return (
      <Bench>
        <div className="wall-none-wrap">
          {/* Bond, curious, his front paws resting on the sheet's top edge, in front of it: the whole dog, never a head behind the paper */}
          <img className="wall-none-dog" src="/dog/curious-420.webp" alt="" aria-hidden="true" width={488} height={637} />
          <main className="wall-none">
          <h1>
            This story isn’t shared
            <Stop />
          </h1>
          <p>The family may have turned the link off, or the address isn’t quite right. Asking whoever sent it for the link again takes a minute.</p>
            <Link className="btn outline" to="/welcome">
              Keep your own story
            </Link>
          </main>
        </div>
      </Bench>
    );
  }

  const fullName = `${story.name} ${story.last_name || ""}`.trim();
  const count = story.memories.length;
  const family = story.testimonials.length;
  const monogram = (story.name.trim()[0] || "?").toUpperCase() + (story.last_name?.trim()[0]?.toUpperCase() || "");

  return (
    <div className="wall" ref={root}>
      <div className="wall-cloth cloth on-dark" ref={ground}>
        <span className="lamp" aria-hidden="true" />
        <div className="wall-top">
          <Link className="brand" to="/welcome" aria-label="A Story">
            <Lockup height={28} />
          </Link>
        </div>
        <header className="hero wall-hero">
          <div className="hero-in wall-hero-in">
            {photo ? (
              <img className="wall-portrait" src={photo} alt={`${story.name}`} />
            ) : (
              <span className="wall-portrait wall-seal" aria-hidden="true">
                {monogram}
              </span>
            )}
            <div className="wall-hero-words">
              <h1>
                {fullName}
                <Stop />
              </h1>
              <p className="wall-intro" data-rise>
                {story.intro ? smarten(story.intro) : `A life, in ${story.name}’s own words.`}
              </p>
              {(count > 0 || family > 0) && (
              <p className="wall-counts" data-rise>
                <WallCounts count={count} chapters={chapters.length} family={family} />
              </p>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="sheet-page wall-sheet">
        <div className="page wall-page">
          {count === 0 && family === 0 ? (
            <section className="wall-empty">
              <img className="wall-empty-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" width={781} height={622} />
              <h2>
                Nothing is shared here yet
                <Stop />
              </h2>
              <p>When {story.name} shares a memory, it appears on this page the moment it is kept. Starting a book of your own takes about two minutes.</p>
              <Link className="btn outline" to="/welcome">
                Keep your own story
              </Link>
            </section>
          ) : (
            <>
              <nav className="wall-contents" aria-label="Chapters">
                <p className="wall-contents-label">Contents</p>
                <ol>
                  {chapters.map((c, i) => (
                    <li key={c.name}>
                      <a href={`#${anchor(c.name)}`}>
                        <span className="n">{i + 1}</span>
                        <span className="t">{c.name}</span>
                        <span className="c">{memories(c.items.length)}</span>
                      </a>
                    </li>
                  ))}
                  {family > 0 && (
                    <li>
                      <a href="#from-the-family">
                        <span className="n">
                          <i className="fleuron" aria-hidden="true" />
                        </span>
                        <span className="t">From the family</span>
                        <span className="c">{family === 1 ? "1 note" : `${family} notes`}</span>
                      </a>
                    </li>
                  )}
                </ol>
              </nav>

              <div className="wall-main">
                {chapters.map((c, i) => {
                  const one = c.items.length === 1;
                  return (
                    <section key={c.name} id={anchor(c.name)} className={`wall-chapter${one ? " one" : ""}`} aria-labelledby={`${anchor(c.name)}-h`}>
                      <header className="wall-chapter-head">
                        <span className="wall-chapter-num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <h2 id={`${anchor(c.name)}-h`}>{c.name}</h2>
                        <span className="wall-chapter-count">{memories(c.items.length)}</span>
                      </header>
                      <div className="wall-leaves">
                        {c.items.map((m) => (
                          <Leaf key={m.id} m={m} />
                        ))}
                      </div>
                    </section>
                  );
                })}
                {family > 0 && (
                  <section id="from-the-family" className="wall-chapter wall-family" aria-labelledby="from-the-family-h">
                    <header className="wall-chapter-head">
                      <span className="wall-chapter-num" aria-hidden="true">
                        <i className="fleuron" />
                      </span>
                      <h2 id="from-the-family-h">From the family</h2>
                    </header>
                    <div className="wall-notes">
                      {story.testimonials.map((t) => (
                        <blockquote key={t.id} className="wall-note">
                          <p>{smarten(t.body)}</p>
                          <footer>{[t.contributor_name, t.relationship].filter(Boolean).join(", ")}</footer>
                        </blockquote>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
        <div className="page wall-next">
          {/* an empty wall already offers "Keep your own story" as its one action, so its third row is the price instead */}
          <WhereNext
            rows={[
              ...(count === 0 && family === 0 ? [] : [{ to: "/welcome", title: "Keep your own story", line: "Every life holds a story worth keeping." }]),
              { to: "https://astoryapp.com/samples/", title: "Turn the pages of a sample", line: "A family book, printed exactly the way yours will be.", external: true },
              { to: "https://astoryapp.com/", title: "How A Story works", line: "One small question a day, and the family adds the rest.", external: true },
              ...(count === 0 && family === 0
                ? [{ to: "https://astoryapp.com/pricing", title: "What a family book costs", line: "The plans side by side, and what each one includes.", external: true }]
                : []),
            ]}
          />
        </div>
      </main>
    </div>
  );
}
