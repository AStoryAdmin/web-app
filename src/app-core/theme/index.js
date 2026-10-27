// A Story — brand design tokens.
//
// Read off the 2026 design file (Figma "Design" page, 40 screens), which is
// what the app is being built to. These values used to come from the written
// brand guideline instead, and the two disagreed — some of it by a digit or
// two, some of it visibly:
//
//   role          guideline   design file
//   terracotta    #B85126     #B85327
//   chocolate     #4A3327     #4A3728
//   page          #F3EBDD     #FAF7F2    ← the page was noticeably warmer
//   body ink      #4A3327     #333333    ← the designs set body in neutral
//                                          grey, not warm brown
//
// Where they disagree the design file wins, because that is the thing being
// implemented. Two deliberate exceptions are marked at their token below —
// both are places where the design file's value fails contrast badly enough
// to matter for the people this app is for.
//
// React Native has no CSS variables, so each theme is a plain object read
// through the ThemeProvider/useTheme hook.

/* ── Raw brand colours ─────────────────────────────────────────────── */
export const BRAND = {
  terracotta: "#B85327",
  terracottaDeep: "#9A4220",
  // The lighter terracotta the designs use for smaller marks — the
  // "Recording" badge, the summary card's rule.
  terracottaLight: "#D25E2C",
  // The warm end of the progress ramp. The design fills the book bar with
  // terracotta running into this, not with one flat brown.
  ember: "#FA7337",
  // brand.json's chocolate, which the web app uses (the Figma's was #4A3728).
  chocolate: "#4A3327",
  chocolateDeep: "#3B291D",
  chocolateInk: "#2B2116",
  gold: "#EAC668",
  brass: "#EBC86A",
  // The written gold of the web app (app.astoryapp.com): the colour of
  // "worth keeping." in the headline and of the bookplate's engraving.
  // Deeper than the logo's gold, because it is ink, not foil — it has to
  // read as words on parchment, not as a shine.
  goldInk: "#BF7F1A",
  goldEdge: "#C9A15A",
  // The page: a warm sand. This is what the design file actually paints
  // behind almost every screen — 27 of its 50 full-height frames are this
  // colour, against 3 in the ivory the app used to use.
  sand: "#F3EBDD",
  // Sheets lifted off the page — the archive panel on home, and the frames
  // the design fills with #FAF7F2 rather than sand.
  ivory: "#FAF7F2",
  // Cards sit a shade lighter again.
  ivoryLight: "#FDFBF8",
  ivoryDeep: "#EEEBE8",
  // The web's printed plate: every card on the paper, a print's white
  // border, the tab bar.
  paperPrint: "#FFFDF8",
  // One step down in tone: an active row or tab, a monogram seal's ground.
  paperTone: "#F4EDE1",
  // The foil of the frames, rules and the ✦, and its soft hairline.
  foil: "#C9A15A",
  // The strip that shows behind a raised sheet, at 40%. It is the whole of
  // the two-tone edge the design draws above the recent-memories panel.
  support: "#D5CDC6",
  // The designs set body copy in a neutral dark grey, not a warm brown.
  ink: "#333333",
  inkSoft: "#676767",
  charcoal: "#4C4C4C",
  green: "#0E9154",
  teal: "#0F4A58",
  tealLight: "#8FBFCB",
};

// The printed book's colours: its inks and the paper they are shown on in
// the app's preview, by paper (the PDF prints on white; the paper is the
// stock the order asks for), and its cover, by style
// (see src/lib/bookDesign.js for the choices). A book is printed, not
// themed, so these are the same whether the app is light or dark, and both
// LIGHT and DARK carry them as `book`. "classic" is the book as it has
// always printed.
export const BOOK_PRINT = {
  papers: {
    classic: {
      page: "#FFFFFF", ink: "#2E1F17", heading: "#0F4A58", accent: "#B85126",
      soft: "#6B5546", faint: "#8A7362", rule: "#E9DCC6", dots: "#C9B79F",
      gold: "#E0A03F", span: "#4A3327",
    },
    ivory: {
      page: "#FAF3E6", ink: "#2E1F17", heading: "#4A3327", accent: "#B85126",
      soft: "#6B5546", faint: "#8A7362", rule: "#E6D7BE", dots: "#C9B79F",
      gold: "#C8913A", span: "#4A3327",
    },
    antique: {
      page: "#F1E4CB", ink: "#3A2A1E", heading: "#4A3327", accent: "#9A6A2A",
      soft: "#6E5540", faint: "#8C7358", rule: "#DFCBA7", dots: "#BFA67C",
      gold: "#B8862E", span: "#3A2A1E",
    },
  },
  covers: {
    cloth: { board: "#4A3327", deep: "#34241A", foil: "#D9B45A", text: "#F3EBDD", soft: "#CDBBA6" },
    heirloom: { board: "#0F4A58", deep: "#0A3640", foil: "#D9B45A", text: "#F3EBDD", soft: "#B9CCCF" },
    tipped: { board: "#EDE3D2", deep: "#D8C9AF", foil: "#8C6A2E", text: "#3A2A1E", soft: "#6E5540", frame: "#FFFFFF" },
    wrap: { board: "#2B2116", deep: "#1C140D", foil: "#EAC668", text: "#FFFFFF", soft: "#EFE6D8", shade: "rgba(20, 12, 6, 0.64)" },
    // A Story's own cover, in the template's seven colourways, sampled from
    // the design team's coverbook.pdf. board: the cloth; spine: the spine
    // band; ink: the capitals; script: the handwritten lines; soft: small
    // print on the back; print: the white border round each photograph.
    keepsake: {
      // The app's own book cloth, with the logo's gold for the name: the
      // default, so the printed book looks like the app it came from.
      chocolate: { board: "#4A3327", spine: "#3B281E", ink: "#F1EBD9", script: "#E9C87E", soft: "#A88E76", print: "#FBFAF6" },
      navy: { board: "#103864", spine: "#13334E", ink: "#F1EBD9", script: "#E4ECED", soft: "#7F94AC", print: "#FBFAF6" },
      cream: { board: "#F1EFEA", spine: "#E4E7E5", ink: "#2D3030", script: "#3C4242", soft: "#969693", print: "#FFFFFF" },
      forest: { board: "#1C372A", spine: "#1A3025", ink: "#F1EBD9", script: "#E4ECED", soft: "#85948D", print: "#FBFAF6" },
      slate: { board: "#214253", spine: "#1D3640", ink: "#F1EBD9", script: "#E4ECED", soft: "#889AA3", print: "#FBFAF6" },
      charcoal: { board: "#343634", spine: "#2B2C2B", ink: "#F1EBD9", script: "#E4ECED", soft: "#929392", print: "#FBFAF6" },
      mustard: { board: "#F2C56A", spine: "#F0BC60", ink: "#2D3030", script: "#3C4242", soft: "#977F4E", print: "#FFFFFF" },
      black: { board: "#1A1B1B", spine: "#242525", ink: "#F1EBD9", script: "#E4ECED", soft: "#848585", print: "#FBFAF6" },
    },
  },
};

