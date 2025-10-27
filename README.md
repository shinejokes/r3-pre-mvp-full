# R3 pre‑MVP (Full, with unique hits & share generation)

## 0) What you need
- Supabase Project URL, publishable (anon) key, service_role key
- Node.js LTS

## 1) Setup env
Copy `.env.example` → `.env.local` and fill values:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url (https://xxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
R3_APP_BASE_URL=http://localhost:3000
```

## 2) Create tables
Open Supabase → SQL Editor → paste `supabase/schema.sql` → RUN.
Then run migration `supabase/migrations/2025-unique-hit.sql` too.

## 3) Run
```
npm install
npm run dev
```
Go to http://localhost:3000

## 4) Flow
- Home: register a message (YouTube URL) → returns messageId + first share link
- Click share link: counts unique hit (per browser/device) and redirects to origin
- Dashboard /m/[messageId]: see counts, create your own share link

## Files
- `pages/index.tsx` — register form
- `pages/[ref].tsx` — redirect + hit record (unique by cookie/fingerprint)
- `pages/api/message.ts` — create message + first share
- `pages/api/share.ts` — create personal share for any visitor
- `pages/m/[messageId].tsx` — dashboard
- `pages/api/health.ts` — diagnostics (env/DB check)
