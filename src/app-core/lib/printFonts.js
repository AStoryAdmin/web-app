// The serif a printed page is set in.
//
// The book and the printed family tree are set in Georgia. Georgia has "ư"
// and "â" but not Vietnamese's stacked and hooked letters ("ầ", "ễ", "ả",
// "ị"), and a browser drawing "Trần" in it borrows the grave accent from
// another font and sets it beside the letter: "Trâ`n". On a page that holds
// any of those letters, the type is Times New Roman instead, which has them
// all; every other page keeps Georgia. Pure, so it's tested.

const GEORGIA_LACKS = /[\u0300-\u036f\u1ea0-\u1ef9]/;

export function needsFullSerif(text) {
  return GEORGIA_LACKS.test(String(text || "").normalize("NFC"));
}

export const FULL_SERIF = `"Times New Roman", "Noto Serif", Georgia, serif`;

/* A whole printed document, with its Georgia stacks swapped when its text
   needs letters Georgia doesn't have. */
export function withFullSerif(html) {
  if (!needsFullSerif(html)) return html;
  return html.replace(/font-family:\s*Georgia,[^;]*;/g, `font-family: ${FULL_SERIF};`).replace(/font-family:\s*Georgia;/g, `font-family: ${FULL_SERIF};`);
}
