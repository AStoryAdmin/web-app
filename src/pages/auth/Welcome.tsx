/**
 * The front door for somebody with no session: the bookbinder's bench.
 * The same chocolate cloth as the sign-in, and on it two things: a leaf of
 * the book's paper (the title page: the promise, how it works in three
 * lines, the two ways in) and the real sample book, lying closed, which
 * you can open and read, in three families' books and seven cover colours
 * (BookSpread, built with the same functions as a real book, printed
 * exactly as the samples page prints it). One screen on a desktop, scaled
 * to the window like the sign-in's book; on a phone the leaf comes first
 * and the book shows one page at a time.
 *
 * Going on to Sign in or Begin a book is a View Transition: the leaf
 * becomes the title page of the open book (they share a name, CSS §3).
 * The front door is the arrival, so the sign-in's opening ritual is
 * marked as seen.
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Lockup } from "../../components/Brand";
import { useLight } from "../../components/delight/Light";
import ClothStamp from "../../components/delight/ClothStamp";
import Leaf from "../../components/delight/Leaf";
import Companion from "../../components/delight/Companion";
import { ButtonLink } from "../../components/ui";
import BookSpread from "../../components/book/BookSpread";
import CoverSwatches from "../../components/book/CoverSwatches";
import { buildSampleBook } from "../../components/book/bookPages";
import { coverColour } from "../../components/book/coverColours";
import { MARK_MASK } from "../../components/book/markMask";
import { SAMPLE_BOOKS, sampleBook, type SampleBook } from "../../data/sampleBooks";
import { useAuth } from "../../state/authContext";
import { BOOK_PRINT } from "../../app-core/theme/index.js";
import { isStacked, markOpened, OUT, seedFit, useFit } from "./bookFit";

/** The sign-in's album: decoded before the page turns into the open book, so its prints never arrive as grey boxes. */
const ALBUM = ["/photos/27-1200.webp", "/photos/02-1200.webp", "/photos/18-1200.webp"];
/** At most 400 ms: the album being decoded, or nothing to wait for. */
const albumReady = (album: { current: Promise<unknown> | null }) => Promise.race([album.current, new Promise((done) => setTimeout(done, 400))]);
/** The three papers a book is printed on, as the swatches under "The book arrives". */
const PAPERS = BOOK_PRINT.papers as Record<string, { page: string }>;
const PAPER_NAMES: [string, string][] = [
  ["classic", "Classic"],
  ["ivory", "Ivory"],
  ["antique", "Antique"],
];

