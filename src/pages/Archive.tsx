/**
 * The Archive: everything in one person's story, by year, with a decade
 * rail beside it on a laptop. Search, chapter chips, the book's progress,
 * and the family's contributions waiting for a look. Nothing to configure.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import { archiveStats } from "../app-core/lib/timeline.js";
import { Button, ButtonLink, Problem } from "../components/ui";
import { ChevronRight, CloseIcon, FamilyIcon, PenIcon, SearchIcon } from "../components/icons";
import BookCard from "../components/archive/BookCard";
import { DecadeRail, DecadeRow, type Decade } from "../components/archive/DecadeNav";
import { InProgressGroup, UndatedGroup, YearGroup, type YearGroupT } from "../components/archive/ArchiveGroups";
import { prefersReducedMotion, useArrive, useInkIn, useRiseOnScroll } from "../components/archive/motion";
import { useAccount } from "../state/accountContext";
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
  const [activeDecade, setActiveDecade] = useState<number | null>(null);
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
    return (ERAS as string[]).filter((e) => counts.has(e)).map((e) => ({ era: e, count: counts.get(e) || 0 }));
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

  const filterKey = `${chapter}|${day ?? ""}|${filtered.length === 0}`;
  useArrive(listRef, filterKey);
  useArrive(topRef, storyId);
  useRiseOnScroll(listRef, ".arc-cards > *", filterKey);
  useInkIn(listRef, filterKey);

  const jump = useCallback((d: Decade) => {
    const el = document.getElementById(`y${d.year}`);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);

  const clearDay = () => {
    const next = new URLSearchParams(params);
    next.delete("day");
    setParams(next, { replace: true });
  };

  if (account === undefined) return <Shell compact title="The Archive"><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell compact title="The Archive">
        <div className="page">
          <Problem message={`We couldn't reach the archive. ${loadError}`} onRetry={reload} />
          <p className="meta">It's kept safe on our side. Check the connection and try again.</p>
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const own = story.relationship === "Myself";
  const stats = archiveStats(story) as { memories: number; chapters: number; span: { from: number; to: number } | null };
  const whose = own ? "your" : `${story.name}'s`;
  const filtering = Boolean(q || chapter || day);
  const nothingAtAll = memories.length === 0;

  return (
    <Shell
      hero={
        <>
          <p className="label" data-rise>
            {`${story.name} ${story.lastName}`.trim()}
            <span className="mobile-only">
              {" "}
              <TellerPick />
            </span>
          </p>
          <h1>The Archive</h1>
          <p className="meta arc-wall" data-rise>
            {story.isPublic ? (
              <>
                The wall is on. <Link to="/account#wall">Share the link</Link>
              </>
            ) : (
              <>
                Only the family sees this. <Link to="/account#wall">Turn on the wall</Link> to share it by link.
              </>
            )}
          </p>
          <dl className="hero-stats" data-rise>
            <div>
              <b>{stats.memories}</b>
              <span>{stats.memories === 1 ? "Memory" : "Memories"}</span>
            </div>
            <div>
              <b>{stats.span ? (stats.span.from === stats.span.to ? String(stats.span.from) : `${stats.span.from}–${stats.span.to}`) : "—"}</b>
              <span>Years covered</span>
            </div>
            <div>
              <b>{stats.chapters}</b>
              <span>{stats.chapters === 1 ? "Chapter" : "Chapters"}</span>
            </div>
          </dl>
        </>
      }
    >
      <div className="page">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div ref={topRef}>
          <div className="arc-top">
            <BookCard story={story} />
          </div>

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

              {chapters.length > 1 && (
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

              {filteredProgress.length > 0 && <InProgressGroup items={filteredProgress} story={story} />}

              {dated.map((g) => (
                <YearGroup key={g.key} group={g} story={story} decade={decadeOf(g.year) as number | null} />
              ))}

              {undated && <UndatedGroup items={undated.items} story={story} />}

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
      </div>
    </Shell>
  );
}