/* ── The two themes ────────────────────────────────────────────────────

   Design-sprint foundation, October 2026. Both themes now follow the web
   app's restraint (web-app/docs/DESIGN.md, src/styles/astory.css §1):

   - One accent colour per theme. Terracotta on the cream page, gold on the
     near-black one. It marks what acts and what is the storyteller's —
     never decoration.
   - One primary action per screen: chocolate on cream, gold on near-black
     (Btn variant="primary"). Everything else is quieter.
   - Surfaces separate by a step in tone. Shadows only on what floats.

   Contrast is measured, not eyeballed. Every token that carries text is
   ≥4.5:1 on every surface it can sit on — the page, a sheet, a card, the
   accent's own 10% tint and every memory paper — and every token that is
   the only edge of a control (a field, a switch track, a progress track)
   is ≥3:1. The ratios are noted beside the tokens; docs/agents/design-system.md
   has the full table.

   Every key that existed before the sprint still exists, so no screen
   breaks; the new names (textSecondary, accentInk, controlBorder, scrim…)
   are what new code reaches for. */

export const LIGHT = {
  name: "light",

  // ── Surfaces. The cream/linen page, then lighter as things rise off it.
  bg: BRAND.sand, // #F3EBDD — the cream paper
  // No white boxes and no white sheets on the cream (owner, 21 Oct; judges,
  // night r1, faults 1 and 10): a sheet is the same paper as the page, and
  // a plate that needs holding is a soft tone a breath off it, not white.
  bgElevated: BRAND.sand, // sheets, the app bar band: the paper itself
  bgCard: "#F6F0E5", // a plate, a chip, a mount: a breath lighter than the paper
  bgSheet: BRAND.sand,
  sheetSupport: "rgba(213, 205, 198, 0.4)",
  // A step *down* in tone: a pressed row, a grouped inset, a skeleton.
  bgSunken: "#EAE0CF",
  // One step down in tone, for an active row or tab (the web's --paper-tone).
  bgTone: BRAND.paperTone,

  // ── The printed plate (components/Ornaments.js Plate, and Card). A 1px
  // rule round the card, and a foil rule 6px inside it. Dark drops the
  // inner rule: the web calls the plate "a light-paper idea".
  plateBorder: "rgba(60, 50, 40, 0.16)",
  plateRule: "rgba(201, 161, 90, 0.35)",
  foil: BRAND.foil,
  foilSoft: "rgba(201, 161, 90, 0.35)",
  // The hairline every rule on the paper is drawn in (the samples' rule).
  rule: "rgba(60, 50, 40, 0.16)",
  // Chapter tags in the book's sage.
  kickerSage: "#3F5B44", // 5.6:1 on its ground
  kickerSageBg: "#E4E8DC",

  // ── The cloth: the brand's dark surface (app bar hero, splash).
  surfaceDark: BRAND.chocolate,
  surfaceDarkDeep: BRAND.chocolateDeep,
  // A panel or button that deliberately contrasts with the page. Always
  // paired with onContrast*, because the two themes flip which is light.
  surfaceContrast: BRAND.chocolate,
  onContrast: BRAND.ivory,
  onContrastSoft: "#D9CFC2", // 7.6:1 on chocolate
  contrastTint: "rgba(243, 235, 221, 0.16)",
  onDark: BRAND.ivory,
  onDarkSoft: "#D9CFC2",
  // Translucent chrome on the cloth (an IconButton on the dark app bar).
  onDarkChrome: "rgba(243, 235, 221, 0.14)",

  brandInk: BRAND.chocolate,

  // ── Ink. Warm, from the web app — not the design file's neutral grey.
  // The old textSoft/textMuted pair was named backwards (muted was the
  // *stronger* one). The canonical names are now textSecondary and
  // textTertiary, in that order of strength; textSoft and textMuted are kept
  // as aliases of them, so "muted" finally means the quieter of the two.
  // The web's ink on the book's paper.
  text: "#2B2B2B", // 12.0:1 on bg, 10.6 on the accent tint
  textSecondary: "#4A423C", // 8.3:1 on bg, 7.4 worst case
  textTertiary: "#635A52", // 5.7:1 on bg, 5.0 worst case (accent tint)
  textSoft: "#4A423C",
  textMuted: "#635A52",
  // Placeholders only, never a sentence: 5.0:1 on a card.
  textPlaceholder: "#776C62",
  heading: BRAND.chocolate, // 9.9:1

  // ── The one primary action. Chocolate on cream, as the web app does.
  primary: BRAND.chocolate,
  primaryPressed: BRAND.chocolateDeep,
  onPrimary: BRAND.ivory, // 11.0:1

  // ── The accent: terracotta. Deepened from #B85327 (4.12:1 on the page,
  // a fail at every text size it was used at) to a terracotta that passes
  // as text *and* still reads as the brand's colour as a fill. The bright
  // brand value lives on as BRAND.terracotta for marks and the progress ramp.
  accent: "#A04621", // 5.2:1 on bg, 4.6 on its own tint
  accentInk: "#9A4320", // small text on tints: 5.6:1 on bg, 4.9 on tint
  accentHover: BRAND.terracottaDeep,
  accentPressed: BRAND.terracottaDeep,
  accentSoft: "rgba(184, 83, 39, 0.10)",
  accentBorder: "rgba(184, 83, 39, 0.30)",
  accentTint: "rgba(184, 83, 39, 0.06)",
  onAccent: "#FFF7EC", // 5.8:1

  // ── Gold: the logo's heart. A fill and a glow, not ink, on cream.
  gold: BRAND.gold,
  goldSoft: "rgba(234, 198, 104, 0.18)",
  goldGlow: "rgba(234, 198, 104, 0.24)",
  // Gold as a mark (an icon) on cream: 3.3:1 on bg, 3.8 on a card.
  goldMark: "#A67A1F",
  // Gold as ink — "worth keeping." Was #BF7F1A at 2.83:1; now 4.9:1.
  accentGold: "#8A5D12",
  // The greeting on Home (owner, 22 Oct, FB-314): oxblood by day, so it
  // holds its own on the cream; the foil's gold by night.
  greeting: "#6E2A22",
  plateEdge: BRAND.goldEdge,
  onGold: BRAND.chocolate,

  artHill: "#D8EBD2",
  artSun: "#F5D06A",

  // ── The live call. Dark in both themes on purpose (see DARK).
  talkGround: BRAND.chocolateInk,
  talkGlowCore: "rgba(234, 198, 104, 0.30)",
  talkGlowMid: "rgba(184, 83, 39, 0.38)",
  talkGlowEdge: "rgba(184, 83, 39, 0)",
  onTalk: BRAND.ivory,
  onTalkSoft: "rgba(250, 247, 242, 0.72)",
  talkChrome: "rgba(250, 247, 242, 0.08)",
  // The ghost circles' edge and the mic disc are the controls on that
  // screen, so they are held to 3:1 against the ground (were 1.6 and 2.3).
  talkChromeBorder: "rgba(250, 247, 242, 0.40)", // 3.6:1
  talkMic: "rgba(234, 198, 104, 0.50)", // 3.5:1
  talkMicRing: "rgba(234, 198, 104, 0.18)",
  talkMuted: "rgba(250, 247, 242, 0.10)",
  talkEnd: BRAND.ivory,
  onTalkEnd: BRAND.chocolateInk,
  talkSheet: BRAND.chocolateDeep,
  talkScrim: "rgba(21, 14, 9, 0.62)",

  // ── The incoming call. Hold their hue across themes (see DARK).
  callAnswer: BRAND.teal,
  callDecline: BRAND.terracotta, // ivory on it: 4.6:1
  onCallAction: BRAND.ivory,
  callCard: "rgba(250, 247, 242, 0.08)",
  callRing: "rgba(234, 198, 104, 0.16)",

  // A link on the paper: terracotta, set at 600 with its → (DECISIONS B15,
  // B27; FEEDBACK FB-042). Teal is the Book's cloth only, never a link
  // (PHILOSOPHY §2, critique §4). The text-deep terracotta the accent
  // already is, so it passes as small text: 5.2:1 on the page.
  link: "#A04621",

  // ── The hero path's materials (hero-spec §1.1).
  // The question card in the call's room is the review's own paper, so it
  // can grow into the page without a cross-fade (H2c).
  roomCard: BRAND.sand,
  // Linh's tipped-in slip, a sheet a shade warmer than the page.
  slipPaper: "#F6EEDD",
  // The paste line along the slip's top edge: ink at 6 %.
  pasteLine: "rgba(43, 43, 43, 0.06)",
  // KeptLine, the one mark for "her own words": the web's gold band under
  // the line (web-reference §3), never gold glyphs. Same in both themes,
  // so the echo, the review and the memory carry one mark.
  keptMarker: "rgba(201, 161, 90, 0.55)",
  // Her echoed clause lit in place in her block, on the room's dark ground.
  markerWash: "rgba(201, 161, 90, 0.24)",
  // The book's silk ribbon: the wax's colours, head to foot (KeepSeal's WAX).
  ribbonSilk: ["#9A4220", "#B4562C", "#7E3519"],
  // A white-bordered print's border (Ornaments Print).
  printBorder: "#FFFDF8",
  // The face of a print that carries words, not a photograph (a kept line
  // typed on a slip), and its ink.
  printFace: "#F6F0E5",
  onPrintFace: "#2B2B2B",

  // ── Lines. `border`/`borderMid` are decorative hairlines between things
  // that are already told apart by tone. `controlBorder` is the edge of a
  // control that has no other edge — a field, an outlined button, an off
  // switch — and is held to 3:1 (WCAG 1.4.11).
  border: "rgba(74, 55, 40, 0.12)",
  borderMid: "rgba(74, 55, 40, 0.22)",
  controlBorder: "#8C7B6B", // 3.4:1 on bg, 3.9 on a card
  fieldBorder: "#8C7B6B", // was #E3E3E3 at 1.08:1 — fields were invisible
  // The off track of a switch and the empty part of any progress bar.
  controlTrack: "#8F7E6E", // 3.3:1 on bg, 3.8 on a card
  progressTrack: "#8F7E6E",
  focusRing: BRAND.teal,

  danger: "#B03A2E", // 5.1:1
  dangerSoft: "rgba(176, 58, 46, 0.10)",
  onDanger: "#FFF7EC",
  // Was #0E9154 at 3.4:1 on the page.
  success: "#1F7346", // 4.9:1 on bg
  successSoft: "rgba(31, 115, 70, 0.12)",

  shadow: "rgba(74, 55, 40, 0.16)",

  // ── Overlays. One scrim for every modal, instead of seven.
  // The web's scrim (it adds a 6px blur; see components that use BlurView).
  scrim: "rgba(42, 35, 32, 0.40)",
  // Chrome laid over a photograph: a disc dark enough to hold a white glyph
  // on any photo (≥4.5:1 for the glyph on the disc over white), with a hairline
  // ring so it still has an edge over a dark one.
  photoScrim: "rgba(23, 18, 16, 0.55)",
  photoChrome: "rgba(23, 18, 16, 0.62)",
  photoChromeBorder: "rgba(255, 255, 255, 0.45)",
  onPhoto: "#FFFFFF",
  onPhotoSoft: "rgba(255, 255, 255, 0.88)",
  // A press, laid over whatever is pressed (rows highlight; buttons scale).
  pressed: "rgba(42, 35, 32, 0.06)",

  // ── Atmosphere (components/Atmosphere.js). The web's paper: its own
  // grain tile (alpha .05, tinted, baked into the PNG) and a vignette at
  // the edges; and the lamp — a soft warm light from the top-left.
  paperGrain: true,
  vignette: "rgba(74, 51, 39, 0.045)",
  glowCore: "rgba(255, 250, 240, 0.85)",
  glowMid: "rgba(255, 246, 230, 0.35)",
  glowEdge: "rgba(255, 246, 230, 0)",
  // The ember: terracotta warmth under a hero, very faint.
  emberCore: "rgba(184, 83, 39, 0.10)",
  emberMid: "rgba(184, 83, 39, 0.04)",
  emberEdge: "rgba(184, 83, 39, 0)",

  // ── The book's progress ramp, and the empty teeth after it.
  progressFrom: BRAND.terracotta,
  progressTo: BRAND.ember,
  combTooth: "#8F7E6E", // was #CCCCCC at 1.36:1 — missing chapters were invisible

  // ── The tab bar: a floating pill of glass (white at 36% over a backdrop
  // blur, hairlined in white) so the page keeps moving underneath it, as it
  // did in 1.0 — the owner's call (2026-10-19) over the opaque strip. The
  // labels are the darker ink below so they still read over a photo.
  tabBar: "rgba(255, 255, 255, 0.36)",
  tabBarBorder: "#FFFFFF",
  tabBarShadow: "0 -10px 24px -20px rgba(42, 35, 32, 0.4)",
  tabBarActive: "rgba(243, 235, 222, 0.58)",
  tabBarActiveBorder: BRAND.ivory,
  tabActive: "#2B2B2B", // 12.2:1 on the pill
  tabInactive: "#635A52", // 6.6:1 on the strip

  // ── Glass: the controls-and-navigation layer (components/glass,
  // docs/agents/overnight/materials-glass.md). Warm, never the system grey.
  //   glassTint     the CSS / web recipe over blur(20) saturate(180%): ivory
  //                 at 74%, so a line of text passing under is texture.
  //   glassTintBlur laid over iOS 16–25's systemThinMaterialLight.
  //   glassTintLiquid  the tint handed to iOS 26 Liquid Glass.
  //   glassSolid    Reduce Transparency / Increase Contrast: paper, no blur.
  // Labels on any of them: tabActive 12.2:1 and tabInactive ≥ 5.6:1 over the
  // worst case measured (a dark photo under the bar, through the edge fade).
  glassTint: "rgba(250, 246, 239, 0.74)",
  glassTintBlur: "rgba(243, 235, 221, 0.50)",
  glassTintLiquid: "rgba(243, 235, 221, 0.42)",
  glassEdge: "rgba(255, 255, 255, 0.92)",
  glassRim: "rgba(74, 55, 40, 0.10)",
  glassSheen: "linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 46%)",
  glassSolid: "#FAF6EF",
  glassSolidEdge: "rgba(42, 35, 32, 0.42)",
  // Glass over a photograph: Apple's clear glass with its 35% dimming,
  // warmed; the white glyph keeps ≥ 4.5:1 over a white photo.
  glassPhoto: "rgba(23, 18, 16, 0.56)",
  glassPhotoLiquid: "rgba(23, 18, 16, 0.35)",
  glassPhotoEdge: "rgba(255, 255, 255, 0.42)",
  // A round control on the cloth band (the bookcloth seen through it).
  glassOnCloth: "rgba(246, 240, 230, 0.12)",
  glassOnClothLiquid: "rgba(246, 240, 230, 0.10)",
  glassOnClothEdge: "rgba(246, 240, 230, 0.34)",
  glassOnClothSheen: "linear-gradient(180deg, rgba(255, 246, 232, 0.22) 0%, rgba(255, 246, 232, 0) 50%)",
  // How much of the paper the scroll edge lays under a floating bar: none
  // 40 pt above it, 0.62 at its top edge, 0.86 at the screen's foot.
  edgeFadeTop: 0.62,
  edgeFadeFoot: 0.86,

  launchGround: "#4A3327",
  launchMark: "#F3EBDD",
  launchHeart: "#EBC86A",
  launchWave: "rgba(241, 237, 223, 0.22)",
  launchWordA: "#F3EBDD",
  launchWordStory: "#EAC668",
  launchLine: "rgba(243, 235, 221, 0.78)",

  book: BOOK_PRINT,
};

