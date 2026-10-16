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
  chocolate: "#4A3728",
  chocolateDeep: "#3B291D",
  chocolateInk: "#2B2116",
  gold: "#EAC668",
  brass: "#EBC86A",
  // The page: a warm sand. This is what the design file actually paints
  // behind almost every screen — 27 of its 50 full-height frames are this
  // colour, against 3 in the ivory the app used to use.
  sand: "#F3EBDE",
  // Sheets lifted off the page — the archive panel on home, and the frames
  // the design fills with #FAF7F2 rather than sand.
  ivory: "#FAF7F2",
  // Cards sit a shade lighter again.
  ivoryLight: "#FDFBF8",
  ivoryDeep: "#EEEBE8",
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

export const LIGHT = {
  name: "light",

  // Page + surfaces. The page is the designs' warm sand, and everything
  // raised off it is lighter, not darker: a sheet is ivory, a card is
  // lighter again. bgElevated used to be the darkest of the three, which
  // was right while the page was ivory and wrong the moment it wasn't.
  bg: BRAND.sand,
  bgElevated: BRAND.ivory,
  bgCard: BRAND.ivoryLight,
  // The raised archive panel, and the 40% strip that shows behind its top
  // edge to give it two tones rather than one.
  bgSheet: BRAND.ivory,
  sheetSupport: "rgba(213, 205, 198, 0.4)",

  // The brand's dark surface — the app bar, the hero at the top of the
  // welcome/auth screens, the splash. Always paired with `onDark*` text.
  surfaceDark: BRAND.chocolate,
  surfaceDarkDeep: BRAND.chocolateDeep,
  // A panel or button that deliberately contrasts with the page — the Talk
  // tile on Home, "Create account", Save. Chocolate here; ivory on the dark
  // theme (see DARK). Always paired with `onContrast*`, never `onDark*`,
  // because the two themes flip which of them is the light one.
  surfaceContrast: BRAND.chocolate,
  onContrast: BRAND.ivory,
  onContrastSoft: "#CBBBA8",
  contrastTint: "rgba(243, 235, 221, 0.16)",
  onDark: BRAND.ivory,
  onDarkSoft: "#CBBBA8",

  // The logo's own ink: Deep Chocolate on every light ground (ivory,
  // white, gold) and Soft Ivory on every dark one — that swap is the whole
  // colour rule for the mark. Deep Teal still carries links, where it does
  // the job of not being the same hue as a button.
  brandInk: BRAND.chocolate,

  // Ink. The designs set body copy in neutral grey and keep the warm brown
  // for headings and names — the contrast between the two is what makes a
  // heading read as one.
  text: BRAND.ink,
  textSoft: BRAND.inkSoft,
  // NOT the design file's #AEAEAE. That grey is 2.08:1 on the page — well
  // under the 4.5:1 floor — and in the designs it only ever sits behind a
  // search placeholder. Applied app-wide it would put every caption and
  // secondary line out of reach of the elderly readers this app is for, so
  // this stays at the guideline's Charcoal (7.25:1).
  textMuted: BRAND.charcoal,
  // The warm brown, for headings and anywhere a name is set.
  heading: BRAND.chocolate,

  // Actions.
  accent: BRAND.terracotta,
  accentHover: BRAND.terracottaDeep,
  accentSoft: "rgba(184, 83, 39, 0.10)",
  accentBorder: "rgba(184, 83, 39, 0.30)",
  accentTint: "rgba(184, 83, 39, 0.06)",
  onAccent: "#FFF7EC",

  // Secondary accent — the gold of the logo's heart.
  gold: BRAND.gold,
  goldSoft: "rgba(234, 198, 104, 0.18)",
  goldGlow: "rgba(234, 198, 104, 0.24)",
  onGold: BRAND.chocolate,

  // Illustration-only: the ground the daily-question figures stand on, and
  // the sun over them. Their own tokens rather than `success` and `gold`,
  // because those two carry meaning in the interface — a green that means
  // saved, a gold that means act on this — and a drawing that borrows them
  // spends that meaning somewhere it isn't saying anything.
  artHill: "#D8EBD2",
  artSun: "#F5D06A",

  // The live call's ground, and the glow that rises off its floor.
  //
  // These are the one set of tokens in this file that do not invert. A call
  // is dark in both themes on purpose: the screen is a room somebody is
  // talking in, not a page they are reading, and a full-brightness ivory
  // field held at arm's length at nine in the evening is a lamp pointed at
  // the person you were about to ask about their mother. Dark only sinks
  // the ground further and pulls the glow back, because a dark room needs
  // less of it.
  talkGround: BRAND.chocolateInk,
  // Terracotta, warming to the logo's gold at the core — and the core is
  // where the microphone sits, so the brightest part of the screen is the
  // part you are meant to talk into.
  talkGlowCore: "rgba(234, 198, 104, 0.30)",
  talkGlowMid: "rgba(184, 83, 39, 0.38)",
  // The outer stop must be the same hue at zero alpha, not `transparent`:
  // SVG interpolates gradient stops through RGBA, so ramping to transparent
  // black would drag a grey bloom through the middle of the terracotta.
  talkGlowEdge: "rgba(184, 83, 39, 0)",
  onTalk: BRAND.ivory,
  onTalkSoft: "rgba(250, 247, 242, 0.62)",
  // The ghost circles, and the mic's fill and ring. All struck off the
  // ivory rather than given their own hex, so they read as the ground
  // lifted rather than as shapes painted onto it.
  talkChrome: "rgba(250, 247, 242, 0.08)",
  talkChromeBorder: "rgba(250, 247, 242, 0.16)",
  // The button reads stronger than the halo around it, never the other way
  // round. Drawn the other way — a dense ring around a pale disc — the mic
  // stops being a button and becomes a hole with a rim, and the one control
  // on this screen that has to look pressable looks like a gap.
  talkMic: "rgba(234, 198, 104, 0.34)",
  talkMicRing: "rgba(234, 198, 104, 0.15)",
  talkMuted: "rgba(250, 247, 242, 0.10)",
  // The end button — the one filled, opaque shape on the screen, which is
  // how it stays findable without a label.
  talkEnd: BRAND.ivory,
  onTalkEnd: BRAND.chocolateInk,
  // The panels the call's machinery lives behind. Opaque rather than
  // translucent: a transcript read through a glow is a transcript nobody
  // reads.
  talkSheet: BRAND.chocolateDeep,
  talkScrim: "rgba(21, 14, 9, 0.62)",

  // The incoming call, before it is answered. Answer and decline get their
  // own tokens rather than `accent` and `danger`, because both of those
  // flip: accent is gold on dark, and a gold decline button on a ringing
  // phone is the one control nobody can afford to read wrong. These two
  // hold their hue across both themes and only lift for the darker ground.
  //
  // Declining is terracotta, not red. Nothing is being destroyed and
  // nothing is lost by not answering — the call comes back tomorrow — and
  // a red button says otherwise.
  callAnswer: BRAND.teal,
  callDecline: BRAND.terracotta,
  onCallAction: BRAND.ivory,
  // The question being brought to the door, on its own translucent card.
  callCard: "rgba(250, 247, 242, 0.08)",
  // The halo that swells behind the mark while it is ringing.
  callRing: "rgba(234, 198, 104, 0.16)",

  // Links: Deep Teal, so clickable text never shares the button hue.
  link: BRAND.teal,

  border: "rgba(74, 55, 40, 0.12)",
  borderMid: "rgba(74, 55, 40, 0.22)",
  // The hairline round a text field. A neutral grey rather than the warm
  // one everything else is outlined in — the design draws every input at
  // #E3E3E3, and a warm-brown hairline on a white pill reads as a tint.
  fieldBorder: "#E3E3E3",
  danger: "#B03A2E",
  // What reads on top of `danger`. Light's danger is a deep red and takes
  // near-white; dark's is a pale salmon and takes ink. Without this the
  // offline banner was setting its own literal and vanished on dark.
  onDanger: "#FFF7EC",
  success: BRAND.green,

  shadow: "rgba(74, 55, 40, 0.16)",

  // The book progress bar's ramp, left to right, and the grey the teeth
  // after it are drawn in.
  progressFrom: BRAND.terracotta,
  progressTo: BRAND.ember,
  combTooth: "#CCCCCC",

  // The floating bottom bar. Read off the 13/09/26 design: the bar is white
  // at 54% over the page (not the page colour itself), hairlined in solid
  // white, with the selected tab in a slightly warmer pill on top of it.
  // More glass than the design's 54%: the page behind should read through
  // it, and the blur keeps the labels on top legible.
  tabBar: "rgba(255, 255, 255, 0.36)",
  tabBarBorder: "#FFFFFF",
  tabBarActive: "rgba(243, 235, 222, 0.58)",
  tabBarActiveBorder: BRAND.ivory,

  // The launch screen. It takes over from the native splash (app.json:
  // splash.png on #4A3327), so these are that image's own colours, sampled
  // from it, and the same in both themes: the handover has to be invisible,
  // and the OS splash doesn't follow the app's theme. Note the ground is
  // not BRAND.chocolate (#4A3728), which is what the old boot screen used.
  launchGround: "#4A3327",
  launchMark: "#F3EBDD",
  launchHeart: "#EBC86A",
  launchWave: "rgba(241, 237, 223, 0.22)",
  launchWordA: "#F3EBDD",
  launchWordStory: "#EAC668",
  launchLine: "rgba(243, 235, 221, 0.78)",

  // The printed book. See BOOK_PRINT.
  book: BOOK_PRINT,
};

