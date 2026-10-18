/**
 * Treasured, as a wax seal pressed onto the memory (docs/research/
 * decoration-2026.md D4): an irregular pool of terracotta wax, the raised
 * rim where the stamp pressed, a thin brass ring, and the A pressed into
 * it. 34px on a print, 56px beside a memory's title, 20px in a list row
 * (where the rim and ring are dropped). It is a state, so it only appears
 * on memories rated as treasured, and it never moves at rest.
 */
export default function WaxSeal({ size = 34, className = "", label }: { size?: number; className?: string; label?: string }) {
  const small = size <= 20;
  return (
    <span className={`seal${small ? " small" : ""} ${className}`} style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <path
          className="wax"
          d="M58.8 27.3 Q61.3 32.0 59.3 36.8 Q59.8 42.1 56.0 45.8 Q55.5 51.7 49.4 52.7 Q46.6 57.4 41.2 57.2 Q37.1 61.0 32.0 59.5 Q26.8 61.2 22.8 57.3 Q17.8 56.6 14.6 52.7 Q9.5 50.9 8.5 45.6 Q4.0 42.2 5.6 36.7 Q1.7 32.0 5.0 27.2 Q5.5 22.4 8.3 18.3 Q9.9 13.5 14.0 10.6 Q17.9 7.6 22.6 6.1 Q26.7 2.1 32.0 4.3 Q37.2 2.5 41.4 6.2 Q46.0 7.7 49.8 10.8 Q55.6 12.2 55.8 18.3 Q60.9 21.5 58.8 27.3Z"
        />
        {!small && <circle className="rim" cx="32" cy="32" r="21.5" />}
        {!small && <circle className="ring" cx="32" cy="32" r="19" />}
      </svg>
      <i className="seal-a" />
    </span>
  );
}
