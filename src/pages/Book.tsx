/**
 * The Book: the family's book open on the desk, the way astoryapp.com/samples
 * shows it, sized to the window so the whole spread and its controls are in
 * view at once. On the teal cloth, the title and how far along it is; on the
 * paper, the book's own contents beside it (every chapter, a click away), the
 * cover colours and Print at home; below, the editions as a price list. The
 * book is a web object (docs/PRODUCT-DECISIONS.md §8): nothing here is
 * "12 more".
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Navigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import BookObject from "../components/BookObject";
import LoadingMark from "../components/delight/LoadingMark";
import { Button, ButtonLink, Problem } from "../components/ui";
import { PenIcon, PrintIcon } from "../components/icons";
import BookSpread from "../components/book/BookSpread";
import CoverSwatches from "../components/book/CoverSwatches";
import Editions from "../components/book/Editions";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { buildBook, type Asked } from "../components/book/bookPages";
import { loadAskedQuestions } from "../components/book/askedQuestions";
import { printAtHome } from "../components/book/printBook";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { KEEPSAKE_TITLE, makeListenKey, normaliseDesign } from "../app-core/lib/bookDesign.js";
import { needsListenKey } from "../lib/qrLinks";
import { listContributions, type Contribution } from "../data/contributions";
import { track } from "../lib/analytics";

type Progress = { count: number; ratio: number; headline: string; chaptersCovered: number; chaptersTotal: number; state: string };
type Design = { cover: { color: string }; listenKey: string };

/** An element's top in the page, in CSS px, ignoring transforms (the sheet rises into place as the page arrives). */
function pageTop(n: HTMLElement): number {
  let y = 0;
  for (let c: HTMLElement | null = n; c; c = c.offsetParent as HTMLElement | null) y += c.offsetTop;
  return y;
}

/**
 * The book fits the window (Bao's Standard rule 11): the page or spread is as tall as the window allows once everything
 * above it (the cloth, its title on one line or two, the running head) and the row under it (one row, or stacked on a
 * tablet) are counted. Those are measured, not guessed, and written to --bk-chrome on the page; the stylesheet's
 * values hold until then (and for the loading skeleton). Measured again when the cloth, the row or the page resize.
 */
