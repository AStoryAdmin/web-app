/**
 * The Book: the real teal book with how far along it is, then every page
 * of it as facing spreads in the print book's own type, print at home for
 * free, and the editions with their prices from the server. The book is a
 * web object (docs/PRODUCT-DECISIONS.md §8): nothing here is "12 more".
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import { Button, ButtonLink, Problem } from "../components/ui";
import { BookIcon, PenIcon, PrintIcon } from "../components/icons";
import BookSpread from "../components/book/BookSpread";
import Editions from "../components/book/Editions";
import { buildBook, bookLine } from "../components/book/bookPages";
import { printAtHome } from "../components/book/printBook";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { listContributions, type Contribution } from "../data/contributions";
import { track } from "../lib/analytics";

type Progress = { count: number; ratio: number; headline: string; chaptersCovered: number; chaptersTotal: number; state: string };

export default function Book() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload } = useAccount();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [printing, setPrinting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const readRef = useRef<HTMLDivElement>(null);
  const editionsRef = useRef<HTMLDivElement>(null);

  const storyId = story?.id ?? null;
  useEffect(() => {
    if (!storyId) return;
    let live = true;
    listContributions(storyId, "approved").then((rows) => live && setContributions(rows));
    return () => {
      live = false;
    };
  }, [storyId]);

  const recordedBy = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const book = useMemo(() => (story ? buildBook(story, { contributions, recordedBy }) : null), [story, contributions, recordedBy]);

  if (account === undefined) return <Shell title="The Book"><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell title="The Book">
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

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <Shell title="The Book">
      <div className="page book-page">
        <div className="pagehead">
          <div className="grow">
            <p className="label">The book</p>
            <span className="desk-only">
              <h1 style={{ fontSize: "var(--t-h2)" }}>{story.name}'s book</h1>
            </span>
            <span className="mobile-only">
              <TellerPick />
            </span>
          </div>
        </div>

        {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}

        <section className="bookhero card" aria-label="How the book is coming along">
          <div className="bookhero-cloth" aria-hidden="true">
            <img src="/book/closed-1200.webp" srcSet="/book/closed-640.webp 640w, /book/closed-1200.webp 1200w" sizes="(max-width: 760px) 60vw, 380px" alt="" width={380} height={480} />
          </div>
          <div className="bookhero-body">
            <h2 className="bookhero-title story-title">{book.title}</h2>
            <p className="bookhero-sub">{book.title === book.fullName ? book.subtitle : book.fullName}</p>
            <p className="bookhero-headline">{progress.headline}</p>
            <div className="progress" style={{ ["--pct" as string]: `${Math.max(6, pct)}%` }} role="img" aria-label={`${pct}% of the way to a first edition`}>
              <div className="bar">{pct >= 20 ? `${pct}%` : ""}</div>
              <div className="mark" />
              <div className="comb" />
              <div className="end">First edition</div>
            </div>
            <p className="meta bookhero-line">{bookLine(book)}</p>
            <div className="bookhero-acts">
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
            <p className="meta bookhero-hint">Print at home opens the whole book in a new window; choose "Save as PDF" there to keep a copy.</p>
          </div>
        </section>

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
            <div className="sechead">
              <h2>Every page</h2>
              <span className="meta">
                {book.pages.length - 1} pages · use the arrow keys
              </span>
            </div>
            <BookSpread key={story.id} book={book} />
          </>
        )}

        <div ref={editionsRef} className="book-anchor" id="editions-anchor" />
        <Editions key={story.id} storyId={story.id} memories={book.memories} onPrintAtHome={print} printing={printing} />
      </div>
    </Shell>
  );
}
