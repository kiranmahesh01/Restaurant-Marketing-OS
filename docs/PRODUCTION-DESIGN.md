# Live application design

Approved direction: Supabase and a new Vercel project under kiran-c364. New authorized Supabase project: trmfoxibmlhvpczeegsx.

Use verified Supabase user sessions and per-restaurant memberships. The existing domain workflow is retained, but each request receives an isolated restaurant snapshot instead of shared process state. Business data is stored in new rmos_ prefixed Postgres tables so existing tables are unaffected. A version-checked atomic write rejects concurrent conflicting edits with HTTP 409; it never silently overwrites another user's change. This is an initial small-team architecture, not a claim of large-scale throughput. Database clients can read only their memberships; business writes are available only to the authenticated application server. No service key reaches the browser.

Empty restaurants are provisioned transactionally with an owner membership. Demo mode is explicit and separate. Live mode disables persona switching, seeding and reset. Role restrictions, immutable IDs, tenant references, state transitions and consent are checked server-side. Overview revenue is computed from recorded orders. Integration actions remain unavailable unless their real adapter and credentials exist; an unavailable integration never marks a record delivered.

Validation: build/lint/type checks, domain permission and tenant tests, PostgreSQL migration/RLS tests, API smoke tests, then hosted login/persistence checks after access is available. Third-party delivery requires named providers, approved credentials and a user-approved destination; deployment alone is not proof of delivery.
