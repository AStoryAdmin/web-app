# The questions A Story asks, 2026

Research note for the founder, October 2026. Nothing under `src/app-core` was edited: it is synced from the phone app, and the bank lives in `phone-app/content/questions.csv` (then `npm run questions`). The 40 proposed rows are in `docs/research/questions-proposed.json`, in the `interview.js` shape, ready for that sheet.

## 1. What the best practitioners do, and why

**StoryCorps.** The headline Great Questions are abstract ("What are the most important lessons you've learned in life?") and work only because two people who love each other sit in a booth for forty minutes. The craft is in the category lists: "How did you choose my name?" The asker belongs in the question.

**Storyworth.** One question a week for a year from a 500-plus library the family queues; the default order is random and reviewers report redundant prompts. Prompts run broad and double ("Did you ever move as a child? What was that experience like?"). Storyworth's own advice: a relative editing the question to the life gives the best experience. Nobody designs the year.

**Remento.** A photograph as the prompt ("What is happening in this photo?"): a picture narrows "your childhood" to one afternoon. Relatives suggest the next question.

**McAdams, Life Story Interview.** Chapters first, then key scenes (high point, low point, turning point, earliest memory), each *one specific moment*: what happened, who was there, what you felt, and only then why it matters. Our turning-point rows ask for "the best stretch" and "the hardest year", which return a summary, not a scene.

**Duke and Fivush, "Do You Know?"** Twenty facts a child can only learn by being told: how your parents met, where they grew up, what went on when you were born, your name's source, parents' schools and jobs, who you look like. Children who know more are measurably more resilient; the active ingredient is the telling. Our deck misses the day you were born and who you look like.

**Reminiscence practice.** Never test: "Do you remember...?" has a wrong answer. Use "Tell me about", a statement, a prop (a photo, a song, a smell), one question at a time, and never remind someone of a death. Our deck has 44 yes/no openers (8%).

**Memory research.** Older adults retrieve most from roughly ages 10 to 30; word cues produce a bump at 5 to 19, "most important memory" cues a life-script bump at 20 to 29 (the wedding, the first child). Odour-cued memories are older, more emotional and feel "brought back in time". A sensory noun retrieves a Tuesday; "important" retrieves the wedding everyone already knows. Only 64 of our 547 questions (12%) carry a sensory cue word.

**Proust and Pivot.** A fixed, short list of taste questions, the same for everyone, answered in a word, as a ritual; character sideways. Our `voice` topic deserves to be a named back page of the book.

**Legacy letters, Pillemer.** The Legacy Project asked 1,500 elders one question ("the most important lessons you have learned"); the usable answers came from follow-ups on concrete domains. Legacy-letter guides: one named reader, one memory per value. Our house rule already holds back "last words" rows (`HELD`).

**Oral-history guides (Smithsonian, Library of Congress).** Open with "Tell me about", keep yes/no for clarifying, save sensitive questions for later, let silence work. `interviewing-method.md` says this for calls; the written deck does not yet obey it.

## 2. Our deck, honestly

547 questions, 11 chapters, average 8.4 words, none over 13; every row has a hint and a follow-up; 260 have a relative's wording. Better written than any competitor's. The problems are shape and sequence.

**Coverage.** Childhood 67, Faith 64, Looking back 62, Anything else 59, Love & family 56, Where we come from 48, Growing up 47, Work 45, World 36, From the family 35, When everything changed 28. Faith, not a core chapter, is the second largest; the turning points are the smallest. Looking back holds 23 of the 45 depth-5 rows. Middle age as scenes is nearly absent.

**Assumptions.** 35 of 56 Love & family rows assume a partner or children. Faith was written so a worshipper and a lapsed nineteen-year-old can both answer; Love & family was not. A never-married storyteller meets "What are your children's names?" at depth 2.

**Wording.** 44 yes/no openers. 25 rows in the believe/regret/advice register, rightly held at depth 4 and 5, except `faith-house-had` (d1), `later-proudest` (d2) and `world-safe-then` (d2, tagged week1). "Teach me to..." (4 rows) is wonderful on a call and dead on a page.

**The first week a new storyteller actually meets.** The web Home calls `deckForDay` directly; the phone's eight openers ("Walk me in through your front door") are not wired on the web. Below five memories the walk is held to the 38 `week1` rows, hash-shuffled and stepped by the calendar: arbitrary order, lasting two days for anyone answering three a day. Simulated from today, answering all three: Day 1 "What did people think was safe back then that isn't?", "What was the best job you ever had?"; Day 4 "Looking back, what are you proudest of?"; Day 5 "Where were you when you found out a baby was coming?"; Day 11 "Is there anyone you would want to make peace with?" (rupture, depth 5). The ladder counts memories, not days: an eager storyteller reaches the regrets in eleven days. One a day is gentler but skips between seven chapters with no arc.

