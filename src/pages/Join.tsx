/**
 * /join/:code — a family code, opened from a link or an email. What an
 * invited relative sees first, so it is the family book open on the cloth
 * like the sign-in: on the left page, an invitation card held by photo
 * corners says plainly what joining means (Bao's Standard rule 29: you
 * join as yourself, you read what they share and add what you remember
 * under your own name, and nobody ever writes as anybody else); on the
 * bookplate, the code and the two ways in. Signed in, the same plate
 * joins the family tree with the code and says what happened. A code opens
 * a place in the tree, never a story's keepers (PRODUCT-DECISIONS §6).
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthFrame from "./auth/AuthFrame";
import PlateSay from "./auth/PlateSay";
import { smarten } from "../lib/typography";
import { Button, ButtonLink } from "../components/ui";
import LoadingMark from "../components/delight/LoadingMark";
import { holdUntilDecoded } from "../components/delight/photoReady";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { joinFamily, type JoinResult } from "../data/familyWrites";
import { joinOutcome, looksLikeFamilyCode, normaliseFamilyCode, spacedCode } from "../app-core/lib/familyCode.js";
import { track } from "../lib/analytics";
import { myStoryIds } from "../components/family/familyView";
import type { Family } from "../data/family";

type Outcome = { ok: boolean; title?: string; body: string };

/** The left page: what joining means, on a card tucked into the endpaper, with one print beside it. */
function Invitation() {
  return (
    <div className="inv ep-arrive" id="joining">
      <figure className="inv-print" aria-hidden="true">
        <img src="/photos/33-1200.webp" alt="" decoding="sync" ref={(img) => holdUntilDecoded(img, img?.closest("figure"))} />
        <i className="pc tl" />
        <i className="pc tr" />
        <i className="pc bl" />
        <i className="pc br" />
      </figure>
      <figure className="inv-print two" aria-hidden="true">
        <img src="/photos/31-1200.webp" alt="" decoding="sync" ref={(img) => holdUntilDecoded(img, img?.closest("figure"))} />
        <i className="pc tl" />
        <i className="pc tr" />
        <i className="pc bl" />
        <i className="pc br" />
      </figure>
      <p className="ep-note inv-note">Photographs from a sample family’s book.</p>
      <div className="inv-card">
        <i className="pc tl" aria-hidden="true" />
        <i className="pc tr" aria-hidden="true" />
        <i className="pc bl" aria-hidden="true" />
        <i className="pc br" aria-hidden="true" />
        <h2 className="inv-head">
          What joining means<span className="stop">.</span>
        </h2>
        <dl className="inv-list">
          <div>
            <dt>You join as yourself.</dt>
            <dd>
              Your name goes into their family tree. On their side you show as “invited · waiting for them” until you come in, then “on A Story”.
            </dd>
          </div>
          <div>
            <dt>You read, and you add.</dt>
            <dd>You read the memories they share with the family, and add what you remember under your own name. It joins the book when they keep it.</dd>
          </div>
          <div>
            <dt>Nobody writes as anybody else.</dt>
            <dd>Not you as them, not them as you. You also get a story of your own, empty until you want it.</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** A code typed by hand, for a link that lost its own. What is wrong with it is said on the plate's one line (`onError`). */
function TypeCode({ initial = "", invalid, onError }: { initial?: string; invalid: boolean; onError: (message: string | null) => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const go = (e: FormEvent) => {
    e.preventDefault();
    const c = normaliseFamilyCode(value) as string;
    if (!looksLikeFamilyCode(c)) return onError(c.length === 6 ? "Some of those letters are never used in a code (I, L, O, 0 and 1). Check them against the message." : `That is ${c.length} letters and numbers; a family code has six.`);
    onError(null);
    navigate(`/join/${c}`, { viewTransition: true });
  };
  return (
    <form onSubmit={go} noValidate className="typecode">
      <label className="field">
        <span>Family code</span>
        <span className="input">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase());
            }}
            placeholder="K7M 2QX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={9}
            aria-invalid={invalid ? true : undefined}
            aria-describedby="plate-say"
            className="codefield"
          />
        </span>
      </label>
      <Button type="submit" block>
        Try this code
      </Button>
    </form>
  );
}

/**
 * The join's answer, with the story it names made the family's storyteller's when the story it opened is the
 * joiner's own: a code for GBao's place, whose story Bao had started about GBao, used to say "GBao’s story is
 * on your Family tab" to GBao. The storyteller is whoever started the family’s tree, by their first name, else
 * whoever made the code; with neither, the line names no story.
 */
