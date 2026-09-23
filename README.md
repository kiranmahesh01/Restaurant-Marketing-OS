# Current live setup — 23 September 2026

The original demo documentation below is historical. The app now supports Supabase login, durable restaurant workspaces and private media. External social/SMS/email/POS/ads/video delivery is still unavailable. See [VERIFICATION.md](VERIFICATION.md) for current results and limitations.

For local demo: Node 22, `npm ci`, then `DEMO_MODE=true npm run dev`.

For live operation, apply only `supabase/migrations/003_live_workspaces.sql` and `004_private_media.sql`; these are already applied to the new Supabase project `trmfoxibmlhvpczeegsx`. Earlier migrations are legacy scaffolding, not required for this persistence layer.

Configure Vercel team `kiran-c364` with `DEMO_MODE=false`, `NEXT_PUBLIC_SUPABASE_URL=https://trmfoxibmlhvpczeegsx.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` set to the final HTTPS origin. Keep server credentials out of GitHub. Create the initial app user in Supabase Authentication, then sign in and create the restaurant. Supabase dashboard accounts are separate from app users.

The server rejects conflicting concurrent edits with HTTP 409. Restaurant snapshots are limited to 8 MB. This is an initial small-team architecture, not a load-tested high-volume platform. Live mode never falls back to sample data. Demo reset/persona switching and simulated orders are disabled.

---

## Original demo documentation (historical)

# Restaurant Marketing OS

All-in-one **restaurant marketing command center**: AI content for every social channel, approval workflow, **Offers Hub** (QSR-style promo calendar), ads connectors, POS/order ingestion, loyalty CRM, reviews, analytics, notifications, audit logs, and multi-restaurant tenancy.

> **Status:** Working MVP in **demo mode** (in-memory store). No API keys required to explore. Supabase schema + env templates included for production.

---

## Quick start

```bash
cd restaurant-marketing-os
cp .env.example .env.local   # optional — demo works empty
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Launch demo dashboard**.

Sample restaurant: **Golden Gate Bistro** (Oakland, CA).

### Production deploy (Vercel + Supabase)

See **[DEPLOY.md](./DEPLOY.md)** for your `magic-ai2` / `hphqrqkuqhxzyjbgpbvh` checklist.

```bash
curl -s http://localhost:3000/api/health   # must be ok:true before client demos
```

### Multi-client (100–1000)

- **Demo stress test:** Settings → Seed +10/+25/+50/+100 (in-memory, capped).  
- **Live clients:** Supabase migrations + RLS + Auth — not optional for real restaurant data.

---

## What works in the MVP

| Area | Behavior |
|------|----------|
| **Overview** | Live KPIs, revenue chart, channel mix, pipelines |
| **Content Studio** | AI captions (IG/FB/TikTok/X/LinkedIn/GBP/email/SMS), variants, draft/submit |
| **Approvals** | Approve / reject / schedule / publish (in-app publish until social APIs live) |
| **Calendar** | Unified content + offers + campaigns |
| **Offers Hub** | Create/activate/pause; redemptions + attributed revenue |
| **Ads** | Campaign table + Meta/Google connector placeholders |
| **Orders / POS** | List + **Simulate POS order** (updates offers + loyalty) |
| **Customers & Loyalty** | Tiers, points, tags, add guest |
| **Reviews** | Manual + AI reply |
| **Integrations** | Demo connect/disconnect; env key checklist per provider |
| **Settings** | Onboard restaurant, switch tenant, reset demo |
| **Audit / Notifications** | Written on every mutation |

Integration actions that need third-party credentials return clear **placeholder** responses (no fake “success” on external publish).

---

## Stack

- **Frontend / API:** Next.js 14 App Router, TypeScript, Tailwind, Recharts, Lucide  
- **State (MVP):** Server in-memory store (`src/lib/store.ts`) — survives HMR via `globalThis`  
- **Production path:** Supabase Auth + Postgres + Storage (`supabase/migrations/001_init.sql`)  
- **AI:** Local brand-aware engine always on; set `OPENAI_API_KEY` for live model  

---

## Big-chain design (McD / Starbucks / HighLevel)

Independent groups rarely lack ideas — they lack a **single system of record** for promos and guests.

1. **Offers Hub = national promo calendar**  
   One code (`BRUNCH15`) with channels (app, POS, social, email), audience (new / loyalty / lapsed / vip), stack rules, window, and attribution. Content and POS both reference it.

2. **Loyalty is the CRM**  
   Points, tiers (bronze→platinum), tags (`winback`, `vip`), opt-in. POS ingest awards points and bumps LTV — same loop as Stars / MyMcD points.

3. **Content with guardrails**  
   Brand voice on the restaurant record → AI generation → human approval → schedule/publish. Multi-unit safe.

4. **Connectors at the edge**  
   Social, ads, video render, POS, SMS are pluggable. UI shows connection status + required env vars.

5. **Multi-tenant from day one**  
   Every row is `restaurant_id`-scoped; SQL RLS policies ship in the migration.

---

## Project structure

```
src/
  app/
    (app)/          # authenticated-style dashboard shell
      dashboard/ content/ approvals/ calendar/ offers/
      ads/ orders/ customers/ reviews/ integrations/
      audit/ settings/ docs/
    api/            # server routes
    page.tsx        # marketing landing
  components/       # shell, sidebar, UI kit
  lib/
    store.ts        # demo persistence + domain actions
    demo-data.ts
    ai-content.ts   # local + OpenAI generator
    types.ts
