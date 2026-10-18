/**
 * The storyteller’s column beside the family: whose story this is, in
 * their own words (the opening of their latest memory, never a summary of
 * it), and the family’s lines under it, each beside the face of whoever
 * wrote it and what they are to the storyteller. Two quiet ways to add to
 * it. Their face is in the tree, the largest one, so it is not repeated
 * here. Nobody is ever written as somebody else: the family’s lines are
 * theirs, under their own name.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Family, Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";
import { fetchContributions, type Contribution } from "../../data/contributions";
import { buildIndex } from "../../app-core/lib/familyGraph.js";
import { quoteFor } from "../../app-core/lib/memoryCard.js";
import { smarten } from "../../lib/typography";
import { PenIcon, PhotoIcon } from "../icons";
import Portrait from "./Portrait";
import { Postmark } from "./Ornaments";
import { firstName, linkState, personName, realPeople, relationTo, stateWords, type Index, type LinkState } from "./familyView";
import { treePeople, yearsOf } from "./tree/treeModel";
import { oneLine, saidLine } from "../person/personRail";
import { ownWords, tellerTurns } from "../archive/transcript";
import { useRetryFocus } from "./useRetryFocus";

type Voice = { id: string; personId: string | null; name: string; relationship: string; text: string; createdAt: string; memoryId: string | null };

const words = (m: Memory) => (m.body || m.excerpt || "").trim();
const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

export default function Storyteller({ family, story, meId, own, preview, onInvite }: { family: Family | null; story: Story; meId: string | null | undefined; own: boolean; preview?: boolean; onInvite?: () => void }) {
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => treePeople(realPeople(family), story), [family, story]);
  const teller = people.find((p) => p.storyId === story.id) || null;
  const real = teller && !teller.id.startsWith("story:") ? teller : null;
  const first = teller ? firstName(teller) : story.name;
  const q = preview ? "?preview=tree" : "";

  // The family’s lines: approved contributions, and memories that carry a contributor’s name (one became the other).
  // null while they load (the sample has none to load)
  const [contributions, setContributions] = useState<Contribution[] | null>(preview ? [] : null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { line: retryLine, arm: armRetry } = useRetryFocus();
  useEffect(() => {
    if (preview) return;
    let live = true;
    fetchContributions(story.id, "approved")
      .then((rows) => {
        if (!live) return;
        setContributions(rows);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [story.id, preview, attempt]);
  const voices = useMemo<Voice[]>(() => {
    const seen = new Set<string>();
    const out: Voice[] = [];
    for (const c of contributions || []) {
      if (!c.body.trim() || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, personId: c.personId, name: c.contributorName, relationship: c.relationship, text: c.body, createdAt: c.createdAt, memoryId: c.memoryId });
    }
    for (const m of story.memories) {
      if (m.status === "in_progress" || !m.contributor || seen.has(m.id) || !words(m)) continue;
      seen.add(m.id);
      const [name, ...rest] = m.contributor.split(",");
      out.push({ id: m.id, personId: m.authorPersonId, name: name.trim(), relationship: rest.join(",").trim(), text: words(m), createdAt: m.createdAt, memoryId: m.id });
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  }, [contributions, story.memories]);

  const kept = story.memories.filter((m) => m.status !== "in_progress");
  const written = kept.filter((m) => !m.audio?.length && !m.familyCallId).length;
  const recorded = kept.length - written;
  // "13 memories: 9 written, 4 recorded" (said aloud, on a call or a recording); one kind needs no split.
  const countLine = !kept.length ? "no memories kept yet" : `${n(kept.length, "memory", "memories")}${written && recorded ? `: ${written} written, ${recorded} recorded` : ""}`;
  const state: LinkState["key"] | null = teller ? (meId && teller.userId === meId ? "you" : linkState(teller, meId).key) : null;
  const stateLine = !teller || !state || teller.deathYear || state === "you" ? "" : stateWords(state);
  const birth = teller?.birthYear || parseInt(String(story.birthYear || ""), 10) || null;
  const years = teller?.deathYear ? yearsOf({ birthYear: birth, deathYear: teller.deathYear }) : birth ? `born ${birth}` : "";
  const meta = [years, stateLine, countLine].filter(Boolean).join(" · ");

  // Their own words: the first real sentence of their latest memory, never the family’s.
  const latest = kept.filter((m) => !m.contributor && saidLine(m).length >= 20).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const said = latest ? saidLine(latest, 160).replace(/^“|”$/g, "") : "";
  const pronoun = teller?.sex === "F" ? "her" : teller?.sex === "M" ? "his" : "their";
  const them = pronoun === "their" ? "them" : pronoun === "her" ? "her" : "him";
  const name = teller ? personName(teller) : story.name;

  return (
    <aside className={`st gilt${voices.length ? "" : " quiet"}`} aria-label={`${name}, the storyteller`}>
      <i className="glint" aria-hidden="true" />
      <div className="st-who">
        <h2 className="st-name">{real ? <Link to={`/family/${real.id}${q}`}>{name}</Link> : name}</h2>
        <p className="st-meta">{meta}</p>
      </div>

      {said ? (
        <figure className="st-said">
          <blockquote>
            <p>{said}</p>
          </blockquote>
          <figcaption>
            {own ? "You, in " : `${first}, in `}
            {preview ? <span>“{smarten(latest!.title?.trim() || "a memory")}”</span> : <Link to={`/archive/${latest!.id}`}>“{smarten(latest!.title?.trim() || "a memory")}”</Link>}
          </figcaption>
        </figure>
      ) : (
        <p className="st-said empty">{own ? "Your first memory will be quoted here, in your own words." : `${first}’s first memory will be quoted here, in ${pronoun} own words.`}</p>
      )}

      <div className="st-acts">
        <Link className="st-act" to="/write">
          <PenIcon aria-hidden="true" /> {own ? "Add a memory" : `Add something ${first} told you`}
        </Link>
        <Link className="st-act" to={real ? `/write?photo=1&with=${real.id}` : "/write?photo=1"}>
          <PhotoIcon aria-hidden="true" /> {own ? "Add a photograph of you" : `Add a photograph of ${them}`}
        </Link>
      </div>

      <section className="st-voices" aria-label="From the family">
        <h3 className="st-h">From the family</h3>
        {voices.length > 0 ? (
          voices.map((v) => {
            const person = v.personId ? ((index.people.get(v.personId) as Person | undefined) ?? null) : null;
            const who = person ? firstName(person) : v.name.split(" ")[0] || "Someone in the family";
            const you = !!meId && person?.userId === meId;
            const rel = (v.relationship || (person && real ? relationTo(index, person.id, real.id) : "")).toLowerCase();
            return (
              <figure className="st-voice" key={v.id}>
                <Portrait photo={person?.photo} given={person?.givenName || who} family={person?.familyName} size={44} />
                <div>
                  <Postmark iso={v.createdAt} />
                  <blockquote>
                    <p>{(oneLine({ body: v.text } as Memory, 150) || smarten(quoteFor(ownWords(tellerTurns(v.text)), 150) as string)).replace(/^“|”$/g, "")}</p>
                  </blockquote>
                  <figcaption>
                    <b>{you ? "You" : who}</b>
                    {rel ? `, ${pronoun} ${rel}` : ""}
                  </figcaption>
                </div>
              </figure>
            );
          })
        ) : failed ? (
          <p className="st-empty bad" role="alert">
            The family’s lines couldn’t be reached just now.{" "}
            <button
              type="button"
              className="st-act"
              onClick={() => {
                armRetry();
                setFailed(false);
                setContributions(null);
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </button>
          </p>
        ) : contributions === null ? (
          <p className="st-empty" aria-busy="true" tabIndex={-1} ref={retryLine}>
            Looking for the family’s lines…
          </p>
        ) : (
          <div className="st-empty">
            <p>Nobody has added their side yet. Sending someone a link takes a minute.</p>
            {onInvite && !preview && (
              <button type="button" className="st-act" onClick={onInvite}>
                Send someone a link <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
