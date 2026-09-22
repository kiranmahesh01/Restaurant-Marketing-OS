# Verification report — 22 September 2026

**Verdict: the demo builds and core sample workflows run, but not everything works as a production system.** Application source and dependency versions were preserved from the supplied ZIP. This report and reproducible checks were added; the issues below remain unfixed.

## Results

- Clean dependency installation completed (install scripts disabled).
- `npm run build`: passed compilation, lint, TypeScript checks and static page generation.
- `npm run lint`: passed with no warnings or errors.
- Production server started successfully on loopback port 43827.
- 18 page routes returned HTTP 200.
- 16 read API routes returned HTTP 200.
- Ten demo workflow checks passed: local caption generation; content create/approve/schedule/publish; offers create/activate/pause; customer creation plus order loyalty attribution; AI review reply; campaign creation; demo blast creation/send; media create/delete; support ticket creation; scheduled publish worker.
- Viewer content creation was correctly rejected.
- Three permission tests failed. Overall: **45 passed, 3 failed**. These are smoke checks, not exhaustive coverage.
- Browser inspection confirmed the landing page, hydrated dashboard, and multiple module screens rendered. No captured browser console errors during the inspected navigation. Not every button, device size or error state was exercised.

## Confirmed problems

1. **Viewer role is not consistently read-only.** After selecting the viewer persona, POST `/api/customers` and POST `/api/orders` return 200 and create records. Expected 403. See those route files.
2. **Approval can be bypassed.** The marketer persona cannot use the dedicated approve action, but POST `/api/content` with action `update` and patch `{ "status": "approved" }` returns 200. Validation is tied to the action name instead of the requested state transition.
3. **Dependency audit fails.** The checked lockfile reports five affected packages: four high and one critical. Packages are `next`, `postcss`, `glob`, `eslint-config-next` and `@next/eslint-plugin-next`. These are package audit classifications; exploitability depends on runtime/configuration. The audit is saved in `verification/dependency-audit.json`. Dependency migration and retesting are needed before deployment.

## Production limitations found in source review

- There is no real sign-in/session boundary. `/api/session` lets callers select a demo user, and active user/restaurant are global server state shared by visitors. Persona switching is a demo, not authentication.
- `src/lib/store.ts` persists everything in process memory. Restarting loses edits; separate instances do not share data. Supabase helpers and migrations exist, but normal domain mutations do not write to Supabase. Adding keys or setting `DEMO_MODE=false` does not implement persistence.
- Several update methods find records by ID without verifying restaurant membership. Creation methods can accept a caller-supplied restaurant ID. SQL RLS cannot protect operations that only use the memory store.
- Social publishing, scheduled publishing and SMS/email sends mark in-app records; they do not deliver to external platforms. Ads, video and POS integration flows contain placeholders. Review replies are stored in-app.
- Overview analytics are seeded data; order ingestion changes orders/loyalty/offer attribution but does not recompute the analytics bundle.
- The scheduled publishing endpoint is unprotected when `CRON_SECRET` is absent. The demo reset endpoint is also publicly callable.
- A successful `/api/health` response is not evidence that authentication, persistence or delivery integrations work.

## Not verified

Live OpenAI/Anthropic calls, Supabase connectivity/migrations/RLS execution, actual social publishing, SMS/email delivery, POS webhooks, video rendering, production hosting, load/concurrency, all validation cases and all interactive UI states. No credentials were supplied or added, and no external messages were sent.

## Reproduce

Use only a disposable local instance: the script resets its demo data and performs mutations.

```sh
npm ci --ignore-scripts
npm run build
npm run lint
npm run start -- --hostname 127.0.0.1 --port 43827
# In another terminal:
node verification/verify.mjs
npm audit
```

The verification script exits nonzero while the three documented permission failures remain. `verification/results.json` contains the recorded outcomes. Do not run it against a shared environment. Before serving real customers, implement per-user authentication and tenant authorization, durable persistence, consistent role/state validation, actual provider adapters, and update vulnerable dependencies; then repeat testing.
