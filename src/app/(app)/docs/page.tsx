"use client";

import { Card, PageHeader, Badge } from "@/components/ui";
import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl prose-sm">
      <PageHeader
        title="Documentation"
        subtitle="Architecture, setup, big-chain patterns, and how every module works"
      />

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">What you have</h2>
        <p>
          <strong>Restaurant Marketing OS</strong> is a working MVP dashboard that unifies content,
          approvals, offers, CRM/loyalty, POS orders, reviews, ads, integrations, notifications, and
          audit logs — multi-restaurant ready from day one.
        </p>
        <p>
          It runs in <Badge tone="brand">demo mode</Badge> with an in-memory store so everything works
          without API keys. Swap to Supabase using the included SQL migration when you deploy.
        </p>
      </Card>

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">Stack</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Next.js 14 (App Router) + TypeScript + Tailwind</li>
          <li>Server API routes under <code className="rounded bg-ink-100 px-1">/api/*</code></li>
          <li>Demo store in memory (server global) → Supabase Postgres + Auth + Storage ready</li>
          <li>Local AI caption engine + optional OpenAI</li>
          <li>Recharts analytics</li>
        </ul>
      </Card>

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">Quick start</h2>
        <pre className="overflow-x-auto rounded-xl bg-ink-900 p-4 text-[12px] text-ink-100">{`cd restaurant-marketing-os
cp .env.example .env.local
npm install
npm run dev
# open http://localhost:3000`}</pre>
        <p>
          Full README lives at project root. SQL schema:{" "}
          <code className="rounded bg-ink-100 px-1">supabase/migrations/001_init.sql</code>
        </p>
      </Card>

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">Modules</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link href="/dashboard" className="font-medium text-brand-700 hover:underline">
              Overview
            </Link>{" "}
            — KPIs, revenue charts, offer + content pipeline, alerts.
          </li>
          <li>
            <Link href="/content" className="font-medium text-brand-700 hover:underline">
              Content Studio
            </Link>{" "}
            — AI for IG/FB/TikTok/SMS/email; save draft or submit approval.
          </li>
          <li>
            <Link href="/approvals" className="font-medium text-brand-700 hover:underline">
              Approvals
            </Link>{" "}
            — approve/reject/schedule/publish (publish is in-app until social APIs connected).
          </li>
          <li>
            <Link href="/offers" className="font-medium text-brand-700 hover:underline">
              Offers Hub
            </Link>{" "}
            — central promo ledger with codes, channels, audiences, redemptions.
          </li>
          <li>
            <Link href="/customers" className="font-medium text-brand-700 hover:underline">
              CRM & Loyalty
            </Link>{" "}
            — tiers, points, tags, opt-in (Starbucks/McD/HighLevel patterns).
          </li>
          <li>
            <Link href="/orders" className="font-medium text-brand-700 hover:underline">
              Orders/POS
            </Link>{" "}
            — ingest simulator; increments offer + loyalty on write.
          </li>
          <li>
            <Link href="/reviews" className="font-medium text-brand-700 hover:underline">
              Reviews
            </Link>{" "}
            — reply + AI assist.
          </li>
          <li>
            <Link href="/integrations" className="font-medium text-brand-700 hover:underline">
              Integrations
            </Link>{" "}
            — Meta, Google, TikTok, Toast/Square/Clover, Creatomate/Shotstack, Twilio, OpenAI.
          </li>
        </ul>
      </Card>

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">How big chains do it (and how we mirror it)</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>One offer ID everywhere.</strong> National LTO is authored once, validated on POS
            menu maps, then pushed to app, kiosk, OOH, and social. Our Offers Hub is that ledger;
            content can attach <code className="rounded bg-ink-100 px-1">offerId</code>.
          </li>
          <li>
            <strong>Loyalty = CRM.</strong> Spend → points → tiers → personalized deals. POS ingest
            awards points and attributes offer revenue.
          </li>
          <li>
            <strong>Local flexibility, brand guardrails.</strong> Brand voice + approval queue lets
            multi-unit marketers move fast without rogue posts.
          </li>
          <li>
            <strong>Always-on measurement.</strong> Channel mix, ROAS, redemptions — same questions a
            brand marketing OS answers every Monday.
          </li>
        </ol>
      </Card>

      <Card className="mb-4 p-6 space-y-3 text-sm text-ink-700 leading-relaxed">
        <h2 className="text-base font-semibold text-ink-900">Going to production</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Create Supabase project; run migration SQL; set URL + anon/service keys.</li>
          <li>Replace <code className="rounded bg-ink-100 px-1">src/lib/store.ts</code> calls with Supabase client queries (schema already matches).</li>
          <li>Enable Supabase Auth; protect routes with session middleware.</li>
          <li>Add OAuth for Meta/Google/TikTok; store tokens encrypted per restaurant.</li>
          <li>Wire POS webhooks to <code className="rounded bg-ink-100 px-1">POST /api/orders</code>.</li>
          <li>Optional: Creatomate/Shotstack render job after media upload to Storage.</li>
          <li>Cron: scheduled publish worker (Vercel cron or Supabase edge functions).</li>
        </ol>
      </Card>

      <Card className="p-6 space-y-2 text-sm text-ink-700">
        <h2 className="text-base font-semibold text-ink-900">API map</h2>
        <ul className="font-mono text-[11px] space-y-1 text-ink-600">
          <li>GET /api/dashboard</li>
          <li>GET|POST /api/content</li>
          <li>POST /api/ai/generate</li>
          <li>GET|POST /api/offers</li>
          <li>GET|POST /api/customers</li>
          <li>GET|POST /api/orders</li>
          <li>GET|POST /api/reviews</li>
          <li>GET|POST /api/integrations</li>
          <li>GET|POST /api/notifications</li>
          <li>GET|POST /api/restaurants</li>
          <li>POST /api/demo/reset</li>
        </ul>
      </Card>
    </div>
  );
}
