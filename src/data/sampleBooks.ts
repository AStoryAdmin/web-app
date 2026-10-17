/**
 * The three fictional families of astoryapp.com/samples ("Three fictional
 * families, printed exactly the way yours will be"), with their words as the
 * samples page has them, so the front door's sample book shows the whole
 * anatomy of a page: the chapter pill, the four marks, the summary with its
 * source, the question and who asked it, the deeper question, the lesson,
 * who carries it now, and the code to scan. Extracted from the live page;
 * nothing here is invented beyond it. Generated: do not edit by hand.
 */
export type SampleMemory = {
  id: string;
  ch: string;
  title: string;
  /** "1966 · age 6" as the samples set it. */
  meta: string;
  rec: string;
  mins: number;
  asked: string;
  q: string;
  summary: string;
  story: string[];
  deepQ?: string;
  deepA?: string;
  lesson: string;
  lessonVi?: string;
  passed: [string, string][];
  video?: boolean;
};

export type SampleBook = {
  key: "carolyn" | "raymond" | "tom";
  name: string;
  full: string;
  pronoun: "she" | "he";
  /** Told in the third person (Raymond asked for it). */
  third: boolean;
  subtitle: string;
  line: string;
  coverColor: string;
  cover: { title: string; line: string; names: string; motto: string };
  title: { t1: string; t2: string; t3: string; t4: string };
  colophon: { title: string; lines: string[] };
  dedication: { text: string; sig: string };
  contents: { num: string; name: string; sub: string }[];
  /** Chapter openers the samples print: kicker, label, line. */
  openers: Record<string, [string, string, string]>;
  memories: SampleMemory[];
  little: { title1: string; note1: string; title2: string; note2: string; items: [string, string, string][] };
  final: string;
  back: { fam: string; quote: string };
};

