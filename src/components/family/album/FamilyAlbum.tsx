/**
 * The family album (docs/mockups/tree/B-album.html, direction B): no chart.
 * A terracotta rail with a dot per generation; the storyteller's layer
 * first (their photograph, their years, their memories, one line of their
 * own words, the family's voices, two tiles), then one row of photo cards
 * per generation relative to them, couples side by side under a gold
 * hairline, a ghost "+" where a relation is missing, and at the bottom the
 * people nobody has placed yet, each with "Add as Rose's …". One tap on a
 * card opens the person. The words for a person's state are the product's
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
import { Tile } from "../../archive/ActionTiles";
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

function Card({ person, story, meId, sub, compact }: CardProps) {
  const photo = usePhotoUrl(person.photo);
  const state = stateOf(person, meId);
  const gone = !!person.deathYear;
  const stateLine = gone ? "" : state === "you" ? "you" : stateWords(state);
  const by = memoriesBy(person, story).length;
  const within = gone ? memoriesWith(person, story).length : 0;
  const years = yearsOf(person);
  const to = href(person);
  const name = personName(person);
  const first = firstName(person);
  const body = (
    <>
      {photo ? (
        <span className="fa-ph">
          <img src={photo} alt="" loading="lazy" />
        </span>
      ) : (
        <span className="fa-nophoto" aria-hidden="true">
          <span className="fa-script">{first}</span>
        </span>
      )}
      <span className="fa-words">
        <span className="fa-nm">{name}</span>
        {(years || sub) && (
          <span className="fa-yr">
            {years}
            {years && sub ? " · " : ""}
            {sub}
          </span>
        )}
        {stateLine && <span className="fa-st">{stateLine}</span>}
        {by > 0 && (
          <span className="fa-rem">
            What they remember: <b>{by}</b>
          </span>
        )}
        {within > 0 && !by && <span className="fa-rem">In {n(within, "memory", "memories")}</span>}
      </span>
    </>
  );
  const cls = `fa-card ${state}${gone ? " gone" : ""}${compact ? " compact" : ""}`;
  return (
    <div className="fa-item" data-fa-rise>
      {to ? (
        <Link className={cls} to={to} aria-label={`${name}${stateLine ? `, ${stateLine}` : ""}`}>
          {body}
        </Link>
      ) : (
        <span className={cls}>{body}</span>
      )}
      {!photo && to && !compact && (
        <Link className="fa-addphoto" to={`/write?photo=1&with=${person.id}`} aria-label={`Add a photo of ${first}`}>
          <span>Add a photo</span>
        </Link>
      )}
    </div>
  );
}

/** A ghost: the "+" for a relation that is missing. */
function Ask({ ghost, anchor, onAdd }: { ghost: Ghost; anchor: Person | null; onAdd: Props["onAdd"] }) {
  return (
    <button type="button" className="fa-ask" data-fa-rise onClick={() => onAdd(anchor, ghost.kind)} aria-label={`Add ${ghost.label}`}>
      <b aria-hidden="true">+</b>
      <span>{ghost.label}</span>
    </button>
  );
}

/* ── The storyteller's layer ───────────────────────────────────────────── */

