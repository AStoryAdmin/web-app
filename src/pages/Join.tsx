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
  // One join per attempt, kept here so a re-run of the effect (StrictMode
  // runs it twice; a new `reload` would too) subscribes to the same call
  // instead of starting another or, worse, losing the answer. Before this
  // the first run was cancelled and the second skipped, and the page sat on
  // "Finding your place…" for good.
  const pending = useRef<{ attempt: number; promise: Promise<JoinResult> } | null>(null);

  // Join as soon as there is a signed-in person.
  useEffect(() => {
    if (!user || !valid) return;
    if (!pending.current || pending.current.attempt !== attempt) {
      pending.current = {
        attempt,
        promise: joinFamily(code).then(async (r) => {
          if (r.ok) {
            track("join_completed", { already: !!r.already, moved: !!r.moved });
            await reload().catch(() => {});
          }
          return r;
        }),
      };
    }
    let live = true;
    void pending.current.promise.then((r) => {
      if (!live) return;
      setResult(r);
      if (r.ok) setPhase("joined");
    });
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
  // A code that is wrong, run out or already used is not fixed by trying
  // again; the way out is another code, typed on the join branch of /start.
  const retryable = !!result && !result.ok && ["offline", "failed", "too_many"].includes(result.reason);
  const needsAnotherCode = !!result && !result.ok && ["not_found", "expired", "used", "taken", "short"].includes(result.reason);

  return (
    <main className="solo">
      <Link to={user ? "/" : "/welcome"} aria-label="A Story" className="solo-brand">
        <Lockup height={40} />
      </Link>
      <section className="solo-card" aria-live="polite">
        {!valid ? (
          <>
            <h1>This link is missing its code.</h1>
            <p className="meta">Ask whoever sent it to send it again, or type the six letters yourself: it says “Someone in the family gave me a code” when you create an account, or “Join someone's story” once you are in.</p>
            <div className="acts stack" style={{ marginTop: "var(--s-6)" }}>
              {user ? (
                <ButtonLink to="/start?another=1&join=1" block>
                  Type the code
                </ButtonLink>
              ) : (
                <ButtonLink to="/create-account?code=" block>
                  Type the code
                </ButtonLink>
              )}
              <ButtonLink to={user ? "/" : "/welcome"} variant="outline" block>
                Open A Story
              </ButtonLink>
            </div>
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
            <p className="meta">Make an account, or sign in, and this code puts you in their family tree. A code is good for 30 days from when it was sent.</p>
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
              {retryable && (
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
              {needsAnotherCode && (
                <ButtonLink to="/start?another=1&join=1" block>
                  Type a different code
                </ButtonLink>
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
