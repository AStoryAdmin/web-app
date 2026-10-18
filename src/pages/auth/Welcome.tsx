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
import { Link, Navigate } from "react-router-dom";
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
import { markOpened, OUT, STACKED, useFit } from "./bookFit";

export default function Welcome() {
  const { user } = useAuth();
  const ground = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const sweepFrom = useRef<number | null>(null);
  useLight(ground);
  useFit(ground, wrap, canvas, "door", 1440, 760);
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
    // the sign-in's album, fetched while the visitor reads, so the open book arrives with its photographs
    for (const src of ["/photos/27-1200.webp", "/photos/02-1200.webp", "/photos/18-1200.webp"]) new Image().src = src;
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

  return (
    <div className="door on-dark" ref={ground} style={{ ["--bk-mark" as string]: MARK_MASK }}>
      <span className="lamp" aria-hidden="true" />
      <ClothStamp ground={ground} />
      <Leaf ground={ground} />
      <header className="door-top">
        <Link className="brand" to="/welcome" aria-label="A Story">
          <Lockup height={36} />
        </Link>
      </header>

      <div className="door-wrap" ref={wrap}>
        <div className={`door-canvas${matchMedia(STACKED).matches ? "" : " scaled"}`} ref={canvas}>
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
                <dd>Read it on screen any day, print it at home for free, or have it bound.</dd>
              </div>
            </dl>
            <div className="door-foot">
            <div className="door-acts">
              <ButtonLink to="/create-account" viewTransition>
                Begin a book
              </ButtonLink>
              <ButtonLink to="/sign-in" variant="outline" viewTransition>
                Sign in
              </ButtonLink>
            </div>
            <p className="door-code">
              Have a family code? <Link to="/create-account?code=" viewTransition>Use it here</Link>
            </p>
            {/* the family dog beside the way in, its paws on the leaf's foil rule, watching the pointer as on the sign-in */}
            <Companion focus={null} shown={false} rest="watch" />
            </div>
          </main>

          <section className="door-book" aria-label="A sample book you can read">
            <div className="door-picks">
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
            <p className="door-note">Three sample families’ books, printed exactly the way yours will be. The photographs beside them are samples too.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
