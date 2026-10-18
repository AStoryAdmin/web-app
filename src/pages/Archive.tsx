/**
 * The Archive: everything in one person's story, by year, with a decade
 * rail beside it on a laptop. Search, chapter chips, the book's progress,
 * and the family's contributions waiting for a look. Nothing to configure.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import { archiveStats } from "../app-core/lib/timeline.js";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { Button, ButtonLink, Problem } from "../components/ui";
import { ChevronRight, CloseIcon, FamilyIcon, PenIcon, SearchIcon } from "../components/icons";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { DecadeRail, DecadeRow, type Decade } from "../components/archive/DecadeNav";
import { InProgressGroup, PrintsFlow, UndatedGroup, YearGroup, type ArchiveView, type YearGroupT } from "../components/archive/ArchiveGroups";
import { prefersReducedMotion, useArrive, useCrossfade, useInkIn, useRiseOnScroll } from "../components/archive/motion";
import { useAccount } from "../state/accountContext";
import { realChapter } from "../components/archive/photos";
import { countPending } from "../data/contributions";
import { decadeOf, groupByYear } from "../app-core/lib/timeline.js";
import { ERAS } from "../app-core/data/eras.js";
import type { Memory, Story } from "../data/stories";

// app-core is plain JS; its inferred option type lacks `story`.
const groupYears = groupByYear as unknown as (memories: Memory[], opts: { story: Story; dir: number }) => unknown;

const dayLabel = (day: string) => {
  const d = new Date(`${day}T12:00:00`);
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
};

const VIEW_KEY = "astory.archiveView";

/** Prints on a laptop, the list on a phone, unless this browser remembers a choice. */
function storedView(): ArchiveView {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "prints" || v === "list") return v;
  } catch {
    /* no storage: the default below */
  }
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches ? "list" : "prints";
}

const decadeLabel = (d: number) => `${String(d).slice(2)}s`;

