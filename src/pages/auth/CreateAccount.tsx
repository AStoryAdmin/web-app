import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { Button, Checkbox, Field, Problem } from "../../components/ui";
import { CodeIcon, LockIcon, MailIcon, UserIcon } from "../../components/icons";
import { createAccount, MIN_PASSWORD, safeNext } from "../../data/auth";
import { useAuth } from "../../state/authContext";
import { normaliseFamilyCode } from "../../app-core/lib/familyCode.js";
import { track } from "../../lib/analytics";

export default function CreateAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  // A code from a link (/join/:code sends ?code=; the invitation email's button sends ?ref=), read the way the server will.
  const prefilled = normaliseFamilyCode(params.get("ref") || params.get("code") || "") as string;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [hasCode, setHasCode] = useState(Boolean(prefilled));
  const [code, setCode] = useState(prefilled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please tell us your name.");
    if (password.length < MIN_PASSWORD) return setError(`The password needs at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const cleaned = hasCode ? normaliseFamilyCode(code) : "";
    const r = await createAccount({ name, email, password, code: cleaned });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    track("account_created", { method: "email", had_code: Boolean(cleaned) });
    const q = new URLSearchParams({ email, next });
    if (cleaned) q.set("code", cleaned);
    if (r.needsCode) navigate(`/verify?${q}`);
    else navigate(cleaned ? `/join/${cleaned}` : next, { replace: true });
  };

  return (
    <AuthFrame line={1}>
      <form className="form" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="sub">Free to start. No card.</p>
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        <Field label="Your name" icon={<UserIcon />} autoComplete="name" placeholder="Dan Hartley" value={name} onChange={(e) => setName(e.target.value)} required />
        <Field label="Email" type="email" icon={<MailIcon />} autoComplete="username" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field
          label="Password"
          type={shown ? "text" : "password"}
          icon={<LockIcon />}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          reveal={{ shown, toggle: () => setShown((s) => !s) }}
          required
        />
        <div style={{ margin: "0 0 var(--s-5)" }}>
          <Checkbox checked={hasCode} onChange={setHasCode}>
            Someone in the family gave me a code
          </Checkbox>
        </div>
        {hasCode && (
          <Field
            label="Family code"
            icon={<CodeIcon />}
            placeholder="K7M2QX"
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            hint="Six letters and numbers. It puts you in your family's tree."
          />
        )}
        <Button type="submit" block loading={busy}>
          Create account
        </Button>
        <p className="legal">
          By creating an account you agree to our <a href="https://astoryapp.com/terms">terms</a> and <a href="https://astoryapp.com/privacy">privacy policy</a>.
        </p>
        <p className="switch">
          Already have an account? <Link to={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
