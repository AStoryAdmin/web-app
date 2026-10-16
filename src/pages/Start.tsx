/**
 * "Whose story is this?" The one question between an account and Home.
 * Somebody who arrived through an invitation already has a story and never
 * sees this. Two cards, a name, how they are related; then Home.
 */
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { newStory, RELATIONSHIPS } from "../data/memories";
import { Button, Field, Problem } from "../components/ui";
import { Lockup } from "../components/Brand";
import { track } from "../lib/analytics";

const RELATIONS = RELATIONSHIPS.filter((r) => r !== "Myself");

export default function Start() {
  const { user } = useAuth();
  const { account, stories, addStory } = useAccount();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const another = params.get("another") === "1";
  const [who, setWho] = useState<"self" | "other" | null>(null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [relationship, setRelationship] = useState("Mother");
  const [birthYear, setBirthYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account === undefined) return null;
  if (!another && stories.length > 0) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const self = who === "self";
    const first = self ? user.firstName || name : name;
    if (!first.trim()) return setError(self ? "Tell us your first name." : "Tell us their first name.");
    setBusy(true);
    try {
      await addStory(
        newStory({
          name: first,
          lastName,
          relationship: self ? "Myself" : relationship,
          birthYear: birthYear.trim(),
        }),
      );
      track("story_created", { subject: self ? "self" : "other" });
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "That didn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="start">
      <header className="start-head">
        <Lockup height={40} />
      </header>
      <main className="start-body">
        {who === null ? (
          <section className="rise" aria-labelledby="start-title">
            <h1 id="start-title">Whose story is this?</h1>
            <p className="sub">You can keep more than one. Start with one person.</p>
            <div className="choice">
              <button type="button" className="choice-card" onClick={() => setWho("other")}>
                <span className="big">Someone in my family</span>
                <span className="meta">A parent, a grandparent, anyone you'd like to ask.</span>
              </button>
              <button type="button" className="choice-card" onClick={() => setWho("self")}>
                <span className="big">My own story</span>
                <span className="meta">In your own words, at your own pace.</span>
              </button>
            </div>
          </section>
        ) : (
          <form className="rise" onSubmit={submit} noValidate>
            <button type="button" className="btn quiet sm" onClick={() => setWho(null)} style={{ marginBottom: "var(--s-4)", paddingLeft: 0 }}>
              ← Back
            </button>
            <h1>{who === "self" ? "About you" : "About them"}</h1>
            {error && <Problem message={error} onDismiss={() => setError(null)} />}
            {who === "other" && (
              <>
                <Field label="Their first name" placeholder="Rose" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
                <div className="field">
                  <span>They are my</span>
                  <div className="chiprow">
                    {RELATIONS.map((r) => (
                      <button key={r} type="button" className="chip big" aria-pressed={relationship === r} onClick={() => setRelationship(r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {who === "self" && !user?.firstName && <Field label="Your first name" placeholder="Rose" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />}
            <Field label="Last name" placeholder="Hartley" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Field label="Year of birth (if you know it)" inputMode="numeric" placeholder="1945" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} hint="It lets the archive say how old they were." />
            <Button type="submit" block loading={busy}>
              {who === "self" ? "Begin" : `Begin ${name.trim() || "their"}${name.trim() ? "'s" : ""} story`}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
