/**
 * Talk, in v1: the browser cannot ring anyone, but it can listen. This page
 * keeps the question (the one asked for, ?q=, or today's) on an index card
 * with the pen beside it, and offers the two ways to answer it here:
 * "Record it here" (/record, the voice kept) and "Write it instead". One
 * plain line says the calls are in the A Story app on iPhone. The live
 * conversation in the browser is v1.5 (docs/PRD.md item 15b).
 */
import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { ButtonLink, Problem } from "../components/ui";
import LoadingMark from "../components/delight/LoadingMark";
import { MicIcon, PenIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { findQuestion, todaysQuestion } from "../lib/today";
import { asksAbout } from "./write/keep";
import { isPaid } from "../lib/plan";
import { track } from "../lib/analytics";
import WhereNext, { Stop } from "../components/book/WhereNext";
import "../styles/pages/record.css";

/** Three lengths, three sizes (as the writer sets its question): short, middling, long. */
const qLen = (q: string) => (q.length > 50 ? "long" : q.length > 34 ? "mid" : "short");

export default function Talk() {
  const { user } = useAuth();
  const { account, activeStory: story, family, loadError, reload } = useAccount();
  const [params] = useSearchParams();
  const qid = params.get("q");

  useEffect(() => {
    if (story) track("talk_wall_shown", { reason: "record_here" });
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
        <div className="page talk-page bka-skel talk-skel" data-busy="true">
          {/* the words themselves, held invisible at their own size and ruled in hairlines, so the column is its real
              height at every width (your own story, the usual case) */}
          <section className="talk-words hold-words sk-ruled" aria-hidden="true">
            <h2>
              Say it out loud<Stop />
            </h2>
            <p className="talk-lead">Record your answer here, in your own voice. A Story keeps the recording and writes the words down for you.</p>
            <ol className="talk-steps">
              <li>
                <b>Record</b>
                <span>as long as you like, in your own words.</span>
              </li>
              <li>
                <b>Listen back</b>
                <span>and say it again if you want to.</span>
              </li>
              <li>
                <b>Keep it</b>
                <span>your voice and your words, in the archive.</span>
              </li>
            </ol>
            <p className="talk-phone">Calls that ring at an hour you choose are in the A Story app on iPhone.</p>
          </section>
          {/* the heart draws inside the card's outline, where today's question will be set */}
          <span className="bka-sk-block">
            <LoadingMark />
          </span>
        </div>
      </Shell>
    );
  if (account === null && loadError)
    return (
      <Shell compact title="Talk" back="/">
        <div className="page">
          <Problem message={loadError} onRetry={reload} />
        </div>
      </Shell>
    );
  if (!story) return <Navigate to="/start" replace />;

  const unlimited = isPaid(user?.plan ?? "free");
  // looked up as Home, the writer and the recorder look it up, in the voice they ask in
  const opts = { relative: asksAbout(story, user, family?.people), user, family };
  const asked = findQuestion(story, qid, opts);
  const question = asked ?? todaysQuestion(story, { ...opts, unlimited });
  const qText = question?.question ?? "Write about anything at all.";
  const own = story.relationship === "Myself";

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
          <h2 id="talk-h" data-running="Say it out loud">
            Say it out loud<Stop />
          </h2>
          <p className="talk-lead">
            {own ? "Record your answer here, in your own voice." : `Record what you remember of ${story.name} here, in your own voice.`} A Story keeps the
            recording and writes the words down for you.
          </p>
          <ol className="talk-steps">
            <li>
              <b>Record</b>
              <span>as long as you like, in your own words.</span>
            </li>
            <li>
              <b>Listen back</b>
              <span>and say it again if you want to.</span>
            </li>
            <li>
              <b>Keep it</b>
              <span>{own ? "your voice and your words, in the archive." : `your voice and your words, in ${story.name}’s archive.`}</span>
            </li>
          </ol>
          <p className="talk-phone">Calls that ring at an hour you choose are in the A Story app on iPhone.</p>
        </section>

        <aside className="talk-card" aria-label={asked ? "The question you chose" : "Today’s question"} data-rise>
          <p className="talk-card-kicker">{asked ? "The question you chose" : "Today’s question"}</p>
          {/* the size steps with the question's length so it always sets in two lines, on the card's ruled lines */}
          <p className="talk-q" data-len={qLen(qText)}>
            {qText}
          </p>
          <div className="talk-acts">
            <ButtonLink to={question ? `/record?q=${encodeURIComponent(question.id)}` : "/record"} icon={<MicIcon />} viewTransition>
              Record it here
            </ButtonLink>
            <ButtonLink variant="outline" to={question ? `/write?q=${encodeURIComponent(question.id)}` : "/write"} icon={<PenIcon />} viewTransition>
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
