/**
 * Family: who is in it, who is on A Story, add someone, review what they
 * asked and sent. The family album across the top (components/family/album:
 * the storyteller's layer, then one row of photo cards per generation,
 * then whoever is not placed yet), then everyone listed on the left, each in one of three states ("not on A Story
 * yet", "invited · waiting for them", "on A Story"); on the right what is
 * waiting for your review (join
 * requests, suggestions, what the family sent), what you are waiting on,
 * the invitation card, and (for the story's owner) who may edit. A code
 * joins the tree, never the keepers. Nobody is listed twice (docs/PRD.md
 * §3.3a); when they are, one line says so and offers a merge.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, Button, Chip, Problem } from "../components/ui";
import { ChevronRight, PlusIcon } from "../components/icons";
import FamilyAlbum from "../components/family/album/FamilyAlbum";
import { sampleFamily } from "../components/family/tree/sampleFamily";
import { placePerson } from "../components/family/tree/placePerson";
import type { GhostKind } from "../components/family/tree/treeModel";
import InviteSheet from "../components/family/InviteSheet";
import ReviewQueue from "../components/family/ReviewQueue";
import Keepers from "../components/family/Keepers";
import Duplicates from "../components/family/Duplicates";
import { Asked, WaitingOnOthers } from "../components/family/Waiting";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { householdFor, listMyCodes, removePerson, revokeCode, type MyCode } from "../data/familyWrites";
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
  const { account, activeStory: story, stories, family, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const [params] = useSearchParams();
  const [invite, setInvite] = useState<{ anchor: Person | null; kind?: string | null } | null>(null);
  // Dev only: a fictional family in the album, for judging the drawing with more than three people. Nothing on it writes.
  const preview = import.meta.env.DEV && params.get("preview") === "tree";
  const sample = useMemo(() => (preview ? sampleFamily() : null), [preview]);
  const [manage, setManage] = useState(false);
  const [codesVersion, setCodesVersion] = useState(0);
  const [askedCount, setAskedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const onAskedCount = useCallback((n: number) => setAskedCount(n), []);

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
  // The roster's chip says the state, so its line leaves it out; the tree's node has no chip and says it.
  const lineFor = (p: Person) => personLine(p, { story, index, tellerId: teller?.id || null, meId, organiser, withState: false });
  const own = story.relationship === "Myself" && (!story.ownerId || story.ownerId === meId);
  const joined = !!story.ownerId && story.ownerId !== meId;

  const afterWrite = async () => {
    await reload();
    setCodesVersion((v) => v + 1);
  };

  /** Somebody already in the family, put into the tree beside somebody else (one or two edges). */
  const place = async (person: Person, anchor: Person, kind: GhostKind) => {
    if (preview || !user || !family) return;
    setError(null);
    try {
      const householdId = anchor.householdId || person.householdId || (await householdFor(user.id, account, family));
      await placePerson({ family, person, anchor, kind, householdId });
      await reload();
    } catch (err) {
      setError(`${person.givenName} wasn't placed (${(err as Error)?.message || "no connection"}).`);
    }
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
            Family &amp; friends · {own ? "your story" : joined ? `${story.name}'s story, which you've joined` : `${story.name}'s story, which you keep`}
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

        <FamilyAlbum
          family={sample ? sample.family : family}
          story={sample ? sample.story : story}
          meId={sample ? sample.meId : meId}
          own={sample ? false : own}
          preview={preview}
          onAdd={(anchor, kind) => !preview && setInvite({ anchor, kind })}
          onPlace={place}
          canPlace={(p) => !preview && canEdit(p, family, meId)}
        />

        <div className="fam">
          <div className="col">
            {others.length > 0 && (
              <>
                <Duplicates people={people} family={family} stories={stories} meId={meId} onChanged={afterWrite} />
                <section className="card people" aria-label="Everyone">
                  <h2>
                    Everyone in {own ? "your" : `${story.name}'s`} story
                    <Button variant="quiet" small aria-pressed={manage} onClick={() => setManage((v) => !v)}>
                      {manage ? "Done" : "Manage"}
                    </Button>
                  </h2>
                  <p className="meta states">Each person is in one of three places: not on A Story yet, invited and waiting for them, or on A Story.</p>
                  {people.map((p) => (
                    <PersonRow key={p.id} person={p} line={lineFor(p)} meId={meId} manage={manage} removable={p.id !== teller?.id && p.userId !== meId && canEdit(p, family, meId)} onRemove={() => remove(p)} />
                  ))}
                </section>
              </>
            )}
          </div>

          <div className="col">
            <div ref={reviewRef} id="review">
              <ReviewQueue story={story} askedCount={askedCount} asked={<Asked story={story} family={family} meId={meId} keeper onCount={onAskedCount} onChanged={afterWrite} />} />
            </div>

            <WaitingOnOthers meId={meId} family={family} />

            <section className="card invite" id="invite" aria-label="Invite and connect">
              <h2>Invite someone to {own ? "your" : `${story.name}'s`} story</h2>
              <p className="meta">They join the family tree with a code or a link: they read what's shared and add what they remember, under their own name. Nobody writes as {own ? "you" : story.name}.</p>
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
        <InviteSheet story={story} family={family} account={account} userId={user.id} senderName={senderName} anchor={invite.anchor} presetKind={invite.kind || ""} onClose={() => setInvite(null)} onSaved={afterWrite} />
      )}
    </Shell>
  );
}