/* The dark theme: the same book by lamplight (owner, 23 Oct, FB-512).

   The near-black page (#171210, with cool-leaning greys in its inks and
   rules, no grain) read as a modern app, not the book the light theme is.
   Dark is now the light theme's paper, cloth and inks seen under one warm
   lamp: a brown-black paper (#221913, never grey, never pure black, no blue
   in it), its grain and laid lines kept, a sheet the same paper as the page
   and a plate a breath lighter, cream ink, separators in a warm sepia, the
   foil frame kept, rust for links and the foil's gold for the one primary.
   The cloth band is the cloth (Cloth.js): unchanged. Ratios below are on
   bg / on a plate (bgCard). */
export const DARK = {
  name: "dark",

  bg: "#221913", // the paper by lamplight
  // A sheet is the same paper as the page, as by day.
  bgElevated: "#221913",
  bgCard: "#2B2119", // a plate: a breath lighter, warmer, never a grey panel
  bgSheet: "#221913",
  sheetSupport: "rgba(232, 214, 186, 0.06)",
  bgSunken: "#1A130E",
  bgTone: "#33271E",

  // The plate's foil rule and the sheet's foil frame stay at night: the
  // book is the same book.
  plateBorder: "rgba(232, 214, 186, 0.14)",
  plateRule: "rgba(201, 161, 90, 0.26)",
  foil: "#C9A15A",
  foilSoft: "rgba(201, 161, 90, 0.30)",
  rule: "rgba(232, 214, 186, 0.16)",
  kickerSage: "#9FC3A6", // 8.9 / 8.1
  kickerSageBg: "rgba(143, 203, 163, 0.12)",

  surfaceDark: "#140E0A",
  surfaceDarkDeep: "#0E0A07",
  // The contrasting panel is the light one here (cream on the dark paper).
  surfaceContrast: "#F2E8D8",
  onContrast: "#221913",
  onContrastSoft: "#4A3F35",
  contrastTint: "rgba(34, 25, 19, 0.10)",
  onDark: "#F2E8D8",
  onDarkSoft: "#D6C7B2",
  onDarkChrome: "rgba(242, 232, 216, 0.12)",

  brandInk: "#F2E8D8",

  // Cream ink, warm all the way down (no cool greys).
  text: "#F2E8D8", // 14.2 / 13.0
  textSecondary: "#D6C7B2", // 10.4 / 9.5
  textTertiary: "#B9A891", // 7.5 / 6.8
  textSoft: "#D6C7B2",
  textMuted: "#B9A891",
  textPlaceholder: "#9E8E7A", // 5.4 / 5.0
  heading: "#F6EEDF",

  // The foil's gold is the one primary action by lamplight.
  primary: "#E2C27A",
  primaryPressed: "#D4B266",
  onPrimary: "#1E1610", // 10.4:1

  accent: "#E2C27A", // 10.1 / 9.2
  accentInk: "#E2C27A",
  accentHover: "#EDD08F",
  accentPressed: "#D4B266",
  accentSoft: "rgba(226, 194, 122, 0.12)",
  accentBorder: "rgba(226, 194, 122, 0.34)",
  accentTint: "rgba(226, 194, 122, 0.07)",
  onAccent: "#1E1610",

  gold: "#E2C27A",
  goldSoft: "rgba(226, 194, 122, 0.14)",
  goldGlow: "rgba(226, 194, 122, 0.18)",
  goldMark: "#E2C27A",
  accentGold: "#E2C27A",
  greeting: "#E2C27A",
  plateEdge: "#8A6A33",
  onGold: "#1E1610",

  artHill: "#26302A",
  artSun: "#C8A756",

  // A call is a room somebody is talking in, not a page they are reading;
  // dark only sinks the ground further and pulls the glow back.
  talkGround: "#140E0A",
  talkGlowCore: "rgba(226, 194, 122, 0.24)",
  talkGlowMid: "rgba(184, 83, 39, 0.30)",
  talkGlowEdge: "rgba(184, 83, 39, 0)",
  onTalk: "#F2E8D8",
  onTalkSoft: "rgba(242, 232, 216, 0.72)",
  talkChrome: "rgba(242, 232, 216, 0.07)",
  talkChromeBorder: "rgba(242, 232, 216, 0.40)", // 3.5:1
  talkMic: "rgba(226, 194, 122, 0.55)", // 4.1:1
  talkMicRing: "rgba(226, 194, 122, 0.16)",
  talkMuted: "rgba(242, 232, 216, 0.09)",
  talkEnd: "#F2E8D8",
  onTalkEnd: "#1E1610",
  talkSheet: "#251B15",
  talkScrim: "rgba(10, 6, 4, 0.66)",

  // Decline holds the brand terracotta (ivory 4.6:1); the lighter
  // #D25E2C it used to lift to was 3.65:1.
  callAnswer: "#15687C",
  callDecline: BRAND.terracotta,
  onCallAction: BRAND.ivory,
  callCard: "rgba(242, 232, 216, 0.07)",
  callRing: "rgba(226, 194, 122, 0.13)",

  // The web's own terracotta at night (astory.css --accent, dark): the
  // rust, kept. 7.9 / 7.2.
  link: "#E2A26F",

  // The card in the room at night is the dark paper one step up, so it
  // doesn't glare; its one foil frame is CallCard's inset hairline (H40).
  roomCard: "#2B2119",
  slipPaper: "#33281F",
  // Cream at 8 %, so the paste line still reads on the dark slip.
  pasteLine: "rgba(242, 232, 216, 0.08)",
  keptMarker: "rgba(201, 161, 90, 0.55)",
  markerWash: "rgba(201, 161, 90, 0.24)",
  ribbonSilk: ["#9A4220", "#B4562C", "#7E3519"],
  // A print's border by lamplight: warm paper, not a white.
  printBorder: "#E8DCC9",
  // A typed print by lamplight is paper under the lamp, as the book reader's
  // page is (judges hab-r2 hold 8: a near-black face in a cream border read
  // as a black square): lamplit ivory with the book's dark ink, 9.9:1.
  printFace: "#D9CBB4",
  onPrintFace: "#2E1F17",

  // Separators in a warm sepia, never a cool grey.
  border: "rgba(232, 214, 186, 0.10)",
  borderMid: "rgba(232, 214, 186, 0.18)",
  controlBorder: "#8A7864", // 4.1 / 3.7
  fieldBorder: "#8A7864",
  controlTrack: "#85735F", // 3.8 / 3.5
  progressTrack: "#85735F",
  focusRing: BRAND.tealLight,

  danger: "#E4796A", // 6.0 / 5.4
  dangerSoft: "rgba(228, 121, 106, 0.14)",
  onDanger: "#1E1610",
  success: "#8FCBA3",
  successSoft: "rgba(143, 203, 163, 0.14)",

  // Shade is the paper's own deepest brown, never a pure black.
  shadow: "rgba(8, 4, 2, 0.6)",

  scrim: "rgba(10, 6, 4, 0.6)",
  photoScrim: "rgba(10, 6, 4, 0.55)",
  photoChrome: "rgba(14, 9, 6, 0.66)",
  photoChromeBorder: "rgba(255, 255, 255, 0.40)",
  onPhoto: "#FFFFFF",
  onPhotoSoft: "rgba(255, 255, 255, 0.88)",
  pressed: "rgba(242, 232, 216, 0.08)",

  // The paper's grain and laid lines stay by lamplight, and the edges fall
  // off into a warm shade; the lamp is amber, low and from the top.
  paperGrain: true,
  vignette: "rgba(8, 4, 2, 0.22)",
  glowCore: "rgba(236, 186, 118, 0.22)",
  glowMid: "rgba(236, 186, 118, 0.08)",
  glowEdge: "rgba(236, 186, 118, 0)",
  emberCore: "rgba(184, 83, 39, 0.14)",
  emberMid: "rgba(184, 83, 39, 0.05)",
  emberEdge: "rgba(184, 83, 39, 0)",

  progressFrom: "#E2C27A",
  progressTo: BRAND.brass,
  combTooth: "#7A6E63",

  tabBar: "rgba(34, 25, 19, 0.16)",
  tabBarBorder: "rgba(232, 214, 186, 0.16)",
  tabBarShadow: "0 -10px 24px -20px rgba(8, 4, 2, 0.8)",
  tabBarActive: "rgba(232, 214, 186, 0.10)",
  tabBarActiveBorder: "rgba(201, 161, 90, 0.30)",
  // The active tab in the cream of the ink on a foil-edged pill, never
  // yellow (judges hab-r2 hold 8).
  tabActive: "#F2E8D8",
  tabInactive: "#B9A891",

  // Glass in the dark: the lamplit paper's brown, never the system's grey.
  glassTint: "rgba(34, 25, 19, 0.72)",
  glassTintBlur: "rgba(34, 24, 17, 0.46)",
  glassTintLiquid: "rgba(34, 24, 17, 0.45)",
  glassEdge: "rgba(232, 214, 186, 0.16)",
  glassRim: "rgba(8, 4, 2, 0.35)",
  glassSheen: "linear-gradient(180deg, rgba(243, 235, 221, 0.09) 0%, rgba(243, 235, 221, 0) 42%)",
  glassSolid: "#2B2119",
  glassSolidEdge: "rgba(232, 214, 186, 0.46)",
  glassPhoto: "rgba(14, 9, 6, 0.58)",
  glassPhotoLiquid: "rgba(14, 9, 6, 0.35)",
  glassPhotoEdge: "rgba(255, 255, 255, 0.34)",
  glassOnCloth: "rgba(246, 240, 230, 0.10)",
  glassOnClothLiquid: "rgba(246, 240, 230, 0.08)",
  glassOnClothEdge: "rgba(246, 240, 230, 0.26)",
  glassOnClothSheen: "linear-gradient(180deg, rgba(255, 246, 232, 0.14) 0%, rgba(255, 246, 232, 0) 50%)",
  edgeFadeTop: 0.62,
  edgeFadeFoot: 0.86,

  launchGround: "#4A3327",
  launchMark: "#F3EBDD",
  launchHeart: "#EBC86A",
  launchWave: "rgba(241, 237, 223, 0.22)",
  launchWordA: "#F3EBDD",
  launchWordStory: "#EAC668",
  launchLine: "rgba(243, 235, 221, 0.78)",

  book: BOOK_PRINT,
};