**Repetition.** Seven rows re-enter the hardest time (`turn-low-point` through `turn-told-nobody`): seven days back in the worst year. Six on homes and addresses, five "anything else?" closers, five "best time" variants, eight "firsts" in one chapter.

**Follow-ups.** One good layer per row ("Which room was that strongest in?"), sent to the call as a note and offered to the writer only via `nextQuestions` after typing. Never the page's second step, so written memories stop at the first answer.

**Sensitive handling.** 66 flagged rows (12%), four named kinds, a note that gives permission rather than warning: the best in the market. Gaps: `love-found-out` and `open-children-names` carry no flag; loss-of-partner rows are not gated on the family tree as `ONLY_WHEN_GONE` gates the relative's.

**Family-asked and photo-asked.** Eight `ask-them` relays and 260 `about` wordings let a relative *answer*; nothing lets a relative *ask*. The deck is derived from a hash and remembers nothing, so "Ask Dad about this" has nowhere to land. Twenty-two rows mention a photograph; none *is* one.

**Three a day.** Storyworth and Remento ask weekly and are called "too slow" and "too fast" at once. Three a day on Free is the right ceiling and the wrong headline: "2 of today's three waiting" reads as homework, and three unrelated chapters in one morning prevent a thread.

## 3. What a great A Story question is

1. **One thing.** One question, one noun, one moment. Never "and".
2. **A cue before a concept.** Open on something the mind can grab: a kitchen, a coat, a coin, a gate.
3. **A scene, not a span.** "Your first morning", not "your working life".
4. **Sensory where it can be.** Smell, sound and touch retrieve older, exacter memories than "important".
5. **Answerable aloud in two minutes** by someone who has never thought about it.
6. **Ends in a person or a place.** If the question doesn't, the follow-up must.
7. **Assumes nothing**: no partner, children, faith, country or career. The hint widens it.
8. **Never a quiz.** No "Do you remember", no "Do you know".
9. **Never "what are your values".** Meaning comes out of the scene.
10. **Said the way a grandchild would say it.** Under twelve words; hint under fourteen.

## 4. The first fourteen days, in order

One a day, nothing sensitive, depth 1 to 2, Childhood-heavy because every life has one. Facts (full name, birthplace, year, towns) move to the family's setup form.

