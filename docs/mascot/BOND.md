# Bond, the A Story mascot

Bond is the founder's dog. He replaces the cream samoyed puppy everywhere (`public/dog/*`). Founder ruling, 2026-10-17.

## What he looks like (from the founder's photos)

A small fluffy mixed-breed. Warm ginger-tan coat, with darker sable-brown tips along his back, the crown of his head and the tips of his ears. A dark brown-black muzzle that fades into tan cheeks, a black nose, dark round shiny eyes. Soft semi-floppy ears that fold forward at the tips, fluffy at the edges. A pale cream ruff on his chest. A fluffy tail that curls over his back, cream underneath. Slightly scruffy, never groomed into a show dog.

## The states the site uses

| File | Pose | Where |
| --- | --- | --- |
| watch | Chin up, both paws on the ledge, looking at you | Sign-in bookplate (eyes follow the pointer) |
| cover | Both paws over his eyes | Password field, the writer once you start |
| peek | One paw over one eye, the other open | "Show" on the password |
| curious | Head tilted, ears lifted | Create account, empty and failure states, Family invite |
| sleep | Eyes closed, chin on his paws | Verify, the writer's board edge, empty book, Person |
| book | Asleep curled against the closed teal book | Decoration (D11) |
| envelope | Sitting up, sealed envelope in his mouth | Family invite sent, Contribute thank-you |

## How to generate (ChatGPT)

Do every prompt in ONE chat, in order, so he stays the same dog. Attach 3 or 4 of the clearest photos of Bond and `public/dog/source.png` (the old sheet, for style only) to prompt 1.

Prompt texts are in the founder's chat message of 2026-10-17 and below.

### 1. Reference sheet

> Create a character reference sheet of my dog Bond, from the attached photos. He must look exactly like the photos: a small fluffy mixed-breed with a warm ginger-tan coat, darker sable-brown tips along his back, the crown of his head and the tips of his ears, a dark brown-black muzzle fading into tan cheeks, a black nose, dark round shiny eyes, soft semi-floppy ears that fold forward at the tips, a pale cream chest ruff, and a fluffy tail curled over his back. Slightly scruffy, not groomed. Do not turn him into a samoyed, a pomeranian or a generic puppy.
>
> Draw him in the exact illustration style of the attached cream puppy sheet (use it for style only, not for the dog): soft hand-drawn coloured pencil and light watercolour, fine warm sepia linework, gentle individual fur strokes, warm and tender, storybook quality.
>
> Show four views in a row with generous space between them: sitting facing the viewer, sitting three-quarter view, standing side view with the tail curled, and a head close-up. Plain flat warm-cream background (#F3EBDD), no paper texture, no vignette, no cast shadows, no text, no labels, no border. Landscape, 1536×1024.

### 2. watch

> Now Bond alone, in the same style. Framing for this and every pose after it: Bond seen from the chest up, as if looking over the edge of a table, his front paws resting on a thin horizontal sepia ledge line that runs across the lower fifth of the image. His head is centred and fills about 60% of the image height. Nothing below the ledge line. Plain flat warm-cream background (#F3EBDD), no texture, no shadows, no text.
>
> Pose: chin slightly raised, both front paws resting side by side on the ledge, looking straight at the viewer with a soft, closed-mouth, content expression. Both eyes fully open and clearly visible. Square, 1024×1024.

### 3. cover

> Same Bond, same style, exactly the same framing, scale and ledge position as the previous image. Only the pose changes: he covers both eyes with both front paws, shy and sweet, his black nose and mouth still showing below his paws, ears relaxed. His elbows rest on the ledge. Square, 1024×1024.

### 4. peek

> Same Bond, same style, exactly the same framing, scale and ledge position. Pose: one front paw over his left eye, the other paw resting on the ledge, his right eye open and peeking at the viewer, a small mischievous smile. Square, 1024×1024.

### 5. curious

> Same Bond, same style, exactly the same framing, scale and ledge position. Pose: head tilted about 20 degrees to one side, ears lifted and alert, eyes bright and looking up toward the viewer, both front paws resting on the ledge. Square, 1024×1024.

### 6. sleep

> Same Bond, same style, exactly the same framing, scale and ledge position. Pose: fast asleep, eyes gently closed as soft curved lines, chin resting on his crossed front paws on the ledge, ears soft and drooping, peaceful. Square, 1024×1024.

### 7. book

> Same Bond, same style. Full body this time: Bond asleep, curled up against a closed clothbound book lying flat on its side. The book cloth is deep teal (#0F4A58), with two thin gold-foil bands on the spine and no lettering. His chin rests on the edge of the book, his tail curled around his paws, eyes closed. A thin sepia ground line under them. Plain flat warm-cream background (#F3EBDD), no texture, no shadows, no text. Landscape, 1536×1024.

### 8. envelope

> Same Bond, same style. Full body: Bond sitting upright and proud, facing the viewer, holding a cream envelope gently in his mouth. The envelope is closed with a round terracotta-red wax seal (#9A4220) and has no writing. His tail curls over his back. A thin sepia ground line under his paws. Plain flat warm-cream background (#F3EBDD), no texture, no shadows, no text. Portrait, 1024×1536.

## If a result is off

- If he drifts toward a samoyed or a generic puppy, reply: "He must look exactly like Bond in the photos and in image 1. Redo it."
- If the framing drifts, reply: "Match the framing, scale and ledge height of the watch image exactly."
- Download each as PNG at full size.

## Status (2026-10-17)

The founder chose the art as delivered: a soft painterly finish, warmer and more finished than the watercolour the prompts asked for. That finish is now the mascot's style; reviewers judge placement and craft, not the style.


The founder's art arrived as one sheet of eight poses plus a separate peek. It is cut, scaled to one shared scale (watch is 640 tall), and in `public/dog/` as .png and .webp: watch 802x640, cover 738x710, peek 689x734, curious 765x949, sleep 781x622, plus book, envelope and sit (a spare, sitting and smiling). The `-paper` variants are the same art cut flat under the chest. Eye centres: watch L 0.449/0.484, R 0.686/0.380; curious L 0.468/0.272, R 0.642/0.408. Lids are his fur colour (about #A06640).

## After the images arrive (lead)

1. Key out the cream ground by flood fill, trim, align every ledge pose on the same ledge height, export at 640px tall.
2. Re-measure the eye positions in `watch` and update the catchlight coordinates in `src/components/delight/Companion.tsx`.
3. Make the `-paper` variants (sleep, curious, cover) with the fur's transparent gaps filled with #FFFDF8, as WebP.
4. Update widths in every `<img>` that names a dog file, and replace `public/dog/source.png` with the reference sheet.
