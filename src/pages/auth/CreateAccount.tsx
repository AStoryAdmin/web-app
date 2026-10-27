/**
 * A new account, in two short steps on the bookplate so the plate never
 * outgrows the page: who you are (your name, written on the plate's line
 * under "This book belongs to", and your email), then a password and, if
 * someone in the family sent one, their code. A code that came in the link
 * (/join/:code sends ?code=, the invitation email ?ref=) is shown as given,
 * not as a field to fill in. Instead of a password they can have a code
 * emailed, which makes the account and signs them in, as the app does.
 */
import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import { useArrive } from "./useArrive";
import { carriedEmail, handOff } from "./handoff";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Checkbox, Field } from "../../components/ui";
import { createAccount, MIN_PASSWORD, safeNext, sendEmailCode } from "../../data/auth";
import { useAuth } from "../../state/authContext";
import { looksLikeFamilyCode, normaliseFamilyCode, spacedCode } from "../../app-core/lib/familyCode.js";
import { track } from "../../lib/analytics";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
type Bad = "name" | "email" | "password" | "code" | null;

export default function CreateAccount() {
  const { user } = useAuth();
  const { arrive, arriving } = useArrive();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  // A code from a link, read the way the server will. "?code=" with nothing after it means "I have a code": open the field.
  const prefilled = normaliseFamilyCode(params.get("ref") || params.get("code") || "") as string;
  const given = looksLikeFamilyCode(prefilled) as boolean;
  const [step, setStep] = useState<"who" | "password">("who");
  const [name, setName] = useState("");
  // an address carried back from Verify's "Change" (router state, never the URL), ready to correct
  const carried = carriedEmail(useLocation().state);
  const [email, setEmail] = useState(carried);
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [hasCode, setHasCode] = useState(given || params.has("code"));
  const [code, setCode] = useState(prefilled);
  const [busy, setBusy] = useState<"password" | "code" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // which field the error is about, so that field points at the plate's line
  const [bad, setBad] = useState<Bad>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  if (user && !arriving) return <Navigate to={next} replace />;

  const fail = (field: Bad, message: string) => {
    setBad(field);
    setError(message);
  };

  const toPassword = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (!name.trim()) return fail("name", "Write your name on the plate first.");
    if (!looksLikeEmail(email)) return fail("email", "That email doesn’t look complete. Check it for a missing letter.");
    setStep("password");
    setFocus(null);
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  // the family code as typed, or "" for none; null when it is typed but not six
  const familyCode = (): string | null => {
    const cleaned = hasCode ? (normaliseFamilyCode(code) as string) : "";
    return cleaned && !looksLikeFamilyCode(cleaned) ? null : cleaned;
  };

  // the address rides in the router state (handoff.ts), never the URL; the family code and next are not personal
  const toVerify = (mode: "signup" | "email", cleaned: string) => {
    const q = new URLSearchParams({ next });
    if (cleaned) q.set("code", cleaned);
    const handoff = mode === "email" ? { email: email.trim(), mode, create: { name, code: cleaned } } : { email: email.trim(), mode };
    navigate(`/verify?${q}`, { state: handOff(handoff), viewTransition: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    if (password.length < MIN_PASSWORD) return fail("password", `The password needs at least ${MIN_PASSWORD} characters.`);
    const cleaned = familyCode();
    if (cleaned === null) return fail("code", "Check the code: it has six.");
    setBusy("password");
    const r = await createAccount({ name, email, password, code: cleaned });
    setBusy(null);
    if (!r.ok) return fail(null, r.error);
    track("account_created", { method: "email", had_code: Boolean(cleaned) });
    if (r.needsCode) toVerify("signup", cleaned);
    // signed in already (confirmation off): go on once AuthProvider has them
    else arrive(cleaned ? `/join/${cleaned}` : next);
  };

  // No password at all: a code by email makes the account and signs them in, the app’s default. Not counted as
  // account_created: for an address that already has an account the same code just signs them in.
  const byCode = async () => {
    if (busy || arriving) return;
    setError(null);
    setBad(null);
    const cleaned = familyCode();
    if (cleaned === null) return fail("code", "Check the code: it has six.");
    setBusy("code");
    const r = await sendEmailCode(email, { createUser: true, name, code: cleaned });
    setBusy(null);
    if (!r.ok) return fail(null, r.error);
    toVerify("email", cleaned);
  };

  const back = () => {
    setError(null);
    setBad(null);
    setStep("who");
    requestAnimationFrame(() => nameRef.current?.focus());
  };

  const says = (field: Bad) => (bad === field ? { "aria-invalid": true as const, "aria-describedby": "plate-say" } : {});

  return (
    <AuthFrame
      title={
        <>
          Create your account<span className="stop">.</span>
        </>
      }
      lettered={step === "who"}
      companion={{ focus, shown, progress: Math.min(1, (focus === "email" ? email.length : name.length) / 24) }}
    >
      {step === "who" ? (
        <form className="form" onSubmit={toPassword} noValidate key="who">
          {/* the name is written on the plate's line, under its engraved "This book belongs to" */}
          <label className="owner">
            <input
              ref={nameRef}
              aria-label="Your name (this book belongs to)"
              aria-describedby={bad === "name" ? "plate-say" : "owner-hint"}
              aria-invalid={bad === "name" ? true : undefined}
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocus("other")}
              onBlur={() => setFocus(null)}
              required
            />
            <span className="owner-hint" id="owner-hint">
              Your name, as your family will see it
            </span>
          </label>
          <PlateSay error={error}>
            {given ? (
              <>
                Joining with the code <b className="nw">{spacedCode(prefilled) as string}</b>. Free to start.
              </>
            ) : (
              "Free to start. No card."
            )}
          </PlateSay>
          <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocusChange={(w) => setFocus(w ? "email" : null)} required {...says("email")} />
          <Button type="submit" block>
            Continue
          </Button>
          <p className="plate-links one">
            <Link to={`/sign-in?next=${encodeURIComponent(next)}`} viewTransition>
              I already have an account
            </Link>
          </p>
        </form>
      ) : (
        <form className="form" onSubmit={submit} noValidate key="password">
          <h2 className="plate-head">
            Choose a password<span className="stop">.</span>
          </h2>
          <p className="given">
            <span>
              For <b>{email.trim()}</b>
            </span>
            <button type="button" className="linkish" onClick={back}>
              Change
            </button>
          </p>
          {/* the plate's one line carries the terms on this step, so the step fits the page with the code field open */}
          <PlateSay error={error}>
            Creating an account accepts the <a href="https://astoryapp.com/terms">terms</a> and <a href="https://astoryapp.com/privacy">privacy policy</a>.
          </PlateSay>
          <Field
            ref={passwordRef}
            label="Password"
            type={shown ? "text" : "password"}
            autoComplete="new-password"
            placeholder={`${MIN_PASSWORD}+ characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            reveal={{ shown, toggle: () => setShown((s) => !s) }}
            onFocusChange={(w) => setFocus(w ? "password" : null)}
            required
            {...says("password")}
          />
          {given ? (
            <p className="given with-code">
              Joining with the family code <b>{spacedCode(prefilled) as string}</b>
            </p>
          ) : !hasCode ? (
            <div className="code-ask">
              <Checkbox checked={hasCode} onChange={setHasCode}>
                Someone in the family gave me a code
              </Checkbox>
            </div>
          ) : (
            <Field
              label="Family code, six letters and numbers"
              placeholder="K7M 2QX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onFocusChange={(w) => setFocus(w ? "other" : null)}
              {...says("code")}
            />
          )}
          <Button type="submit" block loading={busy === "password" || arriving}>
            Create account
          </Button>
          <p className="plate-links one">
            <button type="button" className="linkish" onClick={byCode} disabled={busy !== null || arriving} aria-busy={busy === "code" || undefined}>
              {busy === "code" ? "Sending…" : "Email me a code instead"}
            </button>
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
