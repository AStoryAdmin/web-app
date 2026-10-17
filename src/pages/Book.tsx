/**
 * The Book: the real teal book with how far along it is, then every page
 * of it as facing spreads in the print book's own type, print at home for
 * free, and the editions with their prices from the server. The book is a
 * web object (docs/PRODUCT-DECISIONS.md §8): nothing here is "12 more".
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import BookObject from "../components/BookObject";
import { Button, ButtonLink, Problem } from "../components/ui";
import { BookIcon, PenIcon, PrintIcon } from "../components/icons";
import BookSpread from "../components/book/BookSpread";
import CoverSwatches from "../components/book/CoverSwatches";
import Editions from "../components/book/Editions";
import { buildBook, bookLine, type Asked } from "../components/book/bookPages";
import { loadAskedQuestions } from "../components/book/askedQuestions";
import { printAtHome } from "../components/book/printBook";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { makeListenKey, normaliseDesign } from "../app-core/lib/bookDesign.js";
import { needsListenKey } from "../lib/qrLinks";
import { listContributions, type Contribution } from "../data/contributions";
import { track } from "../lib/analytics";

type Progress = { count: number; ratio: number; headline: string; chaptersCovered: number; chaptersTotal: number; state: string };
type Design = { cover: { color: string }; listenKey: string };

export default function Book() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload, updateStory } = useAccount();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [asked, setAsked] = useState<Record<string, Asked>>({});
  const [printing, setPrinting] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const readRef = useRef<HTMLDivElement>(null);
  const editionsRef = useRef<HTMLDivElement>(null);
  const keyed = useRef<string | null>(null);
  const sweepFrom = useRef<number | null>(null);

  const storyId = story?.id ?? null;
  useEffect(() => {
    if (!storyId) return;
    let live = true;
    listContributions(storyId, "approved").then((rows) => live && setContributions(rows));
    return () => {
      live = false;
    };
  }, [storyId]);

  // The questions relatives sent in, for the memories that answered one.
  const memoryIds = useMemo(() => (story ? story.memories.map((m) => m.id).join(",") : ""), [story]);
  useEffect(() => {
    if (!memoryIds) return;
    let live = true;
    loadAskedQuestions(memoryIds.split(",")).then((rows) => live && setAsked(rows));
    return () => {
      live = false;
    };
  }, [memoryIds]);

  // The book's own key for its listening codes, made once a memory has a recording and kept on the design.
  useEffect(() => {
    if (!story || keyed.current === story.id || !needsListenKey(story)) return;
    keyed.current = story.id;
    const design = normaliseDesign(story.bookDesign) as Design;
    updateStory({ ...story, bookDesign: { ...design, listenKey: makeListenKey() } }).catch(() => {
      keyed.current = null;
    });
  }, [story, updateStory]);

  const recordedBy = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const book = useMemo(() => (story ? buildBook(story, { contributions, recordedBy, asked }) : null), [story, contributions, recordedBy, asked]);

  if (account === undefined) return <Shell compact title="The Book"><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell compact title="The Book">
        <div className="page">
          <Problem message={`We couldn't reach your stories. ${loadError}`} onRetry={reload} />
        </div>
      </Shell>
    );
  }
  if (!story || !book) return <Navigate to="/start" replace />;

  const progress = bookProgress(story) as Progress;
  const pct = Math.round(progress.ratio * 100);
  const empty = book.memories === 0;

  const print = async () => {
    setProblem(null);
    setPrinting(true);
    track("book_pdf_downloaded", { memories: book.memories, photos: book.photos });
    try {
      await printAtHome(story, recordedBy);
    } catch (err) {
      setProblem((err as Error).message || "The book couldn't be made just now. Please try again.");
    } finally {
      setPrinting(false);
    }
  };

  const design = normaliseDesign(story.bookDesign) as Design;
  const setCover = async (color: string, fromX?: number) => {
    if (color === design.cover.color) return;
    sweepFrom.current = fromX ?? null;
    setProblem(null);
    setCoverBusy(true);
    try {
      await updateStory({ ...story, bookDesign: { ...design, cover: { ...design.cover, color } } });
    } catch (err) {
      setProblem((err as Error).message || "The cover colour wasn't saved. Please try again.");
    } finally {
      setCoverBusy(false);
    }
  };

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <Shell
      tone="teal"
      hero={
        <div className="hero-grid">
          <div className="bookhero-body">
            <p className="label" data-rise>
              The book
              <span className="mobile-only">
                {" "}
                <TellerPick />
              </span>
            </p>

            <h1 className="story-title bookhero-title">{book.title}</h1>
            <p className="bookhero-sub" data-rise>{book.title === book.fullName ? book.subtitle : book.fullName}</p>
            <p className="bookhero-headline" data-rise>{progress.headline}</p>
            <div data-rise className="progress" style={{ ["--pct" as string]: `${Math.max(6, pct)}%` }} role="img" aria-label={`${pct}% of the way to a first edition`}>
              <div className="bar">{pct >= 20 ? `${pct}%` : ""}</div>
              <div className="mark" />
              <div className="comb" />
              <div className="end">First edition</div>
            </div>
            <p className="meta bookhero-line" data-rise>{bookLine(book)}</p>
            <div className="bookhero-acts" data-rise>
              <Button icon={<BookIcon />} onClick={() => scrollTo(readRef.current)} disabled={empty}>
                Read it
              </Button>
              <Button variant="outline" icon={<PrintIcon />} onClick={print} loading={printing}>
                Print at home — free
              </Button>
              <Button variant="quiet" onClick={() => scrollTo(editionsRef.current)}>
                Printed editions
              </Button>
            </div>
            <p className="meta bookhero-hint" data-rise>Print at home opens the whole book in a new window; choose "Save as PDF" there to keep a copy.</p>
          </div>
          <BookObject width={260} />
        </div>
      }
    >
      <div className="page book-page">

        {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}


        <div ref={readRef} className="book-anchor" id="read" />
        {empty ? (
          <section className="card book-empty" aria-label="The book is empty">
            <img src="/book/open-1200.webp" alt="" width={520} height={340} />
            <div>
              <h2 className="story-title">The first page is waiting.</h2>
              <p className="story">Answer one question, or write about anything at all. The book makes itself from what {story.name} says, chapter by chapter, with the photographs the family adds.</p>
              <div className="bookhero-acts">
                <ButtonLink to="/write" icon={<PenIcon />}>
                  Write the first memory
                </ButtonLink>
                <ButtonLink to="/" variant="quiet">
                  Today's question
                </ButtonLink>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="sechead bk-head">
              <h2>Every page</h2>
              <span className="meta">{book.pages.length - 2} pages · use the arrow keys, or click a page</span>
              <CoverSwatches value={design.cover.color} onChange={setCover} busy={coverBusy} />
            </div>
            <BookSpread key={story.id} book={book} sweepFrom={sweepFrom} />
          </>
        )}

        <div ref={editionsRef} className="book-anchor" id="editions-anchor" />
        <Editions key={story.id} storyId={story.id} memories={book.memories} onPrintAtHome={print} printing={printing} />
      </div>
    </Shell>
  );
}
