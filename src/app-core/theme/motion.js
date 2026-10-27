/* ── MOTION: the app's one motion vocabulary ────────────────────────────

   Plain numbers, no React Native import, so this file is readable from the
   node test bundle like the rest of src/theme. The Reanimated side (timing
   and spring configs, Reduce Motion, haptics) lives in
   src/components/motion.js, which reads these.

   The values are the live web app's (docs/agents/web-details.md §1.7, read
   from web-app/src/styles/astory.css), and the rules are its DESIGN.md and
   docs/agents/market-research.md §3:

   - How often is it seen? A hundred times a day: a press, nothing more.
     Tens of times: barely (≤200 ms). Occasionally: standard (≤360 ms).
     The first time: an arrival (≤1.2 s).
   - Nothing moves sideways. Pages rise and settle or cross-fade; only a
     sheet travels further than ~24 px.
   - Entering and feedback ease OUT (fast, then settling); movement on
     screen eases in-out (MOVE). Never ease-in on interface. No bounce, no
     overshoot — the live web app has none, and neither does this.
   - Nothing appears from nothing: from 0.95 with opacity, never from 0.
   - Under Reduce Motion every motion becomes a plain fade at the same
     duration, or nothing. */

export const MOTION = {
  // Milliseconds.
  duration: {
    instant: 80,
    // A press going down, and coming back. The web: 120 ms.
    press: 120,
    // A colour or selection change: a chip, a toggle, a tab.
    quick: 160,
    // Standard interface change (--dur-ui).
    ui: 200,
    // A page cross-fading in the stack.
    screen: 240,
    // A sheet rising (--dur-sheet).
    sheet: 360,
    // Into a call: a slower dissolve into the dark room.
    immersive: 420,
    // A photograph developing; an ornament drawing itself.
    arrive: 600,
    // The loading heart drawing its one stroke.
    draw: 720,
    // One skeleton breath (half a cycle).
    shimmer: 900,
    // A photograph appearing once it has loaded: quick enough that a
    // cached one isn't held back, slow enough not to pop (premium-feel.md).
    develop: 320,
    // A number counting up to itself as the ring it counts draws in.
    countUp: 900,

    // The hero path (docs/agents/overnight/hero-spec.md §1.1). Each is an
    // occasional moment, not an interface change, so each is allowed past
    // the 300 ms UI budget, once, with a frame strip (DECISIONS B26). All
    // four travel, so all four ease MOVE.
    // The gold marker drawn under her own words, left to right, line by line.
    marker: 420,
    // The question card becoming the review's page (H2c).
    cardGrow: 520,
    // The book's cover hinging open (H5b).
    coverOpen: 640,
    // The gilt edge's one glint after a keep (H5a).
    glint: 600,
    // A print or a book turned over to its back (MOVE); coverOpen's time.
    flip: 640,
  },

  // The keep (H3b): the press, the seal, the stamp and "Kept." all happen
  // inside this hold, counted from the press, before the page moves on.
  ceremony: { hold: 1800 },

  // A page's arrival inside the templates (TabRootScreen, DetailScreen):
  // the paper is there at once and its blocks rise in right behind the
  // tap, 40 ms apart, so a page is never blank paper waiting for its
  // words. Home's launch arrival keeps the slower web values
  // (screens/dashboard/arrival.js) — it is seen once a day.
  page: {
    sheetDelay: 0,
    sheetDuration: 480,
    linesFrom: 60,
    stagger: 40,
    lineDuration: 420,
    lineRise: 10,
    // The web build has no native page fade under the content: there the
    // first block is moving from 0, so a page is never blank paper.
    firstBlockWeb: 0,
  },

  // The arrival's decorations (DECISIONS M2; motion-plan §1.1–§1.2, §1.13):
  // first visit per session only, never delaying a task; Reduce Motion
  // turns each into a duration.ui fade. `at` is the delay (ms).
  arrival: {
    // The title's masked line rise (OUT); `from` is the line's travel in
    // line heights.
    title: { at: 50, duration: 900, stagger: 90, from: 1.1 },
    // The short foil rule stamped from the left (MOVE).
    foil: { at: 450, duration: 800 },
    // The headband sewn on along the sheet's top: a clip wipe (OUT); cold
    // on a first launch, warm after a page change.
    headband: { cold: 500, warm: 150, duration: 700 },
    // A rail drawn from the top (MOVE).
    rail: { at: 100, duration: 900 },
    // A ✦ or year rule drawn as it enters view (OUT).
    rule: { at: 150, duration: 900 },
    // The tree's threads, after the faces (OUT).
    threads: { at: 600, duration: 500 },
    // Today's ink on the week strip, once a day (OUT).
    ink: { poolAt: 100, pool: 800, dotAt: 180, dot: 450 },
    // The memory print's black corners sliding in (OUT).
    corners: { duration: 360, stagger: 40, travel: 4 },
  },

  // Any line or number that changes while seen: the old lifts `travel` and
  // fades over `out`; the new settles from +travel over `in` (OUT), `at`
  // after.
  swap: { out: 120, in: 240, at: 60, travel: 4 },
  // A list re-filtered, re-sorted or searched: the new content develops
  // from `from` (never from nothing); typing waits `debounce`.
  listSwap: { from: 0.35, duration: 150, debounce: 150 },
  // Heights and neighbours moving (MOVE).
  layout: { duration: 240 },
  // Leaving a list: fade, then fold (OUT then MOVE).
  fold: { fade: 160, close: 200 },
  // A popover menu: in from scale.enterFrom (OUT), out (OUT), a 2 pt lift.
  menu: { in: 160, out: 120, lift: 2 },
  // A task sheet's top corners (navigation/TaskSheet). The paper sheet's
  // own round is RADIUS.sheetTop; it squares only under the condensed
  // strip's foot (Paper.js, M4, FB-298).
  sheetRadius: { from: 22 },
  // Busy shows only after this long (a fast save never flashes "Saving…").
  busyAfter: 300,
  // How long an undo line holds (H24).
  undoHold: 5000,
  // A web alert ignores backdrop taps this long after it opens (a double
  // tap must not close what it just opened).
  alertGuard: 400,


  // A bottom sheet under the finger (components/Sheet.js). Let go past a
  // third of its height, or flick faster than closeVelocity (pt/s), and it
  // goes; otherwise it settles back on spring.sheet. Pulled up, it gives
  // at most `overpull` points.
  // A tall sheet shouldn't need a 220 pt pull: closeDistance caps the
  // third. A release whose speed would carry it past half way (Apple's
  // momentum projection) goes too.
  sheetDrag: { closeFraction: 0.3, closeDistance: 160, closeVelocity: 900, overpull: 24 },

  // A header as the page scrolls under it (the templates' bands): the big
  // title leaves by `fadeBy` × its row, drifting at `parallax` × the
  // scroll, so it is gone before the condensed strip takes over — never a
  // half-clipped title under the clock. A photograph band drifts at
  // `heroParallax` and stretches to fill an over-pull.
  scrollHeader: { fadeBy: 0.6, parallax: 0.35, heroParallax: 0.4 },

  // Cubic beziers, as [x1, y1, x2, y2] — the web app's two, verbatim.
  easing: {
    // OUT: everything entering, every press. --ease-out, GSAP "house-out".
    out: [0.23, 1, 0.32, 1],
    // MOVE: something travelling on screen — a pill moving, a rule drawing.
    inOut: [0.77, 0, 0.175, 1],
    // A loop (a live mic, a skeleton): symmetric, so it never snaps.
    breathe: [0.45, 0, 0.55, 1],
  },

  // Springs, only where something follows a finger, settles after a drag,
  // or is a material carried from one place to another (a print, a slip, a
  // leaf). Every one critically damped: paper, not rubber. Presses are
  // timings, not springs — the web presses with a timed ease.
  spring: {
    // The web's leaf follower (k .045, damping .82 per frame).
    paper: { damping: 20, stiffness: 90, mass: 1 },
    // A sheet let go of mid-drag.
    sheet: { damping: 30, stiffness: 220, mass: 1 },
    // The hero path, in Apple's two designer numbers (hero-spec §1.1).
    // Reanimated 4's duration is perceptual: the spring is visibly home at
    // about this time and fully at rest around 1.5× it (DECISIONS H44), so
    // anything that follows a spring chains off its callback, never off a
    // fixed delay.
    // A print carried between the page and Home (LiftedPrint), both ways.
    print: appleSpring(0.42, 0),
    // Linh's slip laid down and pasted in (H4c).
    tipIn: appleSpring(0.38, 0),
    // The open leaf growing, and a leaf let go of mid-turn (H5b, H5c).
    leaf: appleSpring(0.5, 0),
  },

  // How far a press gives (web-details.md §4.4).
  scale: {
    // A pill button.
    press: 0.97,
    // A round button: an icon, the "+", a back button.
    pressRound: 0.95,
    // A card, a tile, a whole row: big things give less.
    pressCard: 0.98,
    // A day disc in the week strip.
    pressDay: 0.96,
    // A switch knob, a swatch.
    pressSmall: 0.92,
    // Where something appears from — never from 0.
    enterFrom: 0.95,
    // A card lifted under a long press.
    lift: 1.02,
  },

  // A list's arrival.
  stagger: 40,
  staggerMax: 6,
  // How far something rises as it arrives.
  rise: 8,
  riseLarge: 20,
};

