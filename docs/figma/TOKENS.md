# Figma tokens, read from the file itself

Source: Figma "Drafts Design App A Story Us" (PRD6PWc1gDWwRVU3tMGLyv), read
through the Figma connector on 2026-10-16. The "Color System" frame (1:970)
and the Home frame (1:321). The 30-frame PDF export in this folder is the
later file ("APP A Story Us 2026"); the Drafts file holds the same screens
(Home, Home scrolling, Details memory, Create a memory, Archive, Account,
Edit Profile, People, Family & Friends, Invite & Connect, Privacy, General
Settings, Memory Milestones, Recording, Share QR) and this token sheet.
Renders: `drafts-color-system.png`, `drafts-home.png`.

## Colour ramps (the designer's)

Primary (terracotta-orange; actions, labels, the week-strip dot):

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| #F9EBE9 | #FCD2C2 | #FBB69B | #FA9A73 | #FA8554 | #FA7337 | #EF6C33 | #E1652F | #D25E2C | #B85327 |

Secondary (brown; chrome, app bar, body ink):

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| #EEEBE8 | #D5CDC6 | #B9ACA0 | #9C8B7A | #87715D | #715941 | #66503A | #584331 | #4A3728 | #3B291D |

Note the brand file (`landing-page-publish/src/lib/brand.json`) names the
terracotta #B85126 and the chocolate #4A3327; the Figma's primary-900
(#B85327) and secondary-800 (#4A3728) are those, one unit apart. Treat the
brand.json values as canonical and the ramps as their tints and shades.

Neutrals: 0 #FFFFFF · 50 #F0F0F0 · 500 #4D4D4D · 700 #333333 · 900 #0A0A0A.
Success: 50 #EEFAF5 · 700 #0E9154. Ring (focus): outside #50B7BE 3px,
inside #FFFFFF 2px.

Logo: the A typeface #F1EADC, the accent (heart/wordmark) #EAC668, the slogan
#DBD2C5 (on the chocolate ground).

## Type (Montserrat throughout)

| Token | Size / line | Letter-spacing | Weights used |
|---|---|---|---|
| xxs | 10 / 14 | +0.10 | Regular, Medium |
| xs | 12 / 18 | +0.06 | Regular, Medium, Bold |
| sm | 14 / 20 | 0 | Medium, Bold |
| lg | 18 / 28 | 0 | Bold |
| 2xl | 24 / 32 | −0.12 | Medium |

Button sm: 12/18 Medium, +0.06 tracking, height 32, pill padding 16, border
1.2. (The web raises every size: body 16 minimum, buttons 44 minimum. These
are the designer's phone values, kept for proportion.)

## Shape and space

Corners: lg 8 · xl 12 · 2xl 16 · 6xl 40 · 7xl 56 · pill 1000.
Spacing: 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 32.
Shadow xs: 1px 2px 4px rgba(16, 24, 40, 0.08) (#10182814).
