/**
 * Family: who is in it, who has arrived, add someone, review what they
 * sent. The tree on the left with everyone listed under it; on the right
 * the queue of what the family added, the invitation card, and (for the
 * story's owner) who may edit. A code joins the tree, never the keepers.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, Chip, Problem } from "../components/ui";
import { ChevronRight, PlusIcon } from "../components/icons";
import FamilyTree from "../components/family/FamilyTree";
import InviteSheet from "../components/family/InviteSheet";
import ReviewQueue from "../components/family/ReviewQueue";
import Keepers from "../components/family/Keepers";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { listMyCodes, removePerson, revokeCode, type MyCode } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { spacedCode } from "../app-core/lib/familyCode.js";
import { canEdit, expiresLabel, familyTitle, isOrganiser, personLine, personName, realPeople, statusChip, type Index } from "../components/family/familyView";
import type { Person } from "../data/family";

function PersonRow({ person, line, meId, manage, removable, onRemove }: { person: Person; line: string; meId: string | null | undefined; manage: boolean; removable: boolean; onRemove: () => Promise<void> }) {
  const photo = usePhotoUrl(person.photo);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const chip = statusChip(person, meId);
  return (
    <div className={`person${manage ? " managing" : ""}`}>
      <Link className="prow" to={`/family/${person.id}`}>
        <Avatar src={photo} name={person.givenName} size={52} />
        <span>
          <strong>{personName(person)}</strong>
          <span className="meta">{line}</span>
        </span>
        {chip && <Chip tone={chip.tone}>{chip.label}</Chip>}
        {!manage && <ChevronRight className="chev" width={22} height={22} />}
      </Link>
      {manage && removable && !ask && (
        <Button variant="quiet" small onClick={() => setAsk(true)}>
          Remove
        </Button>
      )}
      {manage && ask && (
        <span className="confirm">
          <span className="meta">Take {person.givenName} out of the tree?</span>
          <Button
            variant="accent"
            small
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await onRemove().finally(() => setBusy(false));
            }}
          >
            Remove
          </Button>
          <Button variant="quiet" small onClick={() => setAsk(false)}>
            Keep
          </Button>
        </span>
      )}
    </div>
  );
}

/** Codes this account has made that still open a place, with a way to take one back. */
function MyCodes({ people, version }: { people: Person[]; version: number }) {
  const [codes, setCodes] = useState<MyCode[] | null>(null);
  const [now, setNow] = useState(() => new Date(0));
  useEffect(() => {
    let live = true;
    listMyCodes().then((list) => {
      if (!live) return;
      setCodes(list);
      setNow(new Date());
    });
    return () => {
      live = false;
    };
  }, [version]);
  if (!codes?.length) return null;
  const who = (c: MyCode) => (c.personId ? personName(people.find((p) => p.id === c.personId)) || "a place in the tree" : "the family");
  return (
    <div className="codes">
      <p className="label quiet">Codes you've sent</p>
      <ul>
        {codes.map((c) => (
          <li key={c.code}>
            <b>{spacedCode(c.code) as string}</b>
            <span className="meta">
              for {who(c)} · {expiresLabel(c.expiresAt, now)}
            </span>
            <Button
              variant="quiet"
              small
              onClick={async () => {
                await revokeCode(c.code).catch(() => {});
                setCodes((prev) => (prev || []).filter((x) => x.code !== c.code));
              }}
            >
              Revoke
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Family() {
  const { user } = useAuth();
  const { account, activeStory: story, family, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const [params] = useSearchParams();
  const [invite, setInvite] = useState<{ anchor: Person | null } | null>(null);
  const [manage, setManage] = useState(false);
  const [codesVersion, setCodesVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => realPeople(family), [family]);

  useEffect(() => {
    if (params.get("review") === "1") reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [params]);

  if (account === undefined) return <Shell><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell>
        <div className="page">
          <Problem message={`We couldn't reach the family. ${loadError}`} onRetry={reload} />
        </div>
      </Shell>
    );
  }
  if (!story) return <Navigate to="/start" replace />;

  const meId = user?.id;
  const organiser = isOrganiser(family, meId);
  const teller = people.find((p) => p.storyId === story.id) || null;
  const others = people.filter((p) => p.id !== teller?.id && p.userId !== meId);
  const title = familyTitle(story);
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const lineFor = (p: Person) => personLine(p, { story, index, tellerId: teller?.id || null, meId, organiser });
  const generations = (() => {
    const years = people.map((p) => p.birthYear).filter((y): y is number => !!y);
    if (years.length < 2) return people.length > 1 ? "The family, so far" : "";
    const span = Math.max(...years) - Math.min(...years);
    const n = Math.max(1, Math.round(span / 28) + 1);
    return `${["One", "Two", "Three", "Four", "Five"][Math.min(n, 5) - 1]} generation${n === 1 ? "" : "s"}, so far`;
  })();

  const afterWrite = async () => {
    await reload();
    setCodesVersion((v) => v + 1);
  };

  const remove = async (p: Person) => {
    setError(null);
    try {
      await removePerson(p.id);
      await reload();
    } catch (err) {
      setError(`${p.givenName} wasn't removed (${(err as Error)?.message || "no connection"}).`);
    }
  };

  return (
    <Shell
      hero={
        <>
          <p className="label" data-rise>
            Family &amp; friends
          </p>
          <h1>{title}</h1>
          <div data-rise style={{ marginTop: "var(--s-6)" }}>
            <Button icon={<PlusIcon />} onClick={() => setInvite({ anchor: null })}>
              Invite someone
            </Button>
          </div>
        </>
      }
    >
      <div className="page">
        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}
        {error && <Problem message={error} onDismiss={() => setError(null)} />}

        <div className="fam">
          <div className="col">
            {others.length === 0 ? (
              <section className="card tree empty-fam" aria-label="Family tree">
                <h2 className="story-title">{story.relationship === "Myself" ? "It's just you so far. Who else was there?" : `It's you and ${story.name} so far. Who else was there?`}</h2>
                <p className="meta">A brother, a daughter, the friend who was always at the table. Add them and they can read what's shared and tell their side.</p>
                <Button icon={<PlusIcon />} onClick={() => setInvite({ anchor: null })}>
                  Add a person
                </Button>
              </section>
            ) : (
              <>
                <section className="card tree" aria-label="Family tree">
                  {generations && <h2>{generations}</h2>}
                  {family && <FamilyTree family={family} story={story} meId={meId} organiser={organiser} onAdd={() => setInvite({ anchor: null })} />}
                </section>
                <section className="card people" aria-label="Everyone">
                  <h2>
                    Everyone in {story.name}'s story
                    <Button variant="quiet" small aria-pressed={manage} onClick={() => setManage((v) => !v)}>
                      {manage ? "Done" : "Manage"}
                    </Button>
                  </h2>
                  {people.map((p) => (
                    <PersonRow key={p.id} person={p} line={lineFor(p)} meId={meId} manage={manage} removable={p.id !== teller?.id && p.userId !== meId && canEdit(p, family, meId)} onRemove={() => remove(p)} />
                  ))}
                </section>
              </>
            )}
          </div>

          <div className="col">
            <div ref={reviewRef} id="review">
              <ReviewQueue story={story} />
            </div>

            <section className="card invite" id="invite" aria-label="Invite and connect">
              <h2>Invite someone to {story.name}'s story</h2>
              <p className="meta">They join the family tree with a code or a link: they read what's shared and add what they remember.</p>
              <Button icon={<PlusIcon />} onClick={() => setInvite({ anchor: null })} style={{ marginTop: "var(--s-4)" }}>
                Invite someone
              </Button>
              <MyCodes people={people} version={codesVersion} />
            </section>

            {story.ownerId === meId && <Keepers story={story} people={people} senderName={senderName} />}
          </div>
        </div>
      </div>

      {invite && user && (
        <InviteSheet story={story} family={family} account={account} userId={user.id} senderName={senderName} anchor={invite.anchor} onClose={() => setInvite(null)} onSaved={afterWrite} />
      )}
    </Shell>
  );
}
