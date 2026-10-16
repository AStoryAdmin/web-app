/**
 * The decade rail on a laptop, and the row of decade chips on a phone: a
 * real timeline, so an organiser can jump to the 1950s without scrolling
 * through the 1990s.
 */
export type Decade = { decade: number; label: string; count: number; year: number };

export function DecadeRail({ decades, active, onPick }: { decades: Decade[]; active: number | null; onPick: (d: Decade) => void }) {
  if (!decades.length) return null;
  return (
    <nav className="arc-decades" aria-label="By decade">
      <h3>By decade</h3>
      {decades.map((d) => (
        <button key={d.decade} type="button" aria-current={active === d.decade ? "true" : undefined} onClick={() => onPick(d)}>
          {d.label} <span>{d.count}</span>
        </button>
      ))}
    </nav>
  );
}

export function DecadeRow({ decades, active, onPick }: { decades: Decade[]; active: number | null; onPick: (d: Decade) => void }) {
  if (decades.length < 2) return null;
  return (
    <div className="chiprow scroll arc-decaderow" role="group" aria-label="Decades">
      {decades.map((d) => (
        <button key={d.decade} type="button" className="chip big" aria-pressed={active === d.decade} onClick={() => onPick(d)} style={{ minHeight: 40 }}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
