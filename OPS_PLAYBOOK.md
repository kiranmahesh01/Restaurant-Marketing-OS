# Restaurant Marketing OS — Ops Playbook

How **you (admin)** and **restaurant clients** use the system — the way multi-unit brands and agencies separate duties.

---

## Who sees what

| Persona (header menu) | Portal | Sees | Can do |
|----------------------|--------|------|--------|
| **Sam Admin** | Admin HQ | All restaurants, all tickets, org stats, launch checklist | Everything + resolve tickets + seed tenants |
| **Alex Rivera** (Owner) | Client | Only their restaurant | Approve content, offers, settings, support tickets |
| **Jordan Lee** (Marketer) | Client | Their restaurant | Campaign Drop, content, blasts, offers — **not** final approve |
| **Casey View** (Viewer) | Client | Their restaurant | **Read-only** — mutations return 403 |

**How to switch:** App header → click your name → pick persona.  
This is the demo stand-in for real login (Supabase Auth later).

---

## URLs

| View | URL |
|------|-----|
| Landing | http://localhost:3000 |
| **Client portal** | http://localhost:3000/dashboard |
| **Admin HQ** | http://localhost:3000/admin |
| Client support | http://localhost:3000/support |
| Health | http://localhost:3000/api/health |
| AI status | http://localhost:3000/api/ai/status |
| Go-live checklist | http://localhost:3000/api/ops/checklist |

---

## Daily agent roles (team model)

Treat these as internal “agents” with clear jobs:

1. **Platform Admin** — keys, Vercel/Supabase, multi-tenant, ticket SLA, integrations  
2. **Owner** — brand voice, approvals, budget, final yes/no  
3. **Marketer** — Campaign Drop, captions, offers, SMS/email  
4. **Manager** — reviews, POS, calendar dayparts  
5. **Viewer** — partners/investors, numbers only  

Big companies win because **small problems have an owner**. Support tickets + checklist enforce that.

---

## Client journey (what they experience)

1. Log in (persona: Owner/Marketer) → **Client portal** badge  
2. Overview KPIs for **their** restaurant only  
3. Campaign Drop → create LTO + multi-channel content  
4. Owner Approvals → schedule/publish  
5. Offers live on POS/app conceptually; Orders simulate redemption  
6. Something wrong → **Support** ticket → Admin sees it in Admin HQ  

## Admin journey (what you experience)

1. Persona: **Sam Admin** → **Admin HQ**  
2. Portfolio of restaurants (seed 25–100 for agency demo)  
3. Open tickets → resolve  
4. Launch checklist score for active restaurant  
5. Settings → AI keys health, Supabase path, tenant seed  

---

## Debug checklist (run anytime)

```bash
curl -s http://localhost:3000/api/health | jq .ok
curl -s http://localhost:3000/api/ai/status | jq .activeProvider
curl -s http://localhost:3000/api/ops/checklist | jq .score
curl -s -X POST http://localhost:3000/api/session \
  -H 'content-type: application/json' \
  -d '{"action":"switch_user","userId":"user_platform_admin"}' | jq .bundle.portal
```

Expected: health ok, AI responds (demo or live), checklist score, admin portal switch works, viewer cannot create offers.

---

## Still honest limits (do not oversell clients)

- Demo AI until OpenAI/Anthropic keys are set  
- Social publish is in-app until Meta OAuth  
- Blasts log demo sends until Twilio/Mailchimp  
- Real 100–1000 clients need Supabase + Auth (see DEPLOY.md)  

Restaurant businesses trust systems that **don’t lie about external success**.
