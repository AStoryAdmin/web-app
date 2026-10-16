// The outside of the keepsake book, as the design team's template draws it
// (coverbook.pdf): a square front, a spine, and a square back. Every
// position and size below was measured off the template's spread and is a
// fraction of the cover's width, in CSS container units (cqw), so the same
// fragments draw the cover page inside the book (legacyBook.js) and the
// full wraparound a printer puts on the case (buildCoverWrapHtml), at
// whatever size either is.
//
// Plain JS with no React Native, so it prints and tests the same.

import { SCRIPT_FONT_BASE64, TITLE_FONT_BASE64 } from "../theme/bookFonts.js";
import { LOGO, MARK_PATH, BARS_PATH } from "../theme/logoPaths.js";

const esc = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Where each print sits on the front, from the template: the first is the
// one in front, the second is behind it at the top right, the third
// between them at the bottom right. [left, top, width, height, rotation].
export const PRINT_SPOTS = [
  [40.5, 33.2, 32.4, 42.6, -0.4],
  [60.8, 22.0, 32.3, 42.4, 0.5],
  [59.3, 43.5, 28.8, 43.8, 0.3],
];
const Z = [3, 1, 2];

// The spine's width as a share of the cover's, as the template has it. The
// real width depends on the page count and the printer's paper, and is
// theirs to set; this keeps the proportions until then.
export const SPINE_SHARE = 144 / 1702;

function markSvg(color) {
  const [tx, ty] = LOGO.translate;
  return `<svg viewBox="0 0 ${LOGO.size} ${LOGO.size}" aria-hidden="true">
        <g transform="translate(${tx} ${ty}) scale(${LOGO.scale})">
          <path d="${MARK_PATH}" fill="${color}" fill-rule="evenodd"/>
          <path d="${BARS_PATH}" fill="${color}" fill-rule="evenodd"/>
        </g>
      </svg>`;
}

