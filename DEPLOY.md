# Deployment

Use the current live setup at the top of README.md. Vercel team: kiran-c364. Supabase project: trmfoxibmlhvpczeegsx. Migrations 003 and 004 were applied on 23 September 2026. Earlier migrations are legacy scaffolding.

Set DEMO_MODE=false, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_APP_URL in Vercel. Use Node 22. Create an app user in Supabase Authentication. Set Auth Site URL to the deployed origin and allow /auth/callback on that origin.

Verify hosted login, onboarding, persistence across sessions, uploads, sign-out and tenant isolation before accepting customers. A green health check proves database connectivity only; external delivery providers are still unimplemented.
