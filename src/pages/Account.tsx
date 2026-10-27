/**
 * Account: a settings page, set like the back matter of a book. On a wide
 * window an index stays beside the page (the person, then every section,
 * grouped: you, the stories, the plan and privacy, if you can't), and each
 * section is one row: its name and what it is for on the left, the controls
 * on the right, rows parted by a hairline, never boxed. The person, their
 * storytellers under the three ways to be in a story, the wall, the plan,
 * two privacy switches, the email and the password, who looks after this if
 * they can't, a copy of everything, and deleting the account (which names
 * who inherits each story first, docs/PORTING-MANIFEST.md §1.8). Everything
 * that can fail says so beside the thing that failed.
 */
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, ButtonLink, CodeInput, Field, Problem } from "../components/ui";
import LoadingMark from "../components/delight/LoadingMark";
import { LinkIcon, MailIcon, PrintIcon, UserIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { changePassword, confirmEmailChange, sendPasswordChangeCode, requestEmailChange, updateProfile, updateSettings, CODE_LEN, MIN_PASSWORD, type Settings, type User } from "../data/auth";
import { PLAN_LABELS } from "../lib/plan";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";
import { storyLine } from "../lib/storyLine";
import { meOf, myStoryIds, relationTo, storyGroupOf, storyGroups, storytellerOf, whoseWords, type Index } from "../components/family/familyView";
import PortraitUpload from "../components/family/PortraitUpload";
import WhereNext, { Stop } from "../components/book/WhereNext";
import { householdFor, savePerson } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { editorShape, factDraft, factPatch, lifeDates, lifeLedger, MONTHS, SCHOOL_LEVELS } from "../app-core/lib/personFacts.js";
import type { Person } from "../data/family";
import type { Story } from "../data/stories";
import "./accountProfile.css";

type Note = { ok?: string; error?: string } | null;

/** A function the database does not have yet (an older deploy). */
const MISSING_FN = new Set(["PGRST202", "42883"]);

/** One row of the settings: its name and what it is for on the left, the controls on the right. */
function Section({ title, lead, children, id, tone }: { title: string; lead?: ReactNode; children: ReactNode; id: string; tone?: "danger" }) {
  return (
    // no data-rise: a row below the fold must never wait on an observer to be seen (Bao's Standard rule 25)
    <section className={`acct-sec${tone ? ` ${tone}` : ""}`} aria-labelledby={`${id}-h`} id={id}>
      <header className="acct-sec-head">
        <h2 id={`${id}-h`} data-running={title}>
          {title}
        </h2>
        {lead && <p className="acct-lead">{lead}</p>}
      </header>
      <div className="acct-sec-body">{children}</div>
    </section>
  );
}

/** One part of a section (signing in has three: the email, the password, this browser). */
function Part({ title, lead, children, id }: { title: string; lead?: ReactNode; children: ReactNode; id: string }) {
  return (
    <div className="acct-part" id={id} role="group" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`}>{title}</h3>
      {lead && <p className="acct-lead">{lead}</p>}
      <div className="acct-part-body">{children}</div>
    </div>
  );
}

/** Two short sections side by side on a large window; one alone takes the row (a section that doesn't apply renders nothing). */
function Pair({ children }: { children: ReactNode }) {
  return <div className="acct-pair">{children}</div>;
}

function NoteLine({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p className={`meta acct-note${note.error ? " bad" : " good"}`} role={note.error ? "alert" : "status"}>
      {note.error || note.ok}
    </p>
  );
}

function Switch({ on, label, hint, onChange, busy }: { on: boolean; label: string; hint: string; onChange: (v: boolean) => void; busy?: boolean }) {
  return (
    <button type="button" className={`acct-switch${on ? " on" : ""}`} role="switch" aria-checked={on} onClick={() => onChange(!on)} disabled={busy}>
      <span className="acct-switch-text">
        <strong>{label}</strong>
        <span className="meta">{hint}</span>
      </span>
      <span className="acct-switch-track" aria-hidden="true">
        <span className="acct-switch-knob" />
      </span>
    </button>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────── */

/** The lines of your life that open in place, in the ledger's order (EditProfileScreen LIFE_LINES). */
const LIFE_LINES = [
  { key: "born", label: "Born" },
  { key: "grewUp", label: "Grew up in" },
  { key: "schools", label: "School" },
  { key: "work", label: "Work" },
] as const;
type LifeKey = (typeof LIFE_LINES)[number]["key"];

type School = { level: string; name: string; years: string; kind: string };
type Job = { title: string; place: string; from: string; to: string };
/** What one fact's editor holds (personFacts factDraft): a date and place, one line, or a list. */
type Draft = { day?: string; month?: string; year?: string; place?: string; text?: string; schools?: School[]; jobs?: Job[] };

/**
 * "Who you are to Rose" (the app's lib/profileRelation relationRow): the row, the way into the tree when you are
 * not in it, or nothing on your own story, where there is nobody to be somebody to.
 */
function relationRow({ me, teller, story, userId, toTeller }: { me: Person | null; teller: Person | null; story: Story | null; userId: string; toTeller: string }):
  | { kind: "row"; title: string; value: string; action: string }
  | { kind: "link"; label: string }
  | null {
  if (!teller || !story) return null;
  if ((me && teller.id === me.id) || (teller.userId && teller.userId === userId)) return null;
  if (story.relationship === "Myself" && (!story.ownerId || story.ownerId === userId)) return null;
  const first = (teller.givenName || story.name || "").trim().split(/\s+/)[0];
  if (!first) return null;
  if (!me) return { kind: "link", label: `Put yourself in the family tree, beside ${first}` };
  return toTeller
    ? { kind: "row", title: `Who you are to ${first}`, value: `${first}’s ${toTeller}`, action: "Change it in the family tree" }
    : { kind: "row", title: `Who you are to ${first}`, value: `Not linked to ${first} yet`, action: `Link yourself to ${first} in the family tree` };
}

/** One fact of your life, opened in place: a date and its place, one line, or a list of schools or jobs. */
function FactEditor({ factKey, initial, onSave, onCancel }: { factKey: LifeKey; initial: Draft; onSave: (d: Draft) => Promise<string | null>; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shape = editorShape(factKey) as { kind: "date" | "text" | "schools" | "jobs"; title: string };
  const set = (patch: Draft) => setD((x) => ({ ...x, ...patch }));
  const setRow = <K extends "schools" | "jobs">(list: K, i: number, patch: Partial<NonNullable<Draft[K]>[number]>) =>
    setD((x) => ({ ...x, [list]: (x[list] || []).map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = await onSave(d);
    if (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <form
      className="acct-form acct-fact"
      aria-label={shape.title}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {shape.kind === "date" && (
        <>
          <div className="acct-fact-date">
            <Field label="Day" value={d.day || ""} onChange={(e) => set({ day: e.target.value })} inputMode="numeric" maxLength={2} autoFocus />
            <label className="field">
              <span>Month</span>
              <span className="input">
                <select value={d.month || ""} onChange={(e) => set({ month: e.target.value })}>
                  <option value="">Not known</option>
                  {(MONTHS as string[]).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <Field label="Year" value={d.year || ""} onChange={(e) => set({ year: e.target.value })} inputMode="numeric" maxLength={4} placeholder="1945" />
          </div>
          <Field label="Where" value={d.place || ""} onChange={(e) => set({ place: e.target.value })} placeholder="A town, a country" />
        </>
      )}
      {shape.kind === "text" && <Field label={shape.title} value={d.text || ""} onChange={(e) => set({ text: e.target.value })} autoFocus />}
      {shape.kind === "schools" &&
        (d.schools || []).map((s, i) => (
          <div key={i} className="acct-fact-item" role="group" aria-label={`School ${i + 1}`}>
            <Field label="School" value={s.name} onChange={(e) => setRow("schools", i, { name: e.target.value })} autoFocus={i === 0} />
            <div className="acct-two">
              <label className="field">
                <span>Kind of school</span>
                <span className="input">
                  <select value={s.level} onChange={(e) => setRow("schools", i, { level: e.target.value })}>
                    {(SCHOOL_LEVELS as { key: string; label: string }[]).map((l) => (
                      <option key={l.key} value={l.key}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <Field label="Years" value={s.years} onChange={(e) => setRow("schools", i, { years: e.target.value })} placeholder="1963–1967" />
            </div>
          </div>
        ))}
      {shape.kind === "jobs" &&
        (d.jobs || []).map((j, i) => (
          <div key={i} className="acct-fact-item" role="group" aria-label={`Job ${i + 1}`}>
            <div className="acct-two">
              <Field label="What you did" value={j.title} onChange={(e) => setRow("jobs", i, { title: e.target.value })} placeholder="Teacher" autoFocus={i === 0} />
              <Field label="Where" value={j.place} onChange={(e) => setRow("jobs", i, { place: e.target.value })} placeholder="The bakery" />
            </div>
            <div className="acct-two">
              <Field label="From" value={j.from} onChange={(e) => setRow("jobs", i, { from: e.target.value })} inputMode="numeric" maxLength={4} placeholder="1961" />
              <Field label="To" value={j.to} onChange={(e) => setRow("jobs", i, { to: e.target.value })} inputMode="numeric" maxLength={4} placeholder="1975" />
            </div>
          </div>
        ))}
      {(shape.kind === "schools" || shape.kind === "jobs") && <p className="meta acct-gap-3">Leave a name empty to take that one off.</p>}
      <div className="acct-acts">
        <Button type="submit" small loading={busy}>
          Save
        </Button>
        {shape.kind === "schools" && (
          <Button variant="quiet" small onClick={() => set({ schools: [...(d.schools || []), { level: "secondary", name: "", years: "", kind: "" }] })} disabled={busy}>
            Add another school
          </Button>
        )}
        {shape.kind === "jobs" && (
          <Button variant="quiet" small onClick={() => set({ jobs: [...(d.jobs || []), { title: "", place: "", from: "", to: "" }] })} disabled={busy}>
            Add another job
          </Button>
        )}
        <Button variant="quiet" small onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
      {error && (
        <p className="meta acct-note bad" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/**
 * Your life, as your page shows it (lifeLedger): born, grew up, school and work, each opening the same editor the
 * person page's facts use (personFacts factDraft and factPatch), saved to your row in the tree, so what you add here
 * is on your page and in the book at once (EditProfileScreen, FB-401).
 */
function LifeFacts({ me, userId }: { me: Person; userId: string }) {
  const { account, family, stories, reload } = useAccount();
  const [open, setOpen] = useState<LifeKey | null>(null);
  const [note, setNote] = useState<Note>(null);
  const ownStory = me.storyId ? stories.find((s) => s.id === me.storyId) || null : null;
  const dates = lifeDates(me, ownStory);
  const ledger = lifeLedger(me, dates) as { key: string; value: string }[];
  const valueOf = (key: LifeKey) => ledger.find((r) => r.key === key)?.value || "";

  const save = async (key: LifeKey, draft: Draft): Promise<string | null> => {
    const res = factPatch(key, draft) as { patch?: Record<string, unknown>; error?: string };
    if (res.error || !res.patch) return res.error || "Nothing to save.";
    try {
      const householdId = me.householdId || (await householdFor(userId, account ?? null, family));
      await savePerson({ ...me, ...res.patch } as Person, householdId);
      await reload();
      setOpen(null);
      setNote({ ok: `${(editorShape(key) as { title: string }).title} saved. It’s on your page.` });
      return null;
    } catch (err) {
      return `That didn’t save (${(err as Error)?.message || "no connection"}). Try again in a moment.`;
    }
  };

  return (
    <div className="acct-prof-part">
      <h2 className="acct-sub">Your life</h2>
      <p className="acct-lead">A few facts for your page and the book. Leave out anything you like.</p>
      <ul className="acct-life">
        {LIFE_LINES.map((l) => {
          const v = valueOf(l.key);
          return (
            <li key={l.key}>
              {open === l.key ? (
                <FactEditor factKey={l.key} initial={factDraft(me, l.key, dates) as Draft} onSave={(d) => save(l.key, d)} onCancel={() => setOpen(null)} />
              ) : (
                <button
                  type="button"
                  className="acct-life-row"
                  onClick={() => {
                    setNote(null);
                    setOpen(l.key);
                  }}
                  aria-label={`${l.label}: ${v || "not given yet"}. ${v ? "Change it" : "Add it"}.`}
                >
                  <span className="acct-life-k">{l.label}</span>
                  {v ? <span className="acct-life-v">{v}</span> : <span className="acct-life-add">Add</span>}
                  <span className="acct-life-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="acct-acts acct-acts-top">
        <Link to={`/family/${me.id}`} className="acct-way acct-life-page">
          <strong>See your page as the family does</strong>
        </Link>
        <NoteLine note={note} />
      </div>
    </div>
  );
}

/** Who you are to the person whose story is open, read from the tree; changed only in the tree (EditProfileScreen). */
function Relation({ me, userId }: { me: Person | null; userId: string }) {
  const { family, activeStory } = useAccount();
  const teller = storytellerOf(family, activeStory);
  const toTeller = me && teller && family ? relationTo(buildIndex(family) as Index, me.id, teller.id) : "";
  const row = relationRow({ me, teller, story: activeStory, userId, toTeller });
  if (!row) return null;
  return (
    <div className="acct-prof-part">
      {row.kind === "row" ? (
        <>
          <h2 className="acct-sub">{row.title}</h2>
          <p className="acct-value acct-relation">{row.value}</p>
          <Link to="/family" className="acct-way">
            <strong>{row.action}</strong>
          </Link>
        </>
      ) : (
        <>
          <h2 className="acct-sub">Your place in the family</h2>
          <p className="acct-lead">Once you are in the tree, your page and the facts of your life can be filled in here.</p>
          <Link to="/family" className="acct-way">
            <strong>{row.label}</strong>
          </Link>
        </>
      )}
    </div>
  );
}

function Profile({ user, refresh, bookName }: { user: User; refresh: () => Promise<unknown>; bookName: string }) {
  const { account, family, reload } = useAccount();
  const me = meOf(family, user.id);
  // the face just chosen, shown on the plate before the account is read again (undefined: nothing chosen here)
  const [face, setFace] = useState<string | null | undefined>(undefined);
  const plateFace = face === undefined ? user.avatarUrl : face;
  const [first, setFirst] = useState(user.firstName);
  const [last, setLast] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const changed = first !== user.firstName || last !== user.lastName || phone !== user.phone;

  const save = async () => {
    setBusy(true);
    setNote(null);
    const r = await updateProfile(user.id, { firstName: first, lastName: last, phone });
    if (r.ok) {
      // the same name on your row in the tree, so Account, your page and the tree agree (the app's familyWithName)
      const given = first.trim();
      if (me && given && (me.givenName !== given || (me.familyName || "") !== last.trim())) {
        try {
          await savePerson({ ...me, givenName: given, familyName: last.trim() } as Person, me.householdId || (await householdFor(user.id, account ?? null, family)));
          await reload();
        } catch (err) {
          console.warn("Profile: tree name:", (err as Error)?.message || err);
        }
      }
      await refresh();
      setNote({ ok: "Saved." });
    } else setNote({ error: r.error });
    setBusy(false);
  };

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
  return (
    <section className="acct-sec acct-sec-profile" aria-labelledby="profile-h" id="profile" data-rise>
      {/* Ex Libris: the bookplate from the printed book, the person's name written on it (decoration D16) */}
      <div className="acct-exlibris">
        <img className="acct-plate" src="/book/bookplate.webp" alt="" aria-hidden="true" width={1130} height={1400} />
        <div className="acct-plate-words">
          <Avatar src={plateFace} name={name} size={56} className="acct-seal" />
          {/* the name written on the plate (the page’s one h1 is the hidden “Account” above the sections) */}
          <p className="acct-plate-name" id="profile-h" data-running="Your name">
            {name}
            <Stop />
          </p>
          {bookName && <p className="acct-plate-book">{bookName}</p>}
        </div>
      </div>
      <div className="acct-sec-body">
      <div className="acct-prof-part">
        <h2 className="acct-sub">Your picture</h2>
        <p className="acct-lead">Beside everything you add, and on your place in the family tree.</p>
        <PortraitUpload forProfile currentUrl={plateFace || me?.photo || null} onChange={setFace} />
      </div>
      <div className="acct-prof-part">
      <h2 className="acct-sub">Your name</h2>
      <p className="acct-lead">How the family sees you, in the book’s colophon and beside what you add.</p>
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="acct-two">
          <Field label="First name" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" />
          <Field label="Last name" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </div>
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" hint="Only the family sees it, and only if you let them." />
        <div className="acct-acts">
          <Button type="submit" small disabled={!changed} loading={busy}>
            Save
          </Button>
          {!changed && !note && <span className="acct-why">Change a field to save it.</span>}
          <NoteLine note={note} />
        </div>
      </form>
      </div>
      <Relation me={me} userId={user.id} />
      {me && <LifeFacts me={me} userId={user.id} />}
      </div>
    </section>
  );
}

/* ── Email, in two steps ─────────────────────────────────────────────── */

function Email({ user, refresh }: { user: User; refresh: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const start = async () => {
    setBusy(true);
    setNote(null);
    const r = await requestEmailChange(next);
    if (r.ok) {
      setSent(true);
      setNote({ ok: `We sent a ${CODE_LEN}-digit code to ${next.trim()}.` });
    } else setNote({ error: r.error });
    setBusy(false);
  };
  const finish = async () => {
    setBusy(true);
    setNote(null);
    const r = await confirmEmailChange(next, code);
    if (r.ok) {
      await refresh();
      setOpen(false);
      setSent(false);
      setCode("");
      setNote({ ok: "Your email is changed." });
    } else setNote({ error: r.error });
    setBusy(false);
  };

  return (
    <Part title="Email" lead="Where your sign-in codes and the Sunday email go." id="email">
      <p className="acct-value">
        <MailIcon /> {user.email}
      </p>
      {!open ? (
        <div className="acct-acts">
          <Button variant="outline" small onClick={() => setOpen(true)}>
            Change email
          </Button>
          <NoteLine note={note} />
        </div>
      ) : !sent ? (
        <form
          className="acct-form"
          onSubmit={(e) => {
            e.preventDefault();
            void start();
          }}
        >
          <Field label="New email" type="email" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="email" required />
          <div className="acct-acts">
            <Button type="submit" small loading={busy} disabled={!next.includes("@")}>
              Send a code
            </Button>
            <Button variant="quiet" small onClick={() => setOpen(false)}>
              Keep it
            </Button>
            {!next.includes("@") && !note && <span className="acct-why">Type the new address first.</span>}
            <NoteLine note={note} />
          </div>
        </form>
      ) : (
        <form
          className="acct-form"
          onSubmit={(e) => {
            e.preventDefault();
            void finish();
          }}
        >
          <p className="meta acct-gap-3">Type the code from the email to {next.trim()}.</p>
          <CodeInput value={code} onChange={setCode} length={CODE_LEN} autoFocus />
          <div className="acct-acts acct-acts-top">
            <Button type="submit" small loading={busy} disabled={code.length < CODE_LEN}>
              Confirm
            </Button>
            <Button variant="quiet" small onClick={() => void start()} disabled={busy}>
              Send another
            </Button>
            <NoteLine note={note} />
          </div>
        </form>
      )}
    </Part>
  );
}

/* ── Password ────────────────────────────────────────────────────────── */

function Password() {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [touched, setTouched] = useState(false);
  // Supabase can ask for an emailed code before a password changes; once it has, the code field stays
  const [asked, setAsked] = useState(false);
  const [code, setCode] = useState("");
  // said once the second field has been left, never on the first keystroke
  const mismatch = touched && again.length > 0 && again !== pw;
  const ready = pw.length >= MIN_PASSWORD && pw === again && (!asked || code.length === CODE_LEN);

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    setNote(null);
    const r = await changePassword(pw, asked ? code : undefined);
    if (r.ok) {
      setPw("");
      setAgain("");
      setTouched(false);
      setAsked(false);
      setCode("");
      setNote({ ok: "Your password is changed." });
    } else if (r.needsCode) {
      // the first ask is news, not a mistake; a wrong code is
      setNote(asked ? { error: r.error } : { ok: r.error });
      setAsked(true);
      setCode("");
    } else setNote({ error: r.error });
    setBusy(false);
  };

  const resend = async () => {
    setBusy(true);
    setNote(null);
    const r = await sendPasswordChangeCode();
    setNote(r.ok ? { ok: "We sent another code. It may take a minute." } : { error: r.error });
    setCode("");
    setBusy(false);
  };

  return (
    <Part title="Password" lead="For signing in on a new computer or phone." id="password">
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="New password" type={shown ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" reveal={{ shown, toggle: () => setShown((s) => !s) }} hint={`At least ${MIN_PASSWORD} characters.`} />
        <Field label="Once more" type={shown ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} onBlur={() => setTouched(true)} autoComplete="new-password" error={mismatch ? "These don’t match yet." : null} />
        {asked && (
          <>
            <p className="meta acct-gap-3">Type the code from the email.</p>
            <CodeInput value={code} onChange={setCode} length={CODE_LEN} autoFocus />
          </>
        )}
        <div className="acct-acts">
          <Button type="submit" small loading={busy} disabled={!ready}>
            Change password
          </Button>
          {asked && (
            <Button variant="quiet" small onClick={() => void resend()} disabled={busy}>
              Send another code
            </Button>
          )}
          {!ready && !note && <span className="acct-why">{pw.length < MIN_PASSWORD ? `Type at least ${MIN_PASSWORD} characters, then the same again.` : pw !== again ? "Type the same password again." : "Type the code from the email."}</span>}
          <NoteLine note={note} />
        </div>
      </form>
    </Part>
  );
}

/* ── Storytellers ────────────────────────────────────────────────────── */

function Storytellers({ stories, active, chooseStory, meId }: { stories: Story[]; active: Story | null; chooseStory: (id: string) => Promise<void>; meId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const pick = async (id: string) => {
    setBusy(id);
    setNote(null);
    try {
      await chooseStory(id);
    } catch (err) {
      setNote({ error: (err as Error).message || "Couldn’t switch just now." });
    }
    setBusy(null);
  };
  const { family } = useAccount();
  const groups = storyGroups(stories, meId, myStoryIds(family, meId));
  return (
    <Section title="Whose stories" lead="The four places are about the story that is chosen. There are three ways to be in one, and nobody ever signs as somebody else." id="storytellers">
      {groups.length === 0 && <p className="acct-empty">No stories yet.</p>}
      {groups.map((g) => (
        <div key={g.key} className="acct-group">
          <h3>{g.title}</h3>
          <p className="acct-group-meaning">{g.meaning}</p>
          <ul className="acct-people">
            {g.stories.map((s) => {
              const on = s.id === active?.id;
              return (
                <li key={s.id} className={on ? "on" : undefined} aria-current={on ? "true" : undefined}>
                  <Avatar name={`${s.name} ${s.lastName}`.trim()} size={44} className="acct-seal" />
                  <span className="acct-who">
                    <strong>{`${s.name} ${s.lastName}`.trim()}</strong>
                    <span>
                      {whoseWords(s, g.key, storyLine(s).split(" · ").slice(1).join(" · ") || "a story you keep")} · {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}
                    </span>
                  </span>
                  {on ? (
                    <span className="acct-chosen">Chosen</span>
                  ) : (
                    <Button variant="outline" small onClick={() => pick(s.id)} loading={busy === s.id} disabled={!!busy && busy !== s.id}>
                      Switch to {s.name}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <NoteLine note={note} />
      <div className="acct-ways">
        <Link to="/start?another=1" className="acct-way">
          <strong>Keep someone else’s story</strong>
          <span>For someone who isn’t on A Story yet. You keep it for them, as they tell it.</span>
        </Link>
        <Link to="/start?another=1&join=1" className="acct-way">
          <strong>Join someone’s story</strong>
          <span>Someone who already has an account. You add what you remember, under your own name.</span>
        </Link>
      </div>
    </Section>
  );
}

/* ── Plan ────────────────────────────────────────────────────────────── */

function PlanCard({ user }: { user: User }) {
  const ends = user.subscriptionCancelAt ? new Date(user.subscriptionCancelAt) : null;
  return (
    <Section title="Your plan" lead="Writing, reading and the family are free on every plan." id="plan">
      <p className="acct-plan">
        <b>{user.plan === "complimentary" ? "Full access, through an access code." : PLAN_LABELS[user.plan]}</b>
        {user.plan === "free" && <span className="meta">Three guided questions a day, unlimited writing, the whole family, and the book to print at home.</span>}
      </p>
      {ends && !Number.isNaN(ends.getTime()) && (
        <p className="meta acct-gap-4">
          Your plan ends on {ends.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}, then the account returns to Free. The app is yours. It does not stop being yours.
        </p>
      )}
      <div className="acct-acts">
        <ButtonLink to="/plans" variant="outline" small>
          Compare the plans
        </ButtonLink>
      </div>
    </Section>
  );
}

/* ── Privacy ─────────────────────────────────────────────────────────── */

function Privacy({ user, refresh }: { user: User; refresh: () => Promise<unknown> }) {
  const [busy, setBusy] = useState<keyof Settings | null>(null);
  const [note, setNote] = useState<Note>(null);
  const set = async (key: "shareUsage" | "weeklyDigest", value: boolean) => {
    setBusy(key);
    setNote(null);
    const r = await updateSettings(user.id, { [key]: value });
    if (r.ok) await refresh();
    else setNote({ error: r.error });
    setBusy(null);
  };
  return (
    <Section title="Privacy" lead="What leaves this account, and when." id="privacy">
      <div className="acct-switches">
        <Switch on={user.settings.shareUsage} label="Help improve A Story" hint="Counts and taps, never a word anybody said." onChange={(v) => set("shareUsage", v)} busy={busy === "shareUsage"} />
        <Switch on={user.settings.weeklyDigest} label="The Sunday email" hint="What the family added this week, once a week." onChange={(v) => set("weeklyDigest", v)} busy={busy === "weeklyDigest"} />
      </div>
      <NoteLine note={note} />
    </Section>
  );
}


/* ── The wall ────────────────────────────────────────────────────────── */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const WALL_BASE = (import.meta.env.VITE_PUBLIC_BASE as string | undefined) || window.location.origin;

/** One story's wall: the page anyone with the link can read (get_public_story shows only what is public). */
function WallSwitch({ story }: { story: Story }) {
  const { updateStory } = useAccount();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [copied, setCopied] = useState(false);
  const own = story.relationship === "Myself";
  const url = story.publicSlug ? `${WALL_BASE}/p/${story.publicSlug}` : "";
  const shown = story.memories.filter((m) => m.privacy !== "private" && m.status !== "in_progress").length;

  const flip = async (on: boolean) => {
    setBusy(true);
    setNote(null);
    const slug = story.publicSlug || `${slugify(`${story.name} ${story.lastName}`.trim()) || "story"}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      await updateStory({ ...story, isPublic: on, publicSlug: slug });
      setNote({ ok: on ? "The wall is on. Anyone with the link can read what is public." : "The wall is off. The link shows nothing now." });
    } catch (err) {
      setNote({ error: (err as Error)?.message || "That didn’t save." });
    }
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNote({ error: "Copy the link from the address below." });
    }
  };

  return (
    <div className="acct-wall">
      <Switch on={story.isPublic} label={own ? "Your wall" : `${story.name}’s wall`} hint={story.isPublic ? `${shown} of ${story.memories.length} ${story.memories.length === 1 ? "memory" : "memories"} shown. Private ones never are.` : "Off. Nobody can open the link."} onChange={flip} busy={busy} />
      {story.isPublic && url && (
        <div className="acct-wall-link">
          <a href={url} target="_blank" rel="noreferrer">
            {url.replace(/^https?:\/\//, "")}
          </a>
          <Button variant="outline" small icon={<LinkIcon />} onClick={copy}>
            {copied ? "Copied" : "Copy the link"}
          </Button>
        </div>
      )}
      <NoteLine note={note} />
    </div>
  );
}

function Walls({ meId }: { meId: string }) {
  const { stories, family } = useAccount();
  const mine = stories.filter((s) => !s.readOnly && storyGroupOf(s, meId, myStoryIds(family, meId)) !== "joined" && (s.memories.length > 0 || s.isPublic));
  if (!mine.length) return null;
  return (
    <Section title="The wall" lead="One page anyone with the link can read: the memories that are public, and what the family added. Turn it off any time." id="wall">
      <div className="acct-switches">
        {mine.map((s) => (
          <WallSwitch key={s.id} story={s} />
        ))}
      </div>
    </Section>
  );
}

/* ── Who looks after this if I can't ─────────────────────────────────── */

type Heir = { user_id: string | null; name: string | null; email: string | null; how: string | null };

function Trusted() {
  const [state, setState] = useState<"loading" | "hidden" | "ready">("loading");
  const [heir, setHeir] = useState<Heir | null>(null);
  const [mail, setMail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  useEffect(() => {
    let live = true;
    supabase()
      .rpc("my_letter_heir")
      .then(({ data, error }) => {
        if (!live) return;
        if (error && MISSING_FN.has(error.code)) return setState("hidden");
        const row = (Array.isArray(data) ? data[0] : data) as Heir | null;
        setHeir(row && (row.email || row.name) ? row : null);
        setState("ready");
      })
      .then(undefined, () => live && setState("hidden"));
    return () => {
      live = false;
    };
  }, []);

  if (state !== "ready") return null;

  const save = async () => {
    setBusy(true);
    setNote(null);
    const { error } = await supabase().rpc("set_trusted_person", { uid: null, mail: mail.trim().toLowerCase() });
    if (error) {
      setNote({ error: MISSING_FN.has(error.code) ? "This isn’t switched on for your account yet." : error.message });
    } else {
      setHeir({ user_id: null, name: null, email: mail.trim().toLowerCase(), how: "trusted" });
      setMail("");
      setNote({ ok: "Saved. They will only ever hear from us if they need to." });
    }
    setBusy(false);
  };

  const how = heir?.how === "trusted" ? "the person you chose" : heir?.how === "invited" ? "someone you invited to a story" : heir?.how === "family" ? "someone in your family tree" : "";

  return (
    <Section title="Who looks after this if I can’t" lead="Someone who would receive what you have written and the letters you have left, if you were no longer here." id="trusted">
      {heir ? (
        <p className="acct-value">
          <UserIcon /> {heir.name || heir.email}
          {heir.name && heir.email ? <span className="meta"> · {heir.email}</span> : null}
          {how && <span className="meta"> · {how}</span>}
        </p>
      ) : (
        <p className="meta acct-gap-3">Nobody is named yet.</p>
      )}
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label={heir ? "Choose someone else" : "Their email"} type="email" value={mail} onChange={(e) => setMail(e.target.value)} autoComplete="off" />
        <div className="acct-acts">
          <Button variant="outline" small type="submit" loading={busy} disabled={!mail.includes("@")}>
            {heir ? "Change" : "Name them"}
          </Button>
          {!mail.includes("@") && !note && <span className="acct-why">Type their email first.</span>}
          <NoteLine note={note} />
        </div>
      </form>
    </Section>
  );
}

/* ── Export ──────────────────────────────────────────────────────────── */

function Export({ stories }: { stories: Story[] }) {
  const withPages = stories.filter((s) => s.memories.length > 0);
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const chosen = withPages.find((s) => s.id === pick) ?? withPages[0] ?? null;
  const run = async () => {
    if (!chosen) return;
    setBusy(true);
    setNote(null);
    track("export_requested", { memories: chosen.memories.length, kind: "pdf" });
    try {
      // The print builder carries the book's fonts; only fetched when somebody asks for the file.
      const { printAtHome } = await import("../components/book/printBook");
      await printAtHome(chosen);
      setNote({ ok: "The book opened in a new window. Choose “Save as PDF” there." });
    } catch (err) {
      setNote({ error: (err as Error).message || "The book couldn’t be made just now. Please try again." });
    }
    setBusy(false);
  };
  return (
    <Section title="A copy of everything" lead="The whole book as it would print, with every photograph, to print or to keep as a PDF." id="export">
      {withPages.length === 0 ? (
        <p className="acct-empty">Nothing to copy yet. The first memory makes the first page.</p>
      ) : (
        <>
          {withPages.length > 1 && (
            <div className="acct-pick" role="radiogroup" aria-label="Whose book">
              {withPages.map((s) => (
                <label key={s.id} className={`acct-pick-row${chosen?.id === s.id ? " on" : ""}`}>
                  <input type="radio" name="export-story" checked={chosen?.id === s.id} onChange={() => setPick(s.id)} />
                  <span className="acct-pick-dot" aria-hidden="true" />
                  <strong>{storyLine(s)}</strong>
                  <span className="acct-pick-n">
                    {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="acct-acts">
            <Button variant="outline" small icon={<PrintIcon />} onClick={run} loading={busy}>
              {withPages.length > 1 && chosen ? `Print or save ${chosen.name}’s book` : "Print or save as a PDF"}
            </Button>
            <NoteLine note={note} />
          </div>
        </>
      )}
    </Section>
  );
}

/* ── Delete ──────────────────────────────────────────────────────────── */

type Handoff = { story: Story; to: string | null };

async function whoInherits(owned: Story[]): Promise<Handoff[]> {
  if (!owned.length) return [];
  const ids = owned.map((s) => s.id);
  const { data, error } = await supabase().from("story_managers").select("story_id, invited_email, user_id, status, created_at").in("story_id", ids).eq("status", "active").order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data || []) as { story_id: string; invited_email: string | null; user_id: string | null; created_at: string }[];
  const firstFor = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!firstFor.has(r.story_id)) firstFor.set(r.story_id, r);

  // A name for each inheritor where the database lets us read one; the email otherwise.
  const userIds = [...new Set([...firstFor.values()].map((r) => r.user_id).filter((x): x is string => !!x))];
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase().from("profiles").select("id, first_name, last_name").in("id", userIds);
    for (const p of (profiles || []) as { id: string; first_name: string | null; last_name: string | null }[]) {
      const n = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      if (n) names.set(p.id, n);
    }
  }
  return owned.map((story) => {
    const r = firstFor.get(story.id);
    if (!r) return { story, to: null };
    const name = r.user_id ? names.get(r.user_id) : null;
    const email = r.invited_email || "";
    return { story, to: name ? (email ? `${name} (${email})` : name) : email || "another keeper" };
  });
}

function Delete({ user, stories, afterDelete }: { user: User; stories: Story[]; afterDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState<Handoff[] | null>(null);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const begin = async () => {
    setOpen(true);
    setNote(null);
    try {
      setHandoff(await whoInherits(stories.filter((s) => s.ownerId === user.id)));
    } catch (err) {
      setNote({ error: `We couldn’t check who keeps each story: ${(err as Error).message}` });
    }
  };

  const remove = async () => {
    setBusy(true);
    setNote(null);
    const { data, error } = await supabase().functions.invoke("delete-account");
    const failed = error || (data && typeof data === "object" && "error" in data && (data as { error?: string }).error);
    if (failed) {
      setNote({ error: `The account wasn’t deleted: ${error?.message || (data as { error?: string })?.error || "please try again."}` });
      setBusy(false);
      return;
    }
    await afterDelete();
  };

  const passing = handoff?.filter((h) => h.to) ?? [];
  const gone = handoff?.filter((h) => !h.to) ?? [];
  const kept = stories.filter((s) => s.ownerId !== user.id);

  return (
    <Section title="Delete this account" lead="Each story you keep passes to the person who has kept it with you longest. You see who before anything is deleted." id="delete" tone="danger">
      {!open ? (
        <div className="acct-acts">
          <Button variant="quiet" small className="danger-text" onClick={begin}>
            Delete my account…
          </Button>
        </div>
      ) : (
        <div className="acct-delete" role="group" aria-label="Confirm deleting the account">
          {handoff === null && !note?.error ? (
            <p className="meta">Checking who keeps each story…</p>
          ) : (
            <>
              {passing.map((h) => (
                <p key={h.story.id}>
                  <b>{h.story.name}’s story</b> passes to <b>{h.to}</b>, who has kept it longest. Nothing in it is lost.
                </p>
              ))}
              {gone.map((h) => (
                <p key={h.story.id}>
                  <b>{h.story.name}’s story</b> ({h.story.memories.length} {h.story.memories.length === 1 ? "memory" : "memories"}) has nobody else keeping it and is deleted with the account. Print it first if you want a copy.
                </p>
              ))}
              {kept.length > 0 && <p className="meta">{kept.map((s) => `${s.name}’s story`).join(", ")} belong to someone else and stay as they are.</p>}
              {handoff !== null && handoff.length === 0 && kept.length === 0 && <p className="meta">This account keeps no stories.</p>}
            </>
          )}
          <label className="check-row">
            <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />
            <span>I understand. Delete the account and sign me out everywhere.</span>
          </label>
          <div className="acct-acts">
            <Button className="danger" small onClick={remove} disabled={!sure || handoff === null} loading={busy}>
              Delete my account
            </Button>
            <Button variant="quiet" small onClick={() => setOpen(false)} disabled={busy}>
              Keep it
            </Button>
          </div>
          <NoteLine note={note} />
        </div>
      )}
    </Section>
  );
}

/* ── The index beside the page ───────────────────────────────────────── */

const INDEX: { group: string; items: [string, string][] }[] = [
  { group: "You", items: [["profile", "Your name"], ["signing", "Signing in"]] },
  { group: "The stories", items: [["storytellers", "Whose stories"], ["wall", "The wall"], ["export", "A copy of everything"]] },
  { group: "Plan and privacy", items: [["plan", "Your plan"], ["privacy", "Privacy"]] },
  { group: "If you can’t", items: [["trusted", "Who looks after this"], ["delete", "Delete the account"]] },
];

/**
 * The sections actually on the page (the wall and the keeper appear only when they apply), and the one being
 * read: the last whose heading has passed a line a third of the way down the window. Only a marker moves; no
 * section is ever hidden for it.
 */
function useIndex(root: React.RefObject<HTMLElement | null>, ready: boolean) {
  const [present, setPresent] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>("profile");
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () => {
      const ids = [...el.querySelectorAll<HTMLElement>(".acct-sec[id]")].map((s) => s.id);
      setPresent((prev) => (prev.join() === ids.join() ? prev : ids));
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [root, ready]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const onScroll = () => {
      const line = window.innerHeight * 0.34;
      let at = present[0] || "profile";
      for (const id of present) {
        const s = document.getElementById(id);
        if (s && s.getBoundingClientRect().top <= line) at = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && present.length) at = present[present.length - 1];
      setCurrent(at);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root, present, ready]);
  return { present, current, setCurrent };
}

/* ── The page ────────────────────────────────────────────────────────── */

export default function Account() {
  const { user, refresh, signOut } = useAuth();
  const { account, stories, activeStory, chooseStory, loadError, reload } = useAccount();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const { present, current, setCurrent } = useIndex(pageRef, !!user && account !== undefined);

  if (user === undefined || account === undefined)
    return (
      <Shell bare wide title="Account">
        {/* the index column, the bookplate beside its lines, and three ruled sections, in hairlines, while the account arrives */}
        <div className="page acct-page bka-skel acct-skel" data-busy="true">
          <div className="bka-sk-col acct-skel-index" aria-hidden="true">
            <i className="bka-sk-label" />
            <i className="bka-sk-line nav w70" />
            <i className="bka-sk-line nav w50" />
            <i className="bka-sk-label" />
            <i className="bka-sk-line nav w70" />
            <i className="bka-sk-line nav w50" />
          </div>
          <div className="acct-body">
            <i className="bka-sk-line acct-skel-jump" />
            <div className="acct-sec acct-sec-profile">
              {/* the heart draws inside the bookplate's outline; the hairlines around it are empty, so only its status is read */}
              <div className="acct-exlibris bka-sk-block">
                <LoadingMark />
              </div>
              <div className="acct-sec-body bka-sk-col">
                <i className="bka-sk-line tall w50" />
                <i className="bka-sk-line w85" />
                <i className="bka-sk-line" />
                <i className="bka-sk-line w70" />
              </div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="acct-sec">
                <i className="bka-sk-line w70" />
                <div className="bka-sk-col">
                  <i className="bka-sk-line" />
                  <i className="bka-sk-line w85" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    );
  if (!user) return null; // RequireAuth sends them to sign in

  const bookName = activeStory ? (activeStory.lastName ? `The ${activeStory.lastName} book` : `${activeStory.name}’s book`) : "";
  const leave = async () => {
    setLeaving(true);
    await signOut();
    navigate("/welcome", { replace: true });
  };
  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setCurrent(id);
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <Shell bare wide title="Account">
      <div className="page acct-page" ref={pageRef}>
        <aside className="acct-index" aria-label="Account">
          <nav className="acct-nav" aria-label="Settings">
            {INDEX.map((g) => {
              const items = g.items.filter(([id]) => present.includes(id));
              if (!items.length) return null;
              return (
                <div key={g.group} className="acct-nav-group">
                  <p>{g.group}</p>
                  <ul>
                    {items.map(([id, label]) => (
                      <li key={id}>
                        <a href={`#${id}`} onClick={(e) => jump(e, id)} aria-current={current === id ? "location" : undefined}>
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="acct-body">
          {/* a bare Shell shows no hero, so the page names itself here, for a screen reader */}
          <h1 className="sr-only">Account</h1>
          {loadError && <Problem message={loadError} onRetry={reload} />}
          {/* on a phone the index folds into one control at the top of the page */}
          <label className="acct-jump">
            <span>Go to</span>
            <select
              value={current}
              onChange={(e) => {
                const id = e.target.value;
                setCurrent(id);
                document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
              }}
            >
              {INDEX.flatMap((g) => g.items)
                .filter(([id]) => present.includes(id))
                .map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <Profile user={user} refresh={refresh} bookName={bookName} />
          <Section title="Signing in" lead="Your email, your password, and this browser." id="signing">
            <div className="acct-parts">
              <Email user={user} refresh={refresh} />
              <Password />
              <Part title="Sign out" lead="Only this browser. Your stories stay exactly as they are." id="signout">
                <div className="acct-acts">
                  <Button variant="outline" small onClick={leave} loading={leaving}>
                    Sign out of this browser
                  </Button>
                </div>
              </Part>
            </div>
          </Section>
          <Storytellers stories={stories} active={activeStory} chooseStory={chooseStory} meId={user.id} />
          <Pair>
            <Walls meId={user.id} />
            <Export stories={stories} />
          </Pair>
          <Pair>
            <PlanCard user={user} />
            <Privacy user={user} refresh={refresh} />
          </Pair>
          <Pair>
            <Trusted />
            <Delete
              user={user}
              stories={stories}
              afterDelete={async () => {
                await signOut();
                navigate("/welcome", { replace: true });
              }}
            />
          </Pair>
          <WhereNext
            rows={[
              { to: "/book", title: "Open the book", line: "Every page, as it will print." },
              { to: "/family", title: "The family", line: "Who is in the book, and who is invited." },
              { to: "/", title: "Back to today", line: "Today’s question is waiting." },
            ]}
          />
        </div>
      </div>
    </Shell>
  );
}
