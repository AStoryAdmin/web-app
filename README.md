# A Story — web

The signed-in A Story product in a browser, at app.astoryapp.com. It shares
the phone app's Supabase project and accounts: an account made in either
signs into both and sees the same stories.

Started 2026-10-16. Decisions so far:

- Own repo, own deploy (app.astoryapp.com), same pattern as the marketing
  site (GitHub Actions → S3 → CloudFront).
- Production backend; all of `phone-app/supabase/all.sql` is live.
- v1: sign in, whose story, today's question, write a memory (with photos),
  the archive, the family (tree, invite by code and link, review what the
  family sent), the book (progress, preview, print at home, order).
  v1.5: the live conversation in the browser (WebRTC), once the AI server
  allows this origin.
- Design follows the Figma export (`docs/figma/`), not the current app.

Read `docs/PRD.md`, `docs/PORTING-MANIFEST.md` and `docs/DESIGN-SYSTEM.md`
before building a screen. Mockups for approval are in `docs/mockups/`.

## Run

```bash
npm install
cp .env.example .env   # fill in the Supabase URL and anon key
npm run dev            # http://localhost:5180
npm run check          # lint, unit tests, build
```

## Rules

1. Never write to Supabase from a screen; go through `src/data/`.
2. Every write that can fail says so on screen. This holds recordings that
   exist nowhere else.
3. Colours and type from the theme, never a raw hex in a component.
4. Copy is warm, plain and short. Never "legacy", "deadline", "before it's
   too late"; never "immigrant"; they/them when pronouns are unknown.
5. Body text at least 16px, touch targets at least 44px. The storytellers
   are 65–90.
6. Pure logic lives in `src/lib/` with tests; it is ported from the phone
   app's `src/lib/` and must keep the same behaviour (same archive, same
   dates, same chapters).
