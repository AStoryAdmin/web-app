// The outside of the keepsake book, as the design team's template draws it
// (coverbook.pdf): a square front, a spine, and a square back. Every
// position and size below was measured off the template's spread and is a
// fraction of the cover's width, in CSS container units (cqw), so the same
// fragments draw the cover page inside the book (legacyBook.js) and the
// full wraparound a printer puts on the case (buildCoverWrapHtml), at
// whatever size either is.
//
// Plain JS with no React Native, so it prints and tests the same.

import { SCRIPT_FONT_BASE64 } from "../theme/bookFonts.js";
import { SERIF_FONT_BASE64 } from "./bookSerifFont.js";
import { LOGO, MARK_PATH, BARS_PATH } from "../theme/logoPaths.js";

const esc = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

/* The title, set as a binder sets one (lane K, s89 round 2, replacing the
   template's heavy Montserrat Bold capitals, which read as a template): the
   book's serif, Cormorant Garamond SemiBold, in capitals spaced a tenth of
   an em, stamped in the board's ink; under it a short foil rule and the
   line in the serif's small capitals. Same place on the board as the
   template's, so the prints and the name don't move. A capital with its
   spacing is about 0.72em; the title fills up to 82cqw and steps down for a
   longer one so it stays on one line. */
export const TITLE_TRACK = 0.1;
export function titleSize(title) {
  const n = Math.max(1, String(title || "").length);
  return Math.min(6.2, 82 / (0.72 * n));
}
// The foil of the rule: gold on the dark boards, an antique gold on the
// light ones (cream, mustard), where gold leaf would vanish.
export function foilOf(C) {
  const lightBoard = /^#?[0-3]/.test(String(C?.ink || ""));
  return lightBoard ? "#8A6A2C" : "#C9A15A";
}

/* The front as a cloth-bound book (judges s89 final; BookCover.js draws the
   same board, lane B rulings B-2 and B-6): the title stamped in foil,
   centred over the board's face, a short foil rule and the line; the
   photographs set into the board through debossed windows, each in a fine
   foil fillet, her name written under them. The motto prints only when the
   family wrote their own line (`ownLine`; the default keeps the old call's
   behaviour). Without a photograph: the frames, the sprig over the name
   and the mark. */

/* The windows for one, two or three photographs, in cqw of the front:
   [left, top, width, height], centred on the face right of the hinge
   (52.25). One: a single window. Two: a pair side by side, as two plates
   in one board. Three: one large and two small stacked beside it, the
   bookbinder's triptych (B-6; never a scattered collage). */
export const KEEPSAKE_WINDOWS = {
  1: [[29, 27.5, 46.5, 45]],
  2: [[22.75, 29, 27, 40], [54.75, 29, 27, 40]],
  3: [[26.75, 27.5, 29, 45], [60.75, 27.5, 17, 20], [60.75, 52.5, 17, 20]],
};
// The fillet stands this far out from a window: wider round one window.
export const filletGap = (n) => (n === 1 ? 1.9 : 1.4);
// Where her name sits: under the windows' foot.
export const nameTop = (n) => {
  const ws = KEEPSAKE_WINDOWS[n] || KEEPSAKE_WINDOWS[1];
  return Math.max(...ws.map(([, t, , h]) => t + h)) + 4.6;
};
export const COVER_PRINTS_MAX = 3;
/* The photographs the front sets, from keepsakePhotos' list: the family's
   chosen ones (up to three, in the order they chose them), else only the
   story's first (the default cover is one window). `noPhoto` is already
   an empty list. */
export function coverPrints(design, photos) {
  const chosen = (design?.cover?.photos || []).length > 0;
  return (photos || []).slice(0, chosen ? COVER_PRINTS_MAX : 1);
}

