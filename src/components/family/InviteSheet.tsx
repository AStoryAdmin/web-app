/**
 * Adding somebody to the family, and the code that brings them in.
 *
 * One sheet: their name, what they are to the storyteller, an email if
 * you have it. Saving puts them in the tree (the app’s planRelative keeps
 * the shape right, placeholders and all), then shows the code, the link
 * and a QR to pass on. A code joins the FAMILY TREE: it never makes anyone
 * a keeper of the story (docs/PRODUCT-DECISIONS.md §6).
 *
 * Nobody is listed twice (docs/PRD.md §3.3a): an email already in the
 * household reuses that person instead of adding one, and a name already
 * there (not yet on A Story) asks "is this the same person?" first.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { findPersonByEmail, sameNamePeople, type Family, type Person } from "../../data/family";
import type { Account, Story } from "../../data/stories";
import { Button, Field } from "../ui";
import { CheckIcon, CloseIcon, LinkIcon, MailIcon, ShareIcon, UserIcon } from "../icons";
import { familyCodeFor, householdFor, invitePerson, newPerson, saveEdge, savePerson, sendInviteEmailDetailed, type EdgeKind, type EmailResult } from "../../data/familyWrites";
import { NEW_VIA, RELATIVE_GROUPS, planRelative, relativeKind } from "../../app-core/lib/familyTree.js";
import { inviteMessage, spacedCode } from "../../app-core/lib/familyCode.js";
import { uuid } from "../../lib/uuid";
import { track } from "../../lib/analytics";
import { joinUrl, linkState, personName, qrSvg, stateWords } from "./familyView";

type Need = { step: string; index: number; through: string; candidates: string[]; allowNew: boolean };
type Plan =
  | { need: Need }
  | { error: string }
  | { id: string; people: Person[]; edges: { from: string; to: string; kind: EdgeKind; label?: string }[]; updates: { id: string; patch: Partial<Person> }[] };

type PlanFn = (family: Family, anchorId: string, kind: string, o: { via: string[]; person: Person; newId: () => string; label: string }) => Plan;
const plan = planRelative as unknown as PlanFn;

type Done = { person: Person; code: string | null; codeError: string | null; emailed: boolean | null; emailReason: string | null; email: string; reused?: boolean };

/** One send, as the sheet records it: went, failed with a reason, or not asked for. */
const emailOutcome = (r: EmailResult | null) => ({ emailed: r ? r.ok : null, emailReason: r && !r.ok ? r.reason : null });

const STEP_WORD: Record<string, string> = { up: "Which parent?", down: "Which child?", spouse: "Which partner?", side: "Which brother or sister?" };

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      window.prompt("Copy this:", text);
    }
  };
  return { copied, copy };
}