export const THEMES = { dark: DARK, light: LIGHT };

/* ── Font families ─────────────────────────────────────────────────────
   Loaded in App.js via expo-font; these strings must match the exported
   names of the @expo-google-fonts packages. Only what a key names is
   loaded (type-revision.md: Cormorant 700, EB Garamond 500 and Montserrat
   500 italic went, since nothing set them).

   Three faces, each with one job (the web app's rule, docs/DESIGN.md):
   - Cormorant Garamond — the book's display face. Titles, display lines,
     a memory's title, numbers set large. FONTS.display*.
   - EB Garamond — the book's text face: anything a *person* said. A
     memory's words, a letter, a quote, an answer. FONTS.story*.
   - Montserrat — the interface. Buttons, fields, rows, labels, navigation,
     dates. FONTS.ui*. Three weights, each with a job: 400 for what you
     read, 500 for what you touch or name, 600 for the small caps, the rare
     heading and a code. 700 is the keepsake cover's title alone (it matches
     the printed cover); a test keeps it there.

   Every name says what it is. sans / sansMedium / sansItalic stay as plain
   aliases of ui / uiMedium / uiItalic. New code uses a TYPE role, or
   ui* / display* / story* when no role fits. scripts/test-lib.mjs fails if
   src names a FONTS key that doesn't exist. */
