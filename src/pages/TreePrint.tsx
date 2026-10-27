/**
 * The family tree, for paper (/family/print): one sheet a laptop sends to
 * the printer, for the fridge, a frame or the reunion table. The same
 * generations the Family page draws (buildPlate, so the two never
 * disagree), set as type rather than faces and threads: each generation’s
 * name and decade, then its people, couples joined by an ampersand, with
 * their years and what they are to the storyteller. Anyone not placed yet
 * is listed at the foot. The screen shows the sheet with a way back and
 * Print; printing leaves only the sheet, in black on white.
 */
import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { buildPlate, type PlateUnit } from "../components/family/tree/plateModel";
import { treePeople, yearsOf } from "../components/family/tree/treeModel";
import { generationsLine, peopleLine } from "../components/family/album/albumModel";
import { familyTitle, meOf, personName, realPeople, type Index } from "../components/family/familyView";

const STYLE = `
.tpr { min-height: 100vh; background: var(--page); color: var(--ink); padding: 24px 16px 64px; }
.tpr-bar { max-width: 880px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tpr-bar a { display: inline-flex; align-items: center; min-height: 44px; font: 600 16px/1.3 var(--font-ui); color: var(--heading); text-decoration: underline; text-decoration-color: var(--foil-soft, rgba(201,161,90,0.35)); text-underline-offset: 4px; }
.tpr-sheet { max-width: 880px; margin: 0 auto; padding: 48px 40px; background: var(--paper-print, #FFFDF8); border: 1px solid var(--sheet-rule, rgba(60,50,40,0.16)); border-radius: 6px; color: var(--sheet-ink, var(--ink)); }
.tpr-sheet h1 { margin: 0; font: 600 44px/1.05 var(--book-display); letter-spacing: -0.01em; text-align: center; text-wrap: balance; color: inherit; }
.tpr-sub { margin: 10px 0 0; text-align: center; font: 400 17px/1.5 var(--book-body); color: var(--kicker-grey, #6A645B); }
.tpr-rule { width: 64px; height: 1px; margin: 24px auto 8px; background: var(--foil, #C9A15A); border: 0; }
.tpr-tier { padding: 22px 0; border-bottom: 1px solid var(--sheet-rule, rgba(60,50,40,0.16)); break-inside: avoid; page-break-inside: avoid; }
.tpr-tier:last-of-type { border-bottom: 0; }
.tpr-tier h2 { margin: 0; text-align: center; font: 600 24px/1.2 var(--book-display); color: inherit; }
.tpr-tier .tpr-also, .tpr-tier .tpr-decade { margin: 2px 0 0; text-align: center; font: 400 16px/1.4 var(--book-body); color: var(--kicker-grey, #6A645B); }
.tpr-units { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px 40px; }
.tpr-unit { display: flex; align-items: flex-start; gap: 10px; text-align: center; }
.tpr-amp { font: italic 400 22px/1.3 var(--book-display); color: var(--foil, #C9A15A); }
.tpr-person b { display: block; font: 600 19px/1.3 var(--book-body); color: inherit; }
.tpr-person.teller b { font-size: 22px; }
.tpr-person span { display: block; font: 400 16px/1.4 var(--book-body); color: var(--kicker-grey, #6A645B); }
.tpr-foot { margin: 28px 0 0; text-align: center; font: 400 16px/1.5 var(--book-body); color: var(--kicker-grey, #6A645B); }
@media (max-width: 600px) { .tpr-sheet { padding: 32px 16px; } .tpr-sheet h1 { font-size: 34px; } }
@media print {
  @page { margin: 14mm; }
  html, body, .tpr { background: #fff !important; }
  .tpr { min-height: 0; padding: 0; color: #2A2320; }
  .tpr-bar { display: none !important; }
  .tpr-sheet { max-width: none; padding: 0; border: 0; background: #fff; color: #2A2320; }
  .tpr-sub, .tpr-tier .tpr-also, .tpr-tier .tpr-decade, .tpr-person span, .tpr-foot { color: #4A423C; }
  .tpr-tier { border-bottom-color: #CFC6BA; }
}
`;

/** One couple (or one person), as a line of names joined by an ampersand. */
function Unit({ unit }: { unit: PlateUnit }) {
  return (
    <li className="tpr-unit">
      {unit.nodes.map((n, i) => {
        const years = yearsOf(n.person);
        return (
          <span key={n.id} style={{ display: "contents" }}>
            {i > 0 && <span className="tpr-amp">&amp;</span>}
            <span className={`tpr-person${n.teller ? " teller" : ""}`}>
              <b>{personName(n.person)}</b>
              {years && <span>{years}</span>}
              {n.rel && <span>{n.rel}</span>}
            </span>
          </span>
        );
      })}
    </li>
  );
}

export default function TreePrint() {
  const { user } = useAuth();
  const { account, activeStory: story, family } = useAccount();
  const meRow = meOf(family, user?.id);

  const sheet = useMemo(() => {
    const people = treePeople(realPeople(family), story);
    const index = buildIndex(family || { people: [], edges: [] }) as Index;
    const centre = story ? people.find((p) => p.storyId === story.id) : meRow;
    const plate = buildPlate({ people, index, tellerId: centre?.id || null });
    return { plate, total: people.length };
  }, [family, story, meRow]);

  if (account === undefined) return <div className="tpr" aria-busy="true" />;
  // nothing to print: no story, and no place of their own in a tree
  if (!story && !meRow) return <Navigate to="/family" replace />;

  const { plate, total } = sheet;
  const last = String(story?.lastName || meRow?.familyName || "").trim();
  const title = story ? familyTitle(story) : last ? familyTitle({ name: "", lastName: last }) : "Our family";
  const tiers = plate.tiers.filter((t) => t.units.length);
  const printed = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="tpr">
      <style>{STYLE}</style>
      <div className="tpr-bar">
        <Link to="/family">← Back to the family</Link>
        <Button onClick={() => window.print()}>Print the tree</Button>
      </div>
      <article className="tpr-sheet" aria-labelledby="tpr-title">
        <h1 id="tpr-title">{title}</h1>
        <p className="tpr-sub">{tiers.length ? `${generationsLine(plate.generations)} · ${peopleLine(total, plate.unplaced.length)}` : peopleLine(total, plate.unplaced.length)}</p>
        <hr className="tpr-rule" />
        {tiers.map((t) => (
          <section key={t.key} className="tpr-tier" aria-label={t.title}>
            <h2>{t.title}</h2>
            {t.also && <p className="tpr-also">{t.also}</p>}
            {t.decade && <p className="tpr-decade">Born in the {t.decade}</p>}
            <ul className="tpr-units">
              {(["left", "centre", "right"] as const).flatMap((z) => t.zones[z].filter((item) => item.unit).map((item) => <Unit key={item.key} unit={item.unit!} />))}
            </ul>
          </section>
        ))}
        {plate.unplaced.length > 0 && (
          <section className="tpr-tier" aria-label="Not placed yet">
            <h2>Not placed in the tree yet</h2>
            <ul className="tpr-units">
              {plate.unplaced.map((p) => (
                <li key={p.id} className="tpr-unit">
                  <span className="tpr-person">
                    <b>{personName(p)}</b>
                    {yearsOf(p) && <span>{yearsOf(p)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="tpr-foot">Kept on A Story · {printed}</p>
      </article>
    </div>
  );
}