export const DARK = {
  name: "dark",

  bg: "#241A14",
  bgElevated: "#33251C",
  bgCard: "#3A2A20",
  bgSheet: "#2C201A",
  sheetSupport: "rgba(243, 235, 222, 0.06)",

  surfaceDark: BRAND.chocolateInk,
  surfaceDarkDeep: "#1B120D",
  // Chocolate on this ground was brown on brown: "Create account", the
  // Talk tile and every Save button nearly vanished. The contrast surface
  // is the light one here, as the dark one is on ivory.
  surfaceContrast: "#F1E7D8",
  onContrast: BRAND.chocolateInk,
  onContrastSoft: "#5C4636",
  contrastTint: "rgba(43, 33, 22, 0.10)",
  onDark: BRAND.ivory,
  onDarkSoft: "#CBBBA8",

  // On the dark theme every surface is a dark ground, so the mark is drawn
  // in ivory throughout (see LIGHT.brandInk).
  brandInk: BRAND.ivory,

  text: BRAND.ivory,
  // Solid secondary text — no opacity. On dark the smaller the text the
  // brighter it is, so captions stay legible instead of fading out.
  textSoft: "#D3C4B0",
  textMuted: "#E6DAC7",
  // On a dark ground the warm brown a heading uses in light mode would be
  // unreadable, so headings are simply the brightest ink here.
  heading: BRAND.ivory,

  // Terracotta goes muddy on a dark brown ground, so the guideline's Warm
  // Gold carries the actions here — the same swap the brand guide makes for
  // the logotype on dark backgrounds.
  accent: BRAND.gold,
  accentHover: BRAND.brass,
  accentSoft: "rgba(224, 160, 63, 0.12)",
  accentBorder: "rgba(224, 160, 63, 0.32)",
  accentTint: "rgba(224, 160, 63, 0.07)",
  onAccent: BRAND.chocolateInk,

  gold: BRAND.brass,
  goldSoft: "rgba(235, 200, 106, 0.16)",
  goldGlow: "rgba(235, 200, 106, 0.20)",
  onGold: BRAND.chocolateInk,

  // The light theme's pastel hill would glow on this ground, so it drops to
  // a depth the ink still reads against (see LIGHT.artHill).
  artHill: "#2C3A2E",
  artSun: "#C8A756",

  // See LIGHT.talkGround for why the call screen is dark in both themes.
  // Below chocolateInk, because on dark the call is the only thing on
  // screen and it should read as deeper than every surface around it.
  talkGround: "#150E09",
  // Dimmer than light's, for the same reason the tab bar drops to 8% here:
  // the eye arriving at this screen has already adapted to a dark room.
  talkGlowCore: "rgba(235, 200, 106, 0.24)",
  talkGlowMid: "rgba(184, 83, 39, 0.30)",
  talkGlowEdge: "rgba(184, 83, 39, 0)",
  onTalk: BRAND.ivory,
  onTalkSoft: "rgba(250, 247, 242, 0.58)",
  talkChrome: "rgba(243, 235, 221, 0.07)",
  talkChromeBorder: "rgba(243, 235, 221, 0.14)",
  talkMic: "rgba(235, 200, 106, 0.28)",
  talkMicRing: "rgba(235, 200, 106, 0.12)",
  talkMuted: "rgba(243, 235, 221, 0.09)",
  talkEnd: BRAND.ivory,
  onTalkEnd: BRAND.chocolateInk,
  talkSheet: "#241A14",
  talkScrim: "rgba(0, 0, 0, 0.66)",

  // See LIGHT.callAnswer. Both lift off their light values: Deep Teal at
  // full strength sits almost on top of this ground, and the terracotta
  // goes muddy on it the same way the progress ramp does.
  callAnswer: "#15687C",
  callDecline: BRAND.terracottaLight,
  onCallAction: BRAND.ivory,
  callCard: "rgba(243, 235, 221, 0.07)",
  callRing: "rgba(235, 200, 106, 0.13)",

  link: BRAND.tealLight,

  border: "rgba(243, 235, 221, 0.10)",
  borderMid: "rgba(243, 235, 221, 0.18)",
  fieldBorder: "rgba(243, 235, 221, 0.22)",
  danger: "#E4796A",
  onDanger: BRAND.chocolateInk,
  success: "#7FBF95",

  shadow: "rgba(0, 0, 0, 0.45)",

  // The design is light-only. White at 54% would sit on the dark page as a
  // pale haze, so the dark theme keeps the same idea — a translucent lift
  // off the page rather than a solid block — in ivory instead of white.
  progressFrom: BRAND.gold,
  progressTo: BRAND.brass,
  combTooth: "rgba(243, 235, 221, 0.22)",

  tabBar: "rgba(243, 235, 221, 0.05)",
  tabBarBorder: "rgba(243, 235, 221, 0.16)",
  tabBarActive: "rgba(243, 235, 221, 0.14)",
  tabBarActiveBorder: "rgba(243, 235, 221, 0.22)",

  // The launch screen: the same in both themes. See LIGHT for why.
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

// Font families. The font files are loaded in App.js via expo-font using the
// @expo-google-fonts packages; these strings must match the exported names.
// Cormorant Garamond carries the brand's serif logotype voice (headings),
// DM Sans is the interface face.
// Montserrat, throughout.
//
// The app used to pair Cormorant Garamond (headings) with DM Sans (body).
// Every one of the 840 pieces of type in the 2026 design file is Montserrat
// — Regular, Medium or Bold — so there is no second family any more.
//
// The `serif*` keys are kept rather than renamed: forty-odd screens import
// them, and the rename would be a large diff for no behaviour. They now name
// a *role*, not a family — serif* is the display/heading voice, sans* is the
// reading voice — and both resolve to Montserrat. Worth renaming to
// display*/text* the next time this file is opened for another reason.
export const FONTS = {
  // The brand's own serif. The serif* keys below name a *role* and resolve
  // to Montserrat; these name a family, because they are set on drawn
  // artwork and on the handful of lines that are meant to be read the way
  // artwork is looked at.
  //
  // For a long time that meant the wordmark and nothing else. The live
  // call's one centred line is the second: it is a sentence addressed to a
  // person by name, on an otherwise empty screen, and Montserrat sets it as
  // a heading — which is to say, as a label for something below it. There
  // is nothing below it. Anything that is interface type — a button, a row,
  // a field, a heading over a list — still uses serif*/sans*.
  logotype: "CormorantGaramond_500Medium",
  logotypeBold: "CormorantGaramond_600SemiBold",
  // Handwriting, for the keepsake book cover only.
  script: "MrsSaintDelafield_400Regular",

  serif: "Montserrat_500Medium",
  serifSemiBold: "Montserrat_600SemiBold",
  serifBold: "Montserrat_700Bold",
  serifItalic: "Montserrat_500Medium_Italic",
  sans: "Montserrat_400Regular",
  sansMedium: "Montserrat_500Medium",
  // The designs set every heading and button label in Bold, not SemiBold.
  sansSemiBold: "Montserrat_700Bold",
  sansItalic: "Montserrat_400Regular_Italic",
};

// Corner radii. The brand's shapes are soft and rounded — pill buttons, big
// rounded cards, and a deeply rounded sheet where the ivory page meets the
// chocolate hero.
// Corner radii, counted off the design file: inside the 40 phone screens the
// radii that actually appear are 1000 (pill), 16, 12, 8 and 6 — 20 shows up
// three times in the whole file. `card` was 20 here and is now 16, `chip` was
// 14 and is now 12, which is what the cards and chips are drawn at.
export const RADIUS = {
  pill: 999,
  field: 16,
  card: 16,
  // The one radius with no direct counterpart: the big sheets that slide up
  // over a photograph. Kept generous on purpose — it is what separates a
  // sheet from a card at a glance.
  sheet: 28,
  chip: 12,
};

// A soft, warm drop shadow — used by cards, the floating tab bar and the
// compose button. Elevation keeps the same shape on Android.
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

// Relationship accent colors — kept in the brand's warm range.
export const REL_COLOR = {
  Grandmother: "#C08552",
  Grandfather: "#C08552",
  Mother: "#5E8C6A",
  Father: "#5E8C6A",
  Spouse: "#A76A8B",
  Sibling: "#4E7A8C",
  Aunt: "#B08A5C",
  Uncle: "#B08A5C",
  Relative: "#B08A5C",
  Friend: "#7E6EA8",
  Myself: BRAND.terracotta,
  Other: "#96866C",
};

// Chapter accents — the tint behind a memory card's chapter chip, so a
// scroll through the archive is readable by colour before it's read by word.
// Drawn from the same warm range as REL_COLOR above (several are the same
// value on purpose: a life's chapters and a family's roles are the same
// palette), with Deep Teal carrying the one chapter that isn't warm.
export const CHAPTER_COLOR = {
  // The tag on a memory card. The design tints the pill to 12% of the hue
  // and sets the label in the hue itself, so a washed-out colour arrives as
  // a grey chip — which is what every chapter but two used to do. These are
  // pitched at the saturation of the design's own green (#0E9154): distinct
  // from each other, and still dark enough to read at 10px.
  "Where we come from": "#8C5A2B",
  Childhood: "#0E9154",
  "Growing up": "#0F7A96",
  "Love & family": "#B8407E",
  "Work & making a living": "#9A6A12",
  "The world we lived through": BRAND.teal,
  // The chapter that cuts across the others gets the one hue nothing else
  // uses, so a turning point is spottable in a scroll of memory cards.
  "When everything changed": "#C2412F",
  "Faith & what carried me": "#3D62B8",
  "Looking back": "#7048B8",
  "From the family": "#9A6A12",
  "Anything else": "#6F6250",
};

// The same hues lifted for the dark theme. Set in the light theme's dark
// shades they sank into the brown page ("Where we come from" was #8C5A2B on
// #2A1F19, about 2:1); these keep each chapter's hue and read at 4.5:1 or
// better on the dark card.
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

// Memory colours — the paper a memory is written on, picked from the
// "Memory color" row of the Create a memory sheet (13/09/26 designs).
//
// The mockups are light-only, and their pastels would glare as a full-height
// panel on the dark theme, so each colour carries its own dark counterpart:
// the same hue, dropped to a depth that `theme.text` still reads on.
export const MEMORY_COLORS = [
  // Read off the cards in the design file: a plain ivory, a blush and a
  // sage, with the rest of the row filled out in the same washed register
  // so no swatch shouts over its neighbours. "plain" is the paper a memory
  // gets when nobody chooses.
  { key: "plain", light: "#FDFBF8", dark: "#3A2A20" },
  { key: "blush", light: "#FBEBEC", dark: "#432C32" },
  { key: "apricot", light: "#FBEEDD", dark: "#463325" },
  { key: "butter", light: "#FBF4D8", dark: "#443C25" },
  { key: "sage", light: "#DDECD7", dark: "#2C3A2E" },
  { key: "sea", light: "#D9EDEB", dark: "#293A39" },
  { key: "periwinkle", light: "#DEE6F7", dark: "#2E3444" },
  { key: "lilac", light: "#EBDDF5", dark: "#382E45" },
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

export const TOUCH = 48;
