# Deploy Restaurant Marketing OS (Vercel + Supabase)

Your targets (from you):

- **Vercel team/project:** https://vercel.com/magic-ai2  
- **Supabase project:** https://supabase.com/dashboard/project/hphqrqkuqhxzyjbgpbvh  
  - API host will look like: `https://hphqrqkuqhxzyjbgpbvh.supabase.co`

I **cannot** log into your Vercel or Supabase accounts. You paste keys into Vercel env (or share **anon** + URL here for wiring tests — **never** paste the **service_role** key in chat if this log is retained; prefer Vercel dashboard only).

---

## Why this matters for 100–1000 restaurant clients

| Mode | Good for | Not good for |
|------|----------|--------------|
| **Demo store (default)** | Sales demos, UI QA, Campaign Drop | Real client data, multi-user, uptime |
| **Supabase + RLS** | 100–1000 tenants, audit, backups | — |

Restaurant marketing/CRM/POS-adjacent data **must** be Postgres with row-level security. The seed button can create hundreds of *demo* restaurants for UI stress tests; live clients go through Supabase.

---

## 1. Supabase setup (project `hphqrqkuqhxzyjbgpbvh`)

1. Open **SQL Editor** → New query.  
2. Paste and run, in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_media_blasts.sql`
3. **Storage** → New bucket → name: `media` (public read OK for MVP, or signed URLs later).  
4. **Project Settings → API** copy:
   - Project URL  
   - `anon` `public` key  
   - `service_role` key (server only)

Optional seed org (SQL):

```sql
insert into public.orgs (id, name) values
  ('00000000-0000-4000-8000-000000000001', 'Magic AI Demo Org')
on conflict do nothing;
```

---

## 2. Vercel setup (`magic-ai2`)

### Option A — CLI (from this repo)

```bash
cd restaurant-marketing-os
npm i -g vercel
vercel login
vercel link   # select magic-ai2 team/project
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEMO_MODE
# values:
# NEXT_PUBLIC_SUPABASE_URL=https://hphqrqkuqhxzyjbgpbvh.supabase.co
# DEMO_MODE=true   # keep true until API routes read Supabase
vercel --prod
```

### Option B — Dashboard

1. Import Git repo or deploy CLI.  
2. **Settings → Environment Variables** (Production + Preview):

```
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.vercel.app
DEMO_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://hphqrqkuqhxzyjbgpbvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=           # optional
CRON_SECRET=long-random   # protect /api/jobs/scheduled-publish + seed
```

3. Redeploy.

---

## 3. Verify (do this every release)

```bash
curl -s https://YOUR_DOMAIN.vercel.app/api/health | jq
curl -s https://YOUR_DOMAIN.vercel.app/api/dashboard | jq '.restaurant.name'
curl -s -X POST https://YOUR_DOMAIN.vercel.app/api/ai/generate \
  -H 'content-type: application/json' \
  -d '{"topic":"lunch special","goal":"promo","platform":"instagram"}'
```

**Health must show:**

- `ok: true`
- `checks.app_process.ok`
- With Supabase keys: `supabase_env.ok`
- After migrations: `supabase_connectivity.ok` (or clear “run migrations” message)

---

## 4. What still needs code before DEMO_MODE=false

The UI + API work today on the **in-memory store**. Supabase clients and migrations are ready. To put **real** multi-client data on Supabase:

1. Replace `src/lib/store.ts` mutations with Supabase queries (tables already match).  
2. Add Auth middleware (Supabase Auth).  
3. Map `restaurant_members` for each client user.  
4. Only then set `DEMO_MODE=false`.

Until that swap, **keep DEMO_MODE=true** even on Vercel so the product still runs for demos. Health will warn that Supabase is configured but app data is still demo memory — that is expected and honest.

---

## 5. Client-facing rule (non-negotiable)

- Never tell a restaurant “published to Instagram” unless Meta Graph returned success.  
- Never store card data.  
- Always restaurant-scope queries (`restaurant_id`).  
- Opt-out honored on SMS/email blasts.  
- Audit log every money-adjacent action (offers, blasts, publish).

---

## 6. Local verify (this sandbox)

```bash
cd restaurant-marketing-os
npm run dev -- -H 0.0.0.0 -p 3000
curl -s http://localhost:3000/api/health
open http://localhost:3000/dashboard
```

Settings → **Seed +25 / +100** to simulate multi-client switching.  
Campaign Drop → launch a full LTO.  
Content Studio → attach media.  
SMS & Email → segment blast (demo send).
