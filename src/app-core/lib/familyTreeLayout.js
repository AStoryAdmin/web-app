// Where every card goes on the drawn family tree, and the lines between them.
//
// The tree people picture when they say "family tree": the person in the
// middle, their parents above as a couple, each parent's parents above
// them, fanning out — with an empty "Add parent" card wherever a parent
// isn't known yet, because the gap is where the next tap belongs. Beside
// them, their partner and their brothers and sisters. Below, their children
// and grandchildren.
//
//   ancestors     a pedigree: one couple card above every person, up to
//                 MAX_UP generations, drawn only as far as somebody is known
//                 plus one row of empty slots above them; beside the
//                 parents, their brothers and sisters (aunts and uncles)
//   their level   [+] [older siblings] [person + partner] [younger siblings] [+]
//   descendants   [+] children, each above their own children [+]
//
// The [+] cards at either end of a row are ghosts: faded, dashed, not
// people. They're where the next person on that row goes, on whichever side
// the eye happens to be — so nobody has to find a small + on somebody's
// face to grow the tree. Each card that holds only an empty place carries
// `ghost: true`.
//
// Pure — no React — so it's tested (scripts/test-lib.mjs). It returns cards
// and line segments in unscaled points; FamilyTreeCanvas multiplies by the
// zoom and draws them. Lines are only ever horizontal or vertical: the
// elbowed lines of a printed family tree, which read at a glance and cost
// nothing to draw.

import { isPlaceholder } from "./familyTree.js";

export const PW = 108; // one person's half of a card
export const CH = 148; // card height: room for a two-line name and the years
export const GAP = 16; // between cards on a row
export const ROW = CH + 64; // from one row's top to the next
export const MAX_UP = 4;
// The width of a small round "+" at the end of a row. Only "Add parent"
// keeps a full card, at the top, where the next person is most often
// missing; every other place to add somebody is this, so the people on a
// row aren't outnumbered by empty boxes beside them.
export const PLUS = 56;
// Row-end "+" places. Off: every person card carries its own + instead
// (FamilyTreeCanvas), which always says whose family it adds to. Kept
// switchable so the layout stays tested both ways.
export const ROW_ENDS = false;
// The margin round the whole drawing; row tops sit at this plus a multiple
// of ROW, which is what the canvas snaps its first view to.
export const LAYOUT_MARGIN = 24;

const real = (index, id) => !!id && index.people.has(id) && !isPlaceholder(index.people.get(id));

/* A person's parents, father first. Two at most: a person row holds two. */
function parentsOf(index, id) {
  const ps = [...(index.parentsOf.get(id) || [])].slice(0, 2);
  // Father, then unknown, then mother; stable for two of the same.
  const rank = (p) => ({ M: 0, F: 2 })[index.people.get(p)?.sex] ?? 1;
  ps.sort((a, b) => rank(a) - rank(b));
  // A mother on her own sits on the mother's half, with the empty place
  // for the father beside her — not on his half with hers left empty.
  if (ps.length === 1 && index.people.get(ps[0])?.sex === "F") return [null, ps[0]];
  return [ps[0] || null, ps[1] || null];
}

const byBirth = (index) => (a, b) => {
  const ya = index.people.get(a)?.birthYear || 0;
  const yb = index.people.get(b)?.birthYear || 0;
  if (ya && yb && ya !== yb) return ya - yb;
  if (ya && !yb) return -1;
  if (!ya && yb) return 1;
  return 0;
};

/* Elbowed lines from one card's bottom to the tops of the cards below it:
   down to half-way, across, and down to each — what the printed tree draws.
   The screen draws `curves` instead: one soft S from the parent to each
   child, leaving and arriving straight, like a branch rather than a pipe
   (the owner, 2026-10-19: "gentle, not square — a family feel"). */
