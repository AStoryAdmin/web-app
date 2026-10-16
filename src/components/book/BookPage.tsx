/**
 * One page of the book on screen, in the print book's own type: Source
 * Serif 4 for everything a person said, Montserrat small caps for the
 * running head and the chapter eyebrow, the dateline in terracotta, the
 * photographs as plates, the family's additions as a smaller block.
 */
import { usePhotoUrl } from "../../lib/photoUrls";
import type { Page } from "./bookPages";

function Plate({ url, alt }: { url: string; alt: string }) {
  const src = usePhotoUrl(url);
  return <span className="bk-photo">{src ? <img src={src} alt={alt} loading="lazy" /> : <span className="bk-photo-wait" aria-hidden="true" />}</span>;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function BookPage({ page, number, side, teller }: { page: Page | null; number: number | null; side: "left" | "right"; teller: string }) {
  if (!page || page.kind === "blank") return <div className={`bk-page ${side} blank`} aria-hidden="true" />;

  if (page.kind === "cover") {
    return (
      <section className={`bk-page ${side} cover`} aria-label="Cover">
        <div className="bk-cover-frame" />
        <p className="bk-cover-title">{page.title}</p>
        <div className="bk-cover-rule" />
        <p className="bk-cover-name">{page.name}</p>
        {page.span && <p className="bk-cover-span">{page.span}</p>}
      </section>
    );
  }

  const folio = number != null ? <span className="bk-folio">{number}</span> : null;

  if (page.kind === "title") {
    return (
      <section className={`bk-page ${side} titlepage`} aria-label="Title page">
        <div className="bk-rule" />
        <h2 className="bk-title">{page.title}</h2>
        <p className="bk-subtitle">{page.subtitle}</p>
        {page.span && <p className="bk-span">{page.span}</p>}
        {page.recordedBy && <p className="bk-recorded">Recorded by {page.recordedBy}</p>}
        {folio}
      </section>
    );
  }

  if (page.kind === "contents") {
    return (
      <section className={`bk-page ${side} contents`} aria-label="Contents">
        <p className="bk-eyebrow">Contents</p>
        <ol className="bk-toc">
          {page.entries.map((e) => (
            <li key={e.chapter}>
              <span className="bk-toc-name">{e.chapter}</span>
              <span className="bk-toc-dots" aria-hidden="true" />
              <span className="bk-toc-page">{e.page}</span>
            </li>
          ))}
        </ol>
        {folio}
      </section>
    );
  }

  if (page.kind === "chapter") {
    return (
      <section className={`bk-page ${side} chapter`} aria-label={`${page.chapter}, chapter opener`}>
        <p className="bk-eyebrow">{page.eyebrow}</p>
        <h2 className="bk-chapter">{page.chapter}</h2>
        {page.years && <p className="bk-years">{page.years}</p>}
        <p className="bk-count">
          {page.count} {page.count === 1 ? "memory" : "memories"}
        </p>
        {folio}
      </section>
    );
  }

  if (page.kind === "colophon") {
    return (
      <section className={`bk-page ${side} colophon`} aria-label="Colophon">
        <div className="bk-rule gold" />
        <p>
          {page.memories} {page.memories === 1 ? "memory" : "memories"}
          {page.photos ? `, ${page.photos} ${page.photos === 1 ? "photograph" : "photographs"}` : ""}
        </p>
        {page.span && <p>Spanning {page.span}</p>}
        <p>Made {fmtDate(page.printedOn)}</p>
        <p className="bk-line">Every life holds a story worth preserving.</p>
        {folio}
      </section>
    );
  }

  // A memory, or the continuation of one.
  return (
    <section className={`bk-page ${side} memory`} aria-label={page.title ? page.title : `${page.chapter}, continued`}>
      <p className="bk-running">{page.chapter}</p>
      <article className="bk-memory">
        {page.title && <h3 className="bk-mtitle">{page.title}</h3>}
        {page.dateline && <p className="bk-dateline">{page.dateline}</p>}
        {page.photos.length > 0 && (
          <div className={`bk-plate ${page.photos.length === 1 ? "one" : "many"}`}>
            {page.photos.slice(0, 4).map((u, i) => (
              <Plate key={`${u}-${i}`} url={u} alt={`A photograph from ${teller}'s story`} />
            ))}
          </div>
        )}
        {page.paragraphs.map((p, i) => (
          <p key={i} className={`bk-p${i === 0 && !page.title && page.continued ? " cont" : ""}`}>
            {p}
          </p>
        ))}
        {page.credit && <p className="bk-credit">{page.credit}</p>}
        {page.sides.length > 0 && (
          <aside className="bk-sides" aria-label="From the family">
            <p className="bk-sides-head">From the family</p>
            {page.sides.map((s, i) => (
              <blockquote key={i}>
                <p>{s.body}</p>
                <footer>{s.who}</footer>
              </blockquote>
            ))}
          </aside>
        )}
      </article>
      {folio}
    </section>
  );
}
