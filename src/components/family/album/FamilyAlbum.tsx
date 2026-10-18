/**
 * The family register: no chart, no giant cards. The storyteller first as
 * a frontispiece (portrait or monogram seal, their years and memories, one
 * line of their own words, the family's lines beside it, two quiet
 * actions); then one row per generation relative to them on a terracotta
 * rail, each person a portrait card (a round print, or their initials
 * engraved on a seal when there is no photograph), couples joined by an
 * ampersand, a dashed ring where a relation is missing, and at the bottom
 * the people nobody has placed yet, each with "Add as Rose's …". One tap on
 * a card opens the person. The words for a person's state are the product's
 * three (docs/PRD.md §3.3a), and nobody is ever written as somebody else.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Family, Person } from "../../../data/family";
import type { Memory, Story } from "../../../data/stories";
import { listContributions, type Contribution } from "../../../data/contributions";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import { quoteFor } from "../../../app-core/lib/memoryCard.js";
import { opening } from "../../../lib/resurface";
import { smarten } from "../../../lib/typography";
import { usePhotoUrl } from "../../../lib/photoUrls";
import { Avatar, Button } from "../../ui";
import { PenIcon, PhotoIcon } from "../../icons";
import { firstName, linkState, memoriesBy, memoriesWith, personName, realPeople, relationTo, stateWords, type Index } from "../familyView";
import { PLACE_KINDS, placeWord, treePeople, yearsOf, type GhostKind } from "../tree/treeModel";
import { buildAlbum, decadeOf, generationsLine, loneGhosts, peopleLine, spousesLabel, type Ghost } from "./albumModel";
import { useAlbumMotion } from "./albumMotion";

type Props = {
  family: Family | null;
  story: Story;
  meId: string | null | undefined;
  /** The viewer is the storyteller: "Your parents", "you". */
  own: boolean;
  /** The sample family is for looking: nothing on it writes or fetches. */
  preview?: boolean;
  onAdd: (anchor: Person | null, kind: string | null) => void;
  onPlace: (person: Person, anchor: Person, kind: GhostKind) => void;
  canPlace: (person: Person) => boolean;
};

type Voice = { id: string; personId: string | null; name: string; relationship: string; text: string; createdAt: string };

const isReal = (p: Person | null | undefined): p is Person => !!p && !p.id.startsWith("story:");
/** The person's state, with "you" for the viewer's own row (linkStateOf compares person ids; here the account's id is what we know). */
const stateOf = (p: Person, meId: string | null | undefined) => (meId && p.userId === meId ? "you" : linkState(p, meId).key);
const href = (p: Person) => (isReal(p) ? `/family/${p.id}` : null);
const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
const words = (m: Memory) => (m.body || m.excerpt || "").trim();

/* ── One card ──────────────────────────────────────────────────────────── */

type CardProps = {
  person: Person;
  story: Story;
  meId: string | null | undefined;
  /** "Margaret's", "cousin": under the years. */
  sub?: string;
  compact?: boolean;
};

/** Their initials, the way a monogram is engraved: given and family name, one letter each. */
function initials(p: Person): string {
  const g = String(p.givenName || "").trim();
  const f = String(p.familyName || "").trim();
  const a = g ? Array.from(g)[0] : "";
  const b = f ? Array.from(f)[0] : "";
  return (a + b).toUpperCase() || "?";
}

/** The portrait: their photograph as a round print, or their initials on a seal. */
function Portrait({ person, photo, size }: { person: Person; photo: string | null | undefined; size: "sm" | "md" | "lg" }) {
  return (
    <span className={`fr-portrait ${size}${photo ? "" : " seal"}`} aria-hidden="true">
      {photo ? <img src={photo} alt="" loading="lazy" /> : <span className="fr-mono">{initials(person)}</span>}
    </span>
  );
}

const DOT: Record<string, string> = { you: "on", joined: "on", invited: "waiting", remembered: "off", listed: "off" };

