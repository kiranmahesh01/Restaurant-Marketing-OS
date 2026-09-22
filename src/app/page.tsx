import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  Sparkles,
  Tag,
  Users,
  BarChart3,
  Plug,
  ShieldCheck,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid-fade">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Restaurant Marketing OS</p>
            <p className="text-[11px] text-ink-500">Content · Offers · CRM · POS · Ads</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-medium text-white hover:bg-ink-800"
        >
          Open dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Working MVP · Demo mode · Multi-tenant ready
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            One command center for restaurant marketing — the way big chains run offers.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-600">
            Inspired by how McDonald’s and Starbucks keep national LTOs, loyalty, POS, and social in
            sync: create content with AI, approve it, schedule across channels, manage offers in one
            hub, pull orders, grow CRM tiers, and track ROAS — from a single web dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700"
            >
              Client portal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Admin HQ
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              Docs
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            Inside the app: use the header persona menu to switch Admin / Owner / Marketer / Viewer —
            that is how clients see their restaurant vs how you run the platform.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "AI Content Studio",
              body: "Instagram, Facebook, TikTok, SMS, email — channel-native captions, hashtags, CTAs, and variants. Works offline in demo; plug in OpenAI when ready.",
            },
            {
              icon: Tag,
              title: "Offers Hub (QSR-style)",
              body: "Central offer ledger like enterprise promo calendars: codes, channels, audiences, stack rules, redemptions, and attributed revenue.",
            },
            {
              icon: Users,
              title: "CRM & Loyalty",
              body: "Tiers, points, win-back tags, birthday hooks — the same levers Starbucks Rewards and MyMcD use, scaled for independent groups.",
            },
            {
              icon: BarChart3,
              title: "Analytics & Ads",
              body: "Revenue, ticket, channel mix, campaign ROAS. Meta + Google connector scaffolds with clear env requirements.",
            },
            {
              icon: Plug,
              title: "POS & Social connectors",
              body: "Toast, Square, Clover, Creatomate/Shotstack, Meta Graph — status UI + API stubs until credentials are connected.",
            },
            {
              icon: ShieldCheck,
              title: "Approvals & audit",
              body: "Draft → approve → schedule → publish workflow with notifications and full audit trail for multi-location teams.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-ink-200 bg-ink-900 p-8 text-white shadow-soft">
          <h2 className="text-xl font-semibold">Stack</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Next.js 14 App Router + server API routes · in-memory demo store (swap to Supabase) ·
            Tailwind · Recharts. Supabase schema/migrations and env templates included for auth,
            Postgres, and storage when you leave demo mode.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Next.js", "Supabase-ready", "AI captions", "Offers hub", "POS ingest", "Multi-tenant RLS"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/10"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