function connect(lines, curves, from, tos) {
  if (!tos.length) return;
  const midY = from.y + (tos[0].y - from.y) / 2;
  for (const t of tos) curves.push({ x1: from.x, y1: from.y, x2: t.x, y2: t.y, my: midY });
  lines.push({ x1: from.x, y1: from.y, x2: from.x, y2: midY });
  const xs = [from.x, ...tos.map((t) => t.x)];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  if (hi > lo) lines.push({ x1: lo, y1: midY, x2: hi, y2: midY });
  for (const t of tos) lines.push({ x1: t.x, y1: midY, x2: t.x, y2: t.y });
}

/* The whole drawing for one person in the middle.
   Returns { cards, lines, width, height, focus: { x, y } } where each card is
   { key, x, y, w, h, members: [{ personId, slot, anchorId }] } — a member
   with `slot` is an empty place to add somebody ("parent" | "spouse" |
   "sibling" | "child"), anchored on the person it would be added to.

   `ghosts: false` is the tree as it's printed (lib/familyTreePrint.js): only
   people. No empty places to add anybody, no empty half beside somebody
   without a partner, and a couple card above a person only when one of
   their parents is actually known — a parent known alone is drawn alone. */
export function layoutFamilyTree(index, focusId, { maxUp = MAX_UP, ghosts = true, rowEnds = ROW_ENDS } = {}) {
  if (!index?.people?.has(focusId)) return { cards: [], lines: [], curves: [], width: 0, height: 0, focus: { x: 0, y: 0 } };
  const cards = [];
  const lines = [];
  const curves = [];

  /* ── ancestors ─────────────────────────────────────────────────────────
     A couple card sits above every person known, holding their two
     parents or a slot for each missing one. Above an empty slot there is
     nothing: the tree grows a row at a time, as people are added. A
     placeholder parent (somebody in between that nobody's named) shows as
     a slot, and the tree carries on above it if it has known parents. */
  const showsParents = (id, r) => {
    if (!id || r > maxUp) return false;
    if (ghosts && real(index, id)) return true;
    // A placeholder: only when somebody real is somewhere above it.
    const [f, m] = parentsOf(index, id);
    return [f, m].some((p) => real(index, p) || showsParents(p, r + 1));
  };

  // Width each person's ancestry needs, so couples never overlap.
  const cw = 2 * PW;
  const memo = new Map();
  const spanOf = (id, r) => {
    const key = `${id}|${r}`;
    if (memo.has(key)) return memo.get(key);
    let w = 0;
    if (showsParents(id, r)) {
      const [f, m] = parentsOf(index, id);
      const wf = spanOf(f, r + 1);
      const wm = spanOf(m, r + 1);
      w = Math.max(cw, wf + wm + (wf && wm ? GAP : 0));
    }
    memo.set(key, w);
    return w;
  };

  /* Places the couple above person `id`, centred on `cx`; returns the
     couple card. Its two parents' own couples go above each half. */
  const placeCouple = (id, r, x0, width) => {
    const [f, m] = parentsOf(index, id);
    const wf = spanOf(f, r + 1);
    const wm = spanOf(m, r + 1);
    const inner = wf + wm + (wf && wm ? GAP : 0);
    const start = x0 + (width - inner) / 2;
    const cx = x0 + width / 2;
    const known = [f, m].filter((p) => real(index, p));
    const alone = !ghosts && known.length === 1;
    const card = {
      key: `up:${id}`,
      x: cx - (alone ? PW : cw) / 2,
      y: -r * ROW,
      w: alone ? PW : cw,
      h: CH,
      members: alone
        ? [{ personId: known[0] }]
        : [f, m].map((p) => (real(index, p) ? { personId: p } : { slot: "parent", anchorId: id, personId: null })),
    };
    cards.push(card);
    const halves = alone ? [cx, cx] : [card.x + PW / 2, card.x + PW + PW / 2];
    if (wf) {
      const up = placeCouple(f, r + 1, start, wf);
      connect(lines, curves, { x: up.x + cw / 2, y: up.y + CH }, [{ x: halves[0], y: card.y }]);
    }
    if (wm) {
      const up = placeCouple(m, r + 1, start + (wf ? wf + GAP : 0), wm);
      connect(lines, curves, { x: up.x + cw / 2, y: up.y + CH }, [{ x: halves[1], y: card.y }]);
    }
    return card;
  };

  /* ── their level ─────────────────────────────────────────────────────── */
  const focus = index.people.get(focusId);
  const spouse = (index.spousesOf.get(focusId) || []).find((s) => real(index, s)) || null;
  const [pf, pm] = parentsOf(index, focusId);
  const sibs = new Set();
  for (const p of [pf, pm]) for (const c of index.childrenOf.get(p) || []) if (c !== focusId && real(index, c)) sibs.add(c);
  const siblings = [...sibs].sort(byBirth(index));
  const fy = focus?.birthYear || 0;
  const older = siblings.filter((s) => fy && (index.people.get(s)?.birthYear || 0) && index.people.get(s).birthYear < fy);
  const younger = siblings.filter((s) => !older.includes(s));

  const ghostSibling = (key) => ({ key, ghost: true, plus: true, members: [{ slot: "sibling", anchorId: focusId, personId: null }] });
  const row0 = [
    ...(ghosts && rowEnds ? [ghostSibling("add:sibling:left")] : []),
    ...older.map((s) => ({ key: `sib:${s}`, members: [{ personId: s }] })),
    {
      key: `focus:${focusId}`,
      focus: true,
      members: [
        { personId: focusId },
        ...(spouse ? [{ personId: spouse }] : ghosts ? [{ slot: "spouse", anchorId: focusId, personId: null }] : []),
      ],
    },
    ...younger.map((s) => ({ key: `sib:${s}`, members: [{ personId: s }] })),
    ...(ghosts && rowEnds ? [ghostSibling("add:sibling")] : []),
  ];
  for (const c of row0) c.w = c.plus ? PLUS : c.members.length * PW;
  const row0Width = row0.reduce((s, c) => s + c.w, 0) + GAP * (row0.length - 1);

  /* ── descendants ─────────────────────────────────────────────────────── */
  const kidsOf = (ids) => {
    const out = new Set();
    for (const id of ids) for (const c of index.childrenOf.get(id) || []) if (real(index, c)) out.add(c);
    return [...out].sort(byBirth(index));
  };
  const children = kidsOf([focusId, spouse].filter(Boolean));
  const grandOf = new Map(children.map((c) => [c, kidsOf([c])]));
  // A child's row of their own children, with room for a "+" at its end
  // (their next child — the grandchildren's brother or sister), so whoever
  // is on that row, often the person holding the phone, can add to it.
  const ends = ghosts && rowEnds;
  const grandRow = (c) => grandOf.get(c).length * (PW + GAP) - GAP + (ends ? GAP + PLUS : 0);
  const childSpan = (c) => Math.max(PW, grandOf.get(c).length ? grandRow(c) : PW);
  // An "Add child" ghost at each end once there are children; one, under
  // the person, before there are any.
  const downUnits = [
    ...(ends && children.length ? [{ id: null, w: PLUS, key: "add:child:left" }] : []),
    ...children.map((c) => ({ id: c, w: childSpan(c) })),
    ...(ends ? [{ id: null, w: PLUS, key: "add:child" }] : []),
  ];
  const downWidth = downUnits.length ? downUnits.reduce((s, u) => s + u.w, 0) + GAP * (downUnits.length - 1) : 0;

  /* ── put it together, around one centre line ─────────────────────────── */
  const upWidth = spanOf(focusId, 1);
  // Their partner's parents too, above the partner's half of the card: one
  // family tree, whoever is in the middle. Without them, Hưng's parents,
  // added from his own sheet, vanished whenever Mai was in the middle.
  const spouseUp = spouse ? spanOf(spouse, 1) : 0;
  const upTotal = upWidth + spouseUp + (upWidth && spouseUp ? GAP : 0);
  const width = Math.max(upTotal, row0Width, downWidth, PW);
  const centre = width / 2;

  let parentsCard = null;
  let spouseParentsCard = null;
  if (spouseUp) {
    // Side by side, meeting over the middle of the couple: the person's
    // parents on the left over their half, the partner's on the right.
    if (upWidth) parentsCard = placeCouple(focusId, 1, centre - GAP / 2 - upWidth, upWidth);
    spouseParentsCard = placeCouple(spouse, 1, upWidth ? centre + GAP / 2 : centre - spouseUp / 2 + PW / 2, spouseUp);
  } else if (upWidth) {
    parentsCard = placeCouple(focusId, 1, centre - upWidth / 2, upWidth);
  }

  /* Aunts and uncles: the parents' brothers and sisters, on the parents'
     row — Dad's to the left, Mum's to the right, nearest first — each with
     their partner when there is one, and joined to the grandparents' line.
     A tree without them showed Mum's younger brother only as a chip under
     the drawing, which is the one relative people go looking for first.
     Their children (cousins) stay in the chips: drawing them would need the
     person's own row, where brothers and sisters already are. */
  if (parentsCard) {
    const side = (parent, dir, from) => {
      if (!real(index, parent)) return from;
      const [gf, gm] = parentsOf(index, parent);
      const ids = new Set();
      for (const g of [gf, gm]) for (const c of index.childrenOf.get(g) || []) if (c !== parent && real(index, c)) ids.add(c);
      // Nearest the parents' card first: the eldest of Dad's side sits
      // furthest out on the left, the youngest of Mum's on the right.
      const sorted = [...ids].sort(byBirth(index));
      const order = dir < 0 ? sorted.reverse() : sorted;
      let edge = from ?? (dir < 0 ? parentsCard.x - GAP : parentsCard.x + parentsCard.w + GAP);
      const tops = [];
      for (const id of order) {
        const partner = (index.spousesOf.get(id) || []).find((s) => real(index, s) && s !== parent);
        const members = partner ? [{ personId: id }, { personId: partner }] : [{ personId: id }];
        // Their own half is the one nearest the line, so it reads as theirs.
        if (dir < 0 && partner) members.reverse();
        const w = members.length * PW;
        const cx = dir < 0 ? edge - w : edge;
        cards.push({ key: `aunt:${id}`, x: cx, y: parentsCard.y, w, h: CH, members });
        const ownHalf = dir < 0 && partner ? cx + PW + PW / 2 : cx + PW / 2;
        tops.push({ x: ownHalf, y: parentsCard.y });
        edge = dir < 0 ? cx - GAP : cx + w + GAP;
      }
      // Then a ghost at the outer end: another aunt or uncle on this side.
      if (ghosts && rowEnds) cards.push({
        key: `add:aunt:${parent}`,
        ghost: true,
        plus: true,
        x: dir < 0 ? edge - PLUS : edge,
        y: parentsCard.y,
        w: PLUS,
        h: CH,
        members: [{ slot: "aunt", anchorId: parent, personId: null }],
      });
      const up = cards.find((c) => c.key === `up:${parent}`);
      if (up && tops.length) connect(lines, curves, { x: up.x + up.w / 2, y: up.y + CH }, tops);
      return edge;
    };
    const left = side(pf, -1);
    // With the partner's parents on the right, Mum's side goes on the left
    // too, after Dad's, rather than on top of them.
    if (spouseParentsCard) side(pm, -1, left);
    else side(pm, 1);
  }

  // Their row: laid out so the person (and partner) sit under the centre.
  const focusIdx = row0.findIndex((c) => c.focus);
  const beforeFocus = row0.slice(0, focusIdx).reduce((s, c) => s + c.w + GAP, 0);
  let x = centre - (beforeFocus + row0[focusIdx].w / 2);
  const placedRow0 = row0.map((c) => {
    const card = {
      key: c.key,
      x,
      y: 0,
      w: c.w,
      h: CH,
      members: c.members,
      focus: !!c.focus,
      ...(c.ghost ? { ghost: true } : {}),
      ...(c.plus ? { plus: true } : {}),
    };
    x += c.w + GAP;
    cards.push(card);
    return card;
  });
  if (parentsCard) {
    // The parents' line runs to everyone they're parent of on this row: the
    // person (their own half of the card) and each brother and sister.
    const tos = placedRow0
      .filter((c) => c.focus || c.key.startsWith("sib:"))
      .map((c) => ({ x: c.focus ? c.x + PW / 2 : c.x + c.w / 2, y: c.y }));
    connect(lines, curves, { x: parentsCard.x + parentsCard.w / 2, y: parentsCard.y + CH }, tos);
  }

  // Children under the person (or the couple), grandchildren under each child.
  const focusCard = placedRow0[focusIdx];
  if (spouseParentsCard) {
    connect(lines, curves, { x: spouseParentsCard.x + spouseParentsCard.w / 2, y: spouseParentsCard.y + CH }, [
      { x: focusCard.x + PW + PW / 2, y: 0 },
    ]);
  }
  const focusFrom = { x: focusCard.x + (spouse ? focusCard.w / 2 : PW / 2), y: CH };
  let dx = focusFrom.x - downWidth / 2;
  const childTops = [];
  for (const u of downUnits) {
    const cx = dx + u.w / 2;
    const card = u.id
      ? { key: `kid:${u.id}`, x: cx - PW / 2, y: ROW, w: PW, h: CH, members: [{ personId: u.id }] }
      : { key: u.key, ghost: true, plus: true, x: cx - PLUS / 2, y: ROW, w: PLUS, h: CH, members: [{ slot: "child", anchorId: focusId, personId: null }] };
    cards.push(card);
    if (u.id) childTops.push({ x: cx, y: ROW });
    if (u.id && grandOf.get(u.id).length) {
      const g = grandOf.get(u.id);
      let gx = cx - grandRow(u.id) / 2;
      const tops = [];
      for (const id of g) {
        cards.push({ key: `grand:${id}`, x: gx, y: 2 * ROW, w: PW, h: CH, members: [{ personId: id }] });
        tops.push({ x: gx + PW / 2, y: 2 * ROW });
        gx += PW + GAP;
      }
      connect(lines, curves, { x: cx, y: ROW + CH }, tops);
      if (ends) {
        cards.push({ key: `add:grand:${u.id}`, ghost: true, plus: true, x: gx, y: 2 * ROW, w: PLUS, h: CH, members: [{ slot: "child", anchorId: u.id, personId: null }] });
      }
    } else if (u.id && ends) {
      // No children yet: the "+" for their first sits under them.
      cards.push({ key: `add:grand:${u.id}`, ghost: true, plus: true, x: cx - PLUS / 2, y: 2 * ROW, w: PLUS, h: CH, members: [{ slot: "child", anchorId: u.id, personId: null }] });
    }
    dx += u.w + GAP;
  }
  if (childTops.length) connect(lines, curves, focusFrom, childTops);

  // Normalise to start at (0, 0), with a margin round the edge.
  const M = LAYOUT_MARGIN;
  const minX = Math.min(...cards.map((c) => c.x));
  const minY = Math.min(...cards.map((c) => c.y));
  const maxX = Math.max(...cards.map((c) => c.x + c.w));
  const maxY = Math.max(...cards.map((c) => c.y + c.h));
  const ox = M - minX;
  const oy = M - minY;
  for (const c of cards) {
    c.x += ox;
    c.y += oy;
  }
  for (const l of [...lines, ...curves]) {
    l.x1 += ox;
    l.x2 += ox;
    l.y1 += oy;
    l.y2 += oy;
  }
  for (const c of curves) c.my += oy;
  return {
    cards,
    lines,
    curves,
    width: maxX - minX + 2 * M,
    height: maxY - minY + 2 * M,
    // focusCard is one of `cards`, so it has been moved already.
    focus: { x: focusCard.x + focusCard.w / 2, y: focusCard.y + CH / 2 },
  };
}