function Card({ person, story, meId, sub, compact }: CardProps) {
  const photo = usePhotoUrl(person.photo);
  const state = stateOf(person, meId);
  const gone = !!person.deathYear;
  const stateLine = gone ? "" : state === "you" ? "you" : stateWords(state);
  const by = memoriesBy(person, story).length;
  const within = memoriesWith(person, story).length;
  const years = yearsOf(person);
  const to = href(person);
  const name = personName(person);
  const meta = [years, sub].filter(Boolean).join(" · ");
  const note = by > 0 ? `remembers ${by}` : within > 0 ? `in ${n(within, "memory", "memories")}` : "";
  const body = (
    <>
      <Portrait person={person} photo={photo} size={compact ? "sm" : "md"} />
      <span className="fr-nm">{name}</span>
      {meta && <span className="fr-meta">{meta}</span>}
      {stateLine && (
        <span className={`fr-state ${DOT[state] || "off"}`}>
          <i aria-hidden="true" />
          {stateLine}
        </span>
      )}
      {note && <span className="fr-note">{note}</span>}
    </>
  );
  const cls = `fr-card ${state}${gone ? " gone" : ""}${compact ? " compact" : ""}`;
  return (
    <div className="fr-item" data-fa-rise>
      {to ? (
        <Link className={cls} to={to} aria-label={`${name}${stateLine ? `, ${stateLine}` : ""}`}>
          {body}
        </Link>
      ) : (
        <span className={cls}>{body}</span>
      )}
    </div>
  );
}

/** A ghost: the "+" for a relation that is missing. */
function Ask({ ghost, anchor, onAdd }: { ghost: Ghost; anchor: Person | null; onAdd: Props["onAdd"] }) {
  return (
    <button type="button" className="fr-ask" data-fa-rise onClick={() => onAdd(anchor, ghost.kind)} aria-label={`Add ${ghost.label}`}>
      <span className="fr-ring" aria-hidden="true">+</span>
      <span className="fr-nm">{ghost.label}</span>
    </button>
  );
}

/* ── The storyteller's layer ───────────────────────────────────────────── */

function VoiceFace({ person, name }: { person: Person | null; name: string }) {
  const photo = usePhotoUrl(person?.photo);
  return <Avatar src={photo} name={name} size={44} className="fr-face" />;
}

function Teller({ teller, story, own, meId, voices, index }: { teller: Person; story: Story; own: boolean; meId: string | null | undefined; voices: Voice[]; index: Index }) {
  const photo = usePhotoUrl(teller.photo || story.photo);
  const to = href(teller);
  const name = personName(teller) || story.name;
  const first = firstName(teller);
  const birth = teller.birthYear || parseInt(String(story.birthYear || ""), 10) || null;
  const years = yearsOf({ birthYear: birth, deathYear: teller.deathYear });
  const state = stateOf(teller, meId);
  const stateLine = teller.deathYear ? "" : state === "you" ? "you" : stateWords(state);

  const kept = story.memories.filter((m) => m.status !== "in_progress");
  const written = kept.filter((m) => !m.audio?.length && !m.familyCallId).length;
  const countLine = !kept.length ? "No memories kept yet" : `${n(kept.length, "memory", "memories")}${kept.length > 1 && written ? ` · ${written === kept.length ? "all" : written} of them written` : ""}`;

  // Their own words: the first real sentence of their latest memory, never the family's.
  const latest = kept
    .filter((m) => !m.contributor && words(m).length >= 20)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const said = latest ? smarten(quoteFor(opening(words(latest)), 170) as string) : "";
  const saidFrom = latest?.title?.trim() ? `From “${smarten(latest.title.trim())}”` : "";

  const pronoun = teller.sex === "F" ? "her" : teller.sex === "M" ? "his" : "their";
  const them = pronoun === "their" ? "them" : pronoun === "her" ? "her" : "him";
  const portrait = <Portrait person={teller} photo={photo} size="lg" />;

  return (
    <div className="fr-front" data-fa-rise>
      <div className="fr-who">
        {to ? (
          <Link className="fr-front-portrait" to={to} aria-label={name}>
            {portrait}
          </Link>
        ) : (
          <span className="fr-front-portrait">{portrait}</span>
        )}
        <div className="fr-front-words">
          <p className="fr-kicker">The storyteller</p>
          <h3 className="fr-front-name">{to ? <Link to={to}>{name}</Link> : name}</h3>
          <p className="fr-meta">{[years, stateLine, countLine].filter(Boolean).join(" · ")}</p>
          {said ? (
            <blockquote className="fr-said">
              <p>{said.replace(/^“|”$/g, "")}</p>
              {saidFrom && <cite>{saidFrom}</cite>}
            </blockquote>
          ) : (
            <p className="fr-said empty">{own ? "Your first memory will be quoted here." : `${first}'s first memory will be quoted here.`}</p>
          )}
          <div className="fr-acts">
            <Link className="fr-act" to="/write">
              <PenIcon aria-hidden="true" /> {own ? "Add a memory" : `Add something ${first} told you`}
            </Link>
            <Link className="fr-act" to={isReal(teller) ? `/write?photo=1&with=${teller.id}` : "/write?photo=1"}>
              <PhotoIcon aria-hidden="true" /> {own ? "Add a photograph of you" : `Add a photograph of ${them}`}
            </Link>
          </div>
        </div>
      </div>

      <aside className="fr-voices" aria-label="From the family">
        <p className="fr-kicker">From the family</p>
        {voices.length > 0 ? (
          voices.map((v) => {
            const person = v.personId ? ((index.people.get(v.personId) as Person | undefined) ?? null) : null;
            const who = person ? firstName(person) : v.name.split(",")[0].trim() || "Someone in the family";
            const you = !!meId && person?.userId === meId;
            const rel = (v.relationship || (person && isReal(teller) ? relationTo(index, person.id, teller.id) : "")).toLowerCase();
            return (
              <figure className="fr-voice" key={v.id}>
                <VoiceFace person={person} name={who} />
                <div>
                  <q>{smarten(quoteFor(opening(v.text), 140) as string)}</q>
                  <figcaption>
                    <b>{you ? "You" : who}</b>
                    {rel ? ` · ${pronoun} ${rel}` : ""}
                  </figcaption>
                </div>
              </figure>
            );
          })
        ) : (
          <p className="fr-empty">When someone in the family adds what they remember, their words appear here, under their own name.</p>
        )}
      </aside>
    </div>
  );
}