// The sprig at the head of the spine.
export const SPRIG_PATHS = [
  "M12 39 C11.6 30 11.8 21 13.2 9",
  "M11.8 27 C6.4 26 3.6 20.8 4.4 16 C8.8 16.6 11.6 21 11.8 27 Z",
  "M12.4 21 C17.8 19.6 20.4 14 19.4 9.6 C15.2 10.8 12.6 15.4 12.4 21 Z",
  "M13.2 11 C9.6 9.4 9.2 4.4 11.2 1.2 C14.2 3 14.8 7.4 13.2 11 Z",
];
function sprigSvg(color) {
  return `<svg viewBox="0 0 24 40" aria-hidden="true">
        <path d="${SPRIG_PATHS[0]}" stroke="${color}" stroke-width="1.1" fill="none"/>
        ${SPRIG_PATHS.slice(1).map((d) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.1"/>`).join("")}
      </svg>`;
}

// The title fills the cover's width, as "MOMENTS & MEMORIES" does in the
// template, and steps down for a longer one so it stays on one line.
export function titleSize(title) {
  const n = Math.max(1, String(title || "").length);
  // The template's "MOMENTS & MEMORIES" (18 characters) is Montserrat Bold
  // with a cap height of 4.4% of the cover: 6.3cqw at 0.70em per cap.
  return Math.min(6.3, (6.3 * 18) / n);
}

export function keepsakeFrontHtml(words, photos, tone) {
  const prints = photos
    .slice(0, 3)
    .map((uri, i) => {
      const [l, t, w, h, r] = PRINT_SPOTS[i];
      return `<div class="ks-print" style="left:${l}cqw;top:${t}cqw;width:${w}cqw;height:${h}cqw;transform:rotate(${r}deg);z-index:${Z[i]}"><img src="${esc(uri)}" alt=""></div>`;
    })
    .join("\n      ");
  // Without photographs the front is a plain square, which read as
  // unfinished: a thin inner frame, the sprig over the name and the mark
  // at the foot make it a book (BookCover.js draws the same).
  const bare = photos.length
    ? ""
    : `<div class="ks-frame"></div>
      <div class="ks-ornament">${sprigSvg("currentColor")}</div>
      <div class="ks-foot-mark">${markSvg("currentColor")}</div>`;
  return `<div class="ks-front${photos.length ? "" : " ks-no-photos"}${tone === "colour" ? "" : " ks-bw"}">
      ${bare}
      <h1 class="ks-title" style="font-size:${titleSize(words.title)}cqw">${esc(words.title)}</h1>
      <p class="ks-line">${esc(words.line)}</p>
      ${words.name ? `<p class="ks-name">${esc(words.name)}</p>` : ""}
      ${prints}
      <p class="ks-tagline">${esc(words.tagline)}</p>
    </div>`;
}

export function keepsakeBackHtml(words) {
  // The words sit in an inner block: a container's own padding can't be
  // measured in its container units, only its children's positions can.
  return `<div class="ks-back">
      <div class="ks-back-in">
        <p class="ks-to">Dedicated to</p>
        <div class="ks-rule"></div>
        <p class="ks-family">${esc(words.backName)}</p>
        <p class="ks-message">${esc(words.backMessage)}</p>
      </div>
    </div>`;
}

// The spine's words fit between the sprig and the mark: the middle 62% of
// the spine's height, which is (1 / SPINE_SHARE) spine-widths tall. A
// Montserrat Bold capital with its letter-spacing is about 0.84em.
export function spineTextSize(text) {
  const room = (0.62 * 100) / SPINE_SHARE;
  const n = Math.max(1, String(text || "").length);
  return Math.min(30, room / (0.84 * n));
}

export function keepsakeSpineHtml(words, C) {
  return `<div class="ks-spine">
      <div class="ks-sprig">${sprigSvg(C.soft)}</div>
      <p class="ks-spine-text" style="font-size:${spineTextSize(words.spine).toFixed(2)}cqw">${esc(words.spine)}</p>
      <div class="ks-spine-mark">${markSvg(C.soft)}</div>
    </div>`;
}

// The shared stylesheet. `C` is the colourway (BOOK_PRINT.covers.keepsake).
export function keepsakeCss(C) {
  return `
  /* The script face is embedded, not linked: a face that has to be fetched
     may not have arrived when WebKit renders the PDF. */
  @font-face {
    font-family: "AStoryScript";
    src: url(data:font/ttf;base64,${SCRIPT_FONT_BASE64}) format("truetype");
  }
  @font-face {
    font-family: "AStoryTitle";
    font-weight: 700;
    src: url(data:font/ttf;base64,${TITLE_FONT_BASE64}) format("truetype");
  }
  .ks-front, .ks-back, .ks-spine {
    position: relative;
    overflow: hidden;
    container-type: inline-size;
    background: ${C.board};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ks-front, .ks-back { aspect-ratio: 1 / 1; }
  .ks-front p, .ks-back p, .ks-front h1 { margin: 0; }

  .ks-title {
    position: absolute; left: 10.3cqw; right: 6cqw; top: 7.4cqw;
    font-family: "AStoryTitle", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-weight: 700; line-height: 1.1;
    letter-spacing: 0.02em; text-transform: uppercase; white-space: nowrap;
    color: ${C.ink};
  }
  .ks-line {
    position: absolute; left: 10.6cqw; top: 15.8cqw;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 2.35cqw; letter-spacing: 0.12em; text-transform: uppercase;
    color: ${C.ink};
  }
  .ks-name {
    position: absolute; left: 6cqw; right: 42cqw; top: 25.5cqw;
    font-family: "AStoryScript", cursive; font-size: 7.6cqw; line-height: 1.05;
    text-align: right; color: ${C.script};
  }
  .ks-print {
    position: absolute; box-sizing: border-box;
    background: ${C.print}; padding: 1.7cqw 1.7cqw 3.2cqw;
    box-shadow: 0 0.3cqw 1.1cqw rgba(0, 0, 0, 0.32);
  }
  .ks-print img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .ks-bw .ks-print img { filter: grayscale(1) sepia(0.12) contrast(1.04); }
  .ks-tagline {
    position: absolute; left: 11.5cqw; top: 79.5cqw; width: 50cqw;
    transform: rotate(-4deg); transform-origin: left center;
    font-family: "AStoryScript", cursive; font-size: 6.1cqw; line-height: 1.05;
    color: ${C.script};
  }
  /* Without photographs the words take the cover: the name large, centred. */
  .ks-no-photos .ks-name { left: 8cqw; right: 8cqw; top: 47cqw; font-size: 11cqw; text-align: center; }
  .ks-frame { position: absolute; inset: 4.5cqw; border: 0.25cqw solid ${C.soft}; opacity: 0.55; pointer-events: none; }
  .ks-frame::after { content: ""; position: absolute; inset: 1.2cqw; border: 0.12cqw solid ${C.soft}; opacity: 0.7; }
  .ks-ornament { position: absolute; left: 44cqw; width: 12cqw; top: 24cqw; color: ${C.soft}; }
  .ks-ornament svg { display: block; width: 100%; height: auto; }
  .ks-foot-mark { position: absolute; left: 46cqw; width: 8cqw; bottom: 7cqw; color: ${C.soft}; }
  .ks-foot-mark svg { display: block; width: 100%; height: auto; }
  .ks-no-photos .ks-tagline { left: 8cqw; right: 8cqw; width: auto; text-align: center; transform: none; }

  .ks-back-in {
    position: absolute; left: 0; right: 0; top: 31cqw;
    display: flex; flex-direction: column; align-items: center;
  }
  .ks-to {
    font-family: Georgia, "Times New Roman", serif; font-size: 2.3cqw;
    letter-spacing: 0.04em; color: ${C.script};
  }
  .ks-rule { width: 5.9cqw; height: 0.14cqw; background: ${C.soft}; margin: 2.4cqw 0 2.8cqw; }
  .ks-family {
    font-family: "AStoryScript", cursive; font-size: 9.5cqw; line-height: 1.1;
    color: ${C.script}; text-align: center; padding: 0 8cqw;
  }
  .ks-message {
    width: 58cqw; margin-top: 5cqw !important;
    font-family: Georgia, "Times New Roman", serif; font-style: italic;
    font-size: 2.25cqw; line-height: 1.6; letter-spacing: 0.02em; text-align: center;
    color: ${C.script};
  }

  .ks-spine { background: ${C.spine}; height: 100%; }
  .ks-sprig { position: absolute; top: 5%; left: 22%; width: 56%; }
  .ks-spine-text {
    position: absolute; top: 19%; bottom: 19%; left: 0; right: 0; margin: 0;
    display: flex; align-items: center; justify-content: center;
    writing-mode: vertical-rl;
    font-family: "AStoryTitle", "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;
    color: ${C.soft};
  }
  .ks-spine-mark { position: absolute; bottom: 5%; left: 17%; width: 66%; }
  .ks-sprig svg, .ks-spine-mark svg { display: block; width: 100%; height: auto; }
`;
}