export const FONTS = {
  // The book's voice: Cormorant Garamond.
  display: "CormorantGaramond_600SemiBold",
  displayMedium: "CormorantGaramond_500Medium",
  displayItalic: "CormorantGaramond_500Medium_Italic",
  // What people said: EB Garamond (the web's face for words, quotes,
  // answers, memory bodies). Cormorant is for titles only.
  story: "EBGaramond_400Regular",
  storyItalic: "EBGaramond_400Regular_Italic",
  // The interface: Montserrat.
  ui: "Montserrat_400Regular",
  uiMedium: "Montserrat_500Medium",
  uiSemiBold: "Montserrat_600SemiBold",
  // The keepsake cover's title only (BookCover.js), as the printed cover sets it.
  uiBold: "Montserrat_700Bold",
  uiItalic: "Montserrat_400Regular_Italic",

  // The wordmark and drawn artwork (and, historically, the live call's line).
  logotype: "CormorantGaramond_500Medium",
  logotypeSemiBold: "CormorantGaramond_600SemiBold",
  // Handwriting, for the keepsake book cover only.
  script: "MrsSaintDelafield_400Regular",
  // The everyday hand — a handwritten caption under a photograph, never
  // interface type.
  hand: "Caveat_500Medium",

  // Plain aliases (see above): the same Montserrat as ui / uiMedium / uiItalic.
  sans: "Montserrat_400Regular",
  sansMedium: "Montserrat_500Medium",
  sansItalic: "Montserrat_400Regular_Italic",
};

