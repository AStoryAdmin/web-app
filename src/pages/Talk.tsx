/**
 * Talk, in v1: the browser cannot ring anyone, so this page points at the
 * phone and keeps the question. The live conversation in the browser is
 * v1.5 (docs/PRD.md item 15b); this page becomes it.
 */
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { ButtonLink } from "../components/ui";
import { PenIcon } from "../components/icons";
import { useAccount } from "../state/accountContext";
import { todaysDeck } from "../lib/today";
import { track } from "../lib/analytics";

export default function Talk() {
  const { account, activeStory: story } = useAccount();
  const [params] = useSearchParams();
  const qid = params.get("q");
  if (account === undefined) return <Shell><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;
  const question = qid ? todaysDeck(story, { unlimited: true }).find((p) => p.id === qid) : null;
  track("talk_wall_shown", { reason: "browser_not_yet" });
  return (
    <Shell title="Talk" back="/">
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="savedbox rise">
          <p className="label">Talking with A Story</p>
          <h1>On the phone, for now.</h1>
          {question && <p className="story-q" style={{ fontSize: 24, margin: "var(--s-4) 0" }}>{question.question}</p>}
          <p style={{ marginTop: "var(--s-4)" }}>
            A Story talks with {story.name} on the phone: it rings at the hour you chose in the app, listens, and the memory appears here by evening. Talking here in the browser is coming soon.
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", marginTop: "var(--s-6)" }}>
            <ButtonLink to={question ? `/write?q=${encodeURIComponent(question.id)}` : "/write"} icon={<PenIcon />}>
              Write it instead
            </ButtonLink>
            <ButtonLink to="/" variant="quiet">
              Back to today
            </ButtonLink>
          </div>
        </div>
      </div>
    </Shell>
  );
}
