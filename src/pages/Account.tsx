/**
 * Account: the person, their storytellers, their plan, two privacy
 * switches, the password and the email, who looks after this if they
 * can't, a copy of everything, sign out, and deleting the account (which
 * names who inherits each story first, docs/PORTING-MANIFEST.md §1.8).
 * Everything that can fail says so beside the thing that failed.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, ButtonLink, CodeInput, Field, Problem } from "../components/ui";
import { ChevronRight, LinkIcon, LockIcon, MailIcon, PrintIcon, UserIcon } from "../components/icons";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { changePassword, confirmEmailChange, requestEmailChange, updateProfile, updateSettings, CODE_LEN, MIN_PASSWORD, type Settings, type User } from "../data/auth";
import { PLAN_LABELS } from "../lib/plan";
import { supabase } from "../lib/supabase";
import { track } from "../lib/analytics";
import { storyLine } from "../lib/storyLine";
import type { Story } from "../data/stories";

type Note = { ok?: string; error?: string } | null;

/** A function the database does not have yet (an older deploy). */
const MISSING_FN = new Set(["PGRST202", "42883"]);

function Section({ title, lead, children, id }: { title: string; lead?: string; children: ReactNode; id?: string }) {
  return (
    <section className="card pad acct" aria-labelledby={id ? `${id}-h` : undefined} id={id}>
      <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
      {lead && <p className="meta acct-lead">{lead}</p>}
      {children}
    </section>
  );
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

function Profile({ user, refresh }: { user: User; refresh: () => Promise<unknown> }) {
  const [first, setFirst] = useState(user.firstName);
  const [last, setLast] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const changed = first !== user.firstName || last !== user.lastName || phone !== user.phone;
  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const save = async () => {
    setBusy(true);
    setNote(null);
    const r = await updateProfile(user.id, { firstName: first, lastName: last, phone });
    if (r.ok) {
      await refresh();
      setNote({ ok: "Saved." });
    } else setNote({ error: r.error });
    setBusy(false);
  };

  return (
    <Section title="You" id="profile">
      <div className="acct-person">
        <Avatar src={user.avatarUrl} name={name} size={72} />
        <div>
          <strong className="acct-name">{name}</strong>
          <span className="meta">{user.email}</span>
        </div>
      </div>
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="acct-two">
          <Field label="First name" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" icon={<UserIcon />} />
          <Field label="Last name" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
        </div>
        <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" hint="Only the family sees it, and only if you let them." />
        <div className="acct-acts">
          <Button type="submit" small disabled={!changed} loading={busy}>
            Save
          </Button>
          <NoteLine note={note} />
        </div>
      </form>
    </Section>
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
    <Section title="Email" id="email">
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
          <Field label="New email" type="email" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="email" icon={<MailIcon />} required />
          <div className="acct-acts">
            <Button type="submit" small loading={busy} disabled={!next.includes("@")}>
              Send a code
            </Button>
            <Button variant="quiet" small onClick={() => setOpen(false)}>
              Keep it
            </Button>
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
          <p className="meta" style={{ marginBottom: "var(--s-3)" }}>Type the code from the email to {next.trim()}.</p>
          <CodeInput value={code} onChange={setCode} length={CODE_LEN} autoFocus />
          <div className="acct-acts" style={{ marginTop: "var(--s-4)" }}>
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
    </Section>
  );
}

/* ── Password ────────────────────────────────────────────────────────── */

function Password() {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const mismatch = again.length > 0 && again !== pw;

  const save = async () => {
    if (pw.length < MIN_PASSWORD || pw !== again) return;
    setBusy(true);
    setNote(null);
    const r = await changePassword(pw);
    if (r.ok) {
      setPw("");
      setAgain("");
      setNote({ ok: "Your password is changed." });
    } else setNote({ error: r.error });
    setBusy(false);
  };

  return (
    <Section title="Password" id="password">
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="New password" type={shown ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" icon={<LockIcon />} reveal={{ shown, toggle: () => setShown((s) => !s) }} hint={`At least ${MIN_PASSWORD} characters.`} />
        <Field label="Once more" type={shown ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" error={mismatch ? "These don't match yet." : null} />
        <div className="acct-acts">
          <Button type="submit" small loading={busy} disabled={pw.length < MIN_PASSWORD || pw !== again}>
            Change password
          </Button>
          <NoteLine note={note} />
        </div>
      </form>
    </Section>
  );
}

/* ── Storytellers ────────────────────────────────────────────────────── */

function Storytellers({ stories, active, chooseStory }: { stories: Story[]; active: Story | null; chooseStory: (id: string) => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const pick = async (id: string) => {
    setBusy(id);
    setNote(null);
    try {
      await chooseStory(id);
    } catch (err) {
      setNote({ error: (err as Error).message || "Couldn't switch just now." });
    }
    setBusy(null);
  };
  return (
    <Section title="Your storytellers" lead="Whose stories this account keeps. The four places are about the one that is chosen." id="storytellers">
      <ul className="acct-list">
        {stories.map((s) => {
          const on = s.id === active?.id;
          return (
            <li key={s.id} className="person" aria-current={on ? "true" : undefined}>
              <Avatar name={s.name} size={52} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{storyLine(s)}</strong>
                <span className="meta">
                  {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}
                  {on ? " · chosen" : ""}
                </span>
              </span>
              {on ? (
                <Link to="/" className="btn quiet sm">
                  Open <ChevronRight />
                </Link>
              ) : (
                <Button variant="outline" small onClick={() => pick(s.id)} loading={busy === s.id}>
                  Switch
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <NoteLine note={note} />
      <div className="acct-acts">
        <ButtonLink to="/start?another=1" variant="outline" small>
          Keep someone else's story
        </ButtonLink>
      </div>
    </Section>
  );
}

/* ── Plan ────────────────────────────────────────────────────────────── */

function PlanCard({ user }: { user: User }) {
  const ends = user.subscriptionCancelAt ? new Date(user.subscriptionCancelAt) : null;
  return (
    <Section title="Your plan" id="plan">
      <p className="acct-plan">
        <b>{PLAN_LABELS[user.plan]}</b>
        {user.plan === "free" && <span className="meta">Three guided questions a day, unlimited writing, the whole family, print at home free.</span>}
        {user.plan === "complimentary" && <span className="meta">Full access through an access code.</span>}
      </p>
      {ends && !Number.isNaN(ends.getTime()) && (
        <p className="meta" style={{ marginBottom: "var(--s-4)" }}>
          Your plan ends on {ends.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}, then the account returns to Free. The app is yours. It does not stop being yours.
        </p>
      )}
      <div className="acct-acts">
        <ButtonLink to="/plans" variant={user.plan === "free" ? "primary" : "outline"} small>
          See plans
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
    <Section title="Privacy" id="privacy">
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
      setNote({ error: (err as Error)?.message || "That didn't save." });
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
      <Switch on={story.isPublic} label={own ? "Your wall" : `${story.name}'s wall`} hint={story.isPublic ? `${shown} of ${story.memories.length} ${story.memories.length === 1 ? "memory" : "memories"} shown. Private ones never are.` : "Off. Nobody can open the link."} onChange={flip} busy={busy} />
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

function Walls() {
  const { stories } = useAccount();
  const mine = stories.filter((s) => s.memories.length > 0 || s.isPublic);
  if (!mine.length) return null;
  return (
    <Section title="The wall" lead="A page anyone with the link can read: the memories that are public, and what the family added. Send it to a cousin, put it in the family group. Turn it off any time." id="wall">
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
      setNote({ error: MISSING_FN.has(error.code) ? "This isn't switched on for your account yet." : error.message });
    } else {
      setHeir({ user_id: null, name: null, email: mail.trim().toLowerCase(), how: "trusted" });
      setMail("");
      setNote({ ok: "Saved. They will only ever hear from us if they need to." });
    }
    setBusy(false);
  };

  const how = heir?.how === "trusted" ? "the person you chose" : heir?.how === "invited" ? "someone you invited to a story" : heir?.how === "family" ? "someone in your family tree" : "";

  return (
    <Section title="Who looks after this if I can't" lead="Someone who would receive what you have written and the letters you have left, if you were no longer here." id="trusted">
      {heir ? (
        <p className="acct-value">
          <UserIcon /> {heir.name || heir.email}
          {heir.name && heir.email ? <span className="meta"> · {heir.email}</span> : null}
          {how && <span className="meta"> · {how}</span>}
        </p>
      ) : (
        <p className="meta" style={{ marginBottom: "var(--s-3)" }}>Nobody is named yet.</p>
      )}
      <form
        className="acct-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label={heir ? "Choose someone else" : "Their email"} type="email" value={mail} onChange={(e) => setMail(e.target.value)} icon={<MailIcon />} autoComplete="off" />
        <div className="acct-acts">
          <Button variant="outline" small type="submit" loading={busy} disabled={!mail.includes("@")}>
            {heir ? "Change" : "Name them"}
          </Button>
          <NoteLine note={note} />
        </div>
      </form>
    </Section>
  );
}

/* ── Export ──────────────────────────────────────────────────────────── */

function Export({ stories, recordedBy }: { stories: Story[]; recordedBy: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const run = async (s: Story) => {
    setBusy(s.id);
    setNote(null);
    track("export_requested", { memories: s.memories.length, kind: "pdf" });
    try {
      // The print builder carries the book's fonts; only fetched when somebody asks for the file.
      const { printAtHome } = await import("../components/book/printBook");
      await printAtHome(s, recordedBy);
    } catch (err) {
      setNote({ error: (err as Error).message });
    }
    setBusy(null);
  };
  return (
    <Section title="A copy of everything" lead="The whole book as it would print, with every photograph. Choose “Save as PDF” in the print dialog to keep a file." id="export">
      <ul className="acct-list plain">
        {stories.map((s) => (
          <li key={s.id} className="acct-row">
            <span>
              <strong>{storyLine(s)}</strong> <span className="meta">· {s.memories.length} {s.memories.length === 1 ? "memory" : "memories"}</span>
            </span>
            <Button variant="outline" small icon={<PrintIcon />} onClick={() => run(s)} loading={busy === s.id} disabled={!!busy && busy !== s.id}>
              Download everything as a PDF
            </Button>
          </li>
        ))}
      </ul>
      <NoteLine note={note} />
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
      setNote({ error: `We couldn't check who keeps each story: ${(err as Error).message}` });
    }
  };

  const remove = async () => {
    setBusy(true);
    setNote(null);
    const { data, error } = await supabase().functions.invoke("delete-account");
    const failed = error || (data && typeof data === "object" && "error" in data && (data as { error?: string }).error);
    if (failed) {
      setNote({ error: `The account wasn't deleted: ${error?.message || (data as { error?: string })?.error || "please try again."}` });
      setBusy(false);
      return;
    }
    await afterDelete();
  };

  const passing = handoff?.filter((h) => h.to) ?? [];
  const gone = handoff?.filter((h) => !h.to) ?? [];
  const kept = stories.filter((s) => s.ownerId !== user.id);

  return (
    <Section title="Delete this account" id="delete">
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
                  <b>{h.story.name}'s story</b> passes to <b>{h.to}</b>, who has kept it longest. Nothing in it is lost.
                </p>
              ))}
              {gone.map((h) => (
                <p key={h.story.id}>
                  <b>{h.story.name}'s story</b> ({h.story.memories.length} {h.story.memories.length === 1 ? "memory" : "memories"}) has nobody else keeping it and is deleted with the account. Print it first if you want a copy.
                </p>
              ))}
              {kept.length > 0 && <p className="meta">{kept.map((s) => `${s.name}'s story`).join(", ")} belong to someone else and stay as they are.</p>}
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

/* ── The page ────────────────────────────────────────────────────────── */

export default function Account() {
  const { user, refresh, signOut } = useAuth();
  const { account, stories, activeStory, chooseStory, loadError, reload } = useAccount();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  if (user === undefined || account === undefined) return <Shell compact title="Account"><div className="page" aria-busy="true" /></Shell>;
  if (!user) return null; // RequireAuth sends them to sign in

  const recordedBy = `${user.firstName} ${user.lastName}`.trim();
  const leave = async () => {
    setLeaving(true);
    await signOut();
    navigate("/welcome", { replace: true });
  };

  return (
    <Shell
      hero={
        <>
          <p className="label" data-rise>
            Account &amp; settings
          </p>
          <h1>{`${user.firstName} ${user.lastName}`.trim() || user.email}</h1>
          <div data-rise style={{ marginTop: "var(--s-5)", display: "flex", alignItems: "center", gap: "var(--s-5)", flexWrap: "wrap" }}>
            <span className="meta">{user.email}</span>
            <Button variant="outline" small onClick={leave} loading={leaving}>
              Sign out
            </Button>
          </div>
        </>
      }
    >
      <div className="page acct-page">
        {loadError && <Problem message={`We couldn't reach your stories. ${loadError}`} onRetry={reload} />}

        <div className="acct-grid">
          <div className="acct-col">
            <Profile user={user} refresh={refresh} />
            <Storytellers stories={stories} active={activeStory} chooseStory={chooseStory} />
            <PlanCard user={user} />
            <Privacy user={user} refresh={refresh} />
            <Walls />
          </div>
          <div className="acct-col">
            <Email user={user} refresh={refresh} />
            <Password />
            <Trusted />
            <Export stories={stories} recordedBy={recordedBy} />
            <Delete
              user={user}
              stories={stories}
              afterDelete={async () => {
                await signOut();
                navigate("/welcome", { replace: true });
              }}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}