export const SAMPLE_BOOKS: SampleBook[] = [
  {
    "key": "carolyn",
    "name": "Carolyn",
    "full": "Carolyn Bennett",
    "pronoun": "she",
    "third": false,
    "subtitle": "A family memoir",
    "line": "Baker · Holland, Michigan · b. 1960",
    "coverColor": "navy",
    "cover": {
      "title": "MOMENTS & MEMORIES",
      "line": "APRIL 23, 2026",
      "names": "Carolyn & Dylan",
      "motto": "Finish the parade."
    },
    "title": {
      "t1": "MOMENTS & MEMORIES",
      "t2": "The life of Carolyn Bennett",
      "t3": "A life, in her own words",
      "t4": "Holland, Michigan · born 1960"
    },
    "colophon": {
      "title": "Moments & Memories",
      "lines": [
        "The life of Carolyn Bennett, in her own words.",
        "Gathered between October 2025 and March 2026 from eleven live conversations, sixty-four little questions, two conversations around the family table, a 1994 notebook, a five-year diary, nine years of her own posts and photos, the letters she wrote for this book, and messages from Dylan, Mark, Ellie and Sam.",
        "Every lesson is drawn from Carolyn’s own words, and she approved each one before printing. This book is private to the Bennett family; Carolyn chose to share two pages, marked as shared.",
        "A sample book. Carolyn and her family are fictional.",
        "Shaped, designed and printed by A Story. Layflat binding.",
        "First edition, April 23, 2026, on Carolyn’s sixty-sixth birthday."
      ]
    },
    "dedication": {
      "text": "For Dylan, who made me a mother, and for Ellie and Sam, who made me a grandmother. The three best promotions I ever got.",
      "sig": "Carolyn"
    },
    "contents": [
      {
        "num": "",
        "name": "Who she is",
        "sub": "and how this book was made"
      },
      {
        "num": "01",
        "name": "Where we come from",
        "sub": "Bread and the lake"
      },
      {
        "num": "02",
        "name": "Childhood",
        "sub": "Tulip Time, 1968"
      },
      {
        "num": "03",
        "name": "The world we lived through",
        "sub": "The moon"
      },
      {
        "num": "04",
        "name": "Love & family",
        "sub": "Umbrella, easel, oven, lake"
      },
      {
        "num": "05",
        "name": "Work & making a living",
        "sub": "Ruth’s Table"
      },
      {
        "num": "06",
        "name": "When everything changed",
        "sub": "Her posts, her diary, Mom’s last loaf"
      },
      {
        "num": "07",
        "name": "Faith & what carried me",
        "sub": "The year I stopped going"
      },
      {
        "num": "08",
        "name": "Looking back",
        "sub": "Ellie’s question, the lessons"
      },
      {
        "num": "09",
        "name": "From the family",
        "sub": "and letters to them"
      }
    ],
    "openers": {
      "Where we come from": [
        "Chapter One",
        "Where her story starts",
        "A house on 17th Street, four blocks from the lake, and a kitchen table that is still in the family."
      ],
      "Love & family": [
        "Chapter Four",
        "In this chapter",
        "An umbrella, an easel, an oven that died on Thanksgiving, and a two-year-old walking into Lake Michigan."
      ]
    },
    "memories": [
      {
        "id": "m1",
        "ch": "Where we come from",
        "title": "Bread and the lake",
        "meta": "1966 · age 6",
        "rec": "Oct 9, 2025",
        "mins": 16,
        "asked": "Dylan",
        "q": "What did your house smell like when you were small?",
        "summary": "Saturdays in the little house on 17th Street: her mother Ruth’s bread in the oven, the lake wind through the screen door, and the kitchen table where everything got decided.",
        "story": [
          "Yeast and the lake. That’s the honest answer. My mother baked bread every Saturday whether we needed it or not, and our house sat four blocks from Lake Macatawa, close enough that the wind carried it right through the screen door.",
          "I was the middle of three, wedged between Tom, who was always in trouble, and Anne, who never was because Tom used it all up. We didn’t have much, but we had that kitchen table. Everything important in my life got decided at a kitchen table."
        ],
        "deepQ": "Why the kitchen table, and not some other room?",
        "deepA": "Because nobody could leave. You sat down, you ate, you talked. When Tom got in trouble, it was settled there. When I told them I was marrying Rick, that was there too. You can’t walk away from a table in the middle of dinner. That’s the whole point of it.",
        "lesson": "A home is a table nobody can walk away from.",
        "passed": [
          [
            "Still alive",
            "Ruth’s table is in Dylan’s kitchen now. The family still eats dinner at it."
          ],
          [
            "For Ellie & Sam",
            "Phones go in the bread box during dinner. Grandma’s rule."
          ]
        ]
      },
      {
        "id": "m2",
        "ch": "Childhood",
        "title": "Tulip Time, 1968",
        "meta": "1968 · age 8",
        "rec": "Oct 16, 2025",
        "mins": 21,
        "asked": "Ellie",
        "q": "What was the most embarrassing day of your childhood?",
        "summary": "Her first year as a Klompen dancer at Holland’s Tulip Time festival. Ruth sewed the costume by hand; Carolyn lost a wooden shoe on Eighth Street and finished the parade in one sock.",
        "story": [
          "Mom sewed my costume at the kitchen table for three weeks: the white cap, the striped apron, all of it. I practiced in the driveway in my wooden shoes until the neighbors begged.",
          "Halfway down Eighth Street my left klomp flew off and rolled under a float. I didn’t stop. I danced the rest of the parade in one shoe and one sock, and Dad laughed so hard he had to sit down on the curb."
        ],
        "deepQ": "Why didn’t you stop when the shoe came off?",
        "deepA": "I think I knew that if I stopped, I’d remember it as the day I failed. If I kept going, it would just be a story. Eight years old and I worked that out on Eighth Street. I’ve used it ever since: the first week at the bakery, the winter Mom was sick. You finish the parade.",
        "lesson": "If you lose a shoe, finish the parade.",
        "passed": [
          [
            "Still alive",
            "“Finish the parade” is what the family says before every recital, exam and job interview."
          ],
          [
            "For Ellie",
            "Ellie danced at Tulip Time in 2024, in her great-grandmother’s apron."
          ]
        ]
      },
      {
        "id": "m3",
        "ch": "Love & family",
        "title": "The wedding, in the rain",
        "meta": "1982 · age 22",
        "rec": "Nov 2, 2025",
        "mins": 24,
        "asked": "Dylan",
        "q": "When did you know you’d picked the right person?",
        "summary": "Marrying Rick Bennett on a June Saturday that was supposed to be sunny. The tent leaked, the cake survived, and they danced in the parking lot when the rain finally stopped.",
        "story": [
          "It rained from six in the morning until nine at night. The tent leaked right over the head table, so Rick held an umbrella over me through the whole dinner and ate with his other hand.",
          "Mom made the cake herself, three tiers of lemon. It was the only thing that stayed dry. When the rain finally stopped we danced in the church parking lot, in the puddles, with the car radios turned all the way up."
        ],
        "deepQ": "What did the umbrella tell you that the vows didn’t?",
        "deepA": "Vows are words. Anybody can say them in a dry church. The umbrella was what he did when nobody asked and it cost him something. He was soaked. His dinner was cold. I’ve watched for that my whole life, in friends, in the boys Dylan brought home. Who holds the umbrella when it’s inconvenient.",
        "lesson": "Love is whoever holds the umbrella when it’s inconvenient.",
        "passed": [
          [
            "Still alive",
            "Carolyn told Dylan this on the morning of her wedding in 2010. Mark has heard the umbrella story more times than he can count."
          ],
          [
            "For Ellie & Sam",
            "There is a white umbrella in the hall closet. Ask about it."
          ]
        ]
      },
      {
        "id": "m4",
        "ch": "Love & family",
        "title": "The easel",
        "meta": "1987 · age 27",
        "rec": "Nov 5, 2025",
        "mins": 18,
        "asked": "Dylan",
        "q": "What do you remember about the day Dylan was born?",
        "summary": "Dylan arrived three weeks early in March 1984. The summer she turned three, Rick built her an easel from scrap wood, and she painted on it every day. Carolyn kept every painting.",
        "story": [
          "Dylan arrived on a Tuesday in March of 1984, three weeks early and furious about it. Rick drove us home from Holland Hospital at about eleven miles an hour.",
          "The summer she turned three, he built her an easel from scrap he brought home from the plant. She painted on it every single day: mostly herself, partly the dog, occasionally the paper. I kept every painting in a box under our bed. I still have the box."
        ],
        "deepQ": "Why did you keep every single painting?",
        "deepA": "Because a mother forgets. You think you’ll always remember who they were at three, and then they’re thirteen and you can’t picture it. The paintings were proof. She was a loud, messy, happy little girl who painted the dog purple. I didn’t want anyone to forget that. Including her.",
        "lesson": "Keep the boxes. They are proof of who someone was.",
        "passed": [
          [
            "Still alive",
            "Dylan keeps a box for Ellie and one for Sam, under the same kind of bed."
          ],
          [
            "In the archive",
            "Twelve of Dylan’s paintings are photographed and saved with this memory."
          ]
        ]
      },
      {
        "id": "m5",
        "ch": "Love & family",
        "title": "Tunnel Park",
        "meta": "1986 · age 26",
        "rec": "Nov 9, 2025",
        "mins": 19,
        "asked": "Dylan",
        "q": "Is there a photograph you’d save first in a fire?",
        "summary": "Summer weekends at Tunnel Park with a two-year-old who believed she could walk straight into Lake Michigan. The photo from that summer is, Carolyn says, the happiest she has ever been.",
        "story": [
          "We spent every summer weekend at Tunnel Park. Egg salad sandwiches, those terrible orange sodas Dylan loved, and we’d stay until the lifeguard went home.",
          "She was two and sure she could walk into Lake Michigan and keep going. I chased her down the sand all summer with my sandals in one hand. My sister Anne took the picture the second I caught her. When I look at it now, I see the happiest I have ever been. I didn’t know it then."
        ],
        "deepQ": "Why do you think you didn’t know you were happy then?",
        "deepA": "Because I was tired. The dishes were waiting, money was tight, I was always thinking about the next thing. Happiness doesn’t announce itself. It just looks like a normal Saturday. I wish somebody had tapped me on the shoulder and said, Carolyn, this is it. Pay attention.",
        "lesson": "Happiness looks like a normal Saturday. Pay attention to it.",
        "passed": [
          [
            "Still alive",
            "At family dinners Carolyn whispers “this is it.” Everyone knows what she means."
          ],
          [
            "Watch it",
            "Scan the code to see Carolyn tell this story on video."
          ]
        ],
        "video": true
      },
      {
        "id": "m6",
        "ch": "Work & making a living",
        "title": "Ruth’s Table",
        "meta": "1994 · age 34",
        "rec": "Dec 7, 2025",
        "mins": 27,
        "asked": "Mark",
        "q": "What made you open the bakery?",
        "summary": "Opening a small bakery on Eighth Street and naming it after her mother. Twenty-five years, a 4 a.m. alarm, and somewhere past twenty thousand lemon cakes.",
        "story": [
          "I was thirty-four and scared to death. We put the house up to borrow the money, and Rick painted the sign himself on our garage floor. I named it for Mom because every recipe I had came from her kitchen.",
          "The first day we sold out of bread by ten. The second day we sold four loaves. I got up at four in the morning for twenty-five years, and I would do every one of them again."
        ],
        "deepQ": "What did the four-loaf day teach you?",
        "deepA": "That the first day is a party and the second day is the truth. Everybody comes once to see what you are. You have to earn the second visit. So I learned every customer’s name and how they liked their bread sliced. By the end of that first year the four-loaf days were gone.",
        "lesson": "Anyone will come once. Earn the second time.",
        "passed": [
          [
            "Still alive",
            "Dylan runs her design studio the same way: every client’s name, and how they take their coffee."
          ],
          [
            "For Ellie & Sam",
            "Carolyn still knows the name of every regular. Ask her to prove it."
          ]
        ]
      },
      {
        "id": "m7",
        "ch": "When everything changed",
        "title": "Mom’s last loaf",
        "meta": "2017 · age 56",
        "rec": "Jan 18, 2026",
        "mins": 31,
        "asked": "Dylan",
        "q": "Your diary stops on February 18, 2017. What happened after?",
        "summary": "Her diary had already kept that winter: the bread every morning, the loaf in Ruth’s lap. So A Story asked about what came after: the morning Ruth died, and the coffee can of recipe cards Carolyn still bakes from every Saturday.",
        "story": [
          "Mom died the next morning, early. Anne called me at the shop. I stopped writing in the diary that day because there was nothing left I wanted to remember. I’m glad somebody finally asked me about it anyway.",
          "A week later I found her recipe cards in a coffee can above the stove. Forty years of her handwriting, flour still in the corners. I bake from them every Saturday. The house has to smell right."
        ],
        "deepQ": "What do you do with the grief now?",
        "deepA": "I give it a job. Every Saturday I take out the next card and bake whatever is on it, in order. I’m on card 212. Some of them are terrible. Mom made a lot of gelatin salads. But for two hours the house smells like her, and I talk to her out loud, and that’s enough.",
        "lesson": "You can’t keep the person, but you can keep their Saturdays.",
        "passed": [
          [
            "Still alive",
            "Ellie bakes with her every other Saturday. They are on card 212 of 340."
          ],
          [
            "Next",
            "The coffee can goes to Ellie. Carolyn has written it on the lid."
          ]
        ]
      },
      {
        "id": "m8",
        "ch": "The world we lived through",
        "title": "The moon on Grandpa’s set",
        "meta": "1969 · age 9",
        "rec": "Nov 20, 2025",
        "mins": 9,
        "asked": "A little question",
        "q": "Where were you when something happened that the whole world watched?",
        "summary": "July 20, 1969. The whole street crowded into Grandpa Walsh’s front room to watch the moon landing. It was the first time Carolyn saw a grown man cry from something good.",
        "story": [
          "Grandpa Walsh had the only set on our street that got Channel 8 without tinfoil on the antenna, so everybody came. The kids sat on the rug and the grown-ups stood along the wall with their arms crossed, like they were in church.",
          "When the man stepped down, nobody said a word. Then I looked up and Grandpa was crying, just quietly, with his hand over his mouth. I’d never seen a grown man cry. I understood it was because of something good, and I didn’t know that was allowed."
        ],
        "lesson": "It’s all right to cry at good things.",
        "passed": [
          [
            "Still alive",
            "Carolyn cries at every school concert. Ellie has stopped being embarrassed."
          ]
        ]
      }
    ],
    "little": {
      "title1": "A little question for today",
      "note1": "Carolyn answered a little question most mornings, usually over coffee. Six from her first two weeks. Scan to read all sixty-four.",
      "title2": "Little questions, later on",
      "note2": "By January the little questions had turned reflective. Notice the first one. It led to the conversation on page 38.",
      "items": [
        [
          "Tue · Oct 21",
          "What did you want to be when you grew up?",
          "A lighthouse keeper. I didn’t know yet that you had to like being alone."
        ],
        [
          "Wed · Oct 22",
          "What’s a smell that takes you straight back?",
          "Sawdust. Dad coming home from the plant."
        ],
        [
          "Fri · Oct 24",
          "Which family story got told again and again?",
          "The klomp. Every Christmas. I’ve stopped pretending to mind."
        ],
        [
          "Mon · Oct 27",
          "What was your first job?",
          "Shelling peas for Mrs. Vander Molen, a nickel a bowl. I ate the profits."
        ],
        [
          "Thu · Oct 30",
          "What song do you know every word to?",
          "“Moon River.” Don’t ask me to sing it."
        ],
        [
          "Sat · Nov 1",
          "Who was your best friend at ten?",
          "Patty Kowalski. We wrote letters until 2009. I kept every one."
        ],
        [
          "Tue · Jan 6",
          "What’s something you were wrong about?",
          "That I’d have time to ask Mom later."
        ],
        [
          "Fri · Jan 9",
          "What do you hope Ellie and Sam never lose?",
          "Their nerve."
        ],
        [
          "Wed · Jan 14",
          "What’s the best advice you ignored?",
          "“Don’t open a bakery.” Everyone said it. Thank God I didn’t listen."
        ],
        [
          "Sun · Jan 18",
          "What does a good day look like now?",
          "Coffee, the crossword, one call from Dylan, and bread in the oven."
        ],
        [
          "Thu · Feb 12",
          "What would you put in a time capsule?",
          "The R from the bakery sign. It was crooked."
        ],
        [
          "Mon · Feb 16",
          "What are you still curious about?",
          "What Ellie’s bakery will be called."
        ]
      ]
    },
    "final": "This book is one edition. Carolyn’s archive keeps every conversation, every little question and every recording, and the family can keep adding to it.",
    "back": {
      "fam": "The Bennetts",
      "quote": "“To the Bennetts, who always pulled up a chair.”"
    }
  },
  {
    "key": "raymond",
    "name": "Raymond",
    "full": "Raymond Ortiz",
    "pronoun": "he",
    "third": true,
    "subtitle": "A founder’s ledger",
    "line": "Machinist · founder, Ortiz Precision · b. 1951",
    "coverColor": "forest",
    "cover": {
      "title": "THE LEDGER",
      "line": "1983 – 2022",
      "names": "Raymond & Elena",
      "motto": "Payday is Friday by noon."
    },
    "title": {
      "t1": "THE LEDGER",
      "t2": "Raymond Ortiz and the building of Ortiz Precision",
      "t3": "Thirty-nine years of lessons, told in the third person",
      "t4": "Grand Rapids, Michigan · 1983 – 2022"
    },
    "colophon": {
      "title": "The Ledger",
      "lines": [
        "Raymond Ortiz and the building of Ortiz Precision, 1983–2022.",
        "Written by A Story in the third person, at Raymond’s request: “I’m a machinist, not a writer. Let somebody else say it.” His own words appear in quotation marks.",
        "From fourteen conversations, most guided by his granddaughter Maya, between September 2025 and January 2026, one conversation around the Christmas table, forty-one quick questions, and Elena’s ledgers, 1983 to 2004.",
        "Every lesson is drawn from Raymond’s own words, and he approved each one before printing. A sample book: Raymond and his family are fictional.",
        "First edition, March 9, 2026, on his seventy-fifth birthday."
      ]
    },
    "dedication": {
      "text": "For Elena, whose name should have been on the door from the first day. And for the twelve who stayed.",
      "sig": "Ray"
    },
    "contents": [
      {
        "num": "",
        "name": "Who he is",
        "sub": "and thirty-nine years in one line"
      },
      {
        "num": "",
        "name": "The rules on the shop wall",
        "sub": ""
      },
      {
        "num": "",
        "name": "The plan, 1983",
        "sub": "and what actually happened"
      },
      {
        "num": "01",
        "name": "Beginnings",
        "sub": "The garage, Elena’s ledger"
      },
      {
        "num": "02",
        "name": "The worst Friday",
        "sub": "February 8, 1991"
      },
      {
        "num": "03",
        "name": "Customers",
        "sub": "The one who was sixty percent"
      },
      {
        "num": "04",
        "name": "Hard years",
        "sub": "Four-day weeks, 2009"
      },
      {
        "num": "05",
        "name": "Handing over the keys",
        "sub": "The family, the sale"
      },
      {
        "num": "06",
        "name": "What he passes on",
        "sub": "and letters"
      },
      {
        "num": "",
        "name": "For anyone starting something",
        "sub": ""
      }
    ],
    "openers": {},
    "memories": [
      {
        "id": "r1",
        "ch": "Beginnings",
        "title": "A garage on Godfrey Avenue",
        "meta": "1983 · age 32",
        "rec": "Sep 14, 2025",
        "mins": 26,
        "asked": "Maya",
        "q": "Why did you leave a good job to start your own shop?",
        "summary": "At thirty-two, with $11,000 and a used milling machine, Raymond rented a two-car garage on Godfrey Avenue. For the first winter the only heat came from a kerosene heater and the machine itself.",
        "story": [
          "Raymond Ortiz had a good job. He was the best setup man at a tool and die shop on the southwest side, and he knew it. What he couldn’t stand was watching parts go out late because nobody upstairs would listen to the floor.",
          "In August 1983 he rented a two-car garage on Godfrey Avenue for $180 a month and bought a used Bridgeport mill for $2,300. That first winter he worked in his coat. “The mill was the only thing in there making money,” he says, “so it got the heat first.”"
        ],
        "deepQ": "What made you sure enough to quit?",
        "deepA": "I wasn’t sure. Nobody’s sure. I was angry, and angry lasts longer than sure. But I knew I could make the part right and make it on time. Start with the one thing you can do better than anybody. You learn the rest on the way.",
        "lesson": "Start with the one thing you can do better than anyone. Learn the rest on the way.",
        "passed": [
          [
            "Still alive",
            "The Bridgeport mill still runs at the front of the shop. Every new hire makes a first part on it."
          ],
          [
            "For Maya",
            "Maya machined the first prototype for her own hardware company on that mill in 2025."
          ]
        ]
      },
      {
        "id": "r3",
        "ch": "Beginnings",
        "title": "Elena’s ledger",
        "meta": "1983 – 2004",
        "rec": "Oct 2, 2025",
        "mins": 38,
        "asked": "Maya",
        "q": "Who was the most important person in the company that nobody knew about?",
        "summary": "For twenty-one years, nights and Sundays, Raymond’s wife Elena kept the books at the kitchen table, unpaid and unlisted. Her name went on the company in 2004. He calls the delay the biggest mistake he ever made.",
        "story": [
          "For twenty-one years, most nights after the kids were down and all day Sunday, Elena Ortiz sat at the kitchen table with a green ledger, a pencil and an adding machine. She chased late invoices, managed the bank, and told Raymond which jobs were losing money, usually before he wanted to hear it.",
          "She was never on the payroll. Her name wasn’t on the door or the incorporation papers, and customers assumed she was the receptionist. In 1991, when the company nearly went under, it was Elena’s ledger that showed the bank a way through."
        ],
        "deepQ": "Why didn’t her name go on the company sooner?",
        "deepA": "Because I was proud and I was stupid, and in 1983 those were the same thing. I thought the company was the machines. It was the machines and the money, and she ran the money. If someone does the work of a partner, put their name on it the first day.",
        "lesson": "Whoever knows the numbers is your partner. Put their name on it the first day.",
        "passed": [
          [
            "Still alive",
            "Elena’s ledgers, 1983 to 2004, are kept in the front office by the new owners."
          ],
          [
            "For Marisol",
            "Marisol, now a CFO, keeps an empty green ledger on her desk. She says it is there to remind her."
          ]
        ]
      },
      {
        "id": "r2",
        "ch": "Customers",
        "title": "The customer who was sixty percent",
        "meta": "1986 – 1991 · ages 35–40",
        "rec": "Oct 19, 2025",
        "mins": 29,
        "asked": "Maya",
        "q": "What’s the most expensive mistake you ever made?",
        "summary": "In 1986 a big lakeshore furniture maker became Ortiz Precision’s dream customer. Within four years it was sixty percent of the business. When it halved its orders in 1991, the company nearly closed.",
        "story": [
          "The order came in on a Tuesday in 1986: twelve thousand brackets a month for a big office-furniture maker on the lakeshore. Raymond hired four people that week. By 1990 that one customer was sixty percent of everything Ortiz Precision made. At the time it felt like winning. “It was a trap with a nice paint job,” he says now.",
          "In January 1991 their purchasing manager called to say volumes were being cut in half, effective immediately. There was no warning and no appeal. “I had built a company,” Raymond says, “and handed someone else the keys without noticing.”"
        ],
        "deepQ": "What would you tell someone who just landed a customer that big?",
        "deepA": "Congratulations. Now go get three more. Every month one customer is more than a quarter of you, you’re working for them, not with them. After ’91 we turned down work to keep that rule, and it’s the reason we were still standing in 2009.",
        "lesson": "No single customer should be able to close your doors.",
        "passed": [
          [
            "Still alive",
            "The 25 percent rule is written into the company’s bylaws."
          ],
          [
            "For Tomás",
            "Tomás runs his own shop by it. He calls it “Dad’s quarter.”"
          ]
        ]
      },
      {
        "id": "r4",
        "ch": "Hard years",
        "title": "Four-day weeks",
        "meta": "2009 · age 58",
        "rec": "Nov 6, 2025",
        "mins": 33,
        "asked": "Maya",
        "q": "What decision are you proudest of?",
        "summary": "When the 2009 recession cut revenue by forty-one percent, Raymond put all sixty-two employees on four-day weeks, took no salary for a year, and laid off no one.",
        "story": [
          "By March 2009 orders had fallen off a cliff. The banker suggested what every banker suggested that year: lay off a third of the floor and wait it out. Raymond went home and asked Elena to run the numbers the other way.",
          "Everyone, Raymond included, went to four days a week, and his own salary went to zero for twelve months. The fifth day became training. Revenue fell forty-one percent from its peak, and nobody lost a job. When orders came back in 2010, Ortiz Precision had the only full, trained crew in its corner of Kent County."
        ],
        "deepQ": "Why not lay people off, like everyone else?",
        "deepA": "Because the people you lay off in a bad year are the people you need to rebuild in the good one. And because I’d stood on that pallet in ’91. You can’t ask people to trust you and then let them find out on a Friday. The cuts start in my office.",
        "lesson": "In a bad year, the cuts start in my office.",
        "passed": [
          [
            "Still alive",
            "Rule six on the shop wall, added in 2009."
          ],
          [
            "The 140",
            "Of the 62 employees kept in 2009, 31 are owners of the company today."
          ]
        ]
      },
      {
        "id": "r5",
        "ch": "Handing over the keys",
        "title": "Selling it to the people who built it",
        "meta": "2022 · age 71",
        "rec": "Jan 10, 2026",
        "mins": 41,
        "asked": "Maya",
        "q": "How do you want people to remember the company?",
        "summary": "Instead of a private equity sale that would have moved half the work away, Raymond sold Ortiz Precision to its 140 employees through an employee stock ownership plan. He took less money and kept every job in Grand Rapids.",
        "story": [
          "The private equity offer was the better deal on paper. Raymond kept the term sheet in his desk drawer for three months. In the end he took roughly a fifth less and sold the company to the people who worked there, through an employee stock ownership plan that took two years and four lawyers to build.",
          "On his last day in March 2022, the second shift gave him a framed part: the first bracket he ever made in the garage on Godfrey Avenue. Hector had kept it in his toolbox for thirty-eight years."
        ],
        "deepQ": "Was it worth the money you left on the table?",
        "deepA": "I didn’t leave it on the table. I left it in a hundred and forty houses. The real test of building something is whether it runs without you. I go in on Thursdays now and nobody needs me. Best feeling I’ve had in forty years.",
        "lesson": "Build something that doesn’t need you. That’s how you know you built it right.",
        "passed": [
          [
            "Still alive",
            "Ortiz Precision is owned by its employees. The name stays on the door."
          ],
          [
            "For Maya",
            "Maya has promised every employee at her company a share of it. She has it in writing."
          ]
        ],
        "video": true
      }
    ],
    "little": {
      "title1": "Quick questions",
      "note1": "One a day, answered in a minute, usually from his recliner. Scan to read all forty-one.",
      "title2": "Quick questions, later on",
      "note2": "By November the answers got shorter and truer. The first one took him eleven seconds.",
      "items": [
        [
          "Mon · Sep 8",
          "Best money you ever spent?",
          "$2,300 on a used Bridgeport mill. It still runs."
        ],
        [
          "Wed · Sep 10",
          "Worst hire you ever made?",
          "Me, as a salesman. I lasted four months."
        ],
        [
          "Fri · Sep 12",
          "What do you look for in a person?",
          "Whether they clean their station without being told."
        ],
        [
          "Tue · Sep 16",
          "First thing you do every morning?",
          "Walk the floor before I open my email. Forty years."
        ],
        [
          "Thu · Sep 18",
          "Favorite tool?",
          "My father’s six-inch dial caliper. It’s off by a thousandth. I know which way."
        ],
        [
          "Sun · Sep 21",
          "What did your father teach you?",
          "Leave the engine cleaner than you found it."
        ],
        [
          "Tue · Nov 11",
          "One more year at thirty-two. What would you do?",
          "Pay Elena."
        ],
        [
          "Thu · Nov 13",
          "Something you changed your mind about?",
          "Debt. I hated it. Good debt bought our second building."
        ],
        [
          "Mon · Nov 17",
          "Hardest thing about being the boss?",
          "Eating lunch alone."
        ],
        [
          "Wed · Nov 19",
          "Advice for your 1983 self?",
          "Get a second customer before you need one."
        ],
        [
          "Sat · Nov 22",
          "What does retirement feel like?",
          "Saturday, every day. I miss Mondays."
        ],
        [
          "Tue · Nov 25",
          "What are you still learning?",
          "How to let Maya explain her circuit boards without interrupting."
        ]
      ]
    },
    "final": "This book is one edition. Raymond’s archive keeps every conversation and recording, and the family, and Hector, can keep adding to it.",
    "back": {
      "fam": "Elena",
      "quote": "“Fifty years, two near-misses, one green ledger. None of it without you.”"
    }
  },
  {
    "key": "tom",
    "name": "Tom",
    "full": "Thomas Kessler",
    "pronoun": "he",
    "third": false,
    "subtitle": "A veteran’s homecoming",
    "line": "Army medic, 1968 · ER nurse · b. 1948",
    "coverColor": "slate",
    "cover": {
      "title": "WHAT I CARRIED HOME",
      "line": "SAGINAW, MICHIGAN · BORN 1948",
      "names": "Tom & Diane",
      "motto": "Come home."
    },
    "title": {
      "t1": "WHAT I CARRIED HOME",
      "t2": "The life of Thomas Kessler",
      "t3": "A medic, a nurse, a grandfather",
      "t4": "Saginaw · Vietnam · Saginaw"
    },
    "colophon": {
      "title": "What I Carried Home",
      "lines": [
        "The life of Thomas Kessler, in his own words.",
        "Gathered between September 2025 and February 2026 from thirteen live conversations, most with his granddaughter Hannah; forty-four little questions; one conversation over Sunday dinner; and the forty-one letters he wrote home in 1968.",
        "Every lesson is drawn from Tom’s own words, and he approved each one before printing. Tom chose to share three chapters with historians.",
        "A sample book. Tom and his family are fictional.",
        "Shaped, designed and printed by A Story. First edition, Memorial Day, May 25, 2026."
      ]
    },
    "dedication": {
      "text": "For Danny Alvarez, who laughed louder than anyone. And for Diane, who wrote every week.",
      "sig": "Tom"
    },
    "contents": [
      {
        "num": "",
        "name": "Who he is",
        "sub": "and his life against history"
      },
      {
        "num": "01",
        "name": "Where we come from",
        "sub": "The letter on the kitchen table"
      },
      {
        "num": "02",
        "name": "The war",
        "sub": "Doc · The ones I couldn’t save · 365 days"
      },
      {
        "num": "03",
        "name": "Letters",
        "sub": "and what a medic carried"
      },
      {
        "num": "04",
        "name": "Coming home",
        "sub": "The wrong clothes"
      },
      {
        "num": "05",
        "name": "Work & making a living",
        "sub": "Night shift"
      },
      {
        "num": "06",
        "name": "Love & family",
        "sub": "The Wall"
      },
      {
        "num": "07",
        "name": "Looking back",
        "sub": "Telling it"
      },
      {
        "num": "",
        "name": "For the record",
        "sub": "and what he passes on"
      },
      {
        "num": "",
        "name": "If you know a veteran",
        "sub": ""
      }
    ],
    "openers": {},
    "memories": [
      {
        "id": "v1",
        "ch": "Where we come from",
        "title": "The letter on the kitchen table",
        "meta": "Saginaw, Michigan, 1967 · age 19",
        "rec": "Sep 21, 2025",
        "mins": 29,
        "asked": "Hannah",
        "q": "How did you end up in Vietnam, Grandpa?",
        "summary": "Tom’s draft notice arrived in the spring of 1967. His mother hid it in the bread drawer for a day before she could give it to him. His father, who had served in the Pacific, said only two words.",
        "story": [
          "We lived two blocks from the foundry where my dad worked, on a street where every house put a flag out on the Fourth of July. I was nineteen, pumping gas and taking one class at the community college, which was not enough to keep me out.",
          "The letter came on a Tuesday in April. My mother put it in the bread drawer and didn’t say a word until supper the next day. My father had been on Okinawa. He read it, folded it, and said two words to me: come home. That was the whole conversation."
        ],
        "deepQ": "What did you come to understand about those two words?",
        "deepA": "That he knew. He’d been to war, he knew what it would ask of me, and he couldn’t say any of it. So he gave me the only order that mattered. I came home. It took me forty years to understand that he hadn’t, not all the way. Neither had I.",
        "lesson": "Come home, all the way. It takes longer than the trip.",
        "passed": [
          [
            "Still alive",
            "Tom says “come home” to every grandchild leaving for college. They know what he means now."
          ],
          [
            "For Hannah",
            "Hannah wrote her senior thesis on veterans’ homecomings. It began with this story."
          ]
        ]
      },
      {
        "id": "v2",
        "ch": "The war",
        "title": "Doc",
        "meta": "Central Highlands, Vietnam, 1968 · age 20",
        "rec": "Oct 5, 2025",
        "mins": 46,
        "asked": "Hannah",
        "q": "What was your job over there?",
        "summary": "Tom arrived in Vietnam in February 1968, ten days after the Tết Offensive began, as an Army combat medic with an infantry company. The men called him Doc. He was twenty.",
        "story": [
          "They trained me for ten weeks to be a medic, and in February 1968 they put me on a plane. By the end of my first week everybody in the company called me Doc. Nobody used my name for a year.",
          "The first man I treated was older than me by a month. I remember his boots, not his face. You learned fast what you could fix and what you couldn’t. Some days the job was just to stay. Hold a hand. Talk about Michigan. Lie a little about how bad it was."
        ],
        "deepQ": "What do you mean, the job was just to stay?",
        "deepA": "Some men you could save. Some you couldn’t, and they knew it, and you knew it. What they wanted was not to be alone. So you stayed. Sometimes the bird took the ones who could make it, and you stayed with the one who couldn’t. I’ve believed that every day since, over there and in thirty-six years of emergency rooms.",
        "lesson": "Nobody should be alone at the end. Stay.",
        "passed": [
          [
            "Still alive",
            "Tom volunteers with a hospice program near Saginaw. He sits with veterans who have no one."
          ],
          [
            "For Laura",
            "Laura became a hospice nurse. She says she learned it at the dinner table without knowing."
          ]
        ]
      },
      {
        "id": "v3",
        "ch": "Coming home",
        "title": "The wrong clothes",
        "meta": "February 1969 · age 21",
        "rec": "Nov 16, 2025",
        "mins": 34,
        "asked": "Hannah",
        "q": "What was it like coming home?",
        "summary": "Tom flew home in February 1969. Somewhere between California and Detroit he changed out of his uniform in an airport restroom. At home, almost nobody asked where he had been.",
        "story": [
          "I landed in California in my uniform, and by the time I got to Detroit I was in jeans and a sweatshirt. I changed in a restroom. Nobody told me to. I’d seen how people looked at the guys in uniform, and I’d had enough of being looked at for one year.",
          "My mother cried at the gate. My father shook my hand and held on a long time. Then we drove home and had pot roast, and nobody asked me a single question about where I’d been. I think they were afraid of the answers. So was I."
        ],
        "deepQ": "What would have helped, that night?",
        "deepA": "One question. From anybody. What was it like, Tommy? I might not have answered. But I’d have known the door was open. Instead everybody was polite, and polite is a closed door. When I was a nurse, I always asked. You ask, and then you shut up and listen.",
        "lesson": "Ask, then listen. Polite silence is a closed door.",
        "passed": [
          [
            "Still alive",
            "Tom helps welcome home veterans returning from Honor Flights in mid-Michigan."
          ],
          [
            "For Mike",
            "Mike, a teacher, invites a veteran to class every Veterans Day. His students prepare questions, not just thank-yous."
          ]
        ]
      },
      {
        "id": "v4",
        "ch": "Work & making a living",
        "title": "Night shift",
        "meta": "Saginaw, 1972 – 2008",
        "rec": "Dec 7, 2025",
        "mins": 37,
        "asked": "Laura",
        "q": "Why did you become a nurse, Dad?",
        "summary": "On the GI Bill, Tom went to nursing school, one of two men in his class. He worked thirty-six years in the emergency room of a Saginaw hospital, most of them on nights.",
        "story": [
          "The GI Bill paid for school, and the only thing I knew how to do was what I’d done over there. So I went to nursing school. There were two men in my class of thirty-eight. The other one quit by Christmas.",
          "I worked emergency for thirty-six years, mostly nights, because nights were quiet until they weren’t, and I was good when they weren’t. Wrecks on I-75, kids with fevers, farmers with their hands caught in something. I never panicked once. I’d used up my panic in 1968."
        ],
        "deepQ": "Did the war make you a better nurse?",
        "deepA": "A calmer one. And I needed somewhere to put it. Every person I helped in that ER was a small payment on what I couldn’t do for Danny. Maybe that’s not healthy. But it was useful, and useful kept me going.",
        "lesson": "Take what broke you and put it to use.",
        "passed": [
          [
            "Still alive",
            "When he retired in 2008, the night shift framed his first pay stub and his last one."
          ],
          [
            "For Laura",
            "Laura followed him into nursing. She started on his floor and moved to hospice."
          ]
        ]
      },
      {
        "id": "v5",
        "ch": "Looking back",
        "title": "Telling it",
        "meta": "2020 – 2026 · age 78",
        "rec": "Feb 8, 2026",
        "mins": 41,
        "asked": "Hannah",
        "q": "Why did you finally say yes to this?",
        "summary": "When Hannah was sixteen, she asked to interview him for a school project. He said no. Five years later she asked again, with A Story. This time he said yes.",
        "story": [
          "Hannah asked me in 2020, for a history project, and I told her no. I told her it wasn’t a story for a kid. She said, then when? I didn’t have an answer.",
          "In 2025 she asked again. My friends from that year are mostly gone. If I don’t say it, the only version left is the one in the textbooks, and the textbooks don’t know Danny laughed louder than anyone. So I said yes. Talking doesn’t open the box. It just lets some air in."
        ],
        "deepQ": "What do you want people to understand about you, now that you’ve told it?",
        "deepA": "That I was a kid who did a hard job, then a man who did a useful one, and the two are connected. And that I was wrong to wait. Silence felt like strength. It was just silence. Tell it while you can, to whoever will listen.",
        "lesson": "Tell it while you can, to whoever will listen.",
        "passed": [
          [
            "Still alive",
            "Hannah is preparing his three shared chapters, with his letters, for the Library of Congress Veterans History Project, which takes accounts directly from veterans and their families."
          ],
          [
            "For Hannah",
            "Hannah now helps other families in her county record their veterans."
          ]
        ],
        "video": true
      }
    ],
    "little": {
      "title1": "A little question for today",
      "note1": "Small questions, answered with his morning coffee. The easy ones came first. Scan to read all forty-four.",
      "title2": "Little questions, later on",
      "note2": "By January the answers had changed. The first one is why he agreed to share two pages with everyone.",
      "items": [
        [
          "Mon · Sep 22",
          "What did you do for fun at nineteen?",
          "Drove my ’57 Chevy up and down Genesee Avenue."
        ],
        [
          "Wed · Sep 24",
          "Favorite thing your mother cooked?",
          "Pierogi at Christmas. Mom was Polish. Dad pretended not to be impressed."
        ],
        [
          "Fri · Sep 26",
          "What song takes you back to 1968?",
          "“Dock of the Bay.” It was on every radio that spring. I can’t hear it at a gas station without being back there."
        ],
        [
          "Sun · Sep 28",
          "What did you miss most, over there?",
          "Cold. Real Michigan cold."
        ],
        [
          "Tue · Sep 30",
          "How did you meet Grandma?",
          "A church picnic, the summer before I left. She wrote every week for a year. I married the handwriting."
        ],
        [
          "Thu · Oct 2",
          "Best advice your father gave you?",
          "Two words. You know them by now."
        ],
        [
          "Mon · Jan 12",
          "What should people stop saying to veterans?",
          "“Thank you for your service,” and then walking away. Stay a minute."
        ],
        [
          "Wed · Jan 14",
          "What still makes you laugh?",
          "Danny’s laugh. I can still hear it. That’s the good part."
        ],
        [
          "Fri · Jan 16",
          "What are you proudest of?",
          "Thirty-six years of nights, and two kids who turned out kind."
        ],
        [
          "Sun · Jan 18",
          "What do you do on Memorial Day?",
          "Go to the VFW and say Danny’s name out loud."
        ],
        [
          "Tue · Jan 20",
          "Would you go back to Vietnam?",
          "I’d like to see it in peacetime. Hannah says she’ll take me."
        ],
        [
          "Thu · Jan 22",
          "What makes a good life?",
          "Being useful. Being home for supper."
        ]
      ]
    },
    "final": "This book is one edition. Tom’s archive keeps every conversation, letter and recording, and the family can keep adding to it.",
    "back": {
      "fam": "Diane",
      "quote": "“You wrote every week to a boy you’d met once. I married the handwriting, and then I married you.”"
    }
  }
];

export const sampleBook = (key: string): SampleBook => SAMPLE_BOOKS.find((b) => b.key === key) || SAMPLE_BOOKS[0];
