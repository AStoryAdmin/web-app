/**
 * "Whose story is this?" The one question between an account and Home.
 * Somebody who arrived through an invitation already has a story and never
 * sees this. Three cards, the three ways to be in a story (docs/PRD.md
 * §3.3a): a story you keep for someone who is not on A Story, your own, or
 * joining the story of someone who already has an account. `?another=1`
 * comes back here from the Whose-story sheet; `?join=1` opens the join
 * branch straight away.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { newStory, RELATIONSHIPS } from "../data/memories";
import { requestStoryJoin, storyCard, type Person, type StoryCard } from "../data/family";
import { Avatar, Button, Field, Problem } from "../components/ui";
import { Lockup } from "../components/Brand";
import { track } from "../lib/analytics";
import { storiesToAddTo } from "../app-core/lib/familyStories.js";
import { personName } from "../components/family/familyView";

const RELATIONS = RELATIONSHIPS.filter((r) => r !== "Myself");
// The app's helper is plain JS with `{} = {}` defaults; its type needs saying here.
const toAddTo = storiesToAddTo as unknown as (o: { people: Person[]; meId: string | null; myStoryIds: string[] }) => Person[];

/**
 * Stories already kept in this person's family that they are not yet on:
 * "Ask to join" sends a story_join_requests row for its keepers to answer.
 * Only somebody in the same household may ask; everyone else uses the code.
 * Each candidate is checked with story_card first: a story this account
 * already keeps is never offered (a row in the tree can point at a story
 * that was merged away, which the account's own list no longer carries).
 */
function AskToJoin({ people, myName }: { people: Person[]; myName: string }) {
  const [cards, setCards] = useState<Record<string, StoryCard | null> | null>(null);
  const [asked, setAsked] = useState<Record<string, "asked" | "already" | string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all(people.map((p) => (p.storyId ? storyCard(p.storyId) : Promise.resolve(null)))).then((list) => {
      if (live) setCards(Object.fromEntries(people.map((p, i) => [p.id, list[i]])));
    });
    return () => {
      live = false;
    };
  }, [people]);
  const offered = cards ? people.filter((p) => cards[p.id] && !cards[p.id]!.isKeeper) : [];
  if (!offered.length) return null;
  const ask = async (p: Person) => {
    if (!p.storyId) return;
    setBusy(p.id);
    const r = await requestStoryJoin(p.storyId, myName);
    setBusy(null);
    setAsked((a) => ({ ...a, [p.id]: r.ok ? (r.already ? "already" : "asked") : r.error }));
    if (r.ok) track("story_join_requested", { already: r.already });
  };
  return (
    <div className="askjoin">
      <p className="label quiet">Or ask, without a code</p>
      <p className="meta">These stories are kept in your family already. Asking sends a note to whoever keeps them; they say yes, and you're in.</p>
      <ul>
        {offered.map((p) => {
          const c = cards![p.id]!;
          const r = asked[p.id] || (c.asked ? "asked" : "");
          const about = [c.keeperName ? `kept by ${c.keeperName}` : "their story", `${c.memories} ${c.memories === 1 ? "memory" : "memories"}`].join(" · ");
          return (
            <li key={p.id}>
              <Avatar src={undefined} name={p.givenName} size={40} />
              <span>
                <strong>{personName(p)}</strong>
                <span className="meta">{r === "asked" ? "asked · waiting for them" : r === "already" ? "you're already in this story" : r || about}</span>
              </span>
              {!r && (
                <Button variant="outline" small loading={busy === p.id} onClick={() => void ask(p)}>
                  Ask to join
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Start() {
  const { user } = useAuth();
  const { account, stories, addStory, family } = useAccount();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const join = params.get("join") === "1";
  const another = params.get("another") === "1" || join;
  const [who, setWho] = useState<"self" | "other" | "join" | null>(join ? "join" : null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [relationship, setRelationship] = useState("Mother");
  const [code, setCode] = useState("");
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
                <span className="meta">A parent, a grandparent: someone who isn't on A Story yet. You do the typing and it's kept in their name.</span>
              </button>
              <button type="button" className="choice-card" onClick={() => setWho("self")}>
                <span className="big">My own story</span>
                <span className="meta">In your own words, at your own pace.</span>
              </button>
              <button type="button" className="choice-card quiet" onClick={() => setWho("join")} aria-expanded={false}>
                <span className="big">Someone who is already on A Story</span>
                <span className="meta">Don't start a second story about them. Join theirs: they give you their family code or link, and you add what you remember under your own name.</span>
              </button>
            </div>
          </section>
        ) : (
          <form className="rise" onSubmit={submit} noValidate>
            <button type="button" className="btn quiet sm" onClick={() => setWho(null)} style={{ marginBottom: "var(--s-4)", paddingLeft: 0 }}>
              ← Back
            </button>
            <h1>{who === "self" ? "About you" : who === "join" ? "Join their story" : "About them"}</h1>
            {who === "join" && (
              <>
                <p className="sub">Ask them (or whoever keeps their story) for the six-letter family code on their Family page, or the link. Nothing is written in their name: you read what they chose to share and add what you remember, under your own name, and they approve it.</p>
                <Field label="Their family code" placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} autoFocus />
                <Button type="button" onClick={() => code && navigate(`/join/${code}`)} disabled={!code}>
                  Open it
                </Button>
                <AskToJoin
                  people={toAddTo({ people: family?.people || [], meId: user?.id || null, myStoryIds: stories.map((s) => s.id) })}
                  myName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
                />
              </>
            )}
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
            {who !== "join" && (
              <>
                {who === "other" && <p className="meta" style={{ margin: "calc(-1 * var(--s-2)) 0 var(--s-5)" }}>This is for someone who is not on A Story, or who would rather you did the typing. What you write is kept in their name, as told to you. If they join later, you can hand the story to them.</p>}
                <Field label="Last name" placeholder="Hartley" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Field label="Year of birth (if you know it)" inputMode="numeric" placeholder="1945" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} hint="It lets the archive say how old they were." />
                <Button type="submit" block loading={busy}>
                  {who === "self" ? "Begin" : `Begin ${name.trim() || "their"}${name.trim() ? "'s" : ""} story`}
                </Button>
              </>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
