# Bond illustration set - 18 October 2026

## Direction

Detailed, warm digital illustration with a natural dog smile, soft brown eyes, slight head tilts and playful reactions. Preserve Bond's ginger/sable fur, charcoal muzzle, dark semi-floppy ears, cream-gray chest and pale feathered tail. Avoid human teeth and expressions that make him stern or alarmed.

This follows the founder's request to choose a friendlier direction than the earlier watercolor prescription. The built-in image_gen tool produced this set from real Bond photos and the founder's detailed illustration reference.

## Website studied

The actual local app at localhost:5180: Home, Archive, Family, Book and Write, plus the supplied sign-in screenshot. DESIGN.md, PRODUCT.md, the current Companion component and mascot documentation informed the intended uses.

His warm coat works with the app's ivory paper and chocolate cloth. The teal book and wax-sealed letter connect the decorative poses to the existing book and family-invite surfaces.

## Files

All files are in public/dog/bond, preserving existing public/dog assets:
- watch.png: smiling welcome, 1254 x 1254
- cover.png: both eyes covered, 1254 x 1254
- peek.png: one-eye peek, 1254 x 1254
- curious.png: inquisitive tilt, 1254 x 1254
- sleep.png: chin on crossed paws, 1254 x 1254
- book.png: asleep against teal book, 1536 x 1024
- envelope.png: seated with sealed letter, 1024 x 1536
- reference.png: four views, 1536 x 1024
- watch-alternate.png: alternate smiling portrait, 1254 x 1254

All PNGs have native RGBA transparency. Corner alpha was verified as zero for each; additional pixels above and below the book subject also have zero alpha. Some image viewers display RGB colors stored under transparent pixels; those colors are not an opaque background.

## Review and integration

Open bond-review.html in this folder to compare the cutouts on cream, chocolate and teal grounds, with 120px and 72px samples.

This is an illustration delivery. The running Companion component still uses the existing assets. Before switching sets, measure a common head scale, paw baseline and pupil coordinates for these files. The generated canvases share dimensions but are not pixel-aligned animation frames. Do not reuse the old ART coordinates.

## References and prompts

All 26 original photo attachments from Dog Description Review are saved beside web-app in Bond reference photos. They contain 23 unique images; repeated uploads retain their filenames. source-manifest.json records dimensions and SHA-256 hashes.

The full generation prompts are in bond-generated-prompts.json. The first master was followed by seven poses and one alternate portrait. A later background-cleanup trial was unnecessary: the original files already contained native transparency, and the trial outputs were not selected.

No app source changes or deployment were performed for this illustration set.

