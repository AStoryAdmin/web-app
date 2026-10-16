/**
 * Home: today. One question with a Write button, this week's days, the
 * most recent memories, and (on a laptop) the book filling up and what the
 * family added. Nothing to configure; the place to come back to.
 */
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import MemoryCard from "../components/MemoryCard";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { MicIcon, PenIcon, SearchIcon, UserIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { greeting, noteFor, recordSkip, skipsToday, todaysDeck, todaysQuestion } from "../lib/today";
import { isPaid } from "../lib/plan";
import { stripDays, dotStrength, dayLabel } from "../app-core/lib/weekStrip.js";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { sortByDate } from "../app-core/lib/timeline.js";
import { track } from "../lib/analytics";
import type { Memory } from "../data/stories";

function Art() {
  return (
    <div className="art" aria-hidden="true">
      <svg viewBox="0 0 300 150" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 150c40-52 190-52 240 0z" fill="var(--paper-sage)" />
        <g stroke="var(--gold)" strokeWidth="3">
          <circle cx="250" cy="28" r="14" fill="var(--gold)" stroke="none" />
          <path d="M250 4v8M250 44v8M226 28h8M266 28h8M233 11l6 6M261 45l6 6M267 11l-6 6M239 45l-6 6" />
        </g>
        <g stroke="var(--accent)" strokeWidth="2.4">
          <circle cx="110" cy="80" r="11" /><path d="M98 118c0-14 6-22 12-22s12 8 12 22M104 100l-14 10M118 100l10-18" />
          <circle cx="150" cy="70" r="11" /><path d="M137 118c0-18 6-30 13-30s13 12 13 30M141 96l-10 8M160 94l12 6" />
          <circle cx="190" cy="84" r="11" /><path d="M178 122c0-16 5-24 12-24s12 8 12 24M184 104l-8-12M198 102l10 4" />
          <circle cx="228" cy="76" r="11" /><path d="M216 118c0-16 5-26 12-26s12 10 12 26M219 100l-12 2M240 96l10-12" />
          <circle cx="262" cy="90" r="10" /><path d="M252 124c0-14 4-22 10-22s10 8 10 22M256 110l-8 6M270 108l10 6" />
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();
  const [skips, setSkips] = useState(() => (story ? skipsToday(story.id) : 0));
  const photo = usePhotoUrl(story?.photo);

  const relative = !!story && story.relationship !== "Myself" && story.ownerId !== user?.id && false;
  const unlimited = isPaid(user?.plan ?? "free");
  const deck = useMemo(() => (story ? todaysDeck(story, { relative, unlimited }) : []), [story, relative, unlimited]);
  const question = useMemo(() => (story ? todaysQuestion(story, { relative, unlimited }) : null), [story, relative, unlimited, skips]); // eslint-disable-line react-hooks/exhaustive-deps

  if (account === undefined) return <Shell><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell>
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

  const another = () => {
    if (!story) return;
    const n = recordSkip(story.id);
    track("question_skipped", { depth: question?.depth ?? 0 });
    setSkips(n);
  };

  return (
    <Shell>
      <div className="page">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}
        <div className="pagehead">
          <div className="grow" style={{ display: "flex", alignItems: "center", gap: "var(--s-4)" }}>
            <span className="mobile-only">
              <Avatar src={photo} name={story.name} size={56} />
            </span>
            <div>
              <p className="label">{greeting(user?.firstName || "")}</p>
              <span className="desk-only">
                <h1 style={{ fontSize: "var(--t-h2)" }}>{story.name}'s story, this week</h1>
              </span>
              <span className="mobile-only">
                <TellerPick />
              </span>
            </div>
          </div>
          <div className="tools">
            <Link className="iconbtn desk-only" to="/archive?focus=search" aria-label="Search memories">
              <SearchIcon />
            </Link>
            <Link className="iconbtn mobile-only" to="/account" aria-label="My account">
              <UserIcon />
            </Link>
          </div>
        </div>

        <div className="home">
          <section className="main" aria-label="Today">
            <div className="week" role="group" aria-label="This week">
              {week.map((d) => (
                <button key={d.key} type="button" aria-pressed={d.today} aria-label={dayLabel(d) as string} onClick={() => navigate(`/archive?day=${d.key}`)} style={d.future ? { opacity: 0.5 } : undefined}>
                  {d.today ? "Today" : d.label}
                  <span className={`d${d.count ? " has" : ""}`} style={d.count ? { ["--dot" as string]: dotStrength(d) } : undefined}>
                    {d.day}
                  </span>
                </button>
              ))}
            </div>

            <article className="qcard" aria-labelledby="q-label">
              <div>
                <p className="label" id="q-label">A little question for today,</p>
                {question ? (
                  <>
                    <p className="story-q q">{question.question}</p>
                    {noteFor(question) && <p className="meta" style={{ marginBottom: "var(--s-4)" }}>{noteFor(question)}</p>}
                    <div className="acts">
                      <ButtonLink to={`/write?q=${encodeURIComponent(question.id)}`} icon={<PenIcon />}>
                        Write it
                      </ButtonLink>
                      <ButtonLink to={`/talk?q=${encodeURIComponent(question.id)}`} variant="accent" icon={<MicIcon />}>
                        Talk about it
                      </ButtonLink>
                      {left > 1 && (
                        <Button variant="quiet" small onClick={another}>
                          Ask me another
                        </Button>
                      )}
                    </div>
                    {!unlimited && <p className="meta" style={{ paddingBottom: "var(--s-5)" }}>{left === 1 ? "The last of today's three. Three new ones tomorrow." : `${left} of today's three waiting.`}</p>}
                  </>
                ) : (
                  <>
                    <p className="story-q q">That's today's questions. Three new ones in the morning.</p>
                    <div className="acts">
                      <ButtonLink to="/write" icon={<PenIcon />}>
                        Write in your own words
                      </ButtonLink>
                    </div>
                  </>
                )}
              </div>
              <Art />
            </article>

            <div className="tiles">
              <Link className="tile dark" to="/write">
                <PenIcon />
                Write a memory
              </Link>
              <Link className="tile light" to="/talk">
                <MicIcon />
                Talk with A Story
              </Link>
            </div>

            <div className="sechead">
              <h2>Recent memories</h2>
              {story.memories.length > 0 && <Link to="/archive">All {story.memories.length} →</Link>}
            </div>
            {recent.length ? (
              <div className="recent">
                {recent.map((m, i) => (
                  <MemoryCard key={m.id} memory={m} story={story} style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            ) : (
              <div className="card empty">
                <h2 className="story-title" style={{ fontSize: 24 }}>Nothing here yet.</h2>
                <p>Answer the question above, or write about anything at all. The first memory is the hardest; after that they come.</p>
              </div>
            )}
          </section>

          <aside className="aside" aria-label="This week">
            <div className="card">
              <h3>{story.name}'s book</h3>
              <div className="bookmini">
                <img src="/book/closed-640.webp" alt="" width={64} />
                <div>
                  <p className="n">
                    {progress.count}
                    <small>{progress.headline}</small>
                  </p>
                </div>
              </div>
              <div className="progress" style={{ ["--pct" as string]: `${Math.max(4, Math.round(progress.ratio * 100))}%`, marginTop: "var(--s-4)" }} role="img" aria-label={`${Math.round(progress.ratio * 100)}% of the way to a first edition`}>
                <div className="bar">{progress.ratio >= 0.2 ? `${Math.round(progress.ratio * 100)}%` : ""}</div>
                <div className="mark" />
                <div className="comb" />
                <div className="end">First edition</div>
              </div>
              <ButtonLink to="/book" variant="outline" small block style={{ marginTop: "var(--s-4)" }}>
                Open the book
              </ButtonLink>
            </div>

            <div className="card">
              <h3>From the family</h3>
              {fromFamily.length ? (
                <div className="news">
                  {fromFamily.map((m) => (
                    <Link key={m.id} className="item" to={`/archive/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Avatar name={m.contributor.split(",")[0]} size={36} />
                      <span>
                        <b>{m.contributor.split(",")[0]}</b> added <b>{m.title || "a memory"}</b>.
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="meta">Nobody else is in {story.name}'s story yet.</p>
              )}
              <ButtonLink to="/family" variant="quiet" small style={{ marginTop: "var(--s-3)", paddingLeft: 0 }}>
                {fromFamily.length ? "See the family →" : "Invite someone →"}
              </ButtonLink>
            </div>

            <div className="card">
              <h3>Talking with {story.name}</h3>
              <p className="meta">A Story calls on the phone at the hour you choose. Talking here in the browser is coming.</p>
              <ButtonLink to="/talk" variant="outline" small style={{ marginTop: "var(--s-3)" }}>
                How calls work
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
