/**
 * The front door for somebody with no session. The cloth carries one
 * bold line and two buttons, with something a person said beside them.
 * On the sheet: the book itself, a sample you can turn, the covers and
 * papers it comes in, and the three things A Story does. Nothing here is
 * prettier than the product: the sample book is built with the same
 * functions as a real one.
 */
import { useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lockup } from "../../components/Brand";
import { useLight } from "../../components/delight/Light";
import { ButtonLink } from "../../components/ui";
import BookSpread from "../../components/book/BookSpread";
import CoverSwatches from "../../components/book/CoverSwatches";
import { buildSampleBook } from "../../components/book/bookPages";
import { coverColour } from "../../components/book/coverColours";
import { SAMPLE_BOOKS, sampleBook, type SampleBook } from "../../data/sampleBooks";
import { BOOK_PRINT } from "../../app-core/theme/index.js";
import { useAuth } from "../../state/authContext";

type Cover = { board: string; foil?: string; ink?: string; text?: string };
const covers = BOOK_PRINT.covers as { cloth: Cover; heirloom: Cover; tipped: Cover; wrap: Cover; keepsake: Record<string, Cover> };
const papers = BOOK_PRINT.papers as Record<string, { page: string; heading: string; accent: string }>;

const COVERS: { key: string; name: string; note: string; board: string; foil: string; kind?: "tipped" | "photo" }[] = [
  { key: "keepsake", name: "Keepsake", note: "Their name and their photographs, in seven colours", board: covers.keepsake.navy.board, foil: covers.keepsake.navy.ink || "#F1EBD9" },
  { key: "cloth", name: "Clothbound", note: "Deep brown cloth, the title in gold foil", board: covers.cloth.board, foil: covers.cloth.foil || "#D9B45A" },
  { key: "heirloom", name: "Heirloom", note: "Teal cloth with a foil frame and the mark", board: covers.heirloom.board, foil: covers.heirloom.foil || "#D9B45A" },
  { key: "tipped", name: "Photo plate", note: "A photograph set into a linen board", board: covers.tipped.board, foil: covers.tipped.foil || "#8C6A2E", kind: "tipped" },
  { key: "wrap", name: "Photo wrap", note: "Their photograph across the whole cover", board: "#6B5546", foil: "#FFFFFF", kind: "photo" },
];

const PAPERS = [
  { key: "classic", name: "Classic", note: "white, teal and terracotta" },
  { key: "ivory", name: "Ivory", note: "warm cream, brown and terracotta" },
  { key: "antique", name: "Antique", note: "older paper, brown and gold" },
];

