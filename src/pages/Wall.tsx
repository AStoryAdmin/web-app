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
 * three to a row, the photograph a white-bordered print, the words in their
 * own voice. The chapters are the printed book's own (app-core
 * bookStructure and printedChapterName), so the wall and the Book never
 * disagree. What the family added closes the page as notecards.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { useLight } from "../components/delight/Light";
import LoadingMark from "../components/delight/LoadingMark";
import { usePhotoUrl } from "../lib/photoUrls";
import { supabase } from "../lib/supabase";
import { arrive } from "../lib/arrive";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { bookStructure } from "../app-core/lib/legacyBook.js";
import { printedChapterName } from "../app-core/lib/bookDesign.js";

type WallMemory = { id: string; title: string; body: string; era: string; period: string; created_at: string; photos: string[] };
type Testimonial = { id: string; contributor_name: string; relationship: string; body: string; created_at: string };
type WallStory = { name: string; last_name: string; photo_url: string | null; intro: string; relationship: string; memories: WallMemory[]; testimonials: Testimonial[] };
type Chapter = { name: string; items: WallMemory[] };

const paragraphs = (t: string) =>
  String(t || "")
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

/** The opening of a memory, for the line set large beside a chapter's one leaf: short lines run together as a sentence. */
function leadOf(body: string): string {
  let out = "";
  for (const p of paragraphs(body)) {
    out = out ? `${out}${/[.!?…]$/.test(out) ? "" : "."} ${p}` : p;
    if (out.length >= 60) break;
  }
  return out.length > 160 ? `${out.slice(0, out.lastIndexOf(" ", 156))}…` : out;
}

function Leaf({ m }: { m: WallMemory }) {
  const [open, setOpen] = useState(false);
  const paras = paragraphs(m.body);
  const long = m.body.length > 420 || paras.length > 3;
  // a print once its address is signed; a visitor may never be able to sign it, and then the leaf is the words alone
  const photo = usePhotoUrl(m.photos?.[0] ?? null);
  const id = `leaf-${m.id}`;
  return (
    <article className={`wall-leaf${photo ? " has-photo" : ""}`} aria-labelledby={`${id}-t`}>
      {photo && (
        <span className="wall-print">
          <img src={photo} alt={m.title ? `A photograph for “${m.title}”` : "A photograph from the story"} loading="lazy" />
        </span>
      )}
      {m.period && <p className="wall-date">{m.period}</p>}
      <h3 id={`${id}-t`}>{m.title || "Untitled"}</h3>
      {/* a drop cap needs a long first line to wrap around; words kept line by line start plain */}
      <div id={`${id}-w`} className={`wall-words${long && !open ? " closed" : ""}${(paras[0] || "").length > 140 ? " drop" : ""}`}>
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {long && (
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

export default function Wall() {
  const { slug } = useParams();
  const [story, setStory] = useState<WallStory | null | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  useLight(ground);

  useEffect(() => {
    let live = true;
    supabase()
      .rpc("get_public_story", { slug: slug || "" })
      .then(({ data, error }) => {
        if (!live) return;
        setStory(error ? null : ((data as WallStory | null) ?? null));
      })
      .then(undefined, () => live && setStory(null));
    return () => {
      live = false;
    };
  }, [slug]);

  const chapters = useMemo(() => (story ? chaptersOf(story) : []), [story]);

  // One authored arrival: the name rises line by line, the sheet settles (lib/arrive). The leaves below are never
  // held back for it: they move on the scroll's own timeline (CSS), so nothing waits on an observer.
  useEffect(() => {
    if (!story || !root.current) return;
    return arrive(root.current);
  }, [story]);

  const photo = usePhotoUrl(story?.photo_url ?? null);

  if (story === undefined)
    return (
      <Bench>
        <div className="wall-wait" aria-busy="true">
          <LoadingMark />
        </div>
      </Bench>
    );

  if (story === null) {
    return (
      <Bench>
        <main className="wall-none">
          <img className="wall-none-dog" src="/dog/curious-paper.webp" alt="" aria-hidden="true" width={762} height={640} />
          <h1>
            This story isn’t shared
            <Stop />
          </h1>
          <p>The family may have turned the link off, or the address isn’t quite right. Asking whoever sent it for the link again takes a minute.</p>
          <Link className="btn outline" to="/welcome">
            Keep your own story
          </Link>
        </main>
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
                {story.intro || `A life, in ${story.name}’s own words.`}
              </p>
              <p className="wall-counts" data-rise>
                {memories(count)}
                {chapters.length > 1 ? ` · ${chapters.length} chapters` : ""}
                {family ? ` · ${family} from the family` : ""} · shared by the family, for anyone with the link
              </p>
            </div>
          </div>
        </header>
      </div>

      <main className="sheet-page wall-sheet">
        <div className="page wall-page">
          {count === 0 && family === 0 ? (
            <section className="wall-empty">
              <img className="wall-empty-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" width={762} height={640} />
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
                  const lead = one ? leadOf(c.items[0].body) : "";
                  return (
                    <section key={c.name} id={anchor(c.name)} className={`wall-chapter${one ? " one" : ""}`} aria-labelledby={`${anchor(c.name)}-h`}>
                      <header className="wall-chapter-head">
                        <span className="wall-chapter-num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <h2 id={`${anchor(c.name)}-h`}>{c.name}</h2>
                        <span className="wall-chapter-count">{memories(c.items.length)}</span>
                        {/* a chapter of one memory: its first line, set large beside the leaf, so the row is not half blank */}
                        {one && lead && (
                          <blockquote className="wall-chapter-quote" aria-hidden="true">
                            <p>{lead}</p>
                          </blockquote>
                        )}
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
                          <p>{t.body}</p>
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
          <WhereNext
            rows={[
              { to: "/welcome", title: "Keep your own story", line: "Every life holds a story worth keeping." },
              { to: "https://astoryapp.com/samples/", title: "Turn the pages of a sample", line: "A family book, printed exactly the way yours will be.", external: true },
              { to: "https://astoryapp.com/", title: "How A Story works", line: "One small question a day, and the family adds the rest.", external: true },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