export default function Welcome() {
  const { user } = useAuth();
  const ground = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const sweepFrom = useRef<number | null>(null);
  useLight(ground);
  // the bench is drawn at 1560 by 740 and fitted to the window like the sign-in's book
  useFit(ground, wrap, canvas, 1560, 740);
  const navigate = useNavigate();
  const album = useRef<Promise<unknown> | null>(null);
  // The three fictional families of the samples page, each in its own cover colour until a swatch is chosen.
  const [family, setFamily] = useState<SampleBook["key"]>("carolyn");
  // The first book lies on the cloth in cream: a dark board on the brown cloth reads as a hole (the founder's
  // ruling on the teal book on brown). The other families keep their own colours from the samples page.
  const [colours, setColours] = useState<Record<string, string>>({ carolyn: "cream" });
  const sample = sampleBook(family);
  const colour = colours[family] || sample.coverColor;
  const book = useMemo(() => buildSampleBook(sample, colour), [sample, colour]);

  // Arrival, once per visit: the leaf's lines rise one after another, the book settles onto the cloth.
  // Content is visible by default; this only plays it in, and finishes on its own clock (no observer).
  useLayoutEffect(() => {
    markOpened();
    // the sign-in's album, fetched and decoded while the visitor reads, so the open book arrives with its photographs
    album.current = Promise.all(
      ALBUM.map((src) => {
        const img = new Image();
        img.src = src;
        return img.decode().catch(() => undefined);
      }),
    );
    const el = ground.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lines = el.querySelectorAll(".door-leaf > *");
      const book = el.querySelectorAll(".door-book > *");
      gsap.fromTo(el.querySelector(".door-leaf"), { y: 18, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: OUT, clearProps: "transform,opacity" });
      gsap.fromTo(lines, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: OUT, stagger: 0.07, delay: 0.12, clearProps: "transform,opacity" });
      gsap.fromTo(book, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: OUT, stagger: 0.09, delay: 0.25, clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, []);

  if (user) return <Navigate to="/" replace />;

  // Into the open book: wait (at most 400 ms) for the album to be decoded, then turn the page as a View Transition.
  const into = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const to = e.currentTarget.getAttribute("href") || "/sign-in";
    void albumReady(album).then(() => navigate(to, { viewTransition: true }));
  };

  // the bench's scale from its first frame: the last visit fitted it to this window (useFit corrects it before paint)
  const seed = seedFit(1560, 740);
  return (
    <div className="door on-dark" ref={ground} data-layout={isStacked() ? "stacked" : "book"}
      style={{ ["--bk-mark" as string]: MARK_MASK, ...(seed === null ? null : { ["--fit" as string]: seed.toFixed(4) }) }}>
      <span className="lamp" aria-hidden="true" />
      <ClothStamp ground={ground} />
      <Leaf ground={ground} />
      <header className="door-top">
        <Link className="brand" to="/welcome" aria-label="A Story">
          <Lockup height={36} />
        </Link>
      </header>

      <div className="door-wrap" ref={wrap}>
        <div className={`door-canvas${isStacked() ? "" : " scaled"}`} ref={canvas} style={seed === null ? undefined : { zoom: seed.toFixed(4) }}>
          <main className="door-leaf">
            <h1>
              Every life holds a story <span className="keep">worth keeping.</span>
            </h1>
            <i className="door-rule" aria-hidden="true" />
            <dl className="door-how">
              <div>
                <dt>A question a day</dt>
                <dd>Small ones, like the kitchen they grew up in. Answered in writing, or on a call at the hour they choose.</dd>
              </div>
              <div>
                <dt>The family adds its side</dt>
                <dd>What everyone else remembers, each under their own name.</dd>
              </div>
              <div>
                <dt>The book arrives</dt>
                <dd>Read it on screen any day, print it at home for free, or have it bound: softcover, clothbound or the Heirloom, on one of three papers.</dd>
                <dd className="door-papers" aria-label="The three papers">
                  {PAPER_NAMES.map(([key, name]) => (
                    <span key={key}>
                      <i style={{ background: PAPERS[key]?.page }} aria-hidden="true" />
                      {name}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <div className="door-foot">
              <div className="door-acts">
                <ButtonLink to="/create-account" onClick={into}>
                  Begin a book
                </ButtonLink>
                <ButtonLink to="/sign-in" variant="outline" onClick={into}>
                  Sign in
                </ButtonLink>
              </div>
              <p className="door-code">
                Have a family code?{" "}
                <Link to="/create-account?code=" onClick={into}>
                  Use it here
                </Link>
              </p>
              {/* the family dog beside the way in, its paws on the leaf's foil rule, watching the pointer as on the sign-in */}
              <Companion focus={null} shown={false} rest="watch" poses={["watch"]} />
            </div>
          </main>

          <section className="door-book" aria-label="A sample book you can read">
            <div className="door-picks">
              <div className="door-pickcol">
                <p className="door-note">Three sample families, their books and photographs, printed exactly the way yours will be.</p>
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
              </div>
              <CoverSwatches
                tone="dark"
                value={colour}
                onChange={(k, x) => {
                  sweepFrom.current = x ?? null;
                  setColours((c) => ({ ...c, [family]: k }));
                }}
              />
            </div>
            <div className="door-bench">
              {/* loose prints on the cloth, waiting to go into a book; the book lies on top of them when it opens */}
              <figure className="loose l1" aria-hidden="true">
                <img src="/photos/30-1200.webp" alt="" decoding="async" />
              </figure>
              <figure className="loose l2" aria-hidden="true">
                <img src="/photos/12-1200.webp" alt="" decoding="async" />
              </figure>
              <figure className="loose l3" aria-hidden="true">
                <img src="/photos/33-1200.webp" alt="" decoding="async" />
              </figure>
              <BookSpread key={family} book={book} sweepFrom={sweepFrom} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
