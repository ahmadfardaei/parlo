# Parlo Italiano

An installable web app (PWA) for learning Italian from A1 to B2: 40 units, 3,174 words, 320 verbs (6 tenses each) and 416 phrases, with spaced repetition (10 min · 1 day · 3 days · 7 days · I know this), a starred personal deck, quizzes, offline support and accounts that sync across devices.

- **Front end:** plain JavaScript + Vite, `vite-plugin-pwa` for the service worker and manifest.
- **Accounts & sync:** Supabase (Postgres + Auth: email/password, email links, Google).
- **Hosting:** GitHub Pages, deployed by `.github/workflows/deploy.yml` on every push to `main`.
- **Course content:** `src/data/course.json` (bundled with the app and cached for offline use).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key (optional)
npm run dev
```

Without Supabase settings the app runs in device-only mode: everything works, progress stays in the browser.

## One-time setup

### 1. Supabase (database + login)
1. Create a free project at <https://supabase.com> (pick the EU region closest to you).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and click **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
4. **Authentication → URL Configuration**:
   - **Site URL:** `https://<your-github-username>.github.io/<repo-name>/`
   - **Redirect URLs:** add the same URL, plus `http://localhost:5173/` for local development.

### 2. Google sign-in (optional)
1. <https://console.cloud.google.com> → create a project → **APIs & Services → OAuth consent screen**: External, app name "Parlo Italiano", your email.
2. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   - **Authorized redirect URI:** `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client secret** into Supabase → **Authentication → Providers → Google**, and enable it.
4. While the consent screen is in *Testing*, add your friends' Gmail addresses as test users (or click **Publish app**).

### 3. GitHub Pages
1. Push this folder to a GitHub repository.
2. **Settings → Secrets and variables → Actions → Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Settings → Pages → Source: GitHub Actions**.
4. Push to `main` (or run the workflow by hand). The site appears at `https://<username>.github.io/<repo-name>/`.

The anon key is designed to be public; each person can only read and write their own rows thanks to the row-level security policies in `supabase/schema.sql`.

## Data model

| Table | What it stores |
|---|---|
| `auth.users` | Accounts (managed by Supabase Auth) |
| `profiles` | Name, new cards per session, card direction |
| `progress` | One row per user per unit: `items` maps each word/verb/phrase id to `{d: due time, iv: last interval, k: known, s: starred, t: last change}` |

Progress is saved on the device first and synced in the background; changes made offline are sent when the connection returns. When two devices edit the same item, the most recent change wins.
