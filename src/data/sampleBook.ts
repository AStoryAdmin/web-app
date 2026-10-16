/**
 * A sample story for the front door: four memories of an invented
 * grandmother, Nora, so somebody with no account can turn the pages of a
 * book and see what theirs would be. Built with the same functions as a
 * real one, so the sample is never prettier than the product.
 */
import { newMemory, newStory } from "./memories";
import type { Story } from "./stories";

export function sampleStory(): Story {
  const story = newStory({ id: "sample-nora", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941", intro: "Eighty-four years, most of them in the same three streets." });
  story.bookDesign = { cover: { title: "Moments & Memories", subtitle: "A life, in her words", style: "heirloom" } };
  const at = (n: number) => new Date(2026, 8, 1 + n).toISOString();
  story.memories = [
    newMemory({
      id: "sample-1",
      title: "One bicycle between the four of us",
      era: "Childhood",
      period: "1949",
      body:
        "We had one bicycle between the four of us, a black Raleigh with a bell that didn't ring. It was never my turn. My brothers were older and faster and the rule in our house was that whoever got to it first had it, so I learned to be up before anyone.\n\nI still loved it. I loved the waiting as much as the riding. You could sit on the step with your shoes on and listen for the gate.",
      createdAt: at(0),
    }),
    newMemory({
      id: "sample-2",
      title: "The kitchen on Elm Street",
      era: "Growing up",
      period: "the 1950s",
      body:
        "The kitchen was the only warm room in winter, so that is where everything happened: homework at the table, my mother's radio on the windowsill, the dog asleep against the stove. I can still smell the onions. Nobody thought it was anything special at the time.",
      createdAt: at(1),
    }),
    newMemory({
      id: "sample-3",
      title: "He asked me three times",
      era: "Love & family",
      period: "June 1962",
      body:
        "Your grandfather asked me three times. I said yes the first time. He just didn't hear me, because the band had started and he had his eyes shut, which is how he asked for things he was frightened of.\n\nThe second time I laughed. The third time I took his hand and walked him outside so he could hear the answer properly.",
      createdAt: at(2),
    }),
    newMemory({
      id: "sample-4",
      title: "What I would tell you",
      era: "Looking back",
      period: "2026",
      body: "Keep the ordinary days. The weddings look after themselves. It is the Tuesday afternoons nobody photographed that I would give anything to have back.",
      createdAt: at(3),
    }),
  ];
  return story;
}
