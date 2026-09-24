# Verification — 23 September 2026

Core fixes are tested and deployed at https://restaurant-marketing-os-gilt.vercel.app. Authenticated end-to-end checks remain pending initial app user setup.

- Production build, TypeScript and ESLint pass.
- Dependency audit: zero reported vulnerabilities.
- 14 regression tests pass, including actual PostgreSQL migration execution, tenant read isolation, blocked direct database writes, version conflicts, role restrictions, input validation, consent defaults and order deduplication.
- All 48 demo API smoke checks pass, including the three original permission failures.
- Live mode without configuration fails closed: dashboard redirects to login, private APIs return configuration errors, reset/seeding return 404, and cross-origin writes return 403.
- New Supabase project trmfoxibmlhvpczeegsx is healthy. Migrations 003 and 004 were applied through its SQL editor successfully.
- Vercel production build succeeded in team kiran-c364. Production health returns HTTP 200, demoMode false, database connected. The live login page renders, and anonymous dashboard access redirects to login.
- Supabase site URL and the exact /auth/callback redirect are configured for the production address. Server credentials are stored only in Vercel environment settings.

The app now uses verified Supabase sessions, per-restaurant membership checks, isolated request state, durable Postgres snapshots with optimistic concurrency, and private media storage. Updated dependencies, validation, approval rules, consent defaults, manual order entry and real order-derived analytics are included.

Remaining: initial app user setup and hosted sign-in/persistence/media tests; selected social, SMS/email, POS, review, ads and video provider adapters and credentials. Unimplemented external delivery is disabled in live mode. No real messages or posts have been sent.

Persistence currently uses an 8 MB maximum snapshot per restaurant, intended for initial small-team use. High-volume ingestion needs normalized transactional storage and load testing. Local checks do not establish production readiness for every integration.

Run npm run test, npm run lint, npm run build and npm audit. For the destructive local-only demo smoke suite, start with DEMO_MODE=true on port 43829 and run VERIFY_BASE_URL=http://127.0.0.1:43829 node verification/verify.mjs. Never run it against real customer data.