const matches = (m: Memory, q: string) => {
  const hay = `${m.title}\n${m.body}\n${m.excerpt}\n${m.period}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};

export default function Archive() {
  const { account, activeStory: story, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const day = params.get("day");
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState<string>("");
  const [pending, setPending] = useState(0);
  const [wallCopied, setWallCopied] = useState<string | null>(null);
  const [activeDecade, setActiveDecade] = useState<number | null>(null);
  const [view, setView] = useState<ArchiveView>(storedView);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const storyId = story?.id ?? null;
  const memories = useMemo(() => story?.memories ?? [], [story]);

  // The family's contributions waiting for a keeper (the banner).
  useEffect(() => {
    if (!storyId) return;
    let live = true;
    countPending(storyId)
      .then((n) => live && setPending(n))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [storyId, memories.length]);

  // Home's search icon lands here with the field ready to type into.
  useEffect(() => {
    if (params.get("focus") === "search") searchRef.current?.focus();
  }, [params]);

  const saved = useMemo(() => memories.filter((m) => m.status !== "in_progress"), [memories]);
  const inProgress = useMemo(() => memories.filter((m) => m.status === "in_progress"), [memories]);

  const chapters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of saved) counts.set(m.era, (counts.get(m.era) || 0) + 1);
    // "Anything else" is where a memory waits for a chapter; it is neither a chip nor counted as a chapter
    return (ERAS as string[]).filter((e) => counts.has(e) && realChapter(e)).map((e) => ({ era: e, count: counts.get(e) || 0 }));
  }, [saved]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => saved.filter((m) => (!chapter || m.era === chapter) && (!day || m.createdAt.slice(0, 10) === day) && (!q || matches(m, q))),
    [saved, chapter, day, q],
  );
  const filteredProgress = useMemo(() => inProgress.filter((m) => !chapter && !day && (!q || matches(m, q))), [inProgress, chapter, day, q]);

  const groups = useMemo(() => (story ? (groupYears(filtered, { story, dir: -1 }) as YearGroupT[]) : []), [filtered, story]);
  const dated = useMemo(() => groups.filter((g) => !g.undated && g.year != null), [groups]);
  const undated = groups.find((g) => g.undated);

  // the list hangs its years off a rail labelled by decade
  const byDecade = useMemo(() => {
    const out: { decade: number; groups: YearGroupT[] }[] = [];
    for (const g of dated) {
      const d = decadeOf(g.year) as number;
      const have = out.find((x) => x.decade === d);
      if (have) have.groups.push(g);
      else out.push({ decade: d, groups: [g] });
    }
    return out;
  }, [dated]);

  const chooseView = (v: ArchiveView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* fine without */
    }
  };

  const decades = useMemo<Decade[]>(() => {
    const out: Decade[] = [];
    for (const g of dated) {
      const d = decadeOf(g.year) as number;
      const have = out.find((x) => x.decade === d);
      if (have) have.count += g.items.length;
      else out.push({ decade: d, label: `${d}s`, count: g.items.length, year: g.year as number });
    }
    return out;
  }, [dated]);

  // Which decade is in view, for the rail.
  useEffect(() => {
    if (!decades.length) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const heads = Array.from(document.querySelectorAll<HTMLElement>(".arc-year[data-decade]"));
      let current: number | null = null;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= 140) current = Number(h.dataset.decade);
      }
      setActiveDecade(current ?? decades[0]?.decade ?? null);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [decades]);

  // A link from a memory page ("1975" in its breadcrumb) lands on that year.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, [location.hash, groups.length]);

  const filterKey = `${chapter}|${day ?? ""}|${filtered.length === 0}|${view}`;
  // the list arrives once per page or view; a filter only crossfades it; below the fold, one hook per element
  useArrive(listRef, `${storyId}|${view}`);
  useArrive(topRef, storyId);
  useCrossfade(listRef, `${chapter}|${day ?? ""}`);
  useRiseOnScroll(listRef, ".arc-cards > *, .mosaic > *:not(.arc-year)", filterKey);
  useInkIn(listRef, filterKey);

  // the rail's dots fill as their year or memory comes into view, once each
  useEffect(() => {
    const root = listRef.current;
    if (!root || view !== "list") return;
    const dots = Array.from(root.querySelectorAll<HTMLElement>(".arc-rail [data-dot], .arc-rail .arc-year, .arc-rail .arc-cards > *"));
    if (!dots.length) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      dots.forEach((d) => d.classList.add("dot-lit"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).classList.add("dot-lit");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    dots.forEach((d) => io.observe(d));
    return () => io.disconnect();
  }, [filterKey, view, groups.length]);

  const jump = useCallback((d: Decade) => {
    const el = document.getElementById(`y${d.year}`);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const copyWall = async () => {
    const url = `${window.location.origin}/p/${story?.publicSlug ?? ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setWallCopied("Link copied");
    } catch {
      setWallCopied("Copy failed; it's on Account");
    }
    window.setTimeout(() => setWallCopied(null), 3000);
  };

  const clearDay = () => {
    const next = new URLSearchParams(params);
    next.delete("day");
    setParams(next, { replace: true });
  };

  if (account === undefined)
    return (
      <Shell compact title="The Archive">
        <div className="page arc-page arc-skeleton" aria-busy="true">
          <span className="sk-line w40" />
          <span className="sk-grid">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </Shell>
    );
  if (account === null && loadError) {
    return (
      <Shell compact title="The Archive">
        <div className="page">
          <Problem message="We couldn't reach the archive just now." onRetry={reload} />
          <p className="meta">It's kept safe on our side. Check the connection and try again.</p>
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const own = story.relationship === "Myself";
  const stats = archiveStats(story) as { memories: number; span: { from: number; to: number } | null };
  const whose = own ? "your" : `${story.name}'s`;
  const photoCount = saved.reduce((n, m) => n + (m.photos?.length || 0), 0);
  // the book's progress as the fourth figure: "8 of about 20" toward the first edition, never a countdown
  const book = bookProgress(story) as { count: number; remaining: number; ratio: number; state: string };
  // a share, not the count again (the count is the first figure): how far toward the first edition
  const bookPct = Math.round(book.ratio * 100);
  const bookSub = book.state === "ready" ? "Ready to print" : book.state === "lopsided" ? "Enough to print; some chapters are thin" : "toward the first edition";
  const bookLine = `${bookPct}% ${bookSub.toLowerCase()}`;
  const filtering = Boolean(q || chapter || day);
  const nothingAtAll = memories.length === 0;

  return (
    <Shell
      hero={
        <>
          <p className="label" data-rise>
            <span className="arc-hero-name">{`${story.name} ${story.lastName}`.trim()}</span>
            <span className="mobile-only">
              {" "}
              <TellerPick />
            </span>
          </p>
          <h1>
            The Archive
            <Stop />
          </h1>
          <p className="meta arc-wall" data-rise>
            {story.isPublic && story.publicSlug ? (
              <>
                Anyone with the link can read the public memories.{" "}
                <button type="button" className="arc-wall-act" onClick={copyWall}>
                  {wallCopied ?? "Copy link"}
                </button>
              </>
            ) : (
              <>
                Only the family can read this.{" "}
                <Link className="arc-wall-act" to="/account#wall">
                  Share it by link
                </Link>
              </>
            )}
          </p>
          <dl className="hero-stats arc-stats-hero" data-rise>
            <div>
              <b>{stats.memories}</b>
              <span>{stats.memories === 1 ? "Memory" : "Memories"}</span>
            </div>
            {stats.span ? (
              <div>
                <b>{stats.span.from === stats.span.to ? String(stats.span.from) : `${stats.span.from}–${stats.span.to}`}</b>
                <span>{stats.span.from === stats.span.to ? "The one year dated so far" : "The years it reaches"}</span>
              </div>
            ) : (
              <div>
                <b>{photoCount}</b>
                <span>{photoCount === 1 ? "Photograph" : "Photographs"}</span>
              </div>
            )}
            <div>
              <b>{chapters.length}</b>
              <span>{chapters.length === 1 ? "Chapter" : "Chapters"}</span>
            </div>
            <div className="arc-hs-book">
              <Link to="/book" className="arc-hs-link" aria-label={`${bookLine}. Open the book`}>
                <img src="/book/keepsake-closed.webp" alt="" width={34} height={46} />
                <span className="arc-hs-txt">
                  <b>
                    {bookPct}
                    <small>%</small>
                  </b>
                  <span>{bookSub}</span>
                  <i className="arc-hs-bar" style={{ ["--pct" as string]: `${Math.max(4, bookPct)}%` }} aria-hidden="true" />
                </span>
              </Link>
            </div>
          </dl>
        </>
      }
    >
      <div className="page arc-page">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div ref={topRef}>
          {pending > 0 && (
            <Link className="banner arc-banner" to="/family?review=1" data-arrive>
              <FamilyIcon />
              <span style={{ flex: 1 }}>
                {pending} {pending === 1 ? "contribution" : "contributions"} from the family {pending === 1 ? "is" : "are"} waiting for your review
              </span>
              <ChevronRight className="chev" />
            </Link>
          )}
        </div>

        {nothingAtAll ? (
          <section className="card arc-empty" aria-label="Nothing here yet">
            <img src="/book/closed-640.webp" alt="" width={160} />
            <div>
              <h2>{own ? "Your archive starts with one memory." : `${story.name}'s archive starts with one memory.`}</h2>
              <p>Anything at all: a kitchen, a road, a song on the radio. Three memories and the first chapter appears.</p>
              <ButtonLink to="/write" icon={<PenIcon />}>
                Write the first memory
              </ButtonLink>
            </div>
          </section>
        ) : (
          <div className="arc-body">
            <DecadeRail decades={decades} active={activeDecade} onPick={jump} />

            <section aria-label="Memories" ref={listRef}>
              {/* one row: the search, the chapters, and how to show them */}
              <div className="arc-tools">
                <form
                  className="arc-search"
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    searchRef.current?.blur();
                  }}
                >
                  <label className="input">
                    <span className="sr-only">Search {whose} memories</span>
                    <input ref={searchRef} type="search" placeholder={`Search ${whose} memories`} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
                    {query && (
                      <button type="button" className="clear" onClick={() => setQuery("")} aria-label="Clear the search">
                        <CloseIcon width={20} height={20} />
                      </button>
                    )}
                    <button className="go" type="submit" aria-label="Search">
                      <SearchIcon />
                    </button>
                  </label>
                </form>

                {chapters.length >= 2 && (
                  <div className="chiprow scroll arc-chips" role="group" aria-label="Chapters">
                    <button type="button" className="chip big" aria-pressed={chapter === ""} onClick={() => setChapter("")}>
                      All <span className="n">· {saved.length}</span>
                    </button>
                    {chapters.map((c) => (
                      <button key={c.era} type="button" className="chip big" aria-pressed={chapter === c.era} onClick={() => setChapter(chapter === c.era ? "" : c.era)}>
                        {c.era} <span className="n">· {c.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="arc-view" role="group" aria-label="Show as">
                  <button type="button" className="chip big" aria-pressed={view === "prints"} onClick={() => chooseView("prints")}>
                    Prints
                  </button>
                  <button type="button" className="chip big" aria-pressed={view === "list"} onClick={() => chooseView("list")}>
                    List
                  </button>
                </div>
              </div>

              <DecadeRow decades={decades} active={activeDecade} onPick={jump} />

              {day && (
                <div className="arc-filters">
                  <span className="chip accent">
                    Written on {dayLabel(day)}
                    <button type="button" onClick={clearDay} aria-label="Show every day">
                      <CloseIcon width={18} height={18} />
                    </button>
                  </span>
                </div>
              )}

              {view === "list" ? (
                <div className="arc-rail" key="rail">
                  {filteredProgress.length > 0 && <InProgressGroup items={filteredProgress} story={story} />}
                  {byDecade.map((b) => (
                    <section key={b.decade} className="arc-decade" aria-label={`The ${decadeLabel(b.decade)}`}>
                      <p className="arc-decade-label" data-dot data-arrive>
                        {decadeLabel(b.decade)}
                      </p>
                      {b.groups.map((g) => (
                        <YearGroup key={g.key} group={g} story={story} decade={b.decade} />
                      ))}
                    </section>
                  ))}
                  {undated && (
                    <section className="arc-decade" aria-label="Not dated yet">
                      <UndatedGroup items={undated.items} story={story} />
                    </section>
                  )}
                </div>
              ) : (
                <>
                  {filteredProgress.length > 0 && <InProgressGroup items={filteredProgress} story={story} />}
                  {(dated.length > 0 || undated) && <PrintsFlow groups={[...dated, ...(undated ? [undated] : [])].map((g) => ({ ...g, decade: g.undated ? null : (decadeOf(g.year) as number) }))} story={story} />}
                </>
              )}

              {filtered.length === 0 && filteredProgress.length === 0 && (
                <div className="arc-none" role="status">
                  <p>
                    {day
                      ? `Nothing was written on ${dayLabel(day)}.`
                      : q
                        ? `Nothing here mentions “${query.trim()}”.`
                        : chapter
                          ? `Nothing filed under ${chapter} yet.`
                          : "Nothing here yet."}
                  </p>
                  {filtering && (
                    <Button
                      variant="outline"
                      small
                      onClick={() => {
                        setQuery("");
                        setChapter("");
                        if (day) clearDay();
                      }}
                    >
                      Show everything
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
        {!nothingAtAll && (
          <WhereNext
            rows={[
              { to: "/write", title: own ? "Write today's memory" : `Write a memory for ${story.name}`, line: "A few lines is plenty; the date and chapter come after." },
              { to: "/book", title: "Open the book", line: "See these memories set on the printed page." },
              { to: "/family", title: "Ask the family", line: "Invite someone to add what they remember." },
            ]}
          />
        )}
      </div>
    </Shell>
  );
}