/* ── TYPE: the type scale ──────────────────────────────────────────────
   Roles, not sizes. Spread one into a style: `{ ...TYPE.body, color }`.
   docs/agents/type-revision.md has the table and the reasons.

   Set for readers who are often 70+: nothing anyone reads as a sentence is
   under 16, every control's label is 17 or more, and 13 is the floor for
   anything at all (a caption, a tab label). Cormorant has a small x-height,
   so its roles sit a size or two above the Montserrat role they pair with.

   Set like a book (type-revision.md, 19 Oct 2026):
   - Line heights sit on the 4-pt grid. One exception: body is 17/26,
     because 24 crowds Montserrat's tall x-height in a paragraph and 28
     floats a single line.
   - Tracking follows size. The big Cormorant tightens (−0.6 at 44 down to
     −0.1 at 23); Montserrat is 0 at 16–18, a touch negative above, a
     touch open below, and the uppercase small caps open to .115 em.
   - Figures: Cormorant's default figures are old-style (right inside a
     title: "Summer, 1962"), so its numeral roles ask for lining. They stay
     proportional, because Cormorant's tabular 1 stands alone like an I;
     anything that ticks (a clock, a code) is Montserrat with tabular-nums.

   These are the *unscaled* sizes: the phone's own text size (Dynamic Type)
   still multiplies them, because nothing sets allowFontScaling={false}. */
