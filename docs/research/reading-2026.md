# Reading a memory: research and the specification for the memory page

October 17, 2026. Written for the founder's ruling on the memory page: the colour, the bubbles, the buttons, the frame cut, the image frame and the title were all wrong, and the paragraphs were hard to read. This note covers how the best products set a written entry for reading, and then gives a specification for `/archive/:id` that can be built directly.

**How this was done.** I measured live pages in a browser with computed styles: Medium, Substack, Craig Mod, Stripe Press, the A Story samples book and A Story's own memory page. The other products come from their help pages and reviews, linked in §5. All contrast ratios are WCAG 2 figures I computed from the hex values. NYTimes.com is blocked in the research browser and The Atlantic showed a bot check, which I did not get past, so neither was measured.

**The page moved while I worked.** At 21:48 the memory page was the version the founder rejected: the cloth band, a photo cropped to 16:10, a tinted caption band, three terracotta tiles and a footer of pills. At 22:11 another builder had replaced it with `.mv` (`Shell bare`, `MemoryHead`, `Plate`, a quiet tool row). §4 lists the faults in the rejected version and says which of them the rebuild still has. The specification in §3 is the target for both.

---

## 1. What the best do

### Measured reading columns (desktop, 1006–1366px windows)

| Product | Face | Size / leading | Column | Ink on paper | Contrast | Paragraphs |
|---|---|---|---|---|---|---|
| Medium | Source Serif Pro | 20 / 32px (1.6) | 680px | #242424 on #FFF | 15.5:1 | ~34px space, no indent |
| Substack (default post) | publication serif (Lora here) | 20 / 32px (1.6) | 728px | #363737 on #FFF | 11.9:1 | 20px space |
| Craig Mod essays | FF Meta Serif | 20 / 30px (1.5) | 622px | #333 on #FFF | 12.6:1 | 30px space (one line), `hyphens: auto` |
| Stripe Press online (Poor Charlie's Almanack) | Ivar | 18.9 / 24.2px (1.28) | 423px | #2D2D2D on #EFEFEF | 12.0:1 | 36px first-line indent, no space, justified |
| A Story printed book (samples, memory page) | EB Garamond | 1.52 leading | ~60 characters | #2B2B2B on paper | — | 0.8em space, no indent |
| Project Reboot journal (founder) | Cormorant Garamond | 21px / 1.85 | ~860px leaf | navy ink on #FBF7EE leaf | — | free text in a ruled leaf |
| A Story memory page, rejected | EB Garamond | 22 / 37.4px (1.7) | 542px at 1366; 718px at 1920 | #2A2320 on #F3EBDD | 13.1:1 | 600–1000-character blocks |
| A Story memory page, rebuild 22:11 | EB Garamond | 21 / 34.9px (1.66) | 640px (`64ch`) | #2B2B2B on #F3EBDD | 12.0:1 | 0.9em space |

Every serious reader lands in the same narrow band: a serif at 19–21px with 1.5–1.6 leading, 600–700px columns, near-black ink (never pure black) and space between paragraphs. Only the book-like Stripe Press uses indents, and it pays for that with justification and a narrow 423px page.

### Journaling apps

- **Day One.** The entry view is just the writing. Location, weather, tags, the journal, the time and the device all live on a separate Entry Info screen, reached from the ••• menu or the map at the foot of the entry. Photos added together become one grid that sits inline in the text and can be moved by dragging. Delete, share and export are in the ••• menu too. The lesson: metadata and actions are one tap away, never set around the words. ([Entry Info](https://dayoneapp.com/guides/tips-and-tutorials/entry-info-metadata-in-day-one-for-ios/), [Adding media](https://dayoneapp.com/guides/getting-started-with-day-one/adding-media-in-day-one/), [Day One 3 grids](https://thesweetsetup.com/day-one-for-ios-hits-version-3-introduces-audio-snippets-dark-mode-and-tons-more/))
- **Apple Journal (Mac).** Media can sit in a grid on the entry or be dragged into the text and resized there. If you don't place photos, they arrange themselves in a simple layout, and the design deliberately gives little layout control. ([Apple guide](https://support.apple.com/guide/journal/add-formatting-photos-and-more-devb7625b2b0/mac), [MacMost](https://macmost.com/how-to-use-the-journal-app-on-your-mac.html))
- **Journey.** List rows carry text, date, thumbnail, location, star, weather and mood. Reviewers find that row busy, and it is the opposite of Day One's quiet entry. ([Journey help](https://support.journey.cloud/categories/app-interface-functionalities/articles/journey-view-interface-in-journey))
- **Stoic, Reflectly, 5 Minute Journal, Grid Diary, Rosebud.** These are built around writing, not rereading. Reflectly is bright colour on white with big rounded tappable buttons; reviewers call it beautiful but basic. 5 Minute Journal has a timeline of excerpts that opens a full-day review. Grid Diary's 9-cell grid takes getting used to. Rosebud is a chat. None of them teaches anything about reading a long entry, and Reflectly's big rounded buttons are exactly the "bubble" the founder rejected. ([Reflectly review](https://mobilesyrup.com/2019/04/07/reflectly-journaling-app-review/), [5 Minute Journal listing](https://apps.apple.com/fr/app/5-minute-journal-journaling/id1062945251), [Grid Diary, Macworld](https://www.macworld.com/article/222142/grid-diary-makes-keeping-a-journal-as-easy-as-filling-out-a-form.html))
- **Diarium, Penzu, Notion journal templates.** These are covered in `journaling-apps-2026.md`. Penzu lets you pick a font and cover per entry, and reviewers call the result dated. Notion templates are database rows. Neither is a reading model.
- **Project Reboot (the founder's journal).** Its `DESIGN.md` and `src/styles.css` set a page as a book spread: a verso with a large day number in a masthead, a typewriter dateline, a ✦ ornament and an epigraph; a recto with a running head, the salutation "Dear me," and the text in Cormorant at 21px with 1.85 leading on a laid-paper leaf; a signed close; a folio; and a foil frame with corner ornaments. Tools are 36px icon buttons with no fill, and buttons are 6px-radius rectangles, never pills. Records are "open and ruled" and shadows are kept for the drawer. The founder's own reading page has no tiles and no boxes. The paper, rules and ornaments carry it.

### Long-form reading products

- **Medium.** Source Serif Pro at 20/32 in a 680px column, #242424 on white. The title is a 42px bold sans. Images run the full column or wider. Clap, comment, save and share are grey line icons in a thin bar above and below the article, never filled buttons.
- **Substack.** 20/32 in a 728px column with 20px between paragraphs. The publication picks the serif. The same quiet icon row sits under the title.
- **Craig Mod.** FF Meta Serif at 20/30 in a 622px column, #333 on white, one empty line between paragraphs, automatic hyphenation. Photographs run very large, often wider than the text, so the picture and the words take turns rather than sitting side by side.
- **Stripe Press online.** A book on screen: Ivar at 18.9px, justified, indented, in a 423px page on #EFEFEF, with a huge Cardinal Fruit title (97px, weight 300). The audiobook control and the reading progress are small monospace text ("[+] AUDIOBOOK [1.5X]", "00.00%"), with no buttons at all. This is the best model for A Story's voice control.
- **iA Writer.** Its responsive-typography essay takes 16px Georgia as the floor, suggests 140% leading, and controls the measure with a few fixed widths rather than a fluid column. ([iA](https://ia.net/topics/responsive-typography-the-basics))
- **Bear 2.** Line height, line width (in 8em steps), paragraph spacing and first-line indent are each a setting. Writers of long prose turn spacing to zero and indents on, which shows that space and indent are alternatives, never used together. ([Bear typography](https://bear.app/faq/typography-options/), [community](https://community.bear.app/t/paragraph-spacing/9751))
- **Readwise Reader.** Defaults to 20px with 1.4 line spacing (adjustable from 14 to 80px) and a "medium" line width, all under one "Aa" control. ([Readwise docs](https://docs.readwise.io/reader/docs/faqs/appearance))
- **Instapaper 10 (July 2026), Matter.** Both offer a curated short list of reading faces (Literata, New York, Atkinson Hyperlegible, Lyon) and keep highlights muted. One critique of e-readers in general: size, measure and leading are adjusted separately, when changing the size ought to carry the others with it. ([Instapaper 10](https://www.ithinkdiff.com/instapaper-10-update-liquid-glass-fonts-widgets/), [Matter](https://thesweetsetup.com/is-matter-or-readwise-reader-the-read-later-app-for-you/), [Archibald](https://jeffarchibald.ca/ereader-typography-is-broken-how-to-fix-it))
- **Kindle and Apple Books.** Each has a face drawn for screens: Bookerly (2015, with a typesetting engine for hyphenation and spacing) and Iowan Old Style (a high x-height, so it reads larger). Apple Books has themes (Original, Quiet, Paper, Bold, Calm, Focus) that change the ground and the weight together. ([Bookerly](https://www.thebookdesigner.com/kindle-new-bookerly-font-and-typography-features/), [Iowan](https://en.wikipedia.org/wiki/Iowan_Old_Style), [Apple Books themes](https://iphonelife.com/content/how-to-customize-themes-apple-books-app-iphone))
- **NYT, The Atlantic.** Not measured (see above). From prior knowledge only: a serif of about 20px in a column of about 600px, drop caps on features, and photographs that run wider than the text. I have not verified this here.

### Memory and legacy products

- **Remento.** The story page shows the written story with the original recording kept and playable. A quiet "Edit✨" text button under the story offers three styles: a cleaned transcript (their exact words with "ums" and "ahs" removed and punctuation added), a first-person story and a third-person story. The recording also prints as a QR code per chapter. ([Remento help](https://help.remento.co/en/articles/8365905-can-i-change-how-remento-writes-my-story), [FAQ](https://www.remento.co/faq))
- **Storyworth.** Stories come in by email, phone or web. A built-in proofreader works without rephrasing, and relatives comment. Bloggers report a fixed font and size with no bold or italics, plus "Edit Title / Edit Story / Delete Story" links. I found no public screenshot of the reading view. ([Geneamusings](https://www.geneamusings.com/2023/02/rabbit-holes-with-randy-telling-family.html), [The Bloggess](https://thebloggess.com/2021/12/11/storyworth-you-should-try-it/))
- **StoryCorps Archive.** The page order is title, recorded date and length, the player, then labelled sections: description, participants, interviewer, keywords, places, languages. It reads like an archive record and is not a page you read. ([demo](https://archive.storycorps.org/interviews/demo-interview/), [LoC](https://blogs.loc.gov/folklife/2017/11/storycorps-interviews-and-the-importance-of-keywords/))
- **Ancestry Stories.** A sequence of photographs, each with text above or below, about one ancestor. Photo and words alternate in a single column. ([Geneamusings](https://www.geneamusings.com/2022/03/myancestrystory-debuts-on-ancestry.html))
- **Apple Photos Memories.** A title, a subtitle and a key photo, and nothing else on the title card. ([Apple](https://support.apple.com/guide/photos/pht69f4420d8))
- **Google Photos.** The caption is an "Add a description" field in the Info panel beside the photo, secondary to the picture. ([MakeTechEasier](https://maketecheasier.com/add-description-to-google-photos/))

### The printed book (astoryapp.com/samples): the brand's own reading page

Measured on the memory spreads ("Tulip Time, 1968", "Bread and the lake", "The wedding, in the rain"). All ratios are relative to the body text:

- **Left page head:**
  - the chapter as a sage small-caps pill (Montserrat 600, 0.57 × body, #55745A on #E4E8DC);
  - the four marks Moment / Feeling / Meaning / Lesson as small rules at the top right;
  - the title in Cormorant Garamond 500 at 2.25 × body, leading about 1.0;
  - the dateline "1968 · age 8" in Montserrat 600 terracotta at 0.71 × body.
- **Below the head:**
  - a Summary box: a step down in tone (#F4EDE1), labelled "SUMMARY", with the source mark "LIVE CONVERSATION · 21 MIN" on the right and the summary in italic;
  - "THE QUESTION" with the question in italic EB Garamond and "ASKED BY ELLIE";
  - the words in EB Garamond at 1.52 leading, paragraphs spaced 0.8em with no indent;
  - a 3-line drop cap in Cormorant 500 at 3.35 × body, coloured in the cover cloth's colour (navy on the navy edition).
- **Right page:** "WE ASKED" with a follow-up in italic, then the words, then the lesson set large in a cloth-coloured band, then who carries it, then a QR code for the full transcript and voice.
- **Photographs never share a page with the words.** A memory's photo gets its own spread, full bleed across the gutter. The caption sits in the margin in small caps ("DYLAN, SEVEN MONTHS · 1985") with an italic line under it, and there is a pull quote in italic Cormorant with a terracotta opening quote mark.

The book never puts a photograph and a paragraph in competing boxes side by side, never puts the title in a box, and has no buttons.

---

## 2. What the research on reading from screens says

- **Measure.** Butterick says 45–90 characters including spaces. Baymard says 50–75, citing Ruder's 50–60 as ideal. Bringhurst's 66 is the most cited figure. Dyson and Kipping, and Dyson and Haselgrove, found 55 characters per line the easiest to read, though very long lines were read slightly faster. **Target 62–68 on desktop and 40–48 on phones.** ([Butterick](https://practicaltypography.com/line-length.html), [Baymard](https://baymard.com/blog/line-length-readability), [line-length review](https://journals.uc.edu/index.php/vl/article/view/5765))
- **The `ch` trap (measured).** In EB Garamond, `1ch` (the width of "0") is 0.48em, but an average character of running English, spaces included, is 0.377em. So `N ch` holds about 1.27 × N characters. The rejected page's `68ch` gave **86 characters per line at 1920** (measured median). The rebuild's `64ch` gives **77 at 1366**. Set the measure in `em`: 66 characters ≈ **25.4em**.
- **Size.** Butterick puts web body text at 15–25px. EB Garamond's x-height is 0.41em (measured) against Georgia's 0.48 and Source Serif's ~0.47, so it reads about 1.5–2px smaller than those faces at the same size. Matching Medium's x-height (≈9.5px) takes EB Garamond at about 23px; 22px gives 9.0px. The readers are 65–90 and their families, so it should not go smaller.
- **Leading.** Butterick gives 120–145%, iA 140%, Medium and Substack 160%, the book 152%. A small-x-height Garamond needs less leading than a big-x-height face; at 1.7 the lines come apart. **1.58–1.6.**
- **Space or indent, never both.** Butterick, the Bear writers and the book all agree on this. On screen and in the book, use space of 50–100% of the type size. The book uses 0.8em.
- **Polarity.** Dark text on a light ground beats the reverse for both younger and older adults (Piepenbrock, Mayr & Buchner, Ergonomics 2013). Light paper is the default; dark is an option. ([abstract](https://documentacion.fundacionmapfre.org/documentacion/bib/143702.do))
- **Older readers.** The NIA/NLM checklist asks for upper and lower case (no all-caps text), no italics for running text, plain grounds and left alignment. Its sans-serif advice dates from 2001 low-resolution screens and is superseded by high-DPI serifs. ([NIA checklist](https://corpora.tika.apache.org/base/docs/govdocs1/562/562513.html))
- **Contrast.** Body ink on paper should be at least 7:1 (AAA). Small print needs at least 4.5:1. Avoid pure #000 on #FFF: every measured reader uses #242424–#363737.
- **Drop caps.** Use `::first-letter` so screen readers don't split the word (Roselli). A drop cap rests the eye at the start of a long run. In a short paragraph the letter dominates the text block. In CSS, `initial-letter` works in Safari and Chrome/Edge 110+, and other browsers need a float fallback. ([Roselli](https://adrianroselli.com/2019/10/accessible-drop-caps.html))
- **Hanging punctuation.** `hanging-punctuation` works in Safari only, so treat it as an enhancement and not a dependency. ([Adactio](https://adactio.com/journal/21027))
- **Rag.** Use `text-wrap: pretty` for paragraphs (Chromium tunes the last four lines; WebKit tunes whole paragraphs since 2025) and `balance` for titles. ([ppc.land on WebKit](https://ppc.land/safaris-text-wrap-pretty-brings-superior-web-typography/))
- **Transcribed speech.** Oral history guides descended from Baylor's type words as heard and punctuate by sense. They drop false starts and most crutch words ("um", "uh") and delete the interviewer's back-channel ("okay, right, uh-huh"). Remento's "cleaned transcript" is the same rule. Full verbatim is kept for the record but not for reading. ([Baylor guide](https://npgallery.nps.gov/GetAsset/8502bfeb-ab04-400d-b547-62e63763c5a2/original), [Lincoln Library guide](https://PresidentLincoln.illinois.gov/Resources/9151a648-82b0-4762-b7a6-4ed9639cf146/transcription%20editing%20style%20guide.pdf), [Queens Memory](https://queensmemory.org/wp-content/uploads/2023/10/Queens-Memory-Transcription-Style-Guide_2023_10.pdf))

---

## 3. The reading specification for A Story's memory page

### 3.1 The principle

The memory page is **a page of the family book, open on the bench**. The words lead, set exactly the way the book sets them. The photograph is a print with its own place, never cropped. Everything else is small print or a quiet word: the chapter, when it was, who told it, what can be done. Nothing is filled, boxed or rounded except one Play button and one Send button.

### 3.2 The words: type

| | ≥1680px | 1024–1679px | 600–1023px | <600px |
|---|---|---|---|---|
| Face | EB Garamond | EB Garamond | EB Garamond | EB Garamond |
| Weight | 400 (try 440 on Windows, see note) | 400 | 400 | 400 |
| Size | **23px** | **22px** | 21px | **20px** (19px under 360px) |
| Line height | 1.58 (36.3px) | 1.6 (35.2px) | 1.6 | 1.6 (32px) |
| Measure | **25.4em = 584px**, ≈66 chars | **25.4em = 559px**, ≈66 chars | min(25.4em, 100%) | column: **350px at 390** (gutter 20px), ≈46 chars |
| Paragraph space | 0.8em | 0.8em | 0.8em | 0.8em |
| Indent | none | none | none | none |

- Set the column as `max-width: 25.4em` on the words element, **never in `ch`**. Left aligned, ragged right, `text-wrap: pretty`, `hyphens: manual` on desktop. Under 600px allow `hyphens: auto` with `hyphenate-limit-chars: 7 3 3` and the right `lang`.
- Use `font-variant-numeric: oldstyle-nums proportional-nums`, `font-kerning: normal` and `font-optical-sizing: auto`.
- **Weight note.** The founder reads in Edge on Windows. At 1× DPR, EB Garamond 400's hairlines look grey. Request the variable axis (`EB+Garamond:ital,wght@0,400..800;1,400..800`) and test 440 against 400 by eye at 1366×768. Use 440 only if it reads darker without looking bold. This is unverified, so check it on the founder's screen.
- Running text is always the full ink, never grey and never italic. Italic is for the question, the family's quoted lines and captions.
- Optional, as a later release: an "Aa" control with three sizes (S 20 / M 22 / L 25), kept per viewer. Because the measure is in em, the line length stays at about 66 characters at every size. That is the point of the e-reader critique above.

### 3.3 Ink and paper

| Role | Colour | On | Contrast | Use |
|---|---|---|---|---|
| Body ink | `--sheet-ink` #2B2B2B | sheet #F3EBDD | **11.96:1** | the words, the title, the family's lines |
| Body ink on a print | #2B2B2B | #FFFDF8 | 13.93:1 | captions on a plate |
| Small print | `--ink-soft` #6B625B | #F3EBDD | 5.03:1 | teller line, timestamps, empty states |
| Caption small caps | `--kicker-grey` #6A645B | #F3EBDD | 4.95:1 | photo date line, running head |
| **Terracotta for text** (new `--terracotta-ink`) | **#9A4320** | #F3EBDD | **5.55:1** | dateline, "The question" label, small links |
| Terracotta for glyphs only | #B85126 | #F3EBDD | 4.18:1 | icons ≥17px, rules, the reading bar. **Never text under 24px** |
| Sage for the chapter pill (new `--sage-ink`) | **#3F5B44** | #E4E8DC | **6.05:1** | the pill (the current #55745A is 4.19:1) |
| Drop cap | `--chocolate` #4A3327 | #F3EBDD | 9.89:1 | the book colours its drop cap with the cover cloth, so the app uses its own cloth |
| Ochre | #BF7F1A | #F3EBDD | 2.83:1 | **never text**; only the filled treasure star |
| Foil | #C9A15A | #F3EBDD | 2.03:1 | rules, ✦, the `·` separators only |
| Faint | #9A8F85 | #F3EBDD | 2.67:1 | **never text** on this page |

The ground is the sheet (#F3EBDD laid paper with the existing faint vignette). The text never sits on a tinted box. **Dark** (follows `prefers-color-scheme`, or a manual choice): ground #1E1814, ink #E6DDD0 (13.06:1), soft #B8ADA2 (7.97:1), terracotta-ink #E2A26F (8.05:1). Keep the weight at 400 and raise the leading by 0.05, because light-on-dark type spreads. Light stays the default because of Piepenbrock (2013).

### 3.4 Paragraphs

- Paragraphs are spaced, not indented: 0.8em, as the book does.
- Long blocks are broken at a sentence end. Use `readableParagraphs` with **target 380 and max 560 characters**; the current 420/640 is slightly long. The result is 4–7 lines at 66 characters. A tail under 140 characters joins the paragraph before it. A sentence is never split.
- Never more than 9 lines unbroken at desktop measure, or 12 on a phone.
- No single-word last lines (`text-wrap: pretty`).

### 3.5 Transcribed speech (the house transcript style)

There are two sources, treated differently:

1. **Words the teller typed** in the writer are theirs exactly. Their line breaks are kept (a list of answers, a poem, a recipe).
2. **Words transcribed from a call** are set as a **clean transcript**: their words, in their order. The following are removed:
   - "um", "uh", "er" and stutters;
   - false starts ("So I, so I took home…" becomes "So I took home…");
   - back-channel from anyone other than the teller ("Yeah, right?", "Mm-hmm", "For sure").

   Then:
   - Punctuate by sense and use sentence case. Do not rephrase, reorder or translate.
   - If another person on the call asks something and the teller answers, set the question as one italic line in `--ink-soft`, indented 1.5em, before the answer. This is the book's "WE ASKED" line on a small scale. Otherwise drop the other person's lines.
   - Bao's own questions never appear in the body. The first one becomes "The question" in the head (§3.7).
   - Laughter and pauses: `[laughs]` in italic `--ink-soft`, at most one per paragraph. Unclear words: `[unclear]`, the same style.
   - Code-switching (for example Vietnamese inside English) stays in the same face, wrapped in `<span lang="vi">` so screen readers and hyphenation behave. EB Garamond, Cormorant and Montserrat all carry the Vietnamese subset, which the Google Fonts CSS2 link serves automatically.
   - Under the words, one quiet line: "Lightly tidied from the call · Read it word for word". It opens the full verbatim transcript in place (Remento's model). This is the page's only disclosure about editing.
3. **Short lines.** In a transcript there is never a `<br>`: lines are joined with the sentence punctuation they lack. In typed text, three or more consecutive lines under 40 characters are a **run of lines**. Set it with leading 1.5, no drop cap, no paragraph space between the lines, and 0.8em around the group. It is never floated around a drop cap.

### 3.6 The head: title, dateline, chapter, teller

The head sits at the top of the words column, on the paper, in the book's order:

1. **Back:** "‹ The Archive", Montserrat 600 14px, ink, 44px target. Nothing else on that row. The running head already names the story, so "/ Your story" and "Memory No. N" go.
2. **Chapter pill and marks.** The pill uses Montserrat 600, 11px, 0.2em tracking, uppercase, #3F5B44 on #E4E8DC, 26px tall. Hide it when the chapter is "Anything else", which isn't a chapter. The four marks (Moment / Feeling / Meaning / Lesson) go at the right of the row, 11px, 62px each:
   - "on" marks are #9A4320 with a terracotta rule;
   - "off" marks are #6B625B with a #E5DCCD rule.

   Show the marks only when at least one is on.
3. **Title.** Cormorant Garamond 600, letter-spacing −0.01em, `text-wrap: balance`, in ink, sitting directly on the paper with no box:
   - 44px / 1.08 at 1366; 50px at ≥1680; 32px / 1.1 on phones;
   - at most 2 lines on desktop and 3 on a phone.
4. **Dateline**, 14px under the title. "1966 · AGE 6" in Montserrat 600 13px, 0.08em tracking, uppercase, #9A4320. Undated memories get "Add when it was" in Montserrat 500 14px, `--ink-soft`, with a 1px hairline underline, not a red "No date yet". Separators are foil `·`.
5. **Teller row**, 18px under the dateline, 44px tall. On the left: a 32px round face, then "Told by **Bao** on a call · 6 minutes" in Montserrat 500 14px (the name 600 in ink, the rest `--ink-soft`). Faces of the people in it follow: "with" in EB Garamond italic 16px, then 24px faces with given names. On the right, the three head tools (§3.11).

Words start 32px under the teller row, or 28px under the question.

### 3.7 The question, the summary, the pull quote

- **The question** (when the memory answered one, from Bao or a relative) is set as in the book and **without a box**:
  - the label "THE QUESTION" in Montserrat 600 11px, 0.22em tracking, #9A4320;
  - under it the question in EB Garamond italic, 21px / 1.4, ink, at most 2 lines;
  - under that, "Asked by Ellie" in Montserrat 500 13px, `--ink-soft`;
  - 28px of space before the words.

  The rebuild's bordered, tinted `.mv-asked` box should become this.
- **No summary box on the web page.** The server's summary is third person ("The speaker…"), and BAOS rule 17 says the page shows the person's own words. The book's summary box is a print convention. On screen, the question does the job of a standfirst.
- **No pull quote** inside the words: it repeats text on a page that is all text (BAOS rule 19). When the memory has a **lesson** (the fourth layer), set it once, after the words. Use Cormorant italic 30px / 1.2 in ink, with a terracotta "“" hung outside the column (`text-indent: -0.45em`), and "WHAT HE PASSES ON" in small caps above it. No navy band: on the sheet a band of colour is a box.

### 3.8 The drop cap

- **Only when** the first paragraph has no line break, its first line is at least 200 characters, and its first character is a letter A–Z. Not after a quote mark, a digit or a run of lines. This fixes the measured fault where "W" was dropped beside "e live in a small city / It's in Vietnam".
- **Style:** Cormorant Garamond 600 in `--chocolate` #4A3327, three lines deep (`initial-letter: 3` with an `@supports` fallback to `float: left; font-size: 4.35em; line-height: 0.8; padding: 0.04em 0.08em 0 0`), set on `::first-letter` only. Two lines deep under 600px. No colour fills, no ornaments.

### 3.9 The photograph

- **Treatment (the book's plate):**
  - a print on #FFFDF8 with a 12px border (16px at the bottom) on desktop, 8px (12px at the bottom) on phones;
  - a 1px `--sheet-rule` edge, a **2px radius**, **no rotation**, no shadow at rest;
  - the image at its **natural ratio** (`object-fit: contain` inside the print) and **never cropped**, clamped between 16:10 and 4:5 only for the box; letterboxing, if any, fills with #F4EDE1.
- **Loading:** reserve the ratio, stored at upload, so the layout doesn't jump. Fade the image in with opacity over 240ms. No grey "developing" filter on every view: this page is seen often (Emil's frequency rule).
- **Caption** under the print, 14px below:
  - the when-line in Montserrat 600 11px, 0.14em tracking, uppercase, #6A645B ("SUMMER 1985");
  - then, if there is one, a caption line in EB Garamond italic 16px / 1.4, ink.
- **Size and placement:**
  - desktop ≥1280: the **left page** of a two-page spread, sticky (§3.13);
  - phone: after the first paragraph, at the full column width.
- **Several photographs:** the plate shows one, and the rest sit under the caption as a row of straight prints (76px squares at desktop, 64px on phone, cropping allowed at thumbnail size, 12px apart, 5px white border). The current one gets a 2px #B85126 outline with a 3px offset. Show at most 6, then "+4" as text. Clicking swaps the plate and arrow keys work. The date is printed under the plate instead of hidden on the back of a flipping print.
- **Full view:** clicking the plate opens it full screen on #171210 at 96%, contained, with the caption under it. Esc and a 44px "Close" text button close it.

### 3.10 The voice

- **When there is a recording:** one row directly under the words, between two `--sheet-rule` hairlines:
  - a 44px Play circle in ink with an #FFFDF8 glyph (one of the page's two fills, justified: it is the only non-reading primary action);
  - "Hear Bao tell it" in Montserrat 600 14px, then "6 min" in 13px `--ink-soft`;
  - a waveform at 22% ink, or 85% where it has played.

  While it plays, the 2px terracotta bar beside the paragraph being spoken stays (it already exists).
- **When there is no recording:** no player. The browser's synthetic "read it back" is not the teller's voice, so it becomes a "Listen" text tool in the bottom row (§3.11).
- **Never sticky, never floating.** On a phone the rejected page's sticky reader covered the title.

### 3.11 Actions

The founder's journal, Day One, Medium and Stripe Press all keep actions as quiet words and icons, with the destructive ones in a menu.

| Where | What | How it looks |
|---|---|---|
| Head, right of the teller row | ☆ Treasure · Public/Private · Share | Montserrat 500 14px in ink; the icon is 17px #B85126 (the star fills ochre when on); 44px tall, 12px side padding, transparent. Hover: #F4EDE1 fill. Pressed: scale 0.97. Privacy shows a people or lock icon and the word. Clicking opens a small popover with the two choices and their one-line meanings, the single disclosure. |
| One hairline row under the words (or under the voice) | Add a photograph · Add to the words · (spacer) · More | The same tool style. **More** (`•••`, 44px) opens a menu: Edit when and chapter · Who's in it · Listen (when there is no recording) · Remove…. |
| The family section only | Add what you remember | A text link in #9A4320, Montserrat 600 15px, with an arrow that moves 3px on hover. It appears **once** on the page. |
| The composer | Send | The only filled button besides Play: chocolate, cream text, 44px, the house radius. |
| Remove confirmation | inline under the tool row | The existing `mv-confirm`, keeping the danger fill. |

No pills with fills, no tiles, no outline-pill footer, no icons stacked above labels.

### 3.12 The teller and the family's additions

- The teller is a face and a name in the head (§3.6), never "WRITTEN BY".
- **"What the family remembers"** follows the words, the voice and the tool row, after a ✦ ornament rule (foil, as in the book).
  - Heading: Cormorant 600 28px.
  - Each addition is **their words** in EB Garamond 19px / 1.55, ink, in curly quotes with the opening quote hung (`text-indent: -0.4em`). Under it: a 24px face and "Linh, his daughter · 3 days ago" in Montserrat 500 13px `--ink-soft`, with the name in 600 ink.
  - Additions are 24px apart with a `--sheet-rule` hairline between them. **No cards, no borders, no fills.**
  - Pending additions, shown to keepers only, look the same with a 2px foil rule on the left and "Waiting for you · Keep it · Not this one" as text tools.
  - Empty: one line in EB Garamond italic 17px `--ink-soft` ("Nobody else has added their side yet."), then the single "Add what you remember" link.
- At ≥1280 **without a photograph**, this section sits in the right margin column as marginalia, sticky, with the heading at 24px.

### 3.13 The page at the three sizes

**1366×768** (content 1122px inside the 40px gutters; bar 64px, running head 38px):

```
y   64 ┌ bar ─────────────────────────────────────────────────────────────┐
   110 │ THE VO BOOK                                             CHILDHOOD  │  running head
   120 │ ‹ The Archive                                                     │
   180 │ ┌──────────── plate 500px ─────────┐   [CHILDHOOD]  ▬ ▬ ▬ ▬        │
       │ │  print, natural ratio            │   Funding a startup through   │  44/1.08, 2 lines
       │ │  4:3 → 476×357 image             │   pitch competitions          │
       │ │  3:4 → max-h 560                 │   1966 · AGE 6                │
       │ └──────────────────────────────────┘   (●) Told by Bao · 6 min   ☆ ⚇ ↗ │
       │   SUMMER 1985                          THE QUESTION / italic q    │
   ~430│   Mom and the cake, italic caption     T he first time I won…      │  words start ≈430:
       │   [▫][▫][▫] +2                         22/35.2, 559px, ≈66 chars  │  ≈9 lines on screen
       └ gap 64px ─────────────────────────────────────────────────────────┘
```

The plate column is 500px and the words column 559px (25.4em at 22px), with a 64px gap: 500 + 64 + 559 = 1123, filling the content box. The plate is `position: sticky; top: calc(var(--top-h) + 24px)`, with `max-height: calc(100vh / var(--zoom) - var(--top-h) - 24px - 96px)` (≈584px for the image and caption), aligned to the top of the chapter pill.

Without a photograph: the words column is 559px, then a 64px gap, then a family margin column of 340px, centred (1122 − 963 = 159px of slack, split evenly). The head stays in the words column.

**1920×1000** (`--content-max` 1640, so content is 1560px):

- With a photograph: the plate column is `minmax(0, 1fr)` with a print up to 860px wide, a 96px gap, then words at 23px × 25.4em = 584px. That gives 880 + 96 + 584 = 1560. A landscape 4:3 photo shows at about 836×627. A portrait one is capped by `max-height` at about 800px.
- Without a photograph: three columns, so the screen is used without widening the measure. A **head column** of 380px holds the pill, a 50px title, the dateline, the teller and the head tools, sticky. Then an 80px gap, the **words** (584px), another 80px gap, and the **family margin** (380px). That gives 380 + 80 + 584 + 80 + 380 = 1504, centred.
- The title stays at 50px. The line length never goes past about 68 characters at any width.

**390×844** (20px gutter, so a 350px column; bar about 56px; bottom tab bar about 88px):

```
  70  ‹ The Archive
 126  [CHILDHOOD]                     (marks hidden < 420px)
 160  Funding a startup through       32/1.1, ≤3 lines
      pitch competitions
 248  1966 · AGE 6
 276  (●) Told by Bao · 6 min         head tools wrap to a second row: ☆ Treasure · ⚇ Public · ↗ Share
 368  T he first time I won, I've…   20/32, 350px, ≈46 chars; 2-line drop cap
      …first paragraph (≈6–8 lines)
 ~620 ┌ print 350px, natural ratio ┐  the photograph after paragraph 1
      └────────────────────────────┘
      SUMMER 1985 · italic caption · [▫][▫] strip
      …the rest of the words
      ── Hear Bao tell it ── (not sticky)
      Add a photograph · Add to the words · •••
      ✦  What the family remembers
```

Words start at about 368px, so about 12 lines are visible above the tab bar. The rejected page started them at 1015px and the rebuild at 751px.

### 3.14 What to remove

- The three terracotta tiles (`ActionTiles`) on this page.
- The tinted caption band and every paper-tinted box (`lead-caption`, `lead-typed` in colour).
- The typed card that repeats the first sentence above the same sentence.
- The cloth hero band carrying the teller and privacy, which also appeared in the footer.
- The crumb "Your story · Memory No. N" and the "Memory No." label.
- The footer of outline pills, and the year strip of pills at the foot. Replace the year strip with one line under the family section: "‹ Previous: The klomp · Next in Childhood: Tulip Time, 1968 ›", in EB Garamond italic 17px with Montserrat small-caps labels. This is the book's way of turning the page.
- The 16:10 / 4:3 crops, the 18px and 10px radii on photographs, tilted thumbnails, and the grey "develop" filter on each view.
- The sticky floating "Read it back to me" pill.
- Ochre or 14px #B85126 used for text, and #9A8F85 used for text.
- Bordered cards around the family's lines and around the question (rebuild).
- The summary box, if anyone brings it over from the book.

---

## 4. What A Story's memory page does wrong, and the fix

Measured on the version the founder rejected (as of 21:48) at 1366×768, 1920×1000 and 390×844. The last line of each item says whether the 22:11 rebuild still has the fault.

1. **Bubbles for buttons.** Three 104px-tall terracotta "pills" (Add a photograph / Add to the words / Add what you remember) sat between the photo and the words, with cream labels at 4.37:1, which fails AA at 15px. The same actions appeared again lower down as "Add what you remember →" and "Edit the words", so each action was offered twice. **Fix:** §3.11, quiet word-and-icon tools in one hairline row, "Add what you remember" once in the family section, Remove in the More menu. *Rebuild: fixed (`.mv-tools`).*
2. **Frame cut and image frame.** Every family photograph was cropped to 16:10 (4:3 on phones) inside a white box with an 18px radius and 10px rounded inner corners. Thumbnails were tilted −3° to +3° and photos faded in from grey over 1.6s on every view. The book never crops and prints straight, square-cornered plates. **Fix:** §3.9, natural ratio, 2px radius, a 240ms opacity fade. *Rebuild: natural ratio fixed. The plate is now too small: 238×189px at 1366, stranded left of the head, so the dominant picture became the smallest thing on the page. It should be the 500px left page.*
3. **The title in a box.** Title and dateline sat on a tinted caption band in the memory's paper colour (pink, periwinkle, sage, with an 18px radius), making a second bubble under the photo. The book sets the title on the page. **Fix:** §3.6, Cormorant 44px directly on the paper, with the dateline and teller under it. *Rebuild: fixed.*
4. **Paragraphs not eye-friendly.**
   - Transcripts arrived as 600–1000-character blocks (`readableParagraphs` existed but wasn't used).
   - The measure was `68ch`, which is **86 characters per line at 1920** because `ch` is 27% wider than an average EB Garamond character.
   - Leading of 1.7 (37.4px) pulled a small-x-height face apart.
   - Run-ons and other people's back-channel ("Yeah, right?", "For sure") sat in the teller's words.

   **Fix:** §3.2–3.5: 22–23px, 1.58–1.6 leading, `max-width: 25.4em` (≈66 characters), paragraphs targeted at 380 characters, clean-transcript rules. *Rebuild: paragraphs are now broken. The measure `64ch` still gives 77 characters per line at 1366, and the transcript rules are not applied.*
5. **Colour that fails as small print:**
   - the ochre "Add what you remember →" at 2.83:1;
   - the terracotta 14px "No date yet · add one" at 4.18:1;
   - the sage 11px chapter pill at 4.19:1;
   - `--ink-faint` 11px mark labels at 2.67:1.

   Terracotta and ochre were doing the work of ink. **Fix:** §3.3, a new `--terracotta-ink` #9A4320 (5.55:1) and `--sage-ink` #3F5B44 (6.05:1); ochre and faint are never text. *Rebuild: still uses #B85126 at 13–14px, #55745A on the pill, and `--ink-faint` on the off marks.*
6. **Everything said twice.** "Written by Bao · Public · the family on A Story" appeared on the cloth and "Public · the family, and the wall" in the footer. The crumbs "Archive · Your story · Memory No. 8" repeated the running head "THE VO BOOK · ARCHIVE". The first sentence was set large on the typed card and again as the opening of the words. **Fix:** §3.6 and §3.14: one head, one disclosure (the privacy popover), the words once. *Rebuild: mostly fixed; "/ Your story" and "Memory No." remain.*
7. **The phone hides the words.** At 390×844 the words began at **1015px**, below the fold, after the photo, the caption band and the tiles. The sticky "Read it back to me" pill floated over the title on the first screen, and the bottom tab bar covered the tiles. **Fix:** §3.13, head then first paragraph then photograph, so words start at about 368px; the voice is never sticky. *Rebuild: words start at 751px (photo first). Move the photograph after paragraph 1.*
8. **The drop cap misfires.** At 22:12 the "W" of "We live in a small city" was dropped beside a run of five-word lines, because the test counts the whole block (220 characters) and ignores the line breaks. In the rejected version the drop cap was ochre at 74px with ad-hoc padding. **Fix:** §3.8, drop only for a first line of at least 200 characters with no breaks, in chocolate, `initial-letter: 3`. *Rebuild: the short-line misfire is live.*

---

## 5. Sources

- Measured live with computed styles in October 2026: [Medium, "Welcome to Medium"](https://ev.medium.com/welcome-to-medium-9e53ca408c48) · [Substack, "Grow"](https://on.substack.com/p/grow-series-1) · [Craig Mod, "Fast Software"](https://craigmod.com/essays/fast_software/) · [Stripe Press, Poor Charlie's Almanack, Talk One](https://www.stripe.press/poor-charlies-almanack/talk-one) · [A Story samples](https://astoryapp.com/samples) · `http://localhost:5180/archive/*`
- Founder's journal: `Project Reboot/DESIGN.md`, `Project Reboot/src/Journal.tsx`, `Project Reboot/src/styles.css`
- A Story: `web-app/src/pages/MemoryPage.tsx`, `src/components/archive/*`, `src/styles/astory.css` (§24, §46), `src/styles/pages/archive-reading.css`, `docs/BAOS-STANDARD.md`, `DESIGN.md`, `docs/research/journaling-apps-2026.md`
- Typography: [Butterick, line length](https://practicaltypography.com/line-length.html) · [line spacing](https://practicaltypography.com/line-spacing.html) · [first-line indents](https://practicaltypography.com/first-line-indents.html) · [space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html) · [point size](https://practicaltypography.com/point-size.html) · [iA, responsive typography](https://ia.net/topics/responsive-typography-the-basics) · [Baymard, line length](https://baymard.com/blog/line-length-readability) · [Optimal line length review, Visible Language](https://journals.uc.edu/index.php/vl/article/view/5765) · [Dyson & Haselgrove 2001 via review](https://journals.uc.edu/index.php/vl/article/view/5671) · [Roselli, accessible drop caps](https://adrianroselli.com/2019/10/accessible-drop-caps.html) · [Adactio, hanging punctuation](https://adactio.com/journal/21027) · [WebKit text-wrap: pretty](https://ppc.land/safaris-text-wrap-pretty-brings-superior-web-typography/) · [Literata](https://en.wikipedia.org/wiki/Literata) · [Iowan Old Style](https://en.wikipedia.org/wiki/Iowan_Old_Style) · [Bookerly](https://www.thebookdesigner.com/kindle-new-bookerly-font-and-typography-features/) · [Archibald, e-reader typography](https://jeffarchibald.ca/ereader-typography-is-broken-how-to-fix-it)
- Reading research: [Piepenbrock, Mayr & Buchner 2013, positive polarity for younger and older adults](https://documentacion.fundacionmapfre.org/documentacion/bib/143702.do) · [NIA/NLM senior-friendly checklist](https://corpora.tika.apache.org/base/docs/govdocs1/562/562513.html)
- Transcripts: [Baylor style guide (NPS copy)](https://npgallery.nps.gov/GetAsset/8502bfeb-ab04-400d-b547-62e63763c5a2/original) · [Lincoln Library, adapted from Baylor](https://PresidentLincoln.illinois.gov/Resources/9151a648-82b0-4762-b7a6-4ed9639cf146/transcription%20editing%20style%20guide.pdf) · [Queens Memory 2023](https://queensmemory.org/wp-content/uploads/2023/10/Queens-Memory-Transcription-Style-Guide_2023_10.pdf) · [Remento styles](https://help.remento.co/en/articles/8365905-can-i-change-how-remento-writes-my-story) · [Remento FAQ](https://www.remento.co/faq)
- Products: [Day One Entry Info](https://dayoneapp.com/guides/tips-and-tutorials/entry-info-metadata-in-day-one-for-ios/) · [Day One media](https://dayoneapp.com/guides/getting-started-with-day-one/adding-media-in-day-one/) · [Apple Journal on Mac](https://support.apple.com/guide/journal/add-formatting-photos-and-more-devb7625b2b0/mac) · [Journey views](https://support.journey.cloud/categories/app-interface-functionalities/articles/journey-view-interface-in-journey) · [Readwise Reader appearance](https://docs.readwise.io/reader/docs/faqs/appearance) · [Bear typography](https://bear.app/faq/typography-options/) · [Instapaper 10](https://www.ithinkdiff.com/instapaper-10-update-liquid-glass-fonts-widgets/) · [Matter vs Reader](https://thesweetsetup.com/is-matter-or-readwise-reader-the-read-later-app-for-you/) · [Apple Books themes](https://iphonelife.com/content/how-to-customize-themes-apple-books-app-iphone) · [Reflectly review](https://mobilesyrup.com/2019/04/07/reflectly-journaling-app-review/) · [Grid Diary](https://www.macworld.com/article/222142/grid-diary-makes-keeping-a-journal-as-easy-as-filling-out-a-form.html) · [StoryCorps archive demo](https://archive.storycorps.org/interviews/demo-interview/) · [Ancestry Stories](https://www.geneamusings.com/2022/03/myancestrystory-debuts-on-ancestry.html) · [Apple Photos memories](https://support.apple.com/guide/photos/pht69f4420d8) · [Google Photos captions](https://maketecheasier.com/add-description-to-google-photos/) · [Storyworth, Geneamusings](https://www.geneamusings.com/2023/02/rabbit-holes-with-randy-telling-family.html)

**Not verified:** NYT and Atlantic article CSS (blocked). The Storyworth reading view (no public screenshot found). Whether EB Garamond at weight 440 reads better than 400 in Edge on Windows: it needs the founder's screen.
