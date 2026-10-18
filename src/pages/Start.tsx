/**
 * "Whose story is this?" The one question between an account and Home.
 * Somebody who arrived through an invitation already has a story and never
 * sees this. One sheet of the book's paper on the cloth, one screen on a
 * desktop: the three ways to be in a story side by side (docs/PRD.md
 * §3.3a), each saying who holds the pen: a story you keep for someone who
 * is not on A Story, your own, or joining the story of someone who already
 * has an account. Nobody ever writes as somebody else. The second step
 * keeps the chosen way beside its form. `?another=1` comes back here from
 * the Whose-story sheet (and offers "Not now"); `?join=1` opens the join
 * branch straight away. A second story of your own is never offered.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { newStory, RELATIONSHIPS } from "../data/memories";
import { requestStoryJoin, storyCard, type Person, type StoryCard } from "../data/family";
import { Avatar, Button, Field, Problem } from "../components/ui";
import { Lockup } from "../components/Brand";
import LoadingMark from "../components/delight/LoadingMark";
import { MOTION_OK } from "../lib/arrive";
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

type Way = "other" | "self" | "join";

/** The three ways, in the product's own words (docs/PRD.md §3.3a). `writes` says who holds the pen, every time. */
const WAYS: { key: Way; title: string; writes: string; body: string; act: string }[] = [
  {
    key: "other",
    title: "Someone in my family",
    writes: "You write, in their name",
    body: "A parent or a grandparent who isn't on A Story yet, or would rather you did the typing. What you write is kept in their name, as told to you.",
    act: "Start their story",
  },
  {
    key: "self",
    title: "My own story",
    writes: "You write, in your own words",
    body: "Your life, at your own pace. The family reads what you choose to share and adds what they remember.",
    act: "Start mine",
  },
  {
    key: "join",
    title: "Someone already on A Story",
    writes: "They write; you add",
    body: "Don't start a second story about them. Join theirs with their family code, and add what you remember under your own name.",
    act: "Join their story",
  },
];

/** A small object for each way, the specimen beside its words (Bao's Standard rule 39): their book, your pen, their code. */
function WayObject({ way }: { way: Way }) {
  if (way === "other")
    return (
      <span className="start-obj obj-book" aria-hidden="true">
        <span className="obj-title">Their story</span>
        <span className="obj-rule" />
        <span className="obj-script">with love</span>
      </span>
    );
  if (way === "self")
    return (
      <span className="start-obj obj-leaf" aria-hidden="true">
        <span className="obj-dear">Dear family,</span>
        <svg className="obj-nib" viewBox="0 0 40 96" width="40" height="96">
          <path className="body" d="M20 94 L7 50 C5 41 7 27 11 15 L29 15 C33 27 35 41 33 50 Z" />
          <path className="slit" d="M20 92 V52" />
          <circle className="hole" cx="20" cy="48" r="3.2" />
          <path className="body" d="M10 15 L30 15 L31 4 L9 4 Z" />
        </svg>
      </span>
    );
  return (
    <span className="start-obj obj-code" aria-hidden="true">
      <span className="obj-code-label">Family code</span>
      <span className="obj-code-value">ABC123</span>
    </span>
  );
}

