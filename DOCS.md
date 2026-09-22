# Restaurant Marketing OS — Product & Engineering Guide

## 1. Vision

Give independent and multi-unit restaurants the same **operating system** large chains use internally:

- One place to author **offers**
- One **guest graph** (loyalty CRM)
- One **content factory** with approvals
- Connectors out to **social, ads, POS, SMS**
- Analytics that answer “what worked?” every week

This MVP is a runnable scaffold of that system.

---

## 2. User journeys

### Marketer — create a brunch push

1. **Offers Hub** → ensure `BRUNCH15` is active on app + POS + social.  
2. **Content Studio** → goal=promo, platform=multi, offer code=BRUNCH15 → Generate.  
3. Edit caption → **Submit** for approval.  
4. Owner **Approves** → **Schedule** or **Publish**.  
5. **Calendar** shows the post alongside the offer window.  
6. Guests redeem → **Orders** ingest bumps redemption count + guest points.

### Owner — brand safety

1. Notification: content awaiting approval.  
2. Approvals queue → reject with reason or approve.  
3. Audit log records actor + action.

### Ops — POS

1. Toast/Square webhook (or demo button) → `POST /api/orders`.  
2. Offer code on check → attribution.  
3. Customer id → loyalty update.

---

## 3. Domain model (simplified)

```
Org
 └─ Restaurant (tenant boundary)
     ├─ ContentItem (platforms[], status, offerId?)
     ├─ Offer (code, channels[], audience, redemptions)
     ├─ Customer (tier, points, tags[])
     ├─ Order (posSource, offerCode?, customerId?)
     ├─ Review
     ├─ Campaign / AdAccount
     ├─ Integration (provider, status, envKeys)
     ├─ Notification
     └─ AuditLog
```

All queries in the app are **restaurant-scoped**. Switching restaurants in Settings changes `activeRestaurantId`.

---

## 4. AI content engine

File: `src/lib/ai-content.ts`

- **Demo engine:** deterministic, brand-aware templates per goal × platform (works offline).  
- **OpenAI path:** if `OPENAI_API_KEY` set, chat completions with JSON response; falls back to demo on error.  
- Outputs: title, body, hashtags, CTA, per-channel variants, alt hooks.

Goals mirror real restaurant marketing workstreams: promo, LTO launch, loyalty, event, BTS, stories, ad primary, email, SMS, UGC reply.

---

## 5. Integration matrix

| Provider | Category | MVP | Production next step |
|----------|----------|-----|----------------------|
| Instagram/Facebook | social | status UI | Meta Graph publish |
| TikTok | social | status UI | Content Posting API |
| Meta Ads | ads | metrics seed | Marketing API sync |
| Google Ads | ads | metrics seed | Google Ads API |
| Creatomate/Shotstack | video | test stub | render job + Storage |
| Toast/Square/Clover | pos | demo ingest | OAuth + webhooks |
| OpenAI | ai | optional live | already wired |
| Twilio | comms | stub | SMS send on offer blast |

---

## 6. Security notes (when leaving demo)

- Enable Supabase RLS (policies included).  
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.  
- Store OAuth tokens encrypted; rotate Meta long-lived tokens.  
- Protect cron with `CRON_SECRET`.  
- Respect marketing opt-out on SMS/email.  
- PCI: do not store raw card data — POS handles payments.

---

## 7. Suggested roadmap after MVP

**Phase 2**

- Real Supabase persistence + Auth  
- Media upload to Storage + attach to content  
- Meta IG/FB publish for approved posts  

**Phase 3**

- POS webhooks + menu mapping for offer validation  
- Offer blast composer (SMS/email segments)  
- Creatomate template renders for Reels  

**Phase 4**

- Multi-location rollups for org owners  
- A/B caption tests  
- Automated review routing + escalation SLAs  

---

## 8. Why this is not “just a social scheduler”

Social schedulers stop at posts. Chains win on **closed-loop commerce**:

`Offer → Content → Channel → Order → Loyalty → Next offer`

Restaurant Marketing OS is built around that loop from the first schema.
