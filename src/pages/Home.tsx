/**
 * Home: today. On the cloth, a greeting and one question in the serif with
 * two ways to answer it. On the sheet, this week's days, the book filling
 * up, what the family added, the calls, and the most recent memories.
 * Nothing to configure; the place to come back to.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Shell, { TellerPick } from "../components/Shell";
import Mosaic, { InvitePrint } from "../components/Mosaic";
import FromTheBook from "../components/FromTheBook";
import DayRibbon from "../components/DayRibbon";
import { Avatar, Button, ButtonLink, Problem } from "../components/ui";
import { MicIcon, PenIcon, SearchIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { greeting, noteFor, recordSkip, skipsToday, todaysDeck, todaysQuestion } from "../lib/today";
import { isPaid } from "../lib/plan";
import { dayKey } from "../app-core/lib/dailyQuestion.js";
import { stripDays } from "../app-core/lib/weekStrip.js";
import { bookProgress } from "../app-core/lib/bookProgress.js";
import { track } from "../lib/analytics";
import { resurface } from "../lib/resurface";

const longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });


/** Today's questions left as this browser last counted them (the skips are kept per story and day), before the story is known. */
function heldQuestionsLeft(): number {
  try {
    const day = `-${dayKey()}`;
    let skips = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("astory-skips-") && k.endsWith(day)) skips = Math.max(skips, Number(localStorage.getItem(k) || 0));
    }
    return Math.max(1, 3 - skips);
  } catch {
    return 3;
  }
}

/** Whether this viewer's plan was paid when the page last arrived (the plan comes with the account, after the skeleton). */
const PLAN_SEEN = "astory-home-paid";
/** Today's question as this browser last showed it, so a reload the same day holds its exact words. */
const QUESTION_SEEN = "astory-home-question";
function heldQuestion(): string | null {
  try {
    const seen = JSON.parse(localStorage.getItem(QUESTION_SEEN) || "null") as { day?: string; q?: string } | null;
    return seen && seen.day === dayKey() && seen.q ? seen.q : null;
  } catch {
    return null;
  }
}

function heldPaid(): boolean {
  try {
    return localStorage.getItem(PLAN_SEEN) === "1";
  } catch {
    return false;
  }
}