| Day | Question | Hint |
|---|---|---|
| 1 | Walk me in through your front door. What do I see? | Keep walking until you run out of house. |
| 2 | What did the kitchen smell like in the morning? | Morning and evening smelled different. Pick one. |
| 3 | What could you hear from your bed at night? | Trains, animals, arguments, machinery, the sea. |
| 4 | What did your family call you that nobody else did? | The name that only worked inside the house. |
| 5 | What was on the table on an ordinary weeknight? | Not the holiday meal. A plain Tuesday. |
| 6 | What game did you play that nobody plays now? | No equipment, complicated rules, deadly serious. |
| 7 | How did you get to school? | The route, the weather, how long it took. |
| 8 | What were you told about the day you were born? *(new)* | The weather, the hour, who was there, who was late. |
| 9 | What did your grandmother's house smell like? | Any grandparent or elder. Eyes shut, you'd know it. |
| 10 | What was the first money you ever earned? | How you got it and exactly how much. |
| 11 | What was playing when you were seventeen? | A song, a band, a record, a radio show. |
| 12 | Who is in this photograph, and where was it taken? *(new; the family's photo. With none: "Is there a photograph nobody can explain but you?")* | Start with the person you knew best. |
| 13 | Who sat where at your supper table? | The table you set yourself, or the one you grew up at. |
| 14 | Walk me through an ordinary day when you were ten. | Waking to sleeping. Nothing special happened. Good. |

Day 12 and every seventh day after are the family's: a relative's question, if one has arrived, goes first.

## 5. Forty new or rewritten questions

Full entries are in `questions-proposed.json`. *(r)* replaces an existing row. Hints in italics; "Then" is the follow-up where it carries the question.

**Where we come from**
1. What were you told about the day you were born? *Hearsay is fine.* Then: Who told you, and how often?
2. Who in the family do you look like? *The nose, the hands, the walk.*
3. *(r)* How did your grandparents meet, as far as you know? *Even a scrap.*
4. What did your mother wear when she dressed up? *The one good dress, the scent.*
5. What did your father sound like coming home? *The gate, the boots, the whistle.* Then: What did you do when you heard it?

**Childhood**
6. How was a birthday marked in your house? *A cake or no cake. Nothing at all counts.*
7. What could you buy with the smallest coin you had? *The sweet, the shop, the counter.*
8. What did Saturday morning sound like at your house? *The radio, the washing, the stairs.*
9. Who owned a camera when you were a child? *How you had to stand.* Then: Where are those photographs now?
10. What was different about your best friend's house? *The smell, the food, the rules.*
11. What did you eat at school in the middle of the day? *Carried, served, or walked home for.*
12. What could you hear from bed when you were kept home sick? *The house going on without you.* Then: Who came up the stairs, and with what?

**Growing up**
13. *(r)* Tell me about your first morning at your first job. *What you wore, who showed you.*
14. What was on your bedroom wall at sixteen? *Or no wall of your own.*
15. Where were you on a Saturday night at eighteen? *The hall, the corner, the night shift.* Then: How did you get home?
16. Which letter from those years did you keep? *If you burned them, say so.*
17. *(r, hardship)* Who from your street went away to serve or to work far off? *You, a brother, a neighbour. Who waited.*

**Love & family** (each answerable without a partner or children)
18. Who have you shared a kitchen with the longest? *A husband, a wife, a sister, a friend.* Then: What did you argue about in that kitchen?
19. Where did you go the first time you went out together? *What it cost and who paid.*
20. Which small child did you help raise, yours or not? *A niece, a neighbour's, a younger brother.*
21. Who did you telephone every week, for years? *The day, the hour, what it cost.*
22. *(r, now private)* Where were you when you found out a baby was coming? *Yours, or one you were waiting on.*
23. What did the house sound like at 3 a.m. with a new baby? *The one thing that worked.* Then: Who did you ask when nothing worked?

**Work & making a living**
24. What did you wear to work? *Who washed it.* Then: What did it smell of at the end of the day?
25. What did your workplace sound like? *Machines, a till, children, cattle.*
26. What did you bring home on your hands or clothes? *Flour, oil, chalk, the ward.*
27. What did you get wrong in your first month and never again? *Who caught it.*

**The world we lived through**
28. When did the lights go out for everybody? *A storm, a strike, a power cut.* Then: Who turned up at your door?
29. What food did you taste for the first time as an adult? *Who put it in front of you.*
30. *(r)* What did you do as a child that would frighten a parent today? *Out all day, down by the river.*

**When everything changed** (one moment, after McAdams)
31. *(r)* Tell me about one day you knew was good while it was happening. *One day, not a stretch.*
32. *(r)* Where were you when the news came that changed everything? *A phone, a doorway, a doctor's room.* Then: Who did you tell first?
33. Who did something small for you that turned out to be big? *A lift, a loan, a word. Name them.* Then: Did you ever get to thank them?

**Faith & what carried me**
34. What did your place of worship smell like? *Or the kitchen where your family kept quiet instead.* Then: Where did you sit, and who beside you?
35. *(r)* Say the words your family says before a meal. *A grace, a toast, a joke, a silence.*

**Looking back**
36. *(r, private, d5)* Which letter, call or visit do you wish you had made? *One. What stopped you.* Then: What would the first line have been?
37. *(r)* What were you told at twenty that you only understood at fifty? *One sentence. Who said it.*
38. What do you let a grandchild do that your own kids never could? *Or a niece.* Then: What do they call you?

**From the family, Anything else**
39. What would you ask {name} if you had one question? *It goes to them next.* (a relay; §7)
40. Who is in this photograph, and where was it taken? *The year can be a guess.* Then: What happened just after the shutter clicked?

A Pivot-style back page would add: which word do you love the sound of; what sound do you love; what sound do you hate.

## 6. Questions to retire, and why

- **Values in the abstract:** `faith-what-is-god` ("What do you believe in, in your own words?"), `learn-enough`, `learn-what-for`, `faith-one-thing`, `faith-suffering`, `faith-tell-searching`, `faith-gave-you`, `faith-grateful-community`, `learn-actually-believe`, `learn-should-regret`. Spoken answers are abstractions nobody reads back; the belief is already in the scenes.
- **Opinion at the shallow end:** `world-better-worse`, `world-nobody-does`, `later-proudest` at depth 2.
- **Counts and lists:** `turn-moves`, `open-lived-where`, `open-worked-where`, `list-addresses`, `open-full-name`, `open-born-where`. Title-page facts; a Facts page the family fills.
- **Quizzes:** `else-first-vote`; `roots-grandparents-met` rewritten.
- **The hardest-time cluster:** keep `turn-low-point`, `turn-carried-through`, `turn-came-out-of`; retire the other four.
- **Five closers to one:** keep `else-not-asked` monthly; retire `else-anything`, `else-name-everyone`, `else-forgot-to-say`, `else-advice-me`.
- **"Teach me..."** (4 rows): calls only, with a `call` tag.
- **Homes:** six rows to three (`child-house-walk`, `homes-longest`, `love-first-home`).

## 7. Family-asked and photo-asked questions

The question a relative writes is the one the storyteller most wants to answer (Storyworth, Remento, item 2 of the journaling note). Two kinds should enter the deck. **A relative's question** ("Ask Dad about this" under a memory, or question 39 on their Today sheet): stored with the asker's name, shown to the storyteller first the next morning as "Jamie asks: Which cousin was that?", printed under the answer with the asker's name. **A photograph**: a relative drops one in; the storyteller's next sheet or call opens with it, large, and question 40. Both need storage, because today's deck is derived from a hash; a small `asked_questions` table (story, asker, text, photo, asked_at, answered_memory) is the whole change. One family question a day at most.

## 8. Three product changes

**1. Ordering: a scripted fortnight, then themed weeks, with depth earned by time as well as count.** Replace the hash walk for a new story with §4 (and wire the phone's `openerDeck` on the web). Afterwards each week stays in one chapter and climbs within it: a place, a sense, a person, what repeated, what it cost, then the family's photo or question, then rest. The depth ceiling becomes `min(depthFor(count), weeksActive + 1)`, so three a day cannot reach the regrets in eleven days.

**2. Cadence: one question a day is the promise; "another?" is the gift.** Home shows one question. After a keep, one line: "There's another, if you'd like it" (up to three on Free, unlimited on paid). Retire "2 of today's three waiting" and "Three new ones in the morning": a countdown in sentence case. Every seventh day belongs to the family's question or photograph; with none, the day is quiet.

**3. Follow-ups as the page's second step, and the family's as tomorrow's first.** After the first keep, the bank's `followUp` appears under the memory as one more line ("One more thing: which room was that strongest in?") and the answer joins the same memory as its second paragraph; on a call it is already the note. A relative's "Ask Dad about this" becomes a stored follow-up that leads the next deck, attributed by name. Measure by `wordsPerAnswer` and how often the second paragraph is written.

## Sources

- StoryCorps, Great Questions: https://storycorps.org/participate/great-questions/
- Storyworth: https://welcome.storyworth.com/blog/a-complete-guide-to-storyworths-questions ; https://welcome.storyworth.com/blog/60-storyworth-memoirs-question-prompts ; https://remento.co/journal/storyworth
- Remento: https://resources.remento.co/getting-started/picking-prompts ; https://resources.remento.co/getting-started/reasons-to-add-photos
- McAdams: https://www.northwestern.edu/magazine/winter2005/feature/redemption/sidebar1.html ; https://personality-arp.org/html/newsletter08/mcadams.html
- Duke and Fivush: https://www.seattlefoundation.org/?p=925 ; https://www.parentmap.com/article/the-power-of-story-weaving-threads-of-resilience-across-generations
- Reminiscence and dementia communication: https://www.care.com/c/what-is-reminiscence-therapy/ ; https://theconversation.com/asking-people-with-memory-loss-about-past-holidays-can-help-them-recall-happy-times-125520 ; https://www.razmobility.com/dementia-tips/avoiding-dont-you-remember/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8150461
- Reminiscence bump and cue type: https://pmc.ncbi.nlm.nih.gov/articles/PMC4850910/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC3034034 ; odour cues: https://osu.repo.nii.ac.jp/records/1910
- Proust and Pivot: https://en.wikipedia.org/wiki/Proust_Questionnaire ; https://itotd.com/articles/2444/the-questionnaires-of-james-lipton-bernard-pivot-and-marcel-proust/
- Pillemer, Legacy Project: https://legacyproject.human.cornell.edu/sample-page-2
- Legacy letters: https://www.ncfp.org/wp-content/uploads/2019/01/Tips-for-Writing-Your-Legacy-Letter-Your-Ethical-Will-2004-policy-central-getting-started-with-family-philanthropy.pdf
- Oral-history guides: https://museumonmainstreet.org/sites/default/files/interviewing.pdf ; https://www.loc.gov/programs/veterans-history-project/how-to-participate/vhp-field-kit/ ; https://guides.bpl.org/OralHistory/interviewing
- In-repo: `src/app-core/data/interview.js`, `src/app-core/lib/dailyQuestion.js`, `src/app-core/lib/questionVoice.js`, `src/lib/today.ts`, `src/pages/Home.tsx`, `src/pages/Write.tsx`, `phone-app/docs/interviewing-method.md`, `phone-app/docs/questions/changes.md`, `docs/research/journaling-apps-2026.md`.