function namingTheTeller(result: JoinResult, family: Family | null, userId: string | null | undefined): JoinResult {
  if (!result.ok || !result.story_id || !myStoryIds(family, userId).includes(result.story_id)) return result;
  const place = family?.people.find((p) => p.id === result.person_id) || family?.people.find((p) => p.storyId === result.story_id);
  const home = family?.households.find((h) => h.id === place?.householdId);
  const teller = home?.createdBy && home.createdBy !== userId ? family?.people.find((p) => p.householdId === home.id && p.userId === home.createdBy) : null;
  return { ...result, story_name: String(teller?.givenName || "").trim() || result.inviter_name || null };
}

export default function Join() {
  const { code: raw = "" } = useParams();
  const code = normaliseFamilyCode(raw) as string;
  const valid = looksLikeFamilyCode(code) as boolean;
  const { user } = useAuth();
  const { ensureMyStory, reload, family } = useAccount();
  const [result, setResult] = useState<JoinResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "joined" | "ready">("idle");
  const [attempt, setAttempt] = useState(0);
  const [typed, setTyped] = useState<string | null>(null);
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

  const outcome = result ? (joinOutcome(namingTheTeller(result, family, user?.id)) as Outcome) : null;
  const next = `/join/${code}`;
  // A code that is wrong, run out or already used is not fixed by trying
  // again; the way out is another code.
  const retryable = !!result && !result.ok && ["offline", "failed", "too_many"].includes(result.reason);
  const needsAnotherCode = !!result && !result.ok && ["not_found", "expired", "used", "taken", "short"].includes(result.reason);
  const seal = <div className="codeseal" aria-label={`Family code ${[...code].join(" ")}`}>{spacedCode(code) as string}</div>;

  let plate;
  if (!valid) {
    plate = (
      <div className="form">
        <h1>
          This code doesn’t look right<span className="stop">.</span>
        </h1>
        <PlateSay error={typed}>
          A family code is six letters and numbers, like <span className="nw">K7M 2QX</span>. Check it against the message; it takes a moment.
        </PlateSay>
        <TypeCode initial={code.length > 0 && code.length <= 12 ? code : ""} invalid={!!typed} onError={setTyped} />
      </div>
    );
  } else if (user === undefined) {
    plate = (
      <div className="form plate-wait" aria-busy="true">
        <LoadingMark />
        <p className="sub">Opening the family book</p>
      </div>
    );
  } else if (!user) {
    // Signed out, the code has not been checked yet (that needs an account): say what it does if it is right.
    plate = (
      <div className="form">
        <h1>
          Your family code<span className="stop">.</span>
        </h1>
        <PlateSay>If it is right, it puts you in their family tree. Codes last 30 days.</PlateSay>
        {seal}
        <p className="step">
          <b>Step 1 of 2:</b> your own account, about a minute. <b>Step 2:</b> we check the code and you join.
        </p>
        <div className="acts">
          <ButtonLink to={`/create-account?code=${code}`} block viewTransition>
            Create an account
          </ButtonLink>
          <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="outline" block viewTransition>
            I already have an account
          </ButtonLink>
        </div>
        <p className="plate-links one phone-only">
          <a href="#joining">What joining means ↓</a>
        </p>
      </div>
    );
  } else if (!result) {
    plate = (
      <div className="form plate-wait" aria-busy="true">
        {seal}
        <LoadingMark />
        <p className="sub">Checking the code and putting you in the family tree</p>
      </div>
    );
  } else if (outcome?.ok) {
    plate = (
      <div className="form">
        <h1>
          {smarten(outcome.title || "You’re in")}
          <span className="stop">.</span>
        </h1>
        <PlateSay>{outcome.body}</PlateSay>
        <div className="acts">
          {phase === "ready" ? (
            <ButtonLink to="/" block>
              Go to Home
            </ButtonLink>
          ) : (
            <Button block loading disabled>
              Go to Home
            </Button>
          )}
        </div>
      </div>
    );
  } else {
    plate = (
      <div className="form">
        <h1>
          That didn’t work<span className="stop">.</span>
        </h1>
        <PlateSay error={typed || outcome?.body} />
        {needsAnotherCode && <TypeCode initial={code} invalid={!!typed} onError={setTyped} />}
        {retryable && (
          <div className="acts">
            <Button
              block
              onClick={() => {
                setResult(null);
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </Button>
          </div>
        )}
        <p className="plate-links one">
          <Link to="/" viewTransition>
            Go to Home
          </Link>
        </p>
      </div>
    );
  }

  // The title line only promises a place once the code is known to be good.
  const promise = outcome?.ok ? (
    <>
      Your family’s book <span className="keep">has a place for you.</span>
    </>
  ) : valid ? (
    <>
      Join your <span className="keep">family’s book.</span>
    </>
  ) : undefined;

  return (
    <AuthFrame left={<Invitation />} leftLabel="What joining means" poses={["curious", "happy"]} rest={outcome?.ok ? "happy" : "curious"} promise={promise}>
      {plate}
    </AuthFrame>
  );
}
