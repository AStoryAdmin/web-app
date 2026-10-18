/**
 * "{Name}’s family": the people the tree joins to this person, each as a
 * small portrait with their name and what they are to this person
 * ("mother", "husband", "son", "friend", "son-in-law"): parents first,
 * then partners, brothers and sisters, children, the in-laws the tree
 * joins through them, and friends. One tap opens them. Nothing at all
 * when the tree joins nobody to them (personRail kinOf).
 */
import { Link } from "react-router-dom";
import type { Person } from "../../data/family";
import Portrait from "../family/Portrait";
import { personName } from "../family/familyView";

export default function Kin({ person, kin, preview }: { person: Person; kin: { person: Person; rel: string }[]; preview?: boolean }) {
  if (!kin.length) return null;
  const q = preview ? "?preview=tree" : "";
  return (
    <section className="pk" aria-labelledby="pk-h">
      <h2 id="pk-h" className="pk-h">
        {person.givenName ? `${person.givenName}’s family` : "Their family"}
      </h2>
      <ul className="pk-list">
        {kin.map(({ person: p, rel }) => (
          <li key={p.id}>
            <Link className="pk-one" to={`/family/${p.id}${q}`}>
              <Portrait photo={p.photo} given={p.givenName} family={p.familyName} size={48} />
              <span className="pk-words">
                <span className="pk-nm">{personName(p)}</span>
                {rel && <span className="pk-rel">{rel}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
