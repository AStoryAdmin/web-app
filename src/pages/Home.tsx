/**
 * Home: today. On the cloth, a greeting and one question in the serif with
 * two ways to answer it. On the sheet, this week's days, the book filling
 * up, what the family added, the calls, and the most recent memories.
 * Nothing to configure; the place to come back to.
 */
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import MemoryCard from "../components/MemoryCard";
import FromTheBook from "../components/FromTheBook";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { MicIcon, PenIcon, SearchIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { greeting, noteFor, recordSkip, skipsToday, todaysDeck, todaysQuestion } from "../lib/today";
import { isPaid } from "../lib/plan";
import { stripDays, dotStrength, dayLabel } from "../app-core/lib/weekStrip.js";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { sortByDate } from "../app-core/lib/timeline.js";
import { track } from "../lib/analytics";
import type { Memory } from "../data/stories";

const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export default function Home() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();
  const [skips, setSkips] = useState(() => (story ? skipsToday(story.id) : 0));

  const relative = !!story && story.relationship !== "Myself" && story.ownerId !== user?.id && false;
  const unlimited = isPaid(user?.plan ?? "free");
  const deck = useMemo(() => (story ? todaysDeck(story, { relative, unlimited }) : []), [story, relative, unlimited]);
  const question = useMemo(() => (story ? todaysQuestion(story, { relative, unlimited }) : null), [story, relative, unlimited, skips]); // eslint-disable-line react-hooks/exhaustive-deps

  if (account === undefined) return <Shell compact><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell compact title="Home">
        <div className="page">
          <Problem message={`We couldn't reach your stories. ${loadError}`} onRetry={reload} />
          <p className="meta">They're kept safe on our side. Check the connection and try again.</p>
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const days = stripDays(story.memories) as { key: string; label: string; day: number; count: number; today: boolean; future: boolean; offset: number }[];
  const week = days.slice(-7);
  const recent = sortByDate(story.memories, -1).slice(0, 4) as Memory[];
  const byCreated = [...story.memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fromFamily = byCreated.filter((m) => m.contributor).slice(0, 3);
  const progress = bookProgress(story) as { count: number; remaining: number; ratio: number; headline: string; chaptersCovered: number };
  const left = Math.max(0, deck.length - skips);
  const own = story.relationship === "Myself";

  const another = () => {
    if (!story) return;
    const n = recordSkip(story.id);
    track("question_skipped", { depth: question?.depth ?? 0 });
    setSkips(n);
  };

  const hero = (
    <div className="hero-grid">
      <div>
        <p className="label" data-rise>
          {longDate()} · {own ? "Your story" : `${story.name}'s story`}
          <span className="mobile-only">
            {" "}
            <TellerPick />
          </span>
        </p>
        <h1>
          {greeting("")}, <span className="hl">{user?.firstName || "friend"}</span>.
        </h1>
        <span className="foil" data-rise />
        <div className="ask">
          <span className="pill gold" data-rise>
            {own ? "A little question for today" : `A little question for ${story.name}`}
          </span>
          {question ? (
            <>
              <p className="story-q q" data-rise>
                {question.question}
              </p>
              {noteFor(question) && (
                <p className="meta" style={{ marginBottom: "var(--s-5)" }} data-rise>
                  {noteFor(question)}
                </p>
              )}
              <div className="acts" data-rise>
                <ButtonLink to={`/write?q=${encodeURIComponent(question.id)}`} icon={<PenIcon />}>
                  Write it
                </ButtonLink>
                <ButtonLink to={`/talk?q=${encodeURIComponent(question.id)}`} variant="outline" icon={<MicIcon />}>
                  Talk about it
                </ButtonLink>
                {left > 1 && (
                  <Button variant="quiet" small onClick={another}>
                    Ask me another
                  </Button>
                )}
              </div>
              {!unlimited && (
                <p className="meta note" data-rise>
                  {left === 1 ? "The last of today's three. Three new ones tomorrow." : `${left} of today's three waiting.`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="story-q q" data-rise>
                That's today's questions. Three new ones in the morning.
              </p>
              <div className="acts" data-rise>
                <ButtonLink to="/write" icon={<PenIcon />}>
                  Write in your own words
                </ButtonLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Shell hero={hero}>
      <div className="page home-sheet">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div className="weekrow" data-rise>
          <div className="weekrow-in">
            <span className="label">This week</span>
            <div className="week" role="group" aria-label="This week">
              {week.map((d) => (
                <button key={d.key} type="button" aria-pressed={d.today} aria-label={dayLabel(d) as string} onClick={() => navigate(`/archive?day=${d.key}`)} style={d.future ? { opacity: 0.45 } : undefined}>
                  {d.today ? "Today" : d.label}
                  <span className={`d${d.count ? " has" : ""}`} style={d.count ? { ["--dot" as string]: dotStrength(d) } : undefined}>
                    {d.day}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Link className="iconbtn desk-only" to="/archive?focus=search" aria-label="Search memories">
            <SearchIcon />
          </Link>
        </div>

        <FromTheBook story={story} />

        <div className="trio">
          <div className="card" data-rise>
            <h3>{own ? "Your book" : `${story.name}'s book`}</h3>
            <div className="bookmini">
              <img src="/book/closed-640.webp" alt="" width={56} />
              <div>
                <p className="n">
                  {progress.count}
                  <small>{progress.headline}</small>
                </p>
              </div>
            </div>
            <div className="progress" style={{ ["--pct" as string]: `${Math.round(progress.ratio * 100)}%`, marginTop: "var(--s-5)" }} role="img" aria-label={`${Math.round(progress.ratio * 100)}% of the way to a first edition`}>
              <div className="bar" />
              <div className="end">First edition</div>
            </div>
            <Link className="more" to="/book">
              Open the book
            </Link>
          </div>

          <div className="card" data-rise>
            <h3>From the family</h3>
            {fromFamily.length ? (
              <div className="news">
                {fromFamily.map((m) => (
                  <Link key={m.id} className="item" to={`/archive/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <Avatar name={m.contributor.split(",")[0]} size={32} />
                    <span>
                      <b>{m.contributor.split(",")[0]}</b> added <b>{m.title || "a memory"}</b>.
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="meta">Nobody else is in {own ? "your" : `${story.name}'s`} story yet.</p>
            )}
            <Link className="more" to="/family">
              {fromFamily.length ? "See the family" : "Invite someone"}
            </Link>
          </div>

          <div className="card teal" data-rise>
            <h3>Calls</h3>
            <p className="meta">
              A Story calls on the phone at the hour you choose. <span className="hl">Talking here in the browser is coming.</span>
            </p>
            <Link className="more" to="/talk">
              How calls work
            </Link>
          </div>
        </div>

        <div data-rise>
          <div className="sechead" style={{ marginTop: 0 }}>
            <h2>Recent memories</h2>
            {story.memories.length > 0 && (
              <Link className="more" to="/archive">
                All {story.memories.length}
              </Link>
            )}
          </div>
          {recent.length ? (
            <div className="recent">
              {recent.map((m, i) => (
                <MemoryCard key={m.id} memory={m} story={story} style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          ) : (
            <div className="card empty">
              <h2 className="story-title" style={{ fontSize: 26 }}>Nothing here yet.</h2>
              <p>Answer the question above, or write about anything at all. The first memory is the hardest; after that they come.</p>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
