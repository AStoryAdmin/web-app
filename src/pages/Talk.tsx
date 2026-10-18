/**
 * Talk, in v1: the browser cannot ring anyone, so this page says, once and
 * plainly, that the calls happen on the phone for now, and keeps the
 * question: the one asked for (?q=) or today's, set as an index card with
 * the pen beside it, so the person can write it instead without losing it.
 * The live conversation in the browser is v1.5 (docs/PRD.md item 15b); this
 * page becomes it.
 */
import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { ButtonLink, Problem } from "../components/ui";
import { PenIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { todaysDeck, todaysQuestion } from "../lib/today";
import { isPaid } from "../lib/plan";
import { track } from "../lib/analytics";
import WhereNext, { Stop } from "../components/book/WhereNext";

/** Three lengths, three sizes (as the writer sets its question): short, middling, long. */
const qLen = (q: string) => (q.length > 50 ? "long" : q.length > 34 ? "mid" : "short");

export default function Talk() {
  const { user } = useAuth();
  const { account, activeStory: story, loadError, reload } = useAccount();
  const [params] = useSearchParams();
  const qid = params.get("q");

  useEffect(() => {
    if (story) track("talk_wall_shown", { reason: "browser_not_yet" });
  }, [story]);

  if (account === undefined)
    return (
      <Shell
        compact
        wide
        title="Talk"
        back="/"
        hero={
          <h1 className="hero-title">
            Talk
            <Stop />
          </h1>
        }
      >
        {/* the words and their three steps on the left, the question's card on the right, in hairlines */}
        <div className="page talk-page bka-skel talk-skel" aria-busy="true">
          <span className="bka-sk-col" aria-hidden="true">
            <i className="bka-sk-line tall w70" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line w85" />
            <i className="bka-sk-line w40" />
            <i className="bka-sk-line" />
            <i className="bka-sk-line w70" />
          </span>
          <span className="bka-sk-block" aria-hidden="true" />
        </div>
      </Shell>
    );
  if (account === null && loadError)
    return (
      <Shell compact title="Talk" back="/">
        <div className="page">
          <Problem message={`We couldn’t reach your stories. ${loadError}`} onRetry={reload} />
        </div>
      </Shell>
    );
  if (!story) return <Navigate to="/start" replace />;

  const unlimited = isPaid(user?.plan ?? "free");
  const asked = qid ? todaysDeck(story, { unlimited: true }).find((p) => p.id === qid) : null;
  const question = asked ?? todaysQuestion(story, { unlimited });
  const qText = question?.question ?? "Write about anything at all.";
  const own = story.relationship === "Myself";
  const who = own ? "you" : story.name;

  return (
    <Shell
      compact
      wide
      title="Talk"
      back="/"
      hero={
        <h1 className="hero-title">
          Talk
          <Stop />
        </h1>
      }
    >
      <div className="page talk-page">
        <section className="talk-words" aria-labelledby="talk-h" data-rise>
          <h2 id="talk-h" data-running="On the phone, for now">
            On the phone, for now<Stop />
          </h2>
          <p className="talk-lead">
            A Story talks with {who} in the A Story app on the phone. Talking here in the browser is coming; until then, the question keeps.
          </p>
          <ol className="talk-steps">
            <li>
              <b>It rings</b>
              <span>at the hour you chose in the app.</span>
            </li>
            <li>
              <b>It listens</b>
              <span>while {own ? "you talk" : `${story.name} talks`}.</span>
            </li>
            <li>
              <b>The memory appears here</b>
              <span>by evening, in {own ? "your" : `${story.name}’s`} own words.</span>
            </li>
          </ol>
        </section>

        <aside className="talk-card" aria-label={asked ? "The question you chose" : "Today’s question"} data-rise>
          <p className="talk-card-kicker">{asked ? "The question you chose" : "Today’s question"}</p>
          {/* the size steps with the question's length so it always sets in two lines, on the card's ruled lines */}
          <p className="talk-q" data-len={qLen(qText)}>
            {qText}
          </p>
          <div className="talk-acts">
            <ButtonLink to={question ? `/write?q=${encodeURIComponent(question.id)}` : "/write"} icon={<PenIcon />}>
              Write it instead
            </ButtonLink>
          </div>
          {/* the pen lying ready on the card */}
          <svg className="talk-nib" viewBox="0 0 40 96" width="40" height="96" aria-hidden="true">
            <path className="body" d="M20 94 L7 50 C5 41 7 27 11 15 L29 15 C33 27 35 41 33 50 Z" />
            <path className="slit" d="M20 92 V52" />
            <circle className="hole" cx="20" cy="48" r="3.2" />
            <path className="collar" d="M10 15 L30 15 L31 4 L9 4 Z" />
          </svg>
        </aside>
      </div>
      <div className="page talk-next">
        <WhereNext
          rows={[
            { to: "/", title: "Back to today", line: "Three questions, and the week so far." },
            { to: "/archive", title: "Read what’s kept", line: "Every memory by year." },
            { to: "/book", title: "Open the book", line: "Every page, as it will print." },
          ]}
        />
      </div>
    </Shell>
  );
}