// Every serif role sets lining figures (owner, 21 Oct, FB-293: "October
// 2026" broke in height, the 2 and 0 at x-height and the 6 rising, in
// the faces' default old-style figures). One figure style, app-wide.
const LINING = ["lining-nums"];
const TABULAR = ["tabular-nums"];
export const TYPE = {
  // Cormorant — titles.
  hero: { fontFamily: FONTS.display, fontSize: 44, lineHeight: 48, letterSpacing: -0.6, fontVariant: LINING },
  display: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.4, fontVariant: LINING },
  title: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.3, fontVariant: LINING },
  title2: { fontFamily: FONTS.display, fontSize: 25, lineHeight: 28, letterSpacing: -0.2, fontVariant: LINING },
  // A card's or a row's title: a memory in a list, a person, a letter.
  title3: { fontFamily: FONTS.display, fontSize: 23, lineHeight: 28, letterSpacing: -0.1, fontVariant: LINING },

  // Cormorant — numbers set as type, lining.
  // The one big number on a screen (Home's ring: "13 stories").
  numeral: { fontFamily: FONTS.display, fontSize: 48, lineHeight: 52, letterSpacing: -0.5, fontVariant: LINING },
  // A price on a plan or the book.
  price: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.3, fontVariant: LINING },
  // A figure in a row of stats, a count on a card, a printed total.
  figure: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.2, fontVariant: LINING },

  // EB Garamond — what people said. The web: 19/1.7 on a phone.
  storyLarge: { fontFamily: FONTS.story, fontSize: 23, lineHeight: 36, fontVariant: LINING },
  story: { fontFamily: FONTS.story, fontSize: 20, lineHeight: 32, fontVariant: LINING },
  // A card's excerpt: the web sets it italic, a size down.
  excerpt: { fontFamily: FONTS.storyItalic, fontSize: 18, lineHeight: 28, fontVariant: LINING },

  // EB Garamond — running sentences (DECISIONS B3, owner critique §7:
  // "Running sentences belong in the serif"): an intro, a lead, an insight
  // line ("Rose told five stories this week"), an empty state's sentence,
  // an alert's message. Roman, in full ink; set two sizes over the sans they
  // replace, because EB Garamond's x-height is small. Controls, labels, meta
  // lines, kickers and tabs stay Montserrat.
  // `body` and `callout` stay the interface's (rows, chips and options use
  // them); a screen's sentences take these. Templates and Txt already do.
  lead: { fontFamily: FONTS.story, fontSize: 22, lineHeight: 32, fontVariant: LINING },
  sentence: { fontFamily: FONTS.story, fontSize: 19, lineHeight: 28, fontVariant: LINING },
  // A quieter sentence: a hint, an intro under a title, an empty state's line.
  sentenceSoft: { fontFamily: FONTS.story, fontSize: 18, lineHeight: 24, fontVariant: LINING },
  // A sentence that supports a question or a title ("Only Rose remembers
  // this one"): the book's italic (owner, 21 Oct, FB-268).
  aside: { fontFamily: FONTS.storyItalic, fontSize: 18, lineHeight: 24, fontVariant: LINING },
  // A tab root's running head ("Good evening, Jamie."), tooled in gold on
  // the sheet (FB-267): Cormorant's italic, quieter than the page's title.
  runningHead: { fontFamily: FONTS.displayItalic, fontSize: 24, lineHeight: 28, letterSpacing: -0.1, fontVariant: LINING },

  // Montserrat — the interface. 400 to read, 500 to touch or name, 600 for structure.
  headline: { fontFamily: FONTS.uiSemiBold, fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontFamily: FONTS.ui, fontSize: 17, lineHeight: 26 },
  // A row's name, a short statement that leads a block.
  bodyStrong: { fontFamily: FONTS.uiMedium, fontSize: 17, lineHeight: 24 },
  callout: { fontFamily: FONTS.ui, fontSize: 16, lineHeight: 24 },
  button: { fontFamily: FONTS.uiMedium, fontSize: 17, lineHeight: 24 },
  buttonLarge: { fontFamily: FONTS.uiMedium, fontSize: 18, lineHeight: 24 },
  // The page's one filled button (S-F7, FB-310): its word in the book's
  // title face, sentence case, a size up so Cormorant's small x-height
  // reads as Montserrat 18 did, a hair open on the fill. "Talk", "Keep it",
  // "Send the invite" belong to the page above them, not to a form.
  action: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 28, letterSpacing: 0.2, fontVariant: LINING },
  actionLarge: { fontFamily: FONTS.display, fontSize: 25, lineHeight: 28, letterSpacing: 0.2, fontVariant: LINING },
  // A quiet link on the paper (a text button): the book's italic in
  // terracotta, its → in the words, never underlined (DECISIONS B15, B27;
  // S-F7, FB-310: the semibold sans links read as a form under a serif
  // page). 19 so the italic reads at the size the 17 sans did.
  link: { fontFamily: FONTS.storyItalic, fontSize: 19, lineHeight: 24, fontVariant: LINING },
  // A control's name set strong in the interface face, where the word is
  // a control and not a link on the paper: the door's two answers, today
  // in the week's row, a name in the talk room (the old link role).
  control: { fontFamily: FONTS.uiSemiBold, fontSize: 17, lineHeight: 24 },
  field: { fontFamily: FONTS.ui, fontSize: 17 },
  // Meta lines only (a date, a count, "Told by Rose") — never a sentence.
  footnote: { fontFamily: FONTS.ui, fontSize: 15, lineHeight: 20, letterSpacing: 0.1 },
  // A kicker over a title or a section ("Your grandmother · born 1945",
  // "Today's question"): meta, so Montserrat, in sentence case at the 13
  // floor, one weight down from the controls, set in soft ink by the
  // callers (judges, night r1, FB-268 app-wide: the coloured uppercase
  // kickers were a fourth voice on every page). Uppercase is kept only
  // inside the printed book (smallCaps).
  kicker: { fontFamily: FONTS.uiMedium, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  // The book's small caps, for the printed page only (a running head in
  // the book, a chapter tag on a leaf): 13, tracked .115em, uppercase.
  smallCaps: { fontFamily: FONTS.uiSemiBold, fontSize: 13, lineHeight: 16, letterSpacing: 1.5, textTransform: "uppercase" },
  // A field's label, a plate's eyebrow: sentence case, as the web's are.
  label: { fontFamily: FONTS.uiMedium, fontSize: 15, lineHeight: 20, letterSpacing: 0.1 },
  // The floor. Badges, a photo's credit, the unit under a numeral.
  caption: { fontFamily: FONTS.uiMedium, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  // A tab bar label.
  tab: { fontFamily: FONTS.uiMedium, fontSize: 13, lineHeight: 16, letterSpacing: 0.1 },
  // The "→" after a row or a link: Montserrat's arrow is small, so it is set up a size.
  arrow: { fontFamily: FONTS.ui, fontSize: 20, lineHeight: 24 },
  // Something that ticks: a call's timer, a time being set.
  clock: { fontFamily: FONTS.uiMedium, fontSize: 56, lineHeight: 64, letterSpacing: -1, fontVariant: TABULAR },
  // A code to read out or type: a family code. Spaced, every digit the same width.
  // Set in the book's face with lining figures and open tracking, as a
  // printed code would be (judges, night r1: not bold Montserrat).
  code: { fontFamily: FONTS.display, fontSize: 40, lineHeight: 44, letterSpacing: 6, fontVariant: LINING },
};

// The smallest size any text may be set at, in any role.
export const MIN_TEXT_SIZE = 13;

/* How far each role may grow with the phone's text size, as Apple's own
   type does (premium-craft move 9, DECISIONS B40, F-7): the words a person
   reads grow all the way (iOS's largest accessibility size is about 3.1×);
   titles, already large, stop at 1.8× so a title never fills the screen;
   controls, labels and the small caps stop at 1.6× (a control past that is
   read in the Large Content Viewer, not by growing the bar). Pass it as
   maxFontSizeMultiplier: <Text maxFontSizeMultiplier={scaleCap("title")}>. */
export const SCALE_CAP = { words: 3.2, title: 1.8, control: 1.6 };
const TITLE_ROLES = new Set(["hero", "display", "title", "title2", "title3", "numeral", "price", "figure", "clock", "code"]);
const CONTROL_ROLES = new Set(["headline", "button", "buttonLarge", "action", "actionLarge", "link", "control", "field", "footnote", "kicker", "smallCaps", "label", "caption", "tab", "arrow", "bodyStrong", "body", "callout"]);
export function scaleCap(role) {
  if (TITLE_ROLES.has(role)) return SCALE_CAP.title;
  if (CONTROL_ROLES.has(role)) return SCALE_CAP.control;
  return SCALE_CAP.words;
}

/* ── SPACE: a 4-point grid ─────────────────────────────────────────────
   SPACE[n] = n × 4. Use these for every margin, padding and gap; the
   baseline audit counted 1,093 literals off the grid (10, 14, 18, 22…). */
export const SPACE = {
  0: 0,
  0.5: 2,
  1.5: 6,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
};

// Layout constants built from SPACE.
export const LAYOUT = {
  // The one horizontal page margin. (Screens used 12, 14, 16, 18, 20, 22…)
  gutter: SPACE[5],
  // Between sections of a page: clearly larger than any gap inside one.
  section: SPACE[8],
  // Between items in a stack (cards in a list).
  stack: SPACE[3],
  // Inside a card.
  inset: SPACE[5],
  // The longest comfortable line of reading text.
  readingWidth: 560,
};

/* ── RADIUS ──────────────────────────────────────────────────────────── */
export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  // Chips are pills now (web), but `chip` keeps its old value for the
  // screens that draw a rounded-rectangle chip themselves.
  chip: 12,
  // A boxed field (the web's is 14).
  field: 14,
  // A card is a printed plate (the web's §39): nearly square. Was 16.
  plate: 6,
  card: 6,
  // The rule inside a plate, and a print's corner.
  plateRule: 2,
  lg: 24,
  // The top of the paper sheet where it rises over the cloth: generous, so
  // it reads as a sheet laid on the cloth, not a band that stops (FB-298).
  sheetTop: 28,
  // Modal sheets.
  sheet: 28,
  pill: 999,
};

/* ── Touch targets ───────────────────────────────────────────────────── */
// The comfortable target. Nothing interactive is drawn under TOUCH_MIN.
export const TOUCH = 48;
export const TOUCH_MIN = 44;

/* ── Icon sizes ──────────────────────────────────────────────────────── */
export const ICON = { sm: 18, md: 22, lg: 26, xl: 32 };

/* ── Shadow ──────────────────────────────────────────────────────────────
   Only what floats casts a shadow (the web's rule): the tab bar, the "+",
   a toast, a lifted card while it is dragged. Cards at rest separate by
   tone. Elevation keeps the same shape on Android. */
export function softShadow(theme, level = 1) {
  const spec = [
    { h: 2, r: 6, o: 0.5, e: 2 },
    { h: 6, r: 16, o: 0.7, e: 6 },
    { h: 12, r: 28, o: 0.9, e: 12 },
  ][Math.min(level, 3) - 1];
  return {
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: spec.h },
    shadowRadius: spec.r,
    shadowOpacity: spec.o,
    elevation: spec.e,
  };
}

