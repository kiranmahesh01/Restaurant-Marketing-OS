import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getSupabaseConfig, probeSupabase } from "@/lib/supabase/client";
import { getAiStatus } from "@/lib/ai-content";

export const dynamic = "force-dynamic";

/**
 * Production readiness probe — use before client demos / after deploy.
 * GET /api/health
 */
export async function GET() {
  const started = Date.now();
  const s = getStore();
  const supabaseCfg = getSupabaseConfig();
  const supabaseProbe = await probeSupabase();

  const checks: {
    name: string;
    ok: boolean;
    severity: "critical" | "warn" | "info";
    detail: string;
  }[] = [
    {
      name: "app_process",
      ok: true,
      severity: "critical",
      detail: "Next.js API responding",
    },
    {
      name: "demo_store",
      ok: Array.isArray(s.restaurants) && s.restaurants.length > 0,
      severity: "critical",
      detail: s.demoMode
        ? `In-memory demo store · ${s.restaurants.length} restaurant(s) · active=${s.activeRestaurantId}`
        : "Demo mode off",
    },
    {
      name: "media_library",
      ok: Array.isArray(s.media),
      severity: "warn",
      detail: `${(s.media || []).length} assets in active memory`,
    },
    {
      name: "blasts",
      ok: Array.isArray(s.blasts),
      severity: "warn",
      detail: `${(s.blasts || []).length} blast records`,
    },
    {
      name: "supabase_env",
      ok: supabaseCfg.configured || process.env.DEMO_MODE !== "false",
      severity: process.env.DEMO_MODE === "false" ? "critical" : "warn",
      detail: supabaseCfg.configured
        ? supabaseCfg.message
        : process.env.DEMO_MODE === "false"
          ? "CRITICAL: DEMO_MODE=false but Supabase env missing"
          : supabaseCfg.message + " (OK while DEMO_MODE is not false)",
    },
    {
      name: "supabase_connectivity",
      ok: supabaseProbe.ok || !supabaseCfg.configured,
      severity: supabaseCfg.configured ? "critical" : "info",
      detail: supabaseProbe.detail,
    },
    {
      name: "ai_engine",
      ok: true,
      severity: "info",
      detail: (() => {
        const ai = getAiStatus();
        return `${ai.message} · preferred=${ai.preferred} · openai=${ai.openai.configured ? ai.openai.model : "off"} · claude=${ai.anthropic.configured ? ai.anthropic.model : "off"}`;
      })(),
    },
    {
      name: "cron_secret",
      ok: true,
      severity: "info",
      detail: process.env.CRON_SECRET
        ? "CRON_SECRET set (scheduled publish protected)"
        : "CRON_SECRET empty — scheduled job open in demo only",
    },
  ];

  const criticalFail = checks.some((c) => c.severity === "critical" && !c.ok);
  // supabase_env critical only when DEMO_MODE explicitly false
  const requireLive = process.env.DEMO_MODE === "false";
  const liveFail =
    requireLive &&
    checks.some(
      (c) =>
        (c.name === "supabase_env" || c.name === "supabase_connectivity") && !c.ok
    );

  const status = criticalFail && requireLive ? 503 : liveFail ? 503 : 200;

  return NextResponse.json(
    {
      ok: status === 200,
      service: "restaurant-marketing-os",
      version: "0.2.0",
      demoMode: s.demoMode,
      requireLive,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      tenants: {
        restaurants: s.restaurants.length,
        content: s.content.length,
        customers: s.customers.length,
        offers: s.offers.length,
        orders: s.orders.length,
      },
      checks,
      deploy: {
        vercelProjectHint: "magic-ai2",
        supabaseProjectHint: "hphqrqkuqhxzyjbgpbvh",
        nextSteps: supabaseCfg.configured
          ? [
              "Run supabase/migrations/001_init.sql + 002_media_blasts.sql in SQL editor",
              "Create Storage bucket `media`",
              "Set DEMO_MODE=false after store is wired to Supabase",
            ]
          : [
              "Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY in Vercel env",
              "Redeploy",
              "Open /api/health again",
            ],
      },
    },
    { status }
  );
}
