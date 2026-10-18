/**
 * A new account, in two short steps on the bookplate so the plate never
 * outgrows the page: who you are (name and email), then a password and,
 * if someone in the family sent one, their code. A code that came in the
 * link (/join/:code sends ?code=, the invitation email ?ref=) is shown as
 * given, not as a field to fill in.
 */
import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import type { CompanionFocus } from "../../components/delight/Companion";
import { Button, Checkbox, Field } from "../../components/ui";
import { createAccount, MIN_PASSWORD, safeNext } from "../../data/auth";
import { useAuth } from "../../state/authContext";
import { looksLikeFamilyCode, normaliseFamilyCode, spacedCode } from "../../app-core/lib/familyCode.js";
import { track } from "../../lib/analytics";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

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
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  if (user) return <Navigate to={next} replace />;

  const toPassword = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please tell us your name. It is how your family will see you.");
    if (!looksLikeEmail(email)) return setError("That email doesn't look complete. Check it for a missing letter.");
    setStep("password");
    setFocus(null);
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`The password needs at least ${MIN_PASSWORD} characters.`);
    const cleaned = hasCode ? (normaliseFamilyCode(code) as string) : "";
    if (cleaned && !looksLikeFamilyCode(cleaned)) return setError("A family code is six letters and numbers. Check you have them all, or untick the box.");
    setBusy(true);
    const r = await createAccount({ name, email, password, code: cleaned });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    track("account_created", { method: "email", had_code: Boolean(cleaned) });
    const q = new URLSearchParams({ email, next });
    if (cleaned) q.set("code", cleaned);
    if (r.needsCode) navigate(`/verify?${q}`, { viewTransition: true });
    else navigate(cleaned ? `/join/${cleaned}` : next, { replace: true });
  };

  const back = () => {
    setError(null);
    setStep("who");
    requestAnimationFrame(() => nameRef.current?.focus());
  };

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
          {error && (
            <p className="plate-error" role="alert">
              {error}
            </p>
          )}
          {/* the name is written on the plate's line, under its engraved "This book belongs to" */}
          <label className="owner">
            <input
              ref={nameRef}
              aria-label="Your name (this book belongs to)"
              aria-describedby="owner-hint"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocus("other")}
              onBlur={() => setFocus(null)}
              aria-invalid={error && !name.trim() ? true : undefined}
              required
            />
          </label>
          <p className="owner-hint" id="owner-hint">
            As your family will see it.
          </p>
          <Field label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocusChange={(w) => setFocus(w ? "email" : null)} required />
          {given && (
            <p className="given">
              With the family code <b>{spacedCode(prefilled) as string}</b>
            </p>
          )}
          <Button type="submit" block>
            Continue
          </Button>
          <p className="switch">
            Free to start, no card. Have an account?{" "}
            <Link to={`/sign-in?next=${encodeURIComponent(next)}`} viewTransition>
              Sign in
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
          {error && (
            <p className="plate-error" role="alert">
              {error}
            </p>
          )}
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
          />
          {given ? (
            <p className="given">
              With the family code <b>{spacedCode(prefilled) as string}</b>
            </p>
          ) : (
            <div style={{ margin: "0 0 8px" }}>
              <Checkbox checked={hasCode} onChange={setHasCode}>
                Someone in the family gave me a code
              </Checkbox>
            </div>
          )}
          {hasCode && !given && (
            <Field
              label="Family code"
              placeholder="K7M 2QX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onFocusChange={(w) => setFocus(w ? "other" : null)}
              hint="Six letters and numbers. It puts you in their family tree."
            />
          )}
          <Button type="submit" block loading={busy}>
            Create account
          </Button>
          <p className="legal">
            By creating an account you agree to the <a href="https://astoryapp.com/terms">terms</a> and the <a href="https://astoryapp.com/privacy">privacy policy</a>.
          </p>
        </form>
      )}
    </AuthFrame>
  );
}