export function keepsakeFrontHtml(words, photos, tone, ownLine = words?.tagline || "") {
  const n = Math.min(COVER_PRINTS_MAX, photos.length);
  const line = String(ownLine || "").trim();
  const g = filletGap(n);
  const windows = (KEEPSAKE_WINDOWS[n] || [])
    .map(([l, t, w, h], i) => `<div class="ks-fillet" style="left:${l - g}cqw;top:${t - g}cqw;width:${w + 2 * g}cqw;height:${h + 2 * g}cqw"></div>
      <div class="ks-window" style="left:${l}cqw;top:${t}cqw;width:${w}cqw;height:${h}cqw"><img src="${esc(photos[i])}" alt=""></div>
      <div class="ks-window-light" style="left:${l}cqw;top:${t + h}cqw;width:${w}cqw"></div>`)
    .join("");
  const inner = n
    ? `${windows}
      ${words.name ? `<p class="ks-name" style="top:${nameTop(n)}cqw">${esc(words.name)}</p>` : ""}
      ${line ? `<p class="ks-own">${esc(line)}</p>` : ""}`
    : `<div class="ks-frame"></div>
      <div class="ks-ornament">${sprigSvg("currentColor")}</div>
      <div class="ks-foot-mark">${markSvg("currentColor")}</div>
      ${words.name ? `<p class="ks-name">${esc(words.name)}</p>` : ""}
      ${line ? `<p class="ks-tagline">${esc(line)}</p>` : ""}`;
  return `<div class="ks-front${n ? "" : " ks-no-photos"}${tone === "colour" ? "" : " ks-bw"}">
      <div class="ks-head">
        <h1 class="ks-title" style="font-size:${titleSize(words.title)}cqw">${esc(words.title)}</h1>
        <div class="ks-title-rule"></div>
        <p class="ks-line">${esc(words.line)}</p>
      </div>
      ${inner}
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
// serif capital with its letter-spacing is about 0.74em.
export function spineTextSize(text) {
  const room = (0.62 * 100) / SPINE_SHARE;
  const n = Math.max(1, String(text || "").length);
  return Math.min(30, room / (0.74 * n));
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
    font-family: "AStorySerif";
    font-weight: 600;
    src: url(data:font/otf;base64,${SERIF_FONT_BASE64}) format("opentype");
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

  /* The head, centred over the board's face (right of the hinge). */
  .ks-head {
    position: absolute; left: 4.5cqw; right: 0; top: 8.2cqw;
    display: flex; flex-direction: column; align-items: center;
  }
  .ks-no-photos .ks-head { top: 9.5cqw; }
  .ks-title {
    max-width: 88cqw; text-align: center;
    font-family: "AStorySerif", Georgia, "Times New Roman", serif;
    font-weight: 600; line-height: 1.1;
    letter-spacing: ${TITLE_TRACK}em; padding-left: ${TITLE_TRACK}em; text-transform: uppercase; white-space: nowrap;
    color: ${foilOf(C)};
    text-shadow: 0 -0.12cqw 0 rgba(0, 0, 0, 0.35);
  }
  .ks-title-rule { width: 7cqw; height: 0.22cqw; margin-top: 1.6cqw; background: ${foilOf(C)}; }
  .ks-line {
    margin-top: 1.6cqw !important;
    font-family: "AStorySerif", Georgia, "Times New Roman", serif; font-weight: 600;
    font-size: 2.2cqw; line-height: 1.18; letter-spacing: 0.18em; padding-left: 0.18em; text-transform: uppercase;
    color: ${C.ink}; opacity: 0.85;
  }
  /* The window: the board pressed down, the photograph in it; the fillet
     1.9cqw outside it; the lower edge catching the light. */
  .ks-window { position: absolute; overflow: hidden; background: ${C.spine}; }
  .ks-window::after {
    content: ""; position: absolute; inset: 0;
    box-shadow: inset 0 1.3cqw 1.3cqw -0.2cqw rgba(0, 0, 0, 0.5), inset 0.8cqw 0 0.8cqw -0.2cqw rgba(0, 0, 0, 0.35), inset 0 0 0 0.2cqw rgba(0, 0, 0, 0.45);
  }
  .ks-window img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .ks-bw .ks-window img { filter: grayscale(1) sepia(0.12) contrast(1.04); }
  .ks-fillet {
    position: absolute; box-sizing: border-box;
    border: 0.28cqw solid ${foilOf(C)}; opacity: 0.9;
  }
  .ks-window-light { position: absolute; height: 0.25cqw; background: rgba(255, 255, 255, 0.14); }
  .ks-name {
    position: absolute; left: 10.5cqw; right: 6cqw;
    font-family: "AStoryScript", cursive; font-size: 7.4cqw; line-height: 1.05;
    text-align: center; color: ${C.script};
  }
  .ks-own {
    position: absolute; left: 12.5cqw; right: 8cqw; top: 91cqw;
    font-family: Georgia, "Times New Roman", serif; font-style: italic; font-size: 2.6cqw; line-height: 1.2;
    text-align: center; color: ${C.ink}; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  /* Without photographs the words take the cover: the name large, centred. */
  .ks-no-photos .ks-name { left: 8cqw; right: 8cqw; top: 49cqw; font-size: 11cqw; }
  .ks-frame { position: absolute; inset: 4.5cqw; border: 0.25cqw solid ${C.soft}; opacity: 0.55; pointer-events: none; }
  .ks-frame::after { content: ""; position: absolute; inset: 1.2cqw; border: 0.12cqw solid ${C.soft}; opacity: 0.7; }
  .ks-ornament { position: absolute; left: 44cqw; width: 12cqw; top: 26cqw; color: ${C.soft}; }
  .ks-ornament svg { display: block; width: 100%; height: auto; }
  .ks-foot-mark { position: absolute; left: 46cqw; width: 8cqw; bottom: 7cqw; color: ${C.soft}; }
  .ks-foot-mark svg { display: block; width: 100%; height: auto; }
  .ks-tagline {
    position: absolute; left: 8cqw; right: 8cqw; top: 71.5cqw; text-align: center;
    font-family: "AStoryScript", cursive; font-size: 6.1cqw; line-height: 1.05; color: ${C.script};
  }

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
    /* Every glyph turned with the line, as a spine is set: "mixed" left the
       curly apostrophe upright ("ROSE - S STORY"). */
    -webkit-text-orientation: sideways; text-orientation: sideways;
    font-family: "AStorySerif", Georgia, "Times New Roman", serif; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
    color: ${C.soft};
  }
  .ks-spine-mark { position: absolute; bottom: 5%; left: 17%; width: 66%; }
  .ks-sprig svg, .ks-spine-mark svg { display: block; width: 100%; height: auto; }
`;
}
