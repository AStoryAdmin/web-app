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
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
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
import { OUT } from "../lib/ease";
import { track } from "../lib/analytics";
import { storiesToAddTo } from "../app-core/lib/familyStories.js";
import { personName } from "../components/family/familyView";
import { lifeLine } from "../app-core/lib/personMemories.js";
import { relationFromTree, storyFieldsFrom, storyPicks, type StoryPick } from "../data/storyPick";
import { linkPersonStory } from "../data/session";

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
      <p className="meta">These stories are kept in your family already. Asking sends a note to whoever keeps them; they say yes, and you’re in.</p>
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
                <span className="meta">{r === "asked" ? "asked · waiting for them" : r === "already" ? "you’re already in this story" : r || about}</span>
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

/**
 * Somebody the family tree already knows, offered as their first name is
 * typed (the app's NewStoryScreen pick): starting from their place keeps
 * one Rose in the tree, not two. A story that already exists is opened or
 * joined, never started again.
 */
function InTheTree({
  picks,
  picked,
  stories,
  opening,
  onStart,
  onUnpick,
  onOpen,
  onJoin,
}: {
  picks: StoryPick[];
  picked: Person | null;
  stories: { id: string; readOnly?: boolean }[];
  opening: string | null;
  onStart: (p: Person) => void;
  onUnpick: () => void;
  onOpen: (p: Person) => void;
  onJoin: () => void;
}) {
  const shown = picked ? picks.filter((x) => x.person.id === picked.id) : picks;
  if (!shown.length) return null;
  const line = ({ person, kind }: StoryPick) => {
    if (kind === "open") return stories.find((s) => s.id === person.storyId)?.readOnly ? "You read their story already" : "You keep their story already";
    if (kind === "join") return person.storyId ? "Their story is kept by someone else in the family" : "They’re on A Story, so they start their own";
    if (picked) return "Their story starts from their place in the tree";
    return (lifeLine(person) as string) || "In your family tree";
  };
  return (
    <div className="askjoin">
      <p className="label quiet">{picked ? "From your family tree" : "Already in your family tree?"}</p>
      <ul>
        {shown.map((pick) => {
          const p = pick.person;
          return (
            <li key={p.id}>
              <Avatar src={undefined} name={p.givenName} size={40} />
              <span>
                <strong>{personName(p)}</strong>
                <span className="meta">{line(pick)}</span>
              </span>
              {pick.kind === "start" &&
                (picked ? (
                  <Button variant="outline" onClick={onUnpick}>
                    Not them
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => onStart(p)}>
                    That’s them
                  </Button>
                ))}
              {pick.kind === "open" && (
                <Button variant="outline" loading={opening === p.id} onClick={() => onOpen(p)}>
                  Open it
                </Button>
              )}
              {pick.kind === "join" && (
                <Button variant="outline" onClick={onJoin}>
                  Join theirs
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

/** What step 2 says when you join someone's story (also held, invisible, in its loading frame). */
const JOIN_RECAP =
  "Ask them, or whoever keeps their story, for the six-letter family code on their Family page, or the link. Nothing is written in their name: you read what they chose to share and add what you remember, under your own name, and they approve it.";

/** The three ways, in the product's own words (docs/PRD.md §3.3a). `writes` says who holds the pen, every time. */
const WAYS: { key: Way; title: string; writes: string; body: string; act: string }[] = [
  {
    key: "other",
    title: "Someone in my family",
    writes: "You write it down for them, as told to you",
    body: "A parent or a grandparent who isn’t on A Story yet, or would rather you did the typing. The story is kept in their name.",
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
    body: "Don’t start a second story about them. Join theirs with their family code, and add what you remember under your own name.",
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
  const { account, stories, addStory, family, chooseStory, reload } = useAccount();
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
  // the place in the family tree this story is started from, when one was chosen
  const [picked, setPicked] = useState<Person | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const sheet = useRef<HTMLElement>(null);

  // The sheet's contents rise once, a few things together, each time the step changes (transform and opacity,
  // stated at both ends, cleared after; nothing under reduced motion).
  const loaded = account !== undefined;
  // Set up before the browser paints, so the first frame is already the start of the rise and never a flash.
  useLayoutEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const items = el.querySelectorAll("[data-rise]");
      gsap.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: OUT, stagger: 0.06, clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, [who, loaded]);

  if (account === undefined)
    return (
      // the bench and its sheet at their arrived size, the three ways as frames only; the heart draws in the first
      // specimen's place, and its status line is the one thing read (the held words are hidden, nothing is marked busy)
      <div className="start start-skel">
        <header className="start-head">
          <Lockup height={32} />
          {another && (
            <span className="start-close" aria-hidden="true">
              Not now
            </span>
          )}
        </header>
        {join ? (
          // a join link (what a relative is sent): step 2's frame at its arrived size, the heart in the code field's place
          <main className="start-sheet step-2">
            <div className="start-step">
              <aside className="start-recap" aria-hidden="true">
                <span className="start-back">
                  <span>←</span> The three ways
                </span>
                <p className="start-step-line">Step 2 of 2 · they write; you add</p>
                <h1>
                  Join their story<span className="stop">.</span>
                </h1>
                <p className="start-recap-body">{JOIN_RECAP}</p>
              </aside>
              <div className="start-form">
                <div className="start-code start-sk-code">
                  <div className="start-sk-hold" aria-hidden="true">
                    <Field label="Their family code" placeholder="ABC123" value="" onChange={() => {}} tabIndex={-1} />
                    <div className="start-acts">
                      <Button type="button" disabled>
                        Open it
                      </Button>
                      <span className="acct-why">Type the code they gave you first.</span>
                    </div>
                  </div>
                  <span className="start-sk-mark">
                    <LoadingMark />
                  </span>
                </div>
              </div>
            </div>
          </main>
        ) : (
        <main className="start-sheet">
          <section>
            <div className="start-top" aria-hidden="true">
              <p className="start-step-line">Step 1 of 2</p>
              <h1>
                Whose story is this<span className="stop">?</span>
              </h1>
              <p className="start-sub">There are three ways to be in a story, and nobody ever signs as somebody else. You can keep more than one; start with one person.</p>
            </div>
            <div className="start-ways">
              {WAYS.map((w, i) => (
                <div key={w.key} className={`start-way way-${w.key}`}>
                  <span className="start-spec">{i === 0 && <LoadingMark />}</span>
                  <span className="start-way-text" aria-hidden="true">
                    <span className="start-way-writes">{w.writes}</span>
                    <span className="start-way-title">{w.title}</span>
                    <span className="start-way-body">{w.body}</span>
                  </span>
                  <span className="start-way-act" aria-hidden="true">
                    {w.act}
                  </span>
                </div>
              ))}
            </div>
            <p className="start-sample" aria-hidden="true">
              See a sample book first
            </p>
          </section>
        </main>
        )}
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
    const from = !self && picked && !picked.storyId ? picked : null;
    try {
      // your own story is bound to your place in the tree by addStory itself
      const story = await addStory(
        newStory({
          name: first,
          lastName,
          relationship: self ? "Myself" : relationship,
          birthYear: birthYear.trim(),
          hasAccount: from ? storyFieldsFrom(from).hasAccount : null,
        }),
      );
      if (from) {
        // their place in the tree, bound to the story started from it; the story is kept either way
        await linkPersonStory(from.id, story.id)
          .then((linked) => {
            if (linked) void reload();
          })
          .catch((err) => console.warn("link_person_story:", (err as Error)?.message || err));
      }
      track("story_created", { subject: self ? "self" : "other", fromTree: !!from });
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error)?.message || "That didn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const way = WAYS.find((w) => w.key === who) ?? null;

  const picks =
    who === "other" ? storyPicks({ people: family?.people, meId: user?.id, myStoryIds: stories.map((s) => s.id), typed: name }) : [];
  const typeName = (value: string) => {
    setName(value);
    // a different name is somebody else: the tree's place is let go
    if (picked && value.trim().toLowerCase() !== String(picked.givenName || "").trim().toLowerCase()) setPicked(null);
  };
  const startFrom = (p: Person) => {
    const f = storyFieldsFrom(p);
    setPicked(p);
    setName(f.name);
    setLastName(f.lastName);
    setBirthYear(f.birthYear);
    const rel = relationFromTree(family, p.id, user?.id, RELATIONS);
    if (rel) setRelationship(rel);
  };
  const openStory = async (p: Person) => {
    if (!p.storyId) return;
    setOpening(p.id);
    try {
      await chooseStory(p.storyId);
      navigate("/", { replace: true });
    } catch {
      setError("That story didn’t open. Please try again.");
    } finally {
      setOpening(null);
    }
  };

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
                There are three ways to be in a story, and nobody ever signs as somebody else. You can keep more than one; start with one person.
              </p>
            </div>
            <div className="start-ways">
              {WAYS.map((w) => {
                const taken = w.key === "self" && hasOwn;
                return (
                  <button key={w.key} type="button" className={`start-way way-${w.key}`} onClick={() => setWho(w.key)} disabled={taken} data-rise>
                    {/* a fixed slot, so the words under the three specimens start on one line */}
                    <span className="start-spec">
                      <WayObject way={w.key} />
                    </span>
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
            {/* Where to next, quietly: one row for someone who would like to see the book before choosing */}
            <a className="start-sample" href="https://astoryapp.com/samples/" target="_blank" rel="noopener">
              See a sample book first <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens astoryapp.com)</span>
            </a>
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
                  ? JOIN_RECAP
                  : who === "other"
                    ? "This is for someone who is not on A Story, or who would rather you did the typing. What you write is kept in their name, as told to you. If they join later, you can hand the story to them."
                    : "In your own words, at your own pace. The family reads what you share."}
              </p>
            </aside>

            {who === "join" ? (
              <div className="start-form" data-rise>
                <form
                  className="start-code"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code) navigate(`/join/${code}`);
                  }}
                  noValidate
                >
                  <Field label="Their family code" placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} autoFocus autoComplete="off" />
                  <div className="start-acts">
                    <Button type="submit" disabled={!code}>
                      Open it
                    </Button>
                    {!code && <span className="acct-why">Type the code they gave you first.</span>}
                  </div>
                </form>
                <AskToJoin
                  people={toAddTo({ people: family?.people || [], meId: user?.id || null, myStoryIds: stories.map((s) => s.id) })}
                  myName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
                />
              </div>
            ) : (
            <form className="start-form" onSubmit={submit} noValidate data-rise>
              {error && <Problem message={error} onDismiss={() => setError(null)} />}
              {who === "other" && (
                <>
                  <Field label="Their first name" placeholder="Rose" value={name} onChange={(e) => typeName(e.target.value)} autoFocus required />
                  <InTheTree
                    picks={picks}
                    picked={picked}
                    stories={stories}
                    opening={opening}
                    onStart={startFrom}
                    onUnpick={() => setPicked(null)}
                    onOpen={(p) => void openStory(p)}
                    onJoin={() => setWho("join")}
                  />
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
              <div className="start-two">
                <Field label="Last name" placeholder="Hartley" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <Field label="Year of birth, if you know it" inputMode="numeric" placeholder="1945" value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))} hint={`It lets the archive say how old ${who === "self" ? "you were" : "they were"}.`} />
              </div>
              <Button type="submit" block loading={busy}>
                {who === "self" ? "Begin my story" : `Begin ${name.trim() ? `${name.trim()}’s` : "their"} story`}
              </Button>
            </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