/* ── TRANSITIONS: native-stack presets per kind of route ───────────────
   Spread into a screen's options. RootNavigator picks one per route name
   (src/navigation/transitions.js); a screen never sets its own. */
export const TRANSITIONS = {
  // Moving between the four tabs. Quick: it is seen a hundred times a day,
  // and the tab bar sits in the same place on both sides of it.
  tab: { animation: "fade", animationDuration: MOTION.duration.quick },
  // The default: a calm cross-fade (elders find sideways motion unsettling,
  // which is why this app never slides).
  screen: { animation: "fade", animationDuration: MOTION.duration.screen },
  // A task that rises over where you were — writing, editing, inviting.
  // Fade plus a short rise from below: a sheet arriving, not a page turning.
  sheet: { animation: "fade_from_bottom", animationDuration: MOTION.duration.sheet },
  // Into a call or a recording: the dark room dissolves in slowly.
  immersive: { animation: "fade", animationDuration: MOTION.duration.immersive },
};

// What each preset becomes under Reduce Motion: the same duration, as a
// plain cross-fade (the system's own rule for dissolves).
export function reducedTransition(preset) {
  return { animation: "fade", animationDuration: preset.animationDuration };
}

/* ── Apple's spring, in Reanimated's terms ─────────────────────────────
   SwiftUI's spring(duration:bounce:) is two numbers a designer can read:
   how long it feels, and how much it overshoots (0 = none). Reanimated 4
   takes the same idea as { duration (ms), dampingRatio }, and the two map
   one to one: dampingRatio = 1 − bounce. Bounce stays 0 on this app's
   materials (paper doesn't bounce); the argument is there so a spring that
   follows a flick can carry a little, if a lane ever earns it. */
