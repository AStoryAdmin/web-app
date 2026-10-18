/**
 * "{Name}'s family": the people closest to this person in the tree, each
 * as a small portrait with their name and what they are to this person
 * ("mother", "husband", "son"), parents first, then partners, brothers and
 * sisters, children. One tap opens them. A short way back to the whole
 * family under it. Nothing when the person stands alone in the tree.
 */
import { Link } from "react-router-dom";
import type { Family, Person } from "../../data/family";
import Portrait from "../family/Portrait";
import { personName, relationTo, type Index } from "../family/familyView";

const byBirth = (a: Person, b: Person) => (a.birthYear || 9999) - (b.birthYear || 9999);

function kinOf(person: Person, family: Family | null, index: Index): { person: Person; rel: string }[] {
  const byId = new Map((family?.people || []).map((p) => [p.id, p]));
  const ids = (m: Map<string, string[]>, id: string) => (m.get(id) || []).filter((x) => byId.has(x));
  const parents = ids(index.parentsOf, person.id);
  const partners = ids(index.spousesOf, person.id);
  const siblings = [...new Set(parents.flatMap((pid) => ids(index.childrenOf, pid)))].filter((x) => x !== person.id);
  const children = ids(index.childrenOf, person.id);
  const seen = new Set<string>();
  const out: { person: Person; rel: string }[] = [];
  for (const group of [parents, partners, siblings, children]) {
    for (const p of group
      .map((x) => byId.get(x)!)
      .filter((p) => p && !p.id.startsWith("story:"))
      .sort(byBirth)) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({ person: p, rel: relationTo(index, p.id, person.id) });
    }
  }
  return out;
}

export default function Kin({ person, family, index, preview }: { person: Person; family: Family | null; index: Index; preview?: boolean }) {
  const kin = kinOf(person, family, index);
  const first = person.givenName || "Their";
  const q = preview ? "?preview=tree" : "";
  return (
    <section className="pk" aria-labelledby="pk-h">
      <h2 id="pk-h" className="pk-h">
        {first}'s family
      </h2>
      {kin.length ? (
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
      ) : (
        <p className="pk-none">Nobody is placed beside {person.givenName || "them"} yet.</p>
      )}
      <Link className="pk-tree" to={`/family${q}`}>
        See {first === "Their" ? "them" : first} in the family tree <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
