# Deploying the A Story web app to Cloudflare Pages

Instructions for whoever does the deploy (a person, or an assistant such as
ChatGPT working in the Cloudflare dashboard with the founder). Follow them in
order. Nothing here needs a terminal.

- Repository: `AStoryAdmin/web-app` on GitHub (private), branch `main`
- Target address: `https://app.astoryapp.com`
- The marketing site `astoryapp.com` is a separate project and must not be touched.

## 1. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorise the GitHub app for the `AStoryAdmin` organisation if asked, and give it access to the `web-app` repository.
3. Choose `AStoryAdmin/web-app`, production branch `main`.
4. Build settings:
   - Framework preset: **Vite** (or "None")
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave empty
5. Environment variables (add them for **Production** and for **Preview**):

   | Name | Value |
   |---|---|
   | `NODE_VERSION` | `22` |
   | `VITE_SUPABASE_URL` | copy from `web-app/.env` on the founder's machine |
   | `VITE_SUPABASE_ANON_KEY` | copy from `web-app/.env` on the founder's machine |
   | `VITE_API_URL` | copy from `web-app/.env` (may be empty; the app works without it) |
   | `VITE_SITE_URL` | leave **empty** for the first deploy |

   The anon key is public by design (row-level security protects the data). Never add a Supabase **service role** key here.

6. **Save and Deploy.** The first build takes about two minutes. When it finishes, open the `*.pages.dev` address it gives you and check that the sign-in page shows the open book.

Single-page routing needs no setting: the project has no `404.html`, so Pages serves `index.html` for every path (`/archive`, `/family/…`, `/join/CODE`).

## 2. Point app.astoryapp.com at it

1. In the Pages project → **Custom domains** → **Set up a custom domain** → `app.astoryapp.com`.
2. If `astoryapp.com` is already on Cloudflare DNS, Cloudflare adds the record itself. If not, it shows one **CNAME** record (`app` → `<project>.pages.dev`): add exactly that at the domain's registrar.
3. Wait until the domain shows **Active** and `https://app.astoryapp.com` opens the sign-in page.

## 3. Tell the app and Supabase about the new address

Only after `https://app.astoryapp.com` answers:

1. Pages project → **Settings → Environment variables → Production**: set `VITE_SITE_URL` to `https://app.astoryapp.com`, then **Deployments → Retry deployment** on the latest one so the build picks it up.
2. Supabase dashboard (the same project as the phone app) → **Authentication → URL Configuration** → **Redirect URLs**: add
   - `https://app.astoryapp.com/**`
   - `https://*.pages.dev/**` (preview deploys)

   Do **not** change the **Site URL** if the phone app relies on it; only add redirect URLs.
3. Supabase → **Edge Functions → Secrets**: add `INVITE_JOIN_URL` = `https://app.astoryapp.com`. Invitation emails then say "Join in your browser →" and open the web app with the family code filled in.

## 4. Check it

On `https://app.astoryapp.com`, in a private window:

- `/sign-in` shows the open book; signing in with an existing phone-app account lands on Home.
- `/archive`, `/family`, `/book` load directly when typed into the address bar (not only by clicking).
- `/join/ABCD-EFGH` shows the join page, not a Cloudflare 404.
- "Forgot password" sends an email whose link opens `app.astoryapp.com`, not `localhost`.

## Afterwards

Every push to `main` deploys to production automatically; every other branch gets its own preview address. To roll back, open **Deployments** and choose **Rollback** on an earlier one.