export default function Start() {
  const { user } = useAuth();
  const { account, stories, addStory, family } = useAccount();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const join = params.get("join") === "1";
  const another = params.get("another") === "1" || join;
  const [who, setWho] = useState<Way | null>(join ? "join" : null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [relationship, setRelationship] = useState("Mother");
  const [code, setCode] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheet = useRef<HTMLElement>(null);

  // The sheet's contents rise once, a few things together, each time the step changes (transform and opacity,
  // stated at both ends, cleared after; nothing under reduced motion).
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const items = el.querySelectorAll("[data-rise]");
      gsap.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, [who, account]);

  if (account === undefined)
    return (
      <div className="start" aria-busy="true">
        <LoadingMark />
      </div>
    );
  if (!another && stories.length > 0) return <Navigate to="/" replace />;

  const hasOwn = stories.some((s) => s.relationship === "Myself" && (!s.ownerId || s.ownerId === user?.id));

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

  const way = WAYS.find((w) => w.key === who) ?? null;

  return (
    <div className="start">
      <header className="start-head">
        <Lockup height={32} />
        {another && (
          <Link className="start-close" to="/" aria-label="Not now, back to Home">
            Not now
          </Link>
        )}
      </header>
      <main className={`start-sheet${way ? " step-2" : ""}`} ref={sheet}>
        {!way ? (
          <section aria-labelledby="start-title">
            <div className="start-top">
              <p className="start-step-line" data-rise>
                Step 1 of 2
              </p>
              <h1 id="start-title" data-rise>
                Whose story is this<span className="stop">?</span>
              </h1>
              <p className="start-sub" data-rise>
                There are three ways to be in a story, and nobody ever writes as somebody else. You can keep more than one; start with one person.
              </p>
            </div>
            <div className="start-ways">
              {WAYS.map((w) => {
                const taken = w.key === "self" && hasOwn;
                return (
                  <button key={w.key} type="button" className={`start-way way-${w.key}`} onClick={() => setWho(w.key)} disabled={taken} data-rise>
                    <WayObject way={w.key} />
                    <span className="start-way-text">
                      <span className="start-way-writes">{w.writes}</span>
                      <span className="start-way-title">{w.title}</span>
                      <span className="start-way-body">{taken ? "You keep yours already. Choose it from the storyteller button at the top of any page." : w.body}</span>
                    </span>
                    {!taken && <span className="start-way-act">{w.act}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="start-step">
            <aside className="start-recap" data-rise>
              <button type="button" className="start-back" onClick={() => setWho(null)}>
                <span aria-hidden="true">←</span> The three ways
              </button>
              <p className="start-step-line">Step 2 of 2 · {way.writes.toLowerCase()}</p>
              <h1>
                {who === "self" ? "About you" : who === "join" ? "Join their story" : "About them"}
                <span className="stop">.</span>
              </h1>
              <p className="start-recap-body">
                {who === "join"
                  ? "Ask them, or whoever keeps their story, for the six-letter family code on their Family page, or the link. Nothing is written in their name: you read what they chose to share and add what you remember, under your own name, and they approve it."
                  : who === "other"
                    ? "This is for someone who is not on A Story, or who would rather you did the typing. What you write is kept in their name, as told to you. If they join later, you can hand the story to them."
                    : "In your own words, at your own pace. The family reads what you share."}
              </p>
            </aside>

            <form className="start-form" onSubmit={submit} noValidate data-rise>
              {error && <Problem message={error} onDismiss={() => setError(null)} />}
              {who === "join" && (
                <>
                  <Field label="Their family code" placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} autoFocus autoComplete="off" />
                  <Button type="button" onClick={() => code && navigate(`/join/${code}`)} disabled={!code}>
                    Open it
                  </Button>
                  <AskToJoin
                    people={toAddTo({ people: family?.people || [], meId: user?.id || null, myStoryIds: stories.map((s) => s.id) })}
                    myName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
                  />
                </>
              )}
              {who === "other" && (
                <>
                  <Field label="Their first name" placeholder="Rose" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
                  <div className="field">
                    <span>They are my</span>
                    <div className="chiprow start-rel" role="group" aria-label="They are my">
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
                  <div className="start-two">
                    <Field label="Last name" placeholder="Hartley" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    <Field label="Year of birth, if you know it" inputMode="numeric" placeholder="1945" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} hint={`It lets the archive say how old ${who === "self" ? "you were" : "they were"}.`} />
                  </div>
                  <Button type="submit" block loading={busy}>
                    {who === "self" ? "Begin my story" : `Begin ${name.trim() ? `${name.trim()}'s` : "their"} story`}
                  </Button>
                </>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
