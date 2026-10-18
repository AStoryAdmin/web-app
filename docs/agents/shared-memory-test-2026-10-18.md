# Shared memory (multi-perspective) test, 2026-10-18

Two real accounts on the dev site: Bao Vo (localhost:5180) and the test account GBao (gbao.n.vo, test.localhost:5180, signed in by the founder).

## What was done (real data)
- Bao's account made a family code for the existing tree row "GBao Vo" (friend): **JC6ME5**.
- The test account opened /join/JC6ME5 and joined at once: "You're in, GBao."
- No memory was written yet.

## What works
- The code, the join and the tree: GBao is now in Bao's family, and Bao's tree shows them.
- The test account's Family page shows the whole tree, with GBao marked "you".

## What is broken or missing (the key feature)
1. **A family member can't read the storyteller's memories.** The database lets only a story's owner and keepers read its memories (`memories_all_member`, `is_story_member`). Joining with a person code makes you a tree member, not a story member. From GBao's side, Bao's page says "Nothing with Bao in it yet" and Bao's book isn't listed. Yet the join page promises "You read the memories they share with the family, and add what you remember under your own name."
2. **So a family member can't add their side.** "What the family remembers" (FamilyVoices, on each memory) is only reachable by someone who can open the memory, which today means a keeper.
3. **The contribute link (/c/slug) is never offered on the web.** `contributeUrl` exists but no page shows it, so there is no web way to send "add what you remember" to someone who isn't a keeper.
4. **The joined story is named after the joiner.** In "Whose story?" the joined story reads "GBao Vo · their story · 0 memories", and the join page says "GBao's story is on your Family tab". The code joined GBao's own tree row, whose story was one Bao had started about GBao; Bao's own story (8 memories) isn't there.
5. **Two of the same person.** The test account's own story "Bao Ngo Gia Vo" and the tree row "GBao Vo" are the same human. The tree shows both, one as "not on A Story yet", one as "you".
6. **Wrong name in a line:** on Bao's person page, seen as GBao: "Nobody writes as GBao."
7. **Ty Ngo's state differs by viewer:** "invited · waiting for them" for Bao, "not on A Story yet" for GBao.
8. On the test account's Home, the falling leaf sits on top of the "Last kept…" line.

## Decisions for the founder
- Should a family code let the person read the storyteller's shared memories (a database policy change: a "family reader" role), or only keepers?
- Should the web offer the /c contribute link on each memory ("Ask someone who was there")?

## Round two (keeper path), same day
- Bao invited the test account as a keeper (gbao.n.vo@gmail.com). On its next load Bao's story ("8 memories") appeared under "Stories you've joined".
- GBao opened "Losing grandparents…" and sent a version under "What the family remembers". **It failed every time from the web**: the web sent `via: "web"`, and the database allows only app, call or link (`contributions_via_known`). Fixed: the web now sends `via: "app"`.
- Resent: "TEST: I remember Grandpa's uniform hanging by the door, pressed every Sunday." Bao saw it at once as "Waiting for you · Keep it / Not this one", pressed Keep it, and it now shows under the memory as "Bao Ngo Gia Vo · today".
- Note: the contributor also sees "Keep it / Not this one" on their own version, because a keeper reviews everything.

## The invitation email
- "Download the app" goes to astoryapp.com/?ref=CODE, which does nothing with the code. "Already have it? Open in app" is an astory:// link: Gmail on a computer drops it, and it only works on a phone with the app installed.
- The function already supports a browser button: set the Supabase secret `INVITE_JOIN_URL=https://app.astoryapp.com` and the first button becomes "Join in your browser →" at app.astoryapp.com/?ref=CODE. The web app now turns `/?ref=CODE` into its join page.
- The astory:// button should be dropped from the email until the app is public (a phone-app change to send-invite-email, then a deploy).

## Made during the test (real data)
- Family code JC6ME5 for the tree row "GBao Vo" (used by the test account).
- A keeper invite for gbao.n.vo@gmail.com on Bao's story (it emailed code ZFP78N).
- One kept family version on "Losing grandparents…", from the test account, beginning "TEST:".
