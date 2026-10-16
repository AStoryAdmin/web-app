/**
 * /join/:code — a family code, opened from a link or an email. Signed out,
 * it shows the code and the two doors in; signed in, it joins the family
 * tree with it and says what happened. A code opens a place in the tree,
 * never a story's keepers (docs/PRODUCT-DECISIONS.md §6).
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { Button, ButtonLink } from "../components/ui";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { joinFamily, type JoinResult } from "../data/familyWrites";
import { joinOutcome, looksLikeFamilyCode, normaliseFamilyCode, spacedCode } from "../app-core/lib/familyCode.js";
import { track } from "../lib/analytics";

type Outcome = { ok: boolean; title?: string; body: string };

export default function Join() {
  const { code: raw = "" } = useParams();
  const code = normaliseFamilyCode(raw) as string;
  const valid = looksLikeFamilyCode(code) as boolean;
  const { user } = useAuth();
  const { ensureMyStory, reload } = useAccount();
  const [result, setResult] = useState<JoinResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "joined" | "ready">("idle");
  const [attempt, setAttempt] = useState(0);
  const tried = useRef(-1);

  // Join once per attempt, as soon as there is a signed-in person.
  useEffect(() => {
    if (!user || !valid || tried.current === attempt) return;
    tried.current = attempt;
    let live = true;
    (async () => {
      const r = await joinFamily(code);
      if (r.ok) {
        track("join_completed", { already: !!r.already, moved: !!r.moved });
        await reload().catch(() => {});
      }
      if (!live) return;
      setResult(r);
      if (r.ok) setPhase("joined");
    })();
    return () => {
      live = false;
    };
  }, [user, valid, code, attempt, reload]);

  // Then their own story, with the account read fresh after the join.
  useEffect(() => {
    if (phase !== "joined") return;
    let live = true;
    ensureMyStory()
      .catch(() => null)
      .finally(() => live && setPhase("ready"));
    return () => {
      live = false;
    };
  }, [phase, ensureMyStory]);

  const outcome = result ? (joinOutcome(result) as Outcome) : null;
  const next = `/join/${code}`;

  return (
    <main className="solo">
      <Link to={user ? "/" : "/welcome"} aria-label="A Story" className="solo-brand">
        <Lockup height={40} />
      </Link>
      <section className="solo-card" aria-live="polite">
        {!valid ? (
          <>
            <h1>This link is missing its code.</h1>
            <p className="meta">Ask whoever sent it to send it again, or type the six letters into A Story under “I have a code from family”.</p>
            <ButtonLink to="/welcome" variant="outline" style={{ marginTop: "var(--s-6)" }}>
              Open A Story
            </ButtonLink>
          </>
        ) : user === undefined ? (
          <p className="meta">One moment…</p>
        ) : !user ? (
          <>
            <p className="label">Your family code</p>
            <div className="codebig solo-code" aria-label={`Family code ${[...code].join(" ")}`}>
              {spacedCode(code) as string}
            </div>
            <h1>Someone in your family saved you a place.</h1>
            <p className="meta">Make an account, or sign in, and this code puts you in their family tree.</p>
            <div className="acts stack">
              <ButtonLink to={`/create-account?code=${code}`} block>
                Create an account
              </ButtonLink>
              <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="outline" block>
                Sign in
              </ButtonLink>
            </div>
          </>
        ) : !result ? (
          <>
            <div className="codebig solo-code">{spacedCode(code) as string}</div>
            <p className="meta">Finding your place in the family…</p>
          </>
        ) : outcome?.ok ? (
          <>
            <p className="label">Welcome</p>
            <h1>{outcome.title || "You're in"}</h1>
            <p className="meta big">{outcome.body}</p>
            <ButtonLink to="/" block style={{ marginTop: "var(--s-6)" }}>
              {phase === "ready" ? "Go to Home" : "Go to Home"}
            </ButtonLink>
          </>
        ) : (
          <>
            <div className="codebig solo-code">{spacedCode(code) as string}</div>
            <h1>That didn't work.</h1>
            <p className="meta big">{outcome?.body}</p>
            <div className="acts stack">
              {(result && !result.ok && ["offline", "failed", "too_many"].includes(result.reason)) && (
                <Button
                  block
                  onClick={() => {
                    setResult(null);
                    setAttempt((a) => a + 1);
                  }}
                >
                  Try again
                </Button>
              )}
              <ButtonLink to="/" variant="outline" block>
                Go to Home
              </ButtonLink>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
