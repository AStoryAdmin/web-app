/**
 * One choice among a few, each a card carrying its specimen, its name and
 * one line (the phone's Specimen row). Native radio buttons underneath, so
 * the arrow keys move between them and a screen reader hears a group; A
 * Story's own pick is marked, so a family that changes nothing can see it
 * chose nothing wrong.
 */
import type { ReactNode } from "react";

export type ChoiceCard = { key: string; name: string; note: string; specimen: ReactNode };

export default function ChoiceCards({
  name,
  label,
  options,
  value,
  pick,
  onChange,
}: {
  /** The radio group's name, unique on the page. */
  name: string;
  label: string;
  options: ChoiceCard[];
  value: string;
  /** A Story's pick: marked "Our pick". */
  pick: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="bd-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.key} className="bd-choice" data-on={o.key === value || undefined}>
          <input className="sr-only" type="radio" name={name} value={o.key} checked={o.key === value} onChange={() => onChange(o.key)} />
          <span className="bd-choice-specimen">{o.specimen}</span>
          <span className="bd-choice-words">
            <b>{o.name}</b>
            <span>{o.note}</span>
            {o.key === pick && <span className="bd-pick">Our pick</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
