// QR codes for the printed book, as SVG, from qrcode-generator (pure JS, so
// it runs the same in the app, in expo-print and in the tests).
import qrcode from "qrcode-generator";

// The dark modules of a code as one SVG path, in module units, plus the
// size. Error correction M: a book gets scuffed, and M still reads with 15%
// of the code gone, without making the code larger than a page can hold.
export function qrPath(text) {
  const qr = qrcode(0, "M");
  qr.addData(String(text));
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return { d, size: n };
}

// A whole code, with the four-module quiet zone scanners need, as markup.
export function qrSvg(text, color = "#000") {
  const { d, size } = qrPath(text);
  const q = 4;
  return `<svg viewBox="${-q} ${-q} ${size + 2 * q} ${size + 2 * q}" shape-rendering="crispEdges" aria-hidden="true"><rect x="${-q}" y="${-q}" width="${size + 2 * q}" height="${size + 2 * q}" fill="#fff"/><path d="${d}" fill="${color}"/></svg>`;
}