supabase/migrations/001_init.sql
.env.example
```

---

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dashboard` | Full restaurant-scoped bundle |
| GET/POST | `/api/content` | List / create / approve / schedule / publish |
| POST | `/api/ai/generate` | Caption generation |
| GET/POST | `/api/offers` | Offers CRUD + activate/pause |
| GET/POST | `/api/customers` | CRM |
| GET/POST | `/api/orders` | List + POS ingest |
| GET/POST | `/api/reviews` | Reply (+ AI) |
| GET/POST | `/api/integrations` | Connect + connector tests |
| GET/POST | `/api/notifications` | Mark read |
| GET/POST | `/api/restaurants` | Onboard + switch tenant |
| POST | `/api/demo/reset` | Factory reset demo data |

---

## Environment variables

See **`.env.example`** for the full list. Groups:

- Supabase URL / anon / service role / media bucket  
- `OPENAI_API_KEY` (optional)  
- Meta / Instagram / Facebook / Google Ads / TikTok  
- Creatomate / Shotstack  
- Toast / Square / Clover  
- Twilio / Mailchimp  
- `CRON_SECRET` for scheduled publish workers  

---

## Supabase go-live checklist

1. Create a Supabase project.  
2. Run `supabase/migrations/001_init.sql` in the SQL editor.  
3. Create a Storage bucket `media`.  
4. Set env vars; install `@supabase/supabase-js`.  
5. Replace store mutations with Supabase queries (table names match domain types).  
6. Add Auth (email magic link or Google); gate `(app)` routes with middleware.  
7. Implement OAuth token storage on `integrations.config` (encrypt at rest).  
8. Point POS webhooks to `POST /api/orders`.  
9. Add a cron route that selects `content_items` where `status=scheduled` and `scheduled_at <= now()` and calls publish adapters.

---

## Publish / video / ads placeholders

- **Social publish:** `POST /api/content` action `publish` marks row published and returns a demo note. Real path: Meta Graph (IG/FB), TikTok Content Posting API.  
- **Video:** `POST /api/integrations` `test_video_render` documents Creatomate/Shotstack.  
- **Ads:** campaign metrics are seeded; Marketing API sync is stubbed with env checklist.  

---

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # start production server
npm run lint     # eslint
```

---

## License

MVP scaffold for the project owner — modify freely.