/* ── The shelf: not placed yet ─────────────────────────────────────────── */

function ShelfItem({ person, anchor, canPlace, onPlace, ...card }: { person: Person; anchor: Person | null; canPlace: boolean; onPlace: (kind: GhostKind) => void } & Omit<CardProps, "person">) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    box.current?.querySelector<HTMLButtonElement>(".ft-menu button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={box} className="fr-shelfitem">
      <Card person={person} {...card} />
      {canPlace && anchor && (
        <Button variant="quiet" small className="fr-place" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Add as {firstName(anchor)}'s … →
        </Button>
      )}
      {open && anchor && (
        <div className="ft-menu shelf" role="menu" aria-label={`Place ${firstName(person)}`}>
          <p>Place {firstName(person)}</p>
          {PLACE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPlace(k);
              }}
            >
              {placeWord(k, firstName(anchor))}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── The album ─────────────────────────────────────────────────────────── */

export default function FamilyAlbum({ family, story, meId, own, preview, onAdd, onPlace, canPlace }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => treePeople(realPeople(family), story), [family, story]);
  const teller = people.find((p) => p.storyId === story.id) || null;
  const album = useMemo(() => buildAlbum({ people, index, tellerId: teller?.id || null, meId, own }), [people, index, teller, meId, own]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const whose = own ? "Your" : `${firstName(teller)}'s`;
  const realTeller = isReal(teller) ? teller : null;

  // The family's voices: approved contributions, and memories that carry a contributor's name (one became the other).
  const [contributions, setContributions] = useState<Contribution[]>([]);
  useEffect(() => {
    if (preview) return;
    let live = true;
    listContributions(story.id, "approved").then((rows) => live && setContributions(rows));
    return () => {
      live = false;
    };
  }, [story.id, preview]);
  const voices = useMemo<Voice[]>(() => {
    const seen = new Set<string>();
    const out: Voice[] = [];
    for (const c of contributions) {
      if (!c.body.trim() || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, personId: c.personId, name: c.contributorName, relationship: c.relationship, text: c.body, createdAt: c.createdAt });
    }
    for (const m of story.memories) {
      if (m.status === "in_progress" || !m.contributor || seen.has(m.id) || !words(m)) continue;
      seen.add(m.id);
      const [name, ...rest] = m.contributor.split(",");
      out.push({ id: m.id, personId: m.authorPersonId, name: name.trim(), relationship: rest.join(",").trim(), text: words(m), createdAt: m.createdAt });
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  }, [contributions, story.memories]);

  useAlbumMotion(rail, `${story.id}:${family ? 1 : 0}`);

  const total = people.length;
  const title = album.lone
    ? album.unplaced.length
      ? peopleLine(total, album.unplaced.length)
      : own
        ? "It's just you so far. Who else was there?"
        : `It's you and ${story.name} so far. Who else was there?`
    : generationsLine(album.generations);
  const meta = album.lone ? "" : peopleLine(total, album.unplaced.length);
  const tellerBirth = teller?.birthYear || parseInt(String(story.birthYear || ""), 10) || 0;
  const tellerDecade = tellerBirth ? decadeOf([{ birthYear: tellerBirth }]) : "";
  const cardProps = { story, meId };

  return (
    <section className="fr" aria-label="The family">
      <div className="fr-head">
        <h2>{title}</h2>
        {(meta || preview) && (
          <p className="fr-headmeta">
            {preview ? "A sample family, for looking" : ""}
            {preview && meta ? " · " : ""}
            {meta}
          </p>
        )}
      </div>

      {teller && <Teller teller={teller} story={story} own={own} meId={meId} voices={voices} index={index} />}

      <div className="fr-rail" ref={rail}>
        <span className="fr-line" aria-hidden="true" />

        {album.spouses.length > 0 && realTeller && (
          <section className="fr-stop" aria-label={spousesLabel(index, album.spouses, realTeller.id, whose)}>
            <span className="fr-dot" aria-hidden="true" />
            {tellerDecade && <span className="fr-dec">{tellerDecade}</span>}
            <h3>{spousesLabel(index, album.spouses, realTeller.id, whose)}</h3>
            <div className="fr-cards">
              {album.spouses.map((sp) => (
                <Card key={sp.id} person={sp} {...cardProps} />
              ))}
            </div>
          </section>
        )}

        {album.rows.map((row) => (
          <section className="fr-stop" key={row.level} aria-label={row.title}>
            <span className="fr-dot" aria-hidden="true" />
            {row.decade && <span className="fr-dec">{row.decade}</span>}
            <h3>
              {row.title} {row.note && <span className="n">{row.note}</span>}
            </h3>
            <div className="fr-cards">
              {row.units.map((u) =>
                u.people.length === 2 ? (
                  <div className="fr-couple" key={u.people[0].id} aria-label={u.caption}>
                    <Card person={u.people[0]} {...cardProps} sub={row.sub.get(u.people[0].id)} />
                    <span className="fr-amp" aria-hidden="true">&amp;</span>
                    <Card person={u.people[1]} {...cardProps} sub={row.sub.get(u.people[1].id)} />
                  </div>
                ) : (
                  <Card key={u.people[0].id} person={u.people[0]} {...cardProps} sub={row.sub.get(u.people[0].id)} />
                ),
              )}
              {row.ghosts.map((g) => {
                const anchor = g.anchorId ? byId.get(g.anchorId) || null : null;
                return <Ask key={g.key} ghost={g} anchor={isReal(anchor) ? anchor : null} onAdd={onAdd} />;
              })}
            </div>
          </section>
        ))}

        {album.lone && teller && (
          <section className="fr-stop" aria-label="Who else was there">
            <span className="fr-dot" aria-hidden="true" />
            <h3>
              Who else was there? <span className="n">Each one becomes a portrait here.</span>
            </h3>
            <div className="fr-cards">
              {loneGhosts(realTeller?.id || null).map((g) => (
                <Ask key={g.key} ghost={g} anchor={realTeller} onAdd={onAdd} />
              ))}
            </div>
          </section>
        )}

        {album.unplaced.length > 0 && (
          <section className="fr-stop fr-shelf" aria-label="Not placed yet">
            <span className="fr-dot" aria-hidden="true" />
            <h3>
              Not placed yet <span className="n">Say who they are to {own ? "you" : firstName(teller) || story.name}.</span>
            </h3>
            <div className="fr-cards">
              {album.unplaced.map((p) => (
                <ShelfItem key={p.id} person={p} {...cardProps} anchor={realTeller} canPlace={!preview && canPlace(p)} onPlace={(kind) => realTeller && onPlace(p, realTeller, kind)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