/** The code large, the link, a QR, and the ways to pass them on. */
export function CodeCard({
  code,
  who,
  story,
  senderName,
  emailed,
  email,
  emailReason,
  focusFirst,
}: {
  code: string;
  who: string;
  story: Story;
  senderName: string;
  emailed?: boolean | null;
  email?: string;
  emailReason?: string | null;
  /** Shown in place of the button that asked for it: take the keyboard to its first Copy. */
  focusFirst?: boolean;
}) {
  const firstCopy = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusFirst) firstCopy.current?.focus();
  }, [focusFirst]);
  const link = joinUrl(code);
  const svg = useMemo(() => qrSvg(link), [link]);
  const { copied, copy } = useCopy();
  const message = inviteMessage({ code, link, senderName, storyName: story.name }) as string;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <div className="codecard">
      <p className="label">{who}’s family code</p>
      <div className="codebox">
        <div className="codebig" aria-label={`Family code ${[...code].join(" ")}`}>
          {spacedCode(code) as string}
        </div>
        <Button variant="outline" small ref={firstCopy} onClick={() => copy("code", code)} icon={copied === "code" ? <CheckIcon /> : undefined}>
          {copied === "code" ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="linkrow">
        <div className="input">
          <LinkIcon />
          <span className="url">{link.replace(/^https?:\/\//, "")}</span>
        </div>
        <Button variant="outline" small onClick={() => copy("link", link)}>
          {copied === "link" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="qrwrap">
        <div className="qr" role="img" aria-label={`QR code for ${who}’s link`} dangerouslySetInnerHTML={{ __html: svg }} />
        <div>
          <p className="strong">Or let them scan this</p>
          <p className="meta">Good for a phone across the table. They type the six letters into A Story, or open the link.</p>
          <div className="acts">
            {canShare && (
              <Button variant="quiet" small icon={<ShareIcon />} onClick={() => navigator.share({ text: message }).catch(() => {})}>
                Share…
              </Button>
            )}
            <Button variant="quiet" small onClick={() => copy("message", message)}>
              {copied === "message" ? "Copied" : "Copy the whole message"}
            </Button>
          </div>
        </div>
      </div>
      {emailed === true && email && (
        <p className="meta ok">
          <CheckIcon /> Sent to {email}.
        </p>
      )}
      {emailed === false && email && (
        <p className="meta invite-fail" role="alert">
          The email to {email} didn’t send: {emailReason || "no reason came back"}. The code still works: <b>{spacedCode(code) as string}</b>. Send it by text, or read it out.
        </p>
      )}
    </div>
  );
}

export default function InviteSheet({
  story,
  family,
  account,
  userId,
  senderName,
  anchor = null,
  presetKind = "",
  onClose,
  onSaved,
}: {
  story: Story;
  family: Family | null;
  account: Account | null;
  userId: string;
  senderName: string;
  /** Who the new person is related to; the storyteller when not given. */
  anchor?: Person | null;
  /** A relation already chosen (the tree’s "Add a parent"): a RELATIVE_KINDS key, still changeable. */
  presetKind?: string;
  onClose: () => void;
  /** Called after the rows have landed, before the code is shown (reload). */
  onSaved: () => Promise<void>;
}) {
  const [given, setGiven] = useState("");
  const [last, setLast] = useState(story.lastName || "");
  const [kindKey, setKindKey] = useState<string>(presetKind);
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [via, setVia] = useState<string[]>([]);
  const [need, setNeed] = useState<Need | null>(null);
  /** Somebody with this name is already listed: ask before making a second one. */
  const [twin, setTwin] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const relatedTo = anchor ? personName(anchor) : story.name;
  const peopleNow = family?.people || [];
  const nameOf = (id: string) => {
    const p = peopleNow.find((x) => x.id === id);
    return p ? personName(p).trim() || "someone not named yet" : "someone not named yet";
  };

  /**
   * Somebody already in the tree is the person being added: send them the
   * code (and record the email) instead of making a second row. Their place
   * and relations stay as they are.
   */
  const reuse = async (person: Person, mail: string) => {
    setBusy(true);
    setError(null);
    try {
      if (mail && !person.email) await invitePerson(person.id, mail);
      const code = person.userId ? ({ error: "already" } as const) : await familyCodeFor({ personId: person.id });
      let sent: EmailResult | null = null;
      if ("code" in code && mail) sent = await sendInviteEmailDetailed({ to: mail, code: code.code, storyName: story.name, senderName });
      track("invite_sent", { method: mail ? "email" : "code", relation: kindKey || "existing", reused: true });
      await onSaved();
      setTwin(null);
      setDone({ person, code: "code" in code ? code.code : null, codeError: "error" in code ? code.error : null, ...emailOutcome(sent), email: mail, reused: true });
    } catch (err) {
      setError(`That didn’t go (${(err as Error)?.message || "no connection"}). Nothing was lost; try again.`);
    } finally {
      setBusy(false);
    }
  };

  const save = async (viaNow: string[], addAnyway = false) => {
    setError(null);
    const first = given.trim();
    if (!first) return setError("Their first name, at least.");
    if (!kindKey) return setError(`How is ${first} related to ${relatedTo}?`);
    if (kindKey === "other" && !label.trim()) return setError(`What is ${first} to ${relatedTo}? A word or two.`);
    const mail = email.trim().toLowerCase();
    // Already listed under this email: never a second row (the database
    // would silently drop the email from the copy instead).
    const byMail = findPersonByEmail(family, mail);
    if (byMail) return reuse(byMail, mail);
    // Same name, not on A Story: ask once whether it is the same person.
    if (!addAnyway) {
      const same = sameNamePeople(family, first, last).find((p) => p.id !== anchor?.id);
      if (same) {
        setTwin(same);
        return;
      }
    }
    setBusy(true);
    try {
      const householdId = await householdFor(userId, account, family);
      let fam: Family = family ?? { people: [], edges: [], households: [] };
      let anchorId = anchor?.id || fam.people.find((p) => p.storyId === story.id)?.id;
      if (!anchorId) {
        // The storyteller has no place in the tree yet: make one, bound to the story.
        const teller = { ...newPerson({ givenName: story.name, familyName: story.lastName, birthYear: story.birthYear }), storyId: story.id } as Person;
        await savePerson(teller, householdId);
        fam = { ...fam, people: [...fam.people, teller] };
        anchorId = teller.id;
      }
      const person = newPerson({ givenName: first, familyName: last, email: email.trim() || undefined });
      const planned = plan(fam, anchorId, kindKey, { via: viaNow, person, newId: uuid, label: label.trim() });
      if ("need" in planned) {
        setNeed(planned.need);
        return;
      }
      if ("error" in planned) {
        setError(planned.error === "two-parents" ? `${relatedTo} already has two parents in the tree.` : "That relation didn’t fit. Try another.");
        return;
      }
      for (const p of planned.people) await savePerson(p, householdId);
      for (const u of planned.updates) {
        const old = fam.people.find((p) => p.id === u.id);
        await savePerson({ ...(old || {}), ...u.patch, id: u.id } as Person, householdId);
      }
      for (const e of planned.edges) await saveEdge(householdId, e.from, e.to, e.kind, e.label || "");
      const saved = (planned.people.find((p) => p.id === planned.id) || { ...person, id: planned.id }) as Person;

      if (mail) await invitePerson(planned.id, mail);
      const code = await familyCodeFor({ personId: planned.id });
      let sent: EmailResult | null = null;
      if ("code" in code && mail) sent = await sendInviteEmailDetailed({ to: mail, code: code.code, storyName: story.name, senderName });
      track("invite_sent", { method: mail ? "email" : "code", relation: kindKey });
      await onSaved();
      setDone({ person: saved, code: "code" in code ? code.code : null, codeError: "error" in code ? code.error : null, ...emailOutcome(sent), email: mail });
    } catch (err) {
      setError(`That didn’t save (${(err as Error)?.message || "no connection"}). Nothing was lost; try again.`);
    } finally {
      setBusy(false);
    }
  };

  const choose = (id: string) => {
    const next = [...via, id];
    setVia(next);
    setNeed(null);
    void save(next);
  };

  const groups = RELATIVE_GROUPS as { title: string; keys: string[] }[];
  const word = (key: string) => ((relativeKind(key) as { words: string[] } | null)?.words[0] || key).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetbox invite-sheet" role="dialog" aria-modal="true" aria-label="Invite someone" onClick={(e) => e.stopPropagation()}>
        <div className="sheethead">
          <h2>{done ? (done.reused ? `${done.person.givenName} was already in the family` : `${done.person.givenName} is in the family`) : twin ? "Is this the same person?" : need ? STEP_WORD[need.step] || "Through whom?" : "Who else was there?"}</h2>
          <button type="button" className="iconbtn soft" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {done ? (
          <>
            {done.reused && <p className="meta is-gap">We used the {done.person.givenName} who was already listed instead of adding a second one.</p>}
            {done.code ? (
              <CodeCard code={done.code} who={done.person.givenName} story={story} senderName={senderName} emailed={done.emailed} email={done.email} emailReason={done.emailReason} />
            ) : (
              <p className="meta">
                {done.codeError === "already"
                  ? `${done.person.givenName} is already on A Story, so no code is needed${done.email ? ", and no email was sent" : ""}.`
                  : done.codeError === "not_ready"
                    ? `Codes aren’t switched on for this family yet, so there was nothing to send${done.email ? ` to ${done.email}` : ""}. Try again later from their page.`
                    : `A code couldn’t be made just now${done.email ? `, so no email went to ${done.email}` : ""}. Open their page later and send one.`}
              </p>
            )}
            <div className="acts is-top5">
              <Button onClick={onClose}>Done</Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setDone(null);
                  setGiven("");
                  setEmail("");
                  setKindKey("");
                  setLabel("");
                  setVia([]);
                }}
              >
                Add someone else
              </Button>
            </div>
          </>
        ) : twin ? (
          <>
            <p className="meta is-gap">
              <b>{personName(twin)}</b> is already in the family, {stateWords(linkState(twin, userId).key) || "remembered"}. Adding again would list them twice.
            </p>
            <div className="acts">
              <Button loading={busy} onClick={() => void reuse(twin, email.trim().toLowerCase())}>
                {email.trim() ? `Yes, send the code to that ${twin.givenName}` : `Yes, that’s the same ${twin.givenName}`}
              </Button>
              <Button
                variant="quiet"
                disabled={busy}
                onClick={() => {
                  setTwin(null);
                  void save(via, true);
                }}
              >
                No, add another {given.trim()}
              </Button>
            </div>
            <Button variant="quiet" small className="is-top3 is-flush" disabled={busy} onClick={() => setTwin(null)}>
              Back
            </Button>
          </>
        ) : need ? (
          <>
            <p className="meta is-gap">
              {given.trim()} is {relatedTo}’s {word(kindKey).toLowerCase()}. Through whom?
            </p>
            <div className="choices">
              {need.candidates.map((id) => (
                <button key={id} type="button" className="chip big" onClick={() => choose(id)} disabled={busy}>
                  {nameOf(id)}
                </button>
              ))}
              {need.allowNew && (
                <button type="button" className="chip big" onClick={() => choose(NEW_VIA)} disabled={busy}>
                  Someone not in the tree yet
                </button>
              )}
            </div>
            <Button
              variant="quiet"
              className="is-top4"
              onClick={() => {
                setNeed(null);
                setVia([]);
              }}
            >
              Back
            </Button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(via);
            }}
          >
            <div className="two">
              <Field label="First name" icon={<UserIcon />} value={given} onChange={(e) => setGiven(e.target.value)} placeholder="Their name" autoFocus autoComplete="off" />
              <Field label="Last name" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Optional" autoComplete="off" />
            </div>
            <p className="field-label">
              How are they related to {relatedTo}?
            </p>
            {groups.map((g) => (
              <div key={g.title} className="relgroup">
                <p className="meta">{g.title}</p>
                <div className="chiprow">
                  {g.keys.map((k) => (
                    <button key={k} type="button" className="chip big" aria-pressed={kindKey === k} onClick={() => setKindKey(k)}>
                      {word(k)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {kindKey === "other" && <Field label={`What ${given.trim() || "they"} ${given.trim() ? "is" : "are"} to ${relatedTo}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Godmother, neighbour, oldest friend" />}
            <Field
              label="Email, if you have it"
              icon={<MailIcon />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="We’ll send them the code"
              hint="Without one, you’ll get a code and a link to pass on yourself."
              autoComplete="off"
            />
            {error && (
              <p className="meta bad is-gap" role="alert">
                {error}
              </p>
            )}
            <div className="acts">
              <Button type="submit" loading={busy}>
                {email.trim() ? "Add and send the code" : "Add to the family"}
              </Button>
              <Button variant="quiet" onClick={onClose}>
                Not now
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
