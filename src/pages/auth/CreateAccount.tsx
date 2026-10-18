/**
 * A new account, in two short steps on the bookplate so the plate never
 * outgrows the page: who you are (your name, written on the plate's line
 * under "This book belongs to", and your email), then a password and, if
 * someone in the family sent one, their code. A code that came in the link
 * (/join/:code sends ?code=, the invitation email ?ref=) is shown as given,
 * not as a field to fill in.
 */
import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import PlateSay from "./PlateSay";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Checkbox, Field } from "../../components/ui";
import { createAccount, MIN_PASSWORD, safeNext } from "../../data/auth";
import { useAuth } from "../../state/authContext";
import { looksLikeFamilyCode, normaliseFamilyCode, spacedCode } from "../../app-core/lib/familyCode.js";
import { track } from "../../lib/analytics";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
type Bad = "name" | "email" | "password" | "code" | null;

export default function CreateAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  // A code from a link, read the way the server will. "?code=" with nothing after it means "I have a code": open the field.
  const prefilled = normaliseFamilyCode(params.get("ref") || params.get("code") || "") as string;
  const given = looksLikeFamilyCode(prefilled) as boolean;
  const [step, setStep] = useState<"who" | "password">("who");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState<CompanionFocus>(null);
  const [hasCode, setHasCode] = useState(given || params.has("code"));
  const [code, setCode] = useState(prefilled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // which field the error is about, so that field points at the plate's line
  const [bad, setBad] = useState<Bad>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  if (user) return <Navigate to={next} replace />;

  const fail = (field: Bad, message: string) => {
    setBad(field);
    setError(message);
  };

  const toPassword = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (!name.trim()) return fail("name", "Write your name on the plate first.");
    if (!looksLikeEmail(email)) return fail("email", "That email doesn't look complete. Check it for a missing letter.");
    setStep("password");
    setFocus(null);
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBad(null);
    if (password.length < MIN_PASSWORD) return fail("password", `The password needs at least ${MIN_PASSWORD} characters.`);
    const cleaned = hasCode ? (normaliseFamilyCode(code) as string) : "";
    if (cleaned && !looksLikeFamilyCode(cleaned)) return fail("code", "A family code is six letters and numbers. Check you have them all.");
    setBusy(true);
    const r = await createAccount({ name, email, password, code: cleaned });
    setBusy(false);
    if (!r.ok) return fail(null, r.error);
    track("account_created", { method: "email", had_code: Boolean(cleaned) });
    const q = new URLSearchParams({ email, next });
    if (cleaned) q.set("code", cleaned);
    if (r.needsCode) navigate(`/verify?${q}`, { viewTransition: true });
    else navigate(cleaned ? `/join/${cleaned}` : next, { replace: true });
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
          <PlateSay error={error}>Free to start. No card.</PlateSay>
          <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocusChange={(w) => setFocus(w ? "email" : null)} required {...says("email")} />
          {given && (
            <p className="given">
              With the family code <b>{spacedCode(prefilled) as string}</b>
            </p>
          )}
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
          <PlateSay error={error}>At least {MIN_PASSWORD} characters. Nobody else ever sees it.</PlateSay>
          <Field
            ref={passwordRef}
            label="Password"
            type={shown ? "text" : "password"}
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            reveal={{ shown, toggle: () => setShown((s) => !s) }}
            onFocusChange={(w) => setFocus(w ? "password" : null)}
            required
            {...says("password")}
          />
          {given ? (
            <p className="given">
              With the family code <b>{spacedCode(prefilled) as string}</b>
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
          <Button type="submit" block loading={busy}>
            Create account
          </Button>
          <p className="legal">
            Creating an account accepts the <a href="https://astoryapp.com/terms">terms</a> and <a href="https://astoryapp.com/privacy">privacy policy</a>.
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
