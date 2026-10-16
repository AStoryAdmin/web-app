/**
 * The wall: one person's story the way the family sends it round, at
 * /p/<slug>. Anyone with the link, no account. The server decides what is
 * shown (get_public_story: nothing unless the story is shared, and never a
 * memory marked private or still being written up). Their name and a line
 * about them on the cloth; on the sheet every memory they chose to show,
 * chapter by chapter, and what the family added.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { useLight } from "../components/delight/Light";
import { ButtonLink } from "../components/ui";
import { usePhotoUrl } from "../lib/photoUrls";
import { supabase } from "../lib/supabase";
import { ERAS } from "../app-core/data/eras.js";
import { parseYear } from "../app-core/lib/timeline.js";

type WallMemory = { id: string; title: string; body: string; era: string; period: string; created_at: string; photos: string[] };
type Testimonial = { id: string; contributor_name: string; relationship: string; body: string; created_at: string };
type WallStory = { name: string; last_name: string; photo_url: string | null; intro: string; relationship: string; memories: WallMemory[]; testimonials: Testimonial[] };

const paragraphs = (t: string) => String(t || "").split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);

function Pic({ url }: { url: string }) {
  const src = usePhotoUrl(url);
  return src ? <img src={src} alt="" loading="lazy" /> : null;
}

function WallMemoryCard({ m }: { m: WallMemory }) {
  const [open, setOpen] = useState(false);
  const paras = paragraphs(m.body);
  const long = m.body.length > 320 || paras.length > 2;
  const photo = m.photos?.[0];
  return (
    <article className={`wall-mem${photo ? "" : " nopic"}`}>
      <div>
        {m.period && <p className="date">{m.period}</p>}
        <h3>{m.title || "Untitled"}</h3>
        <div className={`words${long && !open ? " closed" : ""}`}>
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {long && (
          <button type="button" className="more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Less" : "Read the whole thing"}
          </button>
        )}
      </div>
      {photo && <Pic url={photo} />}
    </article>
  );
}

export default function Wall() {
  const { slug } = useParams();
  const [story, setStory] = useState<WallStory | null | undefined>(undefined);
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

  const photo = usePhotoUrl(story?.photo_url ?? null);

  if (story === undefined) return <div className="wall" aria-busy="true" />;

  if (story === null) {
    return (
      <div className="wall">
        <div className="wall-empty">
          <Lockup height={32} />
          <h1 style={{ fontSize: "var(--t-h2)" }}>This story isn't shared.</h1>
          <p className="meta">The family may have turned the link off, or the address isn't quite right.</p>
          <ButtonLink to="/welcome" variant="outline">
            Keep your own story
          </ButtonLink>
        </div>
      </div>
    );
  }

  const fullName = `${story.name} ${story.last_name || ""}`.trim();
  const count = story.memories.length;

  return (
    <div className="wall">
      <div className="wall-cloth on-dark" ref={ground}>
        <span className="lamp" aria-hidden="true" />
        <div className="wall-top">
          <Link className="brand" to="/welcome" aria-label="A Story">
            <Lockup height={28} />
          </Link>
          <Link to="/welcome">Keep your own story</Link>
        </div>
        <header className="wall-hero">
          {photo ? <img className="avatar" src={photo} alt="" /> : <span className="avatar ph" aria-hidden="true">{story.name.slice(0, 1)}</span>}
          <div>
            <h1>
              <span className="hl">{fullName}</span>
              {count ? "" : "."}
            </h1>
            {story.intro ? <p className="intro">{story.intro}</p> : <p className="intro">A life, in {story.name}'s own words.</p>}
            <p className="counts">
              {count} {count === 1 ? "memory" : "memories"}
              {chapters.length > 1 ? ` · ${chapters.length} chapters` : ""}
              {story.testimonials.length ? ` · ${story.testimonials.length} from the family` : ""}
            </p>
          </div>
        </header>
      </div>

      <main className="wall-sheet">
        <div className="page">
          {chapters.length === 0 && <p className="meta">Nothing shared yet.</p>}
          {chapters.map((c) => (
            <section key={c.era} className="wall-chapter" aria-label={c.era}>
              <h2>
                {c.era}
                <span>
                  {c.items.length} {c.items.length === 1 ? "memory" : "memories"}
                </span>
              </h2>
              {c.items.map((m) => (
                <WallMemoryCard key={m.id} m={m} />
              ))}
            </section>
          ))}
          {story.testimonials.length > 0 && (
            <section className="wall-chapter" aria-label="From the family">
              <h2>From the family</h2>
              <div className="wall-family">
                {story.testimonials.map((t) => (
                  <blockquote key={t.id} className="card teal">
                    <p>{t.body}</p>
                    <footer>{[t.contributor_name, t.relationship].filter(Boolean).join(", ")}</footer>
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </div>
        <footer className="wall-foot">
          Kept with <Link to="/welcome">A Story</Link>. Every life holds a story worth preserving.
        </footer>
      </main>
    </div>
  );
}