export function appleSpring(duration, bounce = 0) {
  const b = Math.min(Math.max(Number(bounce) || 0, 0), 0.9);
  return { duration: Math.round(Number(duration) * 1000), dampingRatio: 1 - b };
}

/* ── A cubic bezier, evaluated in plain JS ─────────────────────────────
   For the few things the web build has to drive by hand on its own frame
   loop (KeptLine.web.js), so a frozen-clock film steps them like every
   Reanimated animation: a CSS transition runs on the compositor's clock,
   which a test can't hold still. Same curve as Easing.bezier, solved by
   Newton's method with a bisection fallback (WebKit's UnitBezier).
   Plain numbers in, a number out: no React Native, testable in node. */
export function bezierAt(points, t) {
  const [x1, y1, x2, y2] = points;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xOf = (s) => ((ax * s + bx) * s + cx) * s;
  const yOf = (s) => ((ay * s + by) * s + cy) * s;
  const dxOf = (s) => (3 * ax * s + 2 * bx) * s + cx;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const err = xOf(s) - t;
    if (Math.abs(err) < 1e-6) return yOf(s);
    const d = dxOf(s);
    if (Math.abs(d) < 1e-6) break;
    s -= err / d;
  }
  let lo = 0;
  let hi = 1;
  s = t;
  while (hi - lo > 1e-6) {
    const x = xOf(s);
    if (Math.abs(x - t) < 1e-6) break;
    if (x < t) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
  }
  return yOf(s);
}

/* ── The KeptLine's pen ────────────────────────────────────────────────
   One pen draws the gold band under her words, left to right and line by
   line, at one speed: each line takes its share of the draw by its width,
   so a short last line isn't drawn as slowly as a full one. Given the
   lines' widths, `penSegments` says where in the draw (0–1) each line
   starts and ends; `penFill` says how much of one line is drawn at a
   point of the draw. The native band (KeptLine.js) and the tests read
   these; the web draws the same thing with one background on an inline
   run, which wraps line by line by itself. */
export function penSegments(widths) {
  const ws = widths.map((w) => Math.max(0, Number(w) || 0));
  const total = ws.reduce((a, b) => a + b, 0);
  if (!total) return ws.map(() => [0, 1]);
  let at = 0;
  return ws.map((w) => {
    const seg = [at / total, (at + w) / total];
    at += w;
    return seg;
  });
}

export function penFill(progress, [start, end]) {
  "worklet";
  if (end <= start) return progress >= end ? 1 : 0;
  const f = (progress - start) / (end - start);
  return f <= 0 ? 0 : f >= 1 ? 1 : f;
}

// Where the band sits in a line box: the web's own marker,
// linear-gradient(transparent 74%, gold 74% 90%, transparent 90%).
export const KEPT_BAND = { top: 0.74, bottom: 0.9 };
