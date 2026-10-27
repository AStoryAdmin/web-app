// Copies the phone app's pure logic into this repo, verbatim.
//
//   node scripts/sync-from-app.mjs          # copy
//   node scripts/sync-from-app.mjs --check  # fail if anything has drifted
//
// The archive must behave the same on the web as in the app: the same free-
// text dates read as the same years, the same chapters, the same book
// progress, the same question deck on the same day. The app keeps that logic
// in src/lib and src/data as plain ES modules with no React Native in them,
// so the cheapest way to be identical is to BE identical: copy the files, do
// not rewrite them. `--check` runs in CI so a change on either side shows up
// as a failed build rather than as two archives that disagree.
//
// Relative imports are kept working by keeping the same layout under
// src/app-core/ (lib/ and data/). Every copied file's imports are scanned;
// an import of a file not on the list, or of react-native/expo, fails the
// sync, so nothing impure gets in by accident.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = join(HERE, "..");
const APP = resolve(WEB, "..", "phone-app");
const DEST = join(WEB, "src", "app-core");

/** Paths relative to phone-app/src. Pure modules only. */
export const FILES = [
  // Chapters and the question bank (interview.js is generated from
  // content/questions.csv by the app's build-questions.mjs).
  "data/eras.js",
  "data/interview.js",
  "data/languages.js",
  // The row shapes a story and a memory take in the database, and the
  // save-diff. Shared so both products write the same columns.
  "data/rows.js",
  "data/familyRows.js",
  "lib/photoRefs.js",
  // Dates and the archive.
  "lib/timeline.js",
  "lib/spokenDate.js",
  "lib/memoryDateInput.js",
  "lib/weekStrip.js",
  "lib/photoDate.js",
  // The book. legacyBook builds the printable HTML and needs the brand
  // tokens, the logo paths and a QR encoder (qrcode-generator, a dependency
  // here too).
  "lib/bookProgress.js",
  "lib/bookDesign.js",
  "lib/legacyBook.js",
  // The checks a book passes before it is ordered (print ordering, R12).
  "lib/preflight.js",
  "lib/bookPages.js",
  "lib/bookCase.js",
  "lib/bookSerifFont.js",
  "lib/qr.js",
  "lib/printFonts.js",
  "lib/lifeSummary.js",
  "lib/familyFacts.js",
  "lib/familyRoster.js",
  "data/lessons.js",
  "theme/index.js",
  "theme/motion.js",
  "theme/logoPaths.js",
  "theme/bookFonts.js",
  // Questions. doors.js is the deck's opening run that dailyQuestion.js
  // draws from first.
  "lib/dailyQuestion.js",
  "data/doors.js",
  // The one rule the phone's Home deals today's question by (the doors, the
  // arc, the family's question of the day, a follow-up), so the web asks
  // what the phone asks on the same day.
  "lib/todayQuestion.js",
  "lib/followUps.js",
  "lib/nextQuestion.js",
  "lib/sensitivity.js",
  "lib/questionVoice.js",
  "lib/writeHelper.js",
  "lib/teller.js",
  // Memories and people.
  "lib/memoryCard.js",
  "lib/credit.js",
  "lib/memoryPeople.js",
  "lib/memorySides.js",
  "lib/familyTrust.js",
  "lib/quoteText.js",
  "lib/firstRunGuide.js",
  "lib/fromFamily.js",
  "lib/treasured.js",
  "lib/personMemories.js",
  "lib/personRights.js",
  "lib/personFacts.js",
  "lib/personSources.js",
  "lib/familyGraph.js",
  "lib/familyTree.js",
  "lib/familyTreeLayout.js",
  "lib/familyStories.js",
  "lib/keeperName.js",
  "lib/social.js",
  // Family codes and invites.
  "lib/familyCode.js",
  // Money. subscriptions.js and callUsage.js read RevenueCat and Supabase
  // directly, so the web has its own typed plan logic in src/lib instead.
  "lib/firstCall.js",
  // Saving and sessions.
  "lib/saveErrors.js",
  "lib/sessionCheck.js",
  // What an analytics event may carry (never words).
  "lib/analyticsEvents.js",
  // Which server features are switched on. demoMode.js reads ?demo=1 and
  // ?screenshot=1 from the address bar; lessons.js and serverFeatures.js
  // need it, and it is false on every ordinary page load.
  "lib/serverFeatures.js",
  "lib/demoMode.js",
  // Importing what people already wrote.
  "lib/importers.js",
  "lib/whatsapp.js",
  "lib/gedcom.js",
  "lib/socialArchive.js",
  "lib/memoir.js",
];

const EXTRA = [
  ["content/questions.csv", "content/questions.csv"],
  ["scripts/build-questions.mjs", "scripts/app-build-questions.mjs"],
];

const BANNED = /^(react-native|expo|@expo|@react-native|@react-navigation|@supabase)/;

function importsOf(source) {
  const out = [];
  const re = /(?:^|\n)\s*(?:import|export)[^'"]*?from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) out.push(m[1]);
  return out;
}

const check = process.argv.includes("--check");
let drift = 0;
const allowed = new Set(FILES.map((f) => resolve(APP, "src", f)));

for (const rel of FILES) {
  const from = join(APP, "src", rel);
  const to = join(DEST, rel);
  if (!existsSync(from)) throw new Error(`Missing in phone-app: src/${rel}`);
  const source = readFileSync(from, "utf8");
  for (const spec of importsOf(source)) {
    if (BANNED.test(spec)) throw new Error(`${rel} imports ${spec}: not pure, cannot be copied`);
    if (spec.startsWith(".")) {
      // Metro resolves "./eras" to eras.js; Vite needs the extension written,
      // so the copy is rewritten below. Both spellings must be on the list.
      const target = resolve(dirname(from), spec);
      const withExt = /\.(m?js)$/.test(target) ? target : `${target}.js`;
      if (!allowed.has(withExt)) throw new Error(`${rel} imports ${spec}, which is not on the list`);
    }
  }
  // Give extensionless relative imports their ".js" for the browser (Metro
  // resolves "./eras"; Vite needs "./eras.js"). The only change made to a copy.
  const fixed = source.replace(/(from\s*["'])(\.{1,2}\/[^"']+?)(["'])/g, (m, a, p, b) =>
    /\.(m?js|json)$/.test(p) ? m : `${a}${p}.js${b}`,
  );
  if (check) {
    if (!existsSync(to) || readFileSync(to, "utf8") !== fixed) {
      console.error(`drifted: src/app-core/${rel}`);
      drift++;
    }
  } else {
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, fixed);
  }
}
for (const [from, to] of EXTRA) {
  const src = join(APP, from);
  const dst = join(WEB, to);
  if (check) {
    if (!existsSync(dst) || readFileSync(dst) .toString() !== readFileSync(src).toString()) {
      console.error(`drifted: ${to}`);
      drift++;
    }
  } else {
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
  }
}

if (check && drift) {
  console.error(`${drift} file(s) differ from phone-app. Run: node scripts/sync-from-app.mjs`);
  process.exit(1);
}
console.log(check ? "in sync with phone-app" : `copied ${FILES.length + EXTRA.length} files into src/app-core`);