export default function Welcome() {
  const { user } = useAuth();
  const ground = useRef<HTMLDivElement>(null);
  useLight(ground);
  // The three fictional families of the samples page, each in its own cover colour until a swatch is chosen.
  const [family, setFamily] = useState<SampleBook["key"]>("carolyn");
  const [colours, setColours] = useState<Record<string, string>>({});
  const sample = sampleBook(family);
  const colour = colours[family] || sample.coverColor;
  const book = useMemo(() => buildSampleBook(sample, colour), [sample, colour]);
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="land">
      <div className="wall-cloth on-dark" ref={ground}>
        <span className="lamp" aria-hidden="true" />
        <div className="wall-top">
          <Link className="brand" to="/welcome" aria-label="A Story">
            <Lockup height={32} />
          </Link>
          <Link to="/sign-in">Sign in</Link>
        </div>
        <section className="land-hero">
          <div>
            <h1>
              Every life holds a story <span className="hl">worth keeping.</span>
            </h1>
            <p className="lead">A question a day, answered in their own words. The family adds what it remembers. The book makes itself, chapter by chapter, and arrives bound.</p>
            <div className="acts">
              <ButtonLink to="/create-account">Get started</ButtonLink>
              <ButtonLink to="/sign-in" variant="outline">
                I already have an account
              </ButtonLink>
            </div>
            <p className="meta" style={{ marginTop: "var(--s-5)" }}>
              Someone gave you a code? <Link to="/create-account?code=" style={{ color: "var(--brass)" }}>Use it here</Link>.
            </p>
          </div>
          <aside className="said" aria-label="Something a person said">
            <p className="q">Your grandfather asked me three times. I said yes the first time. He just didn’t hear me.</p>
            <p className="who">Nora, 84, telling her granddaughter</p>
          </aside>
        </section>
      </div>

      <main className="land-sheet">
        <div className="page">
          <section className="land-sec" aria-labelledby="book-h">
            <div className="sechead">
              <span className="pill gold">The book</span>
              <h2 id="book-h">
                Turn the pages of a real <span className="hl">A Story book.</span>
              </h2>
              <p>Three fictional families, printed exactly the way yours will be. Turn the pages with the arrows, or click a page. Tap a colour to see the cover in it.</p>
            </div>
            <div className="sb-pick">
              <div className="sb-books" role="group" aria-label="Choose a sample book">
                {SAMPLE_BOOKS.map((b) => (
                  <button key={b.key} type="button" aria-pressed={b.key === family} onClick={() => setFamily(b.key)}>
                    <i style={{ background: coverColour(colours[b.key] || b.coverColor).board }} aria-hidden="true" />
                    <span>
                      <b>{b.full}</b>
                      <small>{b.subtitle}</small>
                    </span>
                  </button>
                ))}
              </div>
              <CoverSwatches value={colour} onChange={(k) => setColours((c) => ({ ...c, [family]: k }))} />
            </div>
            <BookSpread key={family} book={book} />
          </section>

          <section className="land-sec" aria-labelledby="covers-h">
            <div className="sechead">
              <span className="pill gold">Printed editions</span>
              <h2 id="covers-h">
                Five covers, three papers, <span className="hl">made to stay on a shelf.</span>
              </h2>
              <p>Softcover for the table, clothbound hardcover for the shelf, the Heirloom for the generations after. Or print it at home, free, whenever you like.</p>
            </div>
            <div className="covers">
              {COVERS.map((c) => (
                <div key={c.key} className="cover-tile">
                  <div className={`book${c.kind === "tipped" ? " tipped" : ""}${c.kind === "photo" ? " photo" : ""}`} style={{ ["--board" as string]: c.board, ["--foil" as string]: c.foil }} aria-hidden="true">
                    {c.key === "heirloom" && <span className="frame" />}
                    {c.kind === "tipped" && <span className="plate" />}
                    <span className="name">
                      Nora Whitfield
                      <small>A life, in her words</small>
                    </span>
                  </div>
                  <b>{c.name}</b>
                  <small>{c.note}</small>
                </div>
              ))}
            </div>
            <div className="papers" aria-label="Papers">
              {PAPERS.map((p) => (
                <span key={p.key} className="paper-chip">
                  <i style={{ ["--swatch" as string]: papers[p.key]?.page || "#fff" }} />
                  {p.name} <small>· {p.note}</small>
                </span>
              ))}
            </div>
          </section>

          <section className="land-sec" aria-labelledby="how-h">
            <div className="sechead">
              <span className="pill gold">How it works</span>
              <h2 id="how-h">
                Three small things, <span className="hl">every day.</span>
              </h2>
            </div>
            <div className="hows">
              <div className="card">
                <p className="n">1</p>
                <h3>A question a day</h3>
                <p>Small ones. The kitchen, the first job, the song on the radio. Answer in writing, or on a phone call A Story makes at the hour you choose.</p>
              </div>
              <div className="card">
                <p className="n">2</p>
                <h3>The family adds its side</h3>
                <p>A daughter remembers the lemonade. A nephew has the photograph. Each memory gathers what everyone remembers, under their own names.</p>
              </div>
              <div className="card teal">
                <p className="n">3</p>
                <h3>The book arrives</h3>
                <p>
                  Chapter by chapter, with the photographs. <span className="hl">Read it on screen any day, print it at home, or have it bound.</span>
                </p>
              </div>
            </div>
          </section>

          <section className="card land-cta" aria-label="Get started">
            <div>
              <h2>Start with one memory.</h2>
              <p className="meta">Free to begin. Nothing to set up. The first question is waiting.</p>
            </div>
            <div className="acts">
              <ButtonLink to="/create-account">Get started</ButtonLink>
              <ButtonLink to="/sign-in" variant="quiet">
                Sign in
              </ButtonLink>
            </div>
          </section>
        </div>
        <footer className="land-foot">
          <Link to="/sign-in">Sign in</Link> · <Link to="/create-account">Create an account</Link> · A Story
        </footer>
      </main>
    </div>
  );
}
