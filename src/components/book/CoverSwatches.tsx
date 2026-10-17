/**
 * The seven cover colours, as the samples page offers them: a row of
 * swatches under "Cover colour · Navy". The chosen one is saved on the
 * story's book design, so the phone app sees the same cover.
 */
import { COVER_COLOURS, coverColour } from "./coverColours";

export default function CoverSwatches({ value, onChange, busy = false, tone = "light" }: { value: string; onChange: (key: string) => void; busy?: boolean; tone?: "light" | "dark" }) {
  const cur = coverColour(value);
  return (
    <div className={`bk-swatches ${tone}`}>
      <span className="bk-sw-label">
        Cover colour · <b>{cur.name}</b>
      </span>
      <div className="bk-sw-row" role="group" aria-label="Cover colour">
        {COVER_COLOURS.map((c) => (
          <button
            key={c.key}
            type="button"
            className="bk-sw"
            style={{ ["--sw" as string]: c.board }}
            aria-pressed={c.key === cur.key}
            aria-label={`${c.name} cover`}
            title={c.name}
            disabled={busy}
            onClick={() => onChange(c.key)}
          />
        ))}
      </div>
    </div>
  );
}
