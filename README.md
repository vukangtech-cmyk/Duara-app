# THE CIRCLE (Duara)

THE CIRCLE ni social network ya Kiswahili iliyojengwa kwa React/Vite na Supabase. Toleo hili lina Supabase Auth, Postgres, Row Level Security, Storage, Realtime, profiles, posts, likes, comments, follows, search, notifications, media uploads na profile editing.

## Architecture

- `frontend/` — React + Vite UI.
- `frontend/src/lib/supabase.js` — Supabase browser client.
- `frontend/src/api/api.js` — Auth, database, storage na realtime helpers.
- `supabase/migrations/` — production database migration.
- `backend/duara/` — legacy PHP API iliyohifadhiwa kwa compatibility; frontend mpya haitumii tena PHP.

## Supabase project

Migration `supabase/migrations/20260915114500_the_circle_foundation.sql` imewekwa kwenye project ya **Duara-app**. Imeunda:

- `profiles`, `posts`, `follows`, `likes`, `comments`, `notifications`
- Auth trigger inayounda profile baada ya signup
- RLS policies kwa kila table
- Storage buckets `avatars` na `post-media`
- Storage policies za user-owned uploads
- Database triggers za notifications
- Realtime publication kwa posts, comments na notifications

## Local setup

```bash
cd frontend
npm install
cp ../.env.example .env.local
```

Kisha badilisha `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Run:

```bash
npm run dev
```

## Auth

Signup mpya hutumia email na password. Supabase inaweza kuhitaji email confirmation kulingana na Auth settings. Baada ya confirmation, mtumiaji anaingia na profile yake huundwa automatically kupitia database trigger.

Kwa production, ndani ya Supabase Auth settings weka:

1. Site URL ya domain ya frontend.
2. Redirect URLs za local development na production.
3. Email provider/SMTP kama hutaki kutumia default development email.
4. Password policy ya angalau herufi 8.

## Realtime

Frontend hu-subscribe kwenye `posts`, `comments` na `notifications`. Post mpya, comment au notification inapowasili, feed inajirefresh bila reload ya browser. Supabase Realtime publication na replica identity zimewekwa kwenye migration.

## Production launch checklist

- Deploy `frontend/dist` kwenye Vercel, Netlify au static host.
- Weka `VITE_SUPABASE_URL` na `VITE_SUPABASE_PUBLISHABLE_KEY` kwenye deployment environment.
- Weka production Site URL na Redirect URLs kwenye Supabase Auth.
- Hakikisha migration imeonekana kwenye Supabase na RLS iko enabled.
- Weka email SMTP ya production.
- Washa image/video size limits na moderation kabla ya public growth.
- Tumia publishable/anon key tu frontend; usiwahi kuweka service-role key kwenye browser.

## Current features

Signup/login, persistent sessions, profile editing, public feed, real-time posts/comments/notifications, likes, comments, follows, user search, image/video upload kwa Supabase Storage, responsive layout na mobile-friendly navigation.

## Next hardening

Kabla ya scale kubwa, ongeza pagination/infinite scroll, rate limits/abuse protection, content moderation, image transformations, verified email requirement, account recovery UX, blocking/reporting, analytics na automated end-to-end tests.
