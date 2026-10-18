/**
 * The wall: one person's story the way the family sends it round, at
 * /p/<slug>. Anyone with the link, no account. The server decides what is
 * shown (get_public_story: nothing unless the story is shared, and never a
 * memory marked private or still being written up).
 *
 * Set like the family book opened at its frontispiece: on the cloth their
 * portrait (or a monogram seal), their name and a line about them; on the
 * paper the chapters as a contents column that stays beside you on a wide
 * window, and every memory they chose to show as a leaf of the book, two to
 * a row, the photograph a white-bordered print, the words in their own
 * voice. What the family added closes the page as notecards. One line says
 * this is shared on purpose; nothing else explains itself.
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
import { ERAS } from "../app-core/data/eras.js";
import { parseYear } from "../app-core/lib/timeline.js";

type WallMemory = { id: string; title: string; body: string; era: string; period: string; created_at: string; photos: string[] };
type Testimonial = { id: string; contributor_name: string; relationship: string; body: string; created_at: string };
type WallStory = { name: string; last_name: string; photo_url: string | null; intro: string; relationship: string; memories: WallMemory[]; testimonials: Testimonial[] };

const paragraphs = (t: string) =>
  String(t || "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const anchor = (era: string) => `ch-${era.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/** A white-bordered print, once its address is signed; nothing at all until then (a visitor may never be able to sign it). */
function Print({ src, title }: { src: string; title: string }) {
  return (
    <span className="wall-print">
      <img src={src} alt={title ? `A photograph for “${title}”` : "A photograph from the story"} loading="lazy" />
    </span>
  );
}

function Leaf({ m }: { m: WallMemory }) {
  const [open, setOpen] = useState(false);
  const paras = paragraphs(m.body);
  const long = m.body.length > 420 || paras.length > 3;
  const photo = usePhotoUrl(m.photos?.[0] ?? null);
  const id = `leaf-${m.id}`;
  // the leaves rise as they come into view on a scroll timeline (CSS), never on an observer that might not fire
  return (
    <article className={`wall-leaf${photo ? " has-photo" : ""}${m.body.length > 700 ? " long" : ""}`} aria-labelledby={`${id}-t`}>
      {photo && <Print src={photo} title={m.title} />}
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

  const chapters = useMemo(() => {
    if (!story) return [];
    const order = ERAS as string[];
    const byEra = new Map<string, WallMemory[]>();
    for (const m of story.memories) {
      const era = m.era || "Anything else";
      byEra.set(era, [...(byEra.get(era) || []), m]);
    }
    const keys = [...byEra.keys()].sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)));
    return keys.map((era) => ({
      era,
      items: (byEra.get(era) || []).sort((a, b) => (parseYear(a.period) || 0) - (parseYear(b.period) || 0) || a.created_at.localeCompare(b.created_at)),
    }));
  }, [story]);

  // One authored arrival: the name rises line by line, the sheet settles, the first leaves follow (lib/arrive).
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
            This story isn't shared<Stop />
          </h1>
          <p>The family may have turned the link off, or the address isn't quite right. Asking whoever sent it for the link again takes a minute.</p>
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
                {story.intro || `A life, in ${story.name}'s own words.`}
              </p>
              <p className="wall-counts" data-rise>
                {count} {count === 1 ? "memory" : "memories"}
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
            <section className="wall-empty" data-rise>
              <h2>Nothing is shared here yet.</h2>
              <p>When {story.name} shares a memory, it appears on this page.</p>
            </section>
          ) : (
            <>
              <nav className="wall-contents" aria-label="Chapters">
                <p className="wall-contents-label">Contents</p>
                <ol>
                  {chapters.map((c, i) => (
                    <li key={c.era}>
                      <a href={`#${anchor(c.era)}`}>
                        <span className="n">{i + 1}</span>
                        <span className="t">{c.era}</span>
                        <span className="c">{c.items.length}</span>
                      </a>
                    </li>
                  ))}
                  {family > 0 && (
                    <li>
                      <a href="#from-the-family">
                        <span className="n">✦</span>
                        <span className="t">From the family</span>
                        <span className="c">{family}</span>
                      </a>
                    </li>
                  )}
                </ol>
              </nav>

              <div className="wall-main">
                {chapters.map((c, i) => (
                  <section key={c.era} id={anchor(c.era)} className="wall-chapter" aria-labelledby={`${anchor(c.era)}-h`}>
                    <header className="wall-chapter-head">
                      <span className="wall-chapter-num" aria-hidden="true">
                        {i + 1}
                      </span>
                      <h2 id={`${anchor(c.era)}-h`}>{c.era}</h2>
                      <span className="wall-chapter-count">
                        {c.items.length} {c.items.length === 1 ? "memory" : "memories"}
                      </span>
                    </header>
                    <div className={`wall-leaves${c.items.length === 1 ? " one" : ""}`}>
                      {c.items.map((m) => (
                        <Leaf key={m.id} m={m} />
                      ))}
                    </div>
                  </section>
                ))}
                {family > 0 && (
                  <section id="from-the-family" className="wall-chapter wall-family" aria-labelledby="from-the-family-h">
                    <header className="wall-chapter-head">
                      <span className="wall-chapter-num" aria-hidden="true">
                        ✦
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
              { to: "/welcome", title: "Keep your own story", line: "Start a book for someone in your family." },
              { to: "https://astoryapp.com/samples/", title: "Turn the pages of a sample", line: "A family book, printed exactly the way yours will be.", external: true },
              { to: "https://astoryapp.com/", title: "How A Story works", line: "One small question a day, and the family adds the rest.", external: true },
            ]}
          />
        </div>
        <footer className="wall-foot">
          <p>
            Kept with <Link to="/welcome">A Story</Link>. Every life holds a story worth keeping.
          </p>
        </footer>
      </main>
    </div>
  );
}