function VoiceFace({ person, name }: { person: Person | null; name: string }) {
  const photo = usePhotoUrl(person?.photo);
  return <Avatar src={photo} name={name} size={44} className="fa-face" />;
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
  const body = (
    <>
      <span className={photo ? "fa-ph wide" : "fa-nophoto wide"}>
        {photo ? <img src={photo} alt="" /> : <span className="fa-script" aria-hidden="true">{first}</span>}
        <span className="fa-ribbon">Storyteller</span>
      </span>
      <span className="fa-words">
        <span className="fa-nm">{name}</span>
        <span className="fa-yr">
          {years}
          {years && stateLine ? " · " : ""}
          {stateLine && <span className={`fa-st ${state}`}>{stateLine}</span>}
        </span>
        <span className="fa-rem">{countLine}</span>
        {said && (
          <span className="fa-said">
            {said.startsWith("“") ? said : `“${said}”`}
            {saidFrom && <small>{saidFrom}</small>}
          </span>
        )}
      </span>
    </>
  );

  return (
    <>
      <div className="fa-item" data-fa-rise>
        {to ? (
          <Link className={`fa-card fa-big ${state}`} to={to}>
            {body}
          </Link>
        ) : (
          <span className={`fa-card fa-big ${state}`}>{body}</span>
        )}
      </div>
      <div className="fa-voices" data-fa-rise>
        {voices.length > 0 && (
          <>
            <h4>
              From <span className="hl">family</span>
            </h4>
            {voices.map((v) => {
              const person = v.personId ? ((index.people.get(v.personId) as Person | undefined) ?? null) : null;
              const who = person ? firstName(person) : v.name.split(",")[0].trim() || "Someone in the family";
              const you = !!meId && person?.userId === meId;
              const rel = (v.relationship || (person && isReal(teller) ? relationTo(index, person.id, teller.id) : "")).toLowerCase();
              return (
                <div className="fa-voice" key={v.id}>
                  <VoiceFace person={person} name={who} />
                  <div>
                    <q>{smarten(quoteFor(opening(v.text), 140) as string)}</q>
                    <p className="by">
                      <b>{you ? "You" : who}</b>
                      {rel ? ` · ${pronoun} ${rel}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div className="fa-tiles">
          <Tile icon={<PhotoIcon />} to={isReal(teller) ? `/write?photo=1&with=${teller.id}` : "/write?photo=1"} className="teal">
            <b>Add a photo</b>
            <small>{own ? "of you, or of a day you remember" : `of ${first}, or of a day with ${pronoun === "their" ? "them" : pronoun === "her" ? "her" : "him"}`}</small>
          </Tile>
          <Tile icon={<PenIcon />} to="/write" className="gold">
            <b>Add a memory</b>
            <small>{own ? "something you remember" : `something ${first} told you`}</small>
          </Tile>
        </div>
      </div>
    </>
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
    <div ref={box} className="fa-shelfitem">
      <Card person={person} {...card} />
      {canPlace && anchor && (
        <Button variant="quiet" small className="fa-place" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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
  const withLine = album.spouses.length ? `· with ${album.spouses.map(firstName).join(", and ")}` : "";
  const cardProps = { story, meId };

  return (
    <section className="fa" aria-label="Family album">
      <div className="fa-head">
        <h2>{title}</h2>
        {(meta || preview) && (
          <p className="fa-meta">
            {preview ? "A sample family, for looking" : ""}
            {preview && meta ? " · " : ""}
            {meta}
          </p>
        )}
      </div>

      <div className="fa-rail" ref={rail}>
        <span className="fa-line" aria-hidden="true" />

        {teller && (
          <section className="fa-stop first" aria-label="The storyteller">
            <span className="fa-dot" aria-hidden="true" />
            {tellerDecade && <span className="fa-dec">{tellerDecade}</span>}
            <h3>
              <b>{own ? "You" : firstName(teller)}</b>, the storyteller {withLine && <span className="n">{withLine}</span>}
            </h3>
            <div className={`fa-teller${album.spouses.length ? " with-spouses" : ""}`}>
              <Teller teller={teller} story={story} own={own} meId={meId} voices={voices} index={index} />
              {album.spouses.length > 0 && realTeller && (
                <div className="fa-spouses" data-fa-rise>
                  <span className="lab">{spousesLabel(index, album.spouses, realTeller.id, whose)}</span>
                  {album.spouses.map((s) => (
                    <Card key={s.id} person={s} {...cardProps} compact />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {album.rows.map((row) => (
          <section className="fa-stop" key={row.level} aria-label={row.title}>
            <span className="fa-dot" aria-hidden="true" />
            {row.decade && <span className="fa-dec">{row.decade}</span>}
            <h3>
              <b>{row.title}</b> {row.note && <span className="n">{row.note}</span>}
            </h3>
            <div className="fa-cards">
              {row.units.map((u) =>
                u.people.length === 2 ? (
                  <div className="fa-group" key={u.people[0].id} data-label={u.caption}>
                    {u.people.map((p) => (
                      <Card key={p.id} person={p} {...cardProps} sub={row.sub.get(p.id)} />
                    ))}
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
          <section className="fa-stop" aria-label="Who else was there">
            <span className="fa-dot" aria-hidden="true" />
            <h3>
              <b>Who else was there?</b> <span className="n">· each one becomes a card here</span>
            </h3>
            <div className="fa-cards">
              {loneGhosts(realTeller?.id || null).map((g) => (
                <Ask key={g.key} ghost={g} anchor={realTeller} onAdd={onAdd} />
              ))}
            </div>
          </section>
        )}

        {album.unplaced.length > 0 && (
          <section className="fa-stop fa-shelf" aria-label="Not placed yet">
            <span className="fa-dot" aria-hidden="true" />
            <h3>
              <b>Not placed yet</b> <span className="n">· say who they are to {own ? "you" : firstName(teller) || story.name}</span>
            </h3>
            <div className="fa-cards">
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