/* A colour at an alpha, from a #RRGGBB hex (or an rgb()/rgba() string).
   Use this rather than appending "22" to a hex: that only works while the
   input is a 6-digit hex, and fails silently the day a token becomes rgba. */
export function alpha(color, a) {
  const c = String(color || "").trim();
  let m = /^#([0-9a-f]{6})$/i.exec(c);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) {
    const [r, g, b] = m[1].split("").map((h) => parseInt(h + h, 16));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(c);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  return c;
}

/* ── Relationship colours ────────────────────────────────────────────────
   A story's accent, by who the storyteller is to you. Screens set these as
   *text* (a label, a play button, a waveform), so each is held to 4.5:1 on
   the page, a card and its own 12% tint — in its own theme. The light set
   was 3.0–4.5:1 and the dark theme used the light set (2.8–4.4:1).

   REL_COLOR follows the theme that is showing: ThemeProvider tells this
   module which one it is rendering (setActiveScheme), and every key is a
   getter. That makes the ~13 screens that read REL_COLOR[relationship]
   theme-aware without touching them. New code should call
   relColor(relationship, isDark) instead, which says what it means. */
export const REL_COLOR_LIGHT = {
  Grandmother: "#7E532E",
  Grandfather: "#7E532E",
  Mother: "#43644C",
  Father: "#43644C",
  Spouse: "#824D6A",
  Sibling: "#3F6372",
  Aunt: "#735838",
  Uncle: "#735838",
  Relative: "#735838",
  Friend: "#65558E",
  Myself: "#9A4320",
  Other: "#675C49",
};

export const REL_COLOR_DARK = {
  Grandmother: "#C38A59",
  Grandfather: "#C38A59",
  Mother: "#72A17E",
  Father: "#72A17E",
  Spouse: "#B887A1",
  Sibling: "#6E9CAE",
  Aunt: "#B38F63",
  Uncle: "#B38F63",
  Relative: "#B38F63",
  Friend: "#9D91BD",
  Myself: "#DA7B51",
  Other: "#A3957E",
};

let activeScheme = "light";
// Called by ThemeProvider on every render, before its children render.
export function setActiveScheme(name) {
  activeScheme = name === "dark" ? "dark" : "light";
}

export function relColor(relationship, dark = activeScheme === "dark") {
  const set = dark ? REL_COLOR_DARK : REL_COLOR_LIGHT;
  return set[relationship] || set.Myself;
}

export const REL_COLOR = {};
for (const key of Object.keys(REL_COLOR_LIGHT)) {
  Object.defineProperty(REL_COLOR, key, {
    enumerable: true,
    get: () => (activeScheme === "dark" ? REL_COLOR_DARK : REL_COLOR_LIGHT)[key],
  });
}

/* ── Chapter colours ─────────────────────────────────────────────────────
   The label on a memory card's chapter pill, set in the hue on a 12% tint of
   it. Light: deepened so every one is ≥4.5:1 on its own pill over the page
   or a card (six of eleven were 3.4–4.2). Dark: unchanged — they already
   pass on near-black. Read them through chapterColor(era, isDark). */
export const CHAPTER_COLOR = {
  "Where we come from": "#805227",
  Childhood: "#0A6C3E",
  "Growing up": "#0C637A",
  "Love & family": "#9E376C",
  "Work & making a living": "#7F570F",
  "The world we lived through": BRAND.teal,
  // The chapter that cuts across the others gets the one hue nothing else
  // uses, so a turning point is spottable in a scroll of memory cards.
  "When everything changed": "#A53728",
  "Faith & what carried me": "#385AA9",
  "Looking back": "#6E46B5",
  "From the family": "#7F570F",
  "Anything else": "#695D4C",
};

const CHAPTER_COLOR_DARK = {
  "Where we come from": "#DDA56C",
  Childhood: "#4FCB8D",
  "Growing up": "#5EC3DD",
  "Love & family": "#E98DBB",
  "Work & making a living": "#E2B358",
  "The world we lived through": "#6FC9C2",
  "When everything changed": "#F7907D",
  "Faith & what carried me": "#93ABF2",
  "Looking back": "#B79EF2",
  "From the family": "#E2B358",
  "Anything else": "#C2B59F",
};

/* A chapter's colour for text and icons on the page: the light theme's own,
   or its lifted twin in the dark. null for a chapter nobody has a colour for. */
export function chapterColor(era, dark = false) {
  return (dark ? CHAPTER_COLOR_DARK[era] : CHAPTER_COLOR[era]) || null;
}

/* ── Memory papers ───────────────────────────────────────────────────────
   The paper a memory is written on. Each has a dark twin; the dark twins
   are the same papers under the lamp (FB-512): each a step above the
   lamplit page (#221913), its hue kept but warmed, so the cool ones read
   as tinted paper, not a blue-grey panel. */
export const MEMORY_COLORS = [
  { key: "plain", light: "#FDFBF8", dark: "#2B2119" },
  { key: "blush", light: "#FBEBEC", dark: "#3A2A29" },
  { key: "apricot", light: "#FBEEDD", dark: "#3B2C1F" },
  { key: "butter", light: "#FBF4D8", dark: "#3A3220" },
  { key: "sage", light: "#DDECD7", dark: "#2C3126" },
  { key: "sea", light: "#D9EDEB", dark: "#28302A" },
  { key: "periwinkle", light: "#DEE6F7", dark: "#2E2B33" },
  { key: "lilac", light: "#EBDDF5", dark: "#342A36" },
];

// The one the mockup shows selected, and the colour of the writing panel
// in every frame that doesn't pick another.
export const DEFAULT_MEMORY_COLOR = "plain";

export function memoryColor(key, isDark) {
  const found =
    MEMORY_COLORS.find((c) => c.key === key) ||
    MEMORY_COLORS.find((c) => c.key === DEFAULT_MEMORY_COLOR);
  return isDark ? found.dark : found.light;
}

/* ── The accessibility text sizes (Apple's AX1–AX5) ───────────────────
   The fontScale iOS reports at each of the five larger accessibility
   sizes, so a layout can ask "is this AX3 or past it?" (hero-spec: the
   room's one voice, the stacked dock, the drop cap off) by name, not by a
   number typed into a screen. A browser has no Dynamic Type; the demo's
   `&ax=3` flag (DECISIONS H34, parsed in lib/demoMode.js) forces a level,
   and is passed in as `forced`. */
export const AX_SCALE = { 1: 1.64, 2: 1.95, 3: 2.35, 4: 2.76, 5: 3.12 };

// 0 below AX1, else the accessibility size the scale has reached (1–5).
export function axLevel(fontScale, forced = 0) {
  const f = Math.max(0, Math.min(5, Math.floor(Number(forced) || 0)));
  if (f) return f;
  const s = Number(fontScale) || 1;
  let level = 0;
  for (const [n, at] of Object.entries(AX_SCALE)) if (s >= at - 0.005) level = Number(n);
  return level;
}

export { MOTION, TRANSITIONS, appleSpring } from "./motion.js";