export default function Home() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const navigate = useNavigate();
  const [skips, setSkips] = useState(() => (story ? skipsToday(story.id) : 0));

  const relative = !!story && story.relationship !== "Myself" && story.ownerId !== user?.id && false;
  const unlimited = isPaid(user?.plan ?? "free");
  // remembered for the next cold load's skeleton (a per-viewer convenience)
  useEffect(() => {
    if (account === undefined) return;
    try {
      localStorage.setItem(PLAN_SEEN, unlimited ? "1" : "0");
    } catch {
      /* storage refused: the skeleton holds the free shape */
    }
  }, [account, unlimited]);
  const deck = useMemo(() => (story ? todaysDeck(story, { relative, unlimited }) : []), [story, relative, unlimited]);
  const question = useMemo(() => (story ? todaysQuestion(story, { relative, unlimited }) : null), [story, relative, unlimited, skips]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!question) return;
    try {
      localStorage.setItem(QUESTION_SEEN, JSON.stringify({ day: dayKey(), q: question.question }));
    } catch {
      /* storage refused: the skeleton holds its sample question */
    }
  }, [question]);

  // While the account loads: the arrived hero's frame (same Shell key, so the sheet rises once), its greeting already
  // known, the question's place held invisible at its size; the page's own words rise in when they come.
  if (account === undefined) {
    // sign-in knows the plan; the remembered one is only the fallback
    const heldUnlimited = user?.plan ? isPaid(user.plan) : heldPaid();
    const heldLeft = heldUnlimited ? 3 : heldQuestionsLeft();
    return (
      <Shell
        hero={
          <div className="hero-grid home-hero">
            <div className="greet">
              <p className="label">
                {/* the date needs no account; the label's words are held so it wraps as it will on a phone */}
                <span className="hold-words">{longDate()} · Your story</span>
                <span className="mobile-only">
                  {" "}
                  {/* the storyteller button as it usually reads (your own story), so the label wraps as it will */}
                  <span className="teller-pick hold-words">
                    <span>
                      <strong>{user?.firstName ? `${user.firstName} · Your own story` : "Your own story"}</strong>
                    </span>
                    <svg width={16} height={16} aria-hidden="true" />
                  </span>
                </span>
              </p>
              <h1>
                <span className="nw">{greeting("")},</span> <span className="hl nw">{user?.firstName || "friend"}.</span>
              </h1>
              <span className="foil" />
            </div>
            <div className="ask hold-words" aria-hidden="true">
              <span className="pill gold">A little question for today</span>
              <p className="story-q q">{heldQuestion() ?? "Where did you go as a child to be alone?"}</p>
              <div className="acts">
                <span className="btn primary">
                  <PenIcon />
                  Write it
                </span>
                <span className="btn quiet">
                  <MicIcon />
                  Talk it through on a call
                </span>
                {heldLeft > 1 && <span className="btn quiet sm">Ask me another</span>}
              </div>
              {/* the plan is known from sign-in: a free account's note under the acts is held too, at today's count */}
              {!heldUnlimited && <p className="meta note">{heldLeft === 1 ? "The last of today’s three. Three new ones tomorrow." : `${heldLeft} of today’s three waiting.`}</p>}
            </div>
          </div>
        }
      >
        <div className="page" aria-busy="true" />
      </Shell>
    );
  }
  if (account === null && loadError) {
    return (
      <Shell compact title="Home">
        <div className="page">
          <Problem message="We couldn’t reach your stories." onRetry={reload} />
          <p className="meta">They’re kept safe on our side. Check the connection and try again.</p>
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const days = stripDays(story.memories) as { key: string; label: string; day: number; count: number; today: boolean; future: boolean; offset: number }[];
  const byCreated = [...story.memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const kept = byCreated.filter((m) => m.status !== "in_progress");
  const quoted = resurface(story);
  const recent = kept.filter((m) => m.id !== quoted?.memory.id);
  const quote = quoted ? { node: <FromTheBook story={story} />, memoryId: quoted.memory.id } : null;
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
    <div className="hero-grid home-hero">
      <div className="greet">
        <p className="label" data-rise>
          {longDate()} · {own ? "Your story" : `${story.name}’s story`}
          <span className="mobile-only">
            {" "}
            <TellerPick />
          </span>
        </p>
        <h1>
          <span className="nw">{greeting("")},</span> <span className="hl nw">{user?.firstName || "friend"}.</span>
        </h1>
        <span className="foil" />
      </div>
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
                <ButtonLink to={`/talk?q=${encodeURIComponent(question.id)}`} variant="quiet" icon={<MicIcon />}>
                  Talk it through on a call
                </ButtonLink>
                {left > 1 && (
                  <Button variant="quiet" small onClick={another}>
                    Ask me another
                  </Button>
                )}
              </div>
              {!unlimited && (
                <p className="meta note" data-rise>
                  {left === 1 ? "The last of today’s three. Three new ones tomorrow." : `${left} of today’s three waiting.`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="story-q q" data-rise>
                That’s today’s questions. Three new ones in the morning.
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
  );

  return (
    <Shell hero={hero}>
      <div className="page home-sheet">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}

        <div className="weekrow" data-rise>
          <DayRibbon days={days} memories={story.memories} onPick={(key) => navigate(`/archive?day=${key}`)} />
          <Link className="home-find" to="/archive?focus=search">
            <span>Search {story.memories.length > 1 ? `all ${story.memories.length} memories` : "your memories"}</span>
            <SearchIcon aria-hidden="true" />
          </Link>
        </div>

        <div className="home-board">
          <section className="home-mem" aria-labelledby="recent-h">
            <div className="sechead" style={{ marginTop: 0 }} data-rise>
              <h2 id="recent-h">Recent memories</h2>
              {story.memories.length > 0 && (
                <Link className="more" to="/archive">
                  All {story.memories.length}
                </Link>
              )}
            </div>
            {recent.length ? <Mosaic memories={recent} story={story} lead={false} limit={6} /> : quote ? null : <InvitePrint story={story} />}
          </section>

          <aside className="home-side" aria-label="At a glance">
            {quote && <div className="home-quote" data-rise>{quote.node}</div>}

            <div className="card glance" data-rise>
              <div className="glance-row">
                <img className="glance-book" src="/book/keepsake-closed.webp" alt="" width={52} />
                <div className="glance-body">
                  <h3>{own ? "Your book" : `${story.name}’s book`}</h3>
                  <p className="meta">{progress.headline}</p>
                  <div className="progress" style={{ ["--pct" as string]: `${Math.round(progress.ratio * 100)}%` }} role="img" aria-label={`${Math.round(progress.ratio * 100)}% of the way to a first edition`}>
                    <div className="bar" />
                    <div className="end">First edition</div>
                  </div>
                  <Link className="more" to="/book">
                    Open the book
                  </Link>
                </div>
              </div>

              <div className="glance-row">
                <div className="glance-body">
                  <h3>From the family</h3>
                  {fromFamily.length ? (
                    <div className="news">
                      {fromFamily.slice(0, 2).map((m) => (
                        <Link key={m.id} className="item" to={`/archive/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <Avatar name={m.contributor.split(",")[0]} size={28} />
                          <span>
                            <b>{m.contributor.split(",")[0]}</b> added <b>{m.title || "a memory"}</b>.
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="meta">Nobody else is in {own ? "your" : `${story.name}’s`} story yet.</p>
                  )}
                  <Link className="more" to="/family">
                    {fromFamily.length ? "See the family" : "Invite someone"}
                  </Link>
                </div>
              </div>

              <div className="glance-row">
                <div className="glance-body">
                  <h3>Calls</h3>
                  <p className="meta">A Story calls on the phone at the hour you choose. Talking here in the browser is coming.</p>
                  <Link className="more" to="/talk">
                    How calls work
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
