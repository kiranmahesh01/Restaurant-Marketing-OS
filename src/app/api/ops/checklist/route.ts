import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getAiStatus } from "@/lib/ai-content";
import { getSupabaseConfig } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Big-company style launch checklist — every small thing before a client goes live.
 */
export async function GET() {
  const s = getStore();
  const ai = getAiStatus();
  const sb = getSupabaseConfig();
  const rid = s.activeRestaurantId;
  const content = s.content.filter((c) => c.restaurantId === rid);
  const offers = s.offers.filter((o) => o.restaurantId === rid);
  const integrations = s.integrations.filter((i) => i.restaurantId === rid);
  const reviews = s.reviews.filter((r) => r.restaurantId === rid);
  const openTickets = (s.tickets || []).filter(
    (t) => t.status === "open" || t.status === "in_progress"
  );

  const items = [
    {
      id: "brand_voice",
      owner: "Client owner",
      area: "Brand",
      title: "Brand voice set on restaurant",
      ok: !!(s.restaurants.find((r) => r.id === rid)?.brandVoice),
      fix: "Settings → brand voice",
    },
    {
      id: "active_offer",
      owner: "Marketer",
      area: "Offers",
      title: "At least one active offer (LTO / welcome)",
      ok: offers.some((o) => o.status === "active"),
      fix: "Offers Hub → Activate",
    },
    {
      id: "approval_queue",
      owner: "Owner/Manager",
      area: "Content",
      title: "No stale pending approvals (>3)",
      ok: content.filter((c) => c.status === "pending_approval").length <= 3,
      fix: "Approvals → review queue",
    },
    {
      id: "negative_reviews",
      owner: "Manager",
      area: "Reputation",
      title: "No unreplied ≤3★ reviews",
      ok: !reviews.some((r) => !r.replied && r.rating <= 3),
      fix: "Reviews → AI reply",
    },
    {
      id: "ai_provider",
      owner: "Platform admin",
      area: "AI",
      title: "Live AI key (OpenAI or Claude) OR accept demo engine",
      ok: true,
      fix: ai.activeProvider === "demo-engine" ? "Add OPENAI_API_KEY or ANTHROPIC_API_KEY" : "OK",
      detail: `active=${ai.activeProvider}`,
    },
    {
      id: "supabase",
      owner: "Platform admin",
      area: "Infra",
      title: "Supabase configured for real client data",
      ok: sb.configured,
      fix: "DEPLOY.md → Vercel env + SQL migrations",
    },
    {
      id: "social_connector",
      owner: "Platform admin",
      area: "Integrations",
      title: "At least one social connector marked connected (demo OK until OAuth)",
      ok: integrations.some(
        (i) =>
          ["instagram", "facebook", "tiktok", "meta"].includes(i.provider) &&
          i.status === "connected"
      ),
      fix: "Integrations → Connect (demo) then real OAuth",
    },
    {
      id: "pos_path",
      owner: "Ops",
      area: "POS",
      title: "Order ingest path verified (demo simulate OK)",
      ok: s.orders.some((o) => o.restaurantId === rid),
      fix: "Orders → Simulate POS order",
    },
    {
      id: "support_sla",
      owner: "Platform admin",
      area: "Service",
      title: "Open support tickets under control",
      ok: openTickets.length < 10,
      fix: "Admin HQ → tickets",
      detail: `${openTickets.length} open/in progress`,
    },
    {
      id: "audit_trail",
      owner: "Compliance",
      area: "Audit",
      title: "Audit log receiving events",
      ok: s.auditLogs.length > 0,
      fix: "Perform any action; check Audit Logs",
    },
  ];

  const passed = items.filter((i) => i.ok).length;
  const score = Math.round((passed / items.length) * 100);

  return NextResponse.json({
    ok: score >= 70,
    score,
    passed,
    total: items.length,
    restaurantId: rid,
    items,
    agents: {
      note: "Treat each owner as a team agent with a clear job — same as big QSR brand ops.",
      roster: [
        { agent: "Platform Admin", job: "Infra, AI keys, multi-tenant, tickets SLA" },
        { agent: "Restaurant Owner", job: "Approvals, brand voice, budget" },
        { agent: "Marketer", job: "Campaign Drop, content, blasts, offers" },
        { agent: "Manager", job: "Reviews, POS, daypart calendar" },
        { agent: "Viewer", job: "Read-only performance (investors/partners)" },
      ],
    },
  });
}