function useBookChrome(page: RefObject<HTMLDivElement | null>, on: boolean) {
  useLayoutEffect(() => {
    const el = page.current;
    if (!el || !on) return;
    const measure = () => {
      const stage = el.querySelector<HTMLElement>(".bk-stage");
      const under = el.querySelector<HTMLElement>(".bk-under");
      if (!stage || !under || !stage.offsetHeight) return;
      const top = pageTop(stage);
      const below = pageTop(under) + under.offsetHeight - (top + stage.offsetHeight);
      // the phone's tab bar covers the foot of the window: the fit counts only the paper you can see
      const bar = document.querySelector<HTMLElement>(".tabbar");
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const tab = bar && getComputedStyle(bar).display !== "none" ? Math.max(0, (window.innerHeight - bar.getBoundingClientRect().top) / zoom) : 0;
      // 13px of paper under the last control, as on a laptop (235 + 68 + 13 = the 316 the stylesheet starts from)
      el.style.setProperty("--bk-chrome", `${Math.ceil(top + below + 13 + tab)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const under = el.querySelector(".bk-under");
    if (under) ro.observe(under);
    const hero = document.querySelector(".hero");
    if (hero) ro.observe(hero);
    return () => {
      ro.disconnect();
      el.style.removeProperty("--bk-chrome");
    };
  }, [page, on]);
}

export default function Book() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload, updateStory } = useAccount();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [asked, setAsked] = useState<Record<string, Asked>>({});
  const [printing, setPrinting] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
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
  const pageRef = useRef<HTMLDivElement>(null);
  useBookChrome(pageRef, !!book && book.memories > 0);

  if (account === undefined)
    return (
      <Shell
        compact
        wide
        tone="teal"
        hero={
          /* no title prop and no h1 here: the Shell keys its arrival on both, so the cloth and the sheet arrive once, when
             the skeleton shows, and the page's own words take their place without the sheet dipping a second time */
          /* the cloth at its arrived height, its words held but not yet shown, so the sheet doesn't move when they come */
          <div className="bkh bkh-skel" aria-hidden="true">
            <div className="bkh-words">
              <p className="label mobile-only">
                <span className="teller-pick">&nbsp;</span>
              </p>
              <p className="bkh-title">
                {KEEPSAKE_TITLE}
                <Stop />
              </p>
              <p className="bkh-line">&nbsp;</p>
            </div>
            <div className="bkh-edition">
              <p className="bkh-headline">&nbsp;</p>
              <div className="bkh-rule" />
              <p className="bkh-end">First edition</p>
            </div>
          </div>
        }
      >
        {/* the desk's hairlines while the story arrives: the contents label and its ruled rows beside the open spread */}
        <div className="page book-page bka-skel bk-skel" data-busy="true">
          <span className="bka-sk-col bk-skel-rail" aria-hidden="true">
            <i className="bka-sk-label" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line" />
          </span>
          {/* the heart draws inside the spread's outline, where the book will open; its status line is read */}
          <span className="bka-sk-block">
            <LoadingMark />
          </span>
          {/* below 1100px the rail sits under the book, after the row of buttons: its place, without a rule */}
          <i className="bk-skel-under" aria-hidden="true" />
        </div>
      </Shell>
    );
  if (account === null && loadError) {
    return (
      <Shell compact tone="teal" title="The Book">
        <div className="page">
          <Problem message={loadError} onRetry={reload} />
        </div>
      </Shell>
    );
  }
  if (!story || !book) return <Navigate to="/start" replace />;

  const progress = bookProgress(story) as Progress;
  const pct = Math.round(progress.ratio * 100);
  const empty = book.memories === 0;
  const pages = book.pages.length - 2;

  const print = async () => {
    setProblem(null);
    setPrinting(true);
    track("book_pdf_downloaded", { memories: book.memories, photos: book.photos });
    try {
      await printAtHome(story, recordedBy);
    } catch (err) {
      setProblem((err as Error).message || "The book couldn’t be made just now. Please try again.");
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
      setProblem((err as Error).message || "The cover colour wasn’t saved. Please try again.");
    } finally {
      setCoverBusy(false);
    }
  };

  const swatches = <CoverSwatches value={design.cover.color} onChange={setCover} busy={coverBusy} />;
  const printButton = (
    <div className="bk-print">
      <Button variant="outline" icon={<PrintIcon />} onClick={print} loading={printing}>
        Print at home, free
      </Button>
      <p className="meta">To print, or to keep as a PDF.</p>
    </div>
  );

  return (
    <Shell
      compact
      wide
      tone="teal"
      hero={
        <div className="bkh">
          <div className="bkh-words">
            <p className="label mobile-only" data-rise>
              <TellerPick />
            </p>
            <h1 className="bkh-title">
              {book.title}
              <Stop />
            </h1>
            <p className="bkh-line" data-rise>
              {book.fullName} · {empty ? "no pages yet" : `${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"} · ${pages} pages`}
            </p>
          </div>
          <div className="bkh-edition" data-rise>
            <p className="bkh-headline">{progress.headline}</p>
            <div className="bkh-rule" style={{ ["--pct" as string]: `${Math.max(4, pct)}%` }} role="img" aria-label={`${pct}% of the way to a first edition`}>
              <span className="bkh-fill" />
              <span className="bkh-star fleuron" aria-hidden="true" />
            </div>
            <p className="bkh-end">First edition</p>
          </div>
        </div>
      }
    >
      <div className="page book-page" ref={pageRef}>
        {problem && <Problem message={problem} onDismiss={() => setProblem(null)} />}

        {empty ? (
          <section className="bk-empty" aria-labelledby="bk-empty-h" data-rise>
            <div className="bk-empty-desk">
              <BookObject book={book} className="bk-empty-object" />
              {/* the family dog, asleep against the closed book until there is something to read (D11) */}
              <img className="bk-empty-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" width={781} height={622} />
            </div>
            <div className="bk-empty-words">
              <h2 id="bk-empty-h">
                The first page is waiting<Stop />
              </h2>
              <p className="story">Answer one question, or write about anything at all. The book makes itself from what {story.name} says, chapter by chapter, with the photographs the family adds.</p>
              <p className="bk-empty-time">The first memory takes about two minutes.</p>
              <div className="bk-empty-acts">
                <ButtonLink to="/write" icon={<PenIcon />}>
                  Write the first memory
                </ButtonLink>
              </div>
              {swatches}
            </div>
          </section>
        ) : (
          <BookSpread
            key={`read-${story.id}`}
            book={book}
            sweepFrom={sweepFrom}
            rail={
              <>
                {swatches}
                {printButton}
              </>
            }
          />
        )}

        <Editions key={`ed-${story.id}`} storyId={story.id} memories={book.memories} />

        <WhereNext
          rows={[
            empty
              ? { to: "https://astoryapp.com/samples/", title: "Turn the pages of a sample", line: "A family book, printed exactly the way this one will be.", external: true }
              : { to: "/write", title: "Write the next page", line: `One question, or anything ${story.relationship === "Myself" ? "you remember" : `${story.name} remembers`}.` },
            { to: "/archive", title: "Read it as an archive", line: "Every memory by year, with the photographs." },
            { to: "/family", title: "Ask the family in", line: "What they add prints under their own names." },
          ]}
        />
      </div>
    </Shell>
  );
}
