/**
 * A QR code, as inline SVG, for any link: the listening codes in the book,
 * the family's code card, the archive link on a book's last page. The
 * modules come from app-core's encoder (qrcode-generator, error correction
 * M, the same code the printed book draws), so a code on screen is the code
 * on paper. Black on white in every theme: a code is for a camera, not a
 * reader. `label` is what a screen reader says instead of the squares.
 */
import { useMemo } from "react";
import { qrPath } from "../app-core/lib/qr.js";

const QUIET = 4;

export default function QrCode({ value, label, size, className = "", ink = "#111" }: { value: string; label: string; size?: number | string; className?: string; ink?: string }) {
  const { d, size: n } = useMemo(() => qrPath(value) as { d: string; size: number }, [value]);
  const box = n + 2 * QUIET;
  return (
    <svg
      className={`qr-code ${className}`.trim()}
      viewBox={`${-QUIET} ${-QUIET} ${box} ${box}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect x={-QUIET} y={-QUIET} width={box} height={box} fill="#fff" />
      <path d={d} fill={ink} />
    </svg>
  );
}
