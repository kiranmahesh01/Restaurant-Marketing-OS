import { NextRequest, NextResponse } from "next/server";
import { mutateStore, addAudit, getStore } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { Restaurant, Integration } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Multi-client scale seed for agency / franchise demos.
 * POST { "count": 25 }  → adds N restaurants under the demo org (capped).
 * Does NOT fake external publish success.
 *
 * Protect in production with CRON_SECRET or remove this route.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const hdr = req.headers.get("authorization") || req.headers.get("x-cron-secret");
      if (hdr !== `Bearer ${secret}` && hdr !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const requested = Math.min(Math.max(Number(body.count) || 10, 1), 100);
    // Hard cap per request — 1000 clients = multiple calls + real Supabase, not RAM demo
    const s0 = getStore();
    const existing = s0.restaurants.length;
    if (existing + requested > 500) {
      return NextResponse.json(
        {
          error: `Demo memory cap: refuse to exceed 500 tenants (have ${existing}). Use Supabase for 100–1000 live clients.`,
        },
        { status: 400 }
      );
    }

    const cities = [
      ["Oakland", "CA"],
      ["San Francisco", "CA"],
      ["San Jose", "CA"],
      ["Sacramento", "CA"],
      ["Los Angeles", "CA"],
      ["San Diego", "CA"],
      ["Portland", "OR"],
      ["Seattle", "WA"],
      ["Austin", "TX"],
      ["Denver", "CO"],
      ["Chicago", "IL"],
      ["Miami", "FL"],
      ["Brooklyn", "NY"],
      ["Phoenix", "AZ"],
      ["Atlanta", "GA"],
    ];
    const cuisines = [
      "California Contemporary",
      "Italian",
      "Mexican",
      "Japanese",
      "American Grill",
      "Cafe & Bakery",
      "BBQ",
      "Seafood",
      "Indian",
      "Thai",
    ];

    const created: { id: string; name: string; city: string }[] = [];

    mutateStore((s) => {
      if (!s.media) s.media = [];
      if (!s.blasts) s.blasts = [];
      const templates = s.integrations.filter((i) => i.restaurantId === s.restaurants[0]?.id);
      const orgId = s.restaurants[0]?.orgId || "org_arena_demo";

      for (let i = 0; i < requested; i++) {
        const [city, state] = cities[(existing + i) % cities.length];
        const cuisine = cuisines[(existing + i) % cuisines.length];
        const n = existing + i + 1;
        const name = body.prefix
          ? `${body.prefix} #${n}`
          : `${cuisine.split(" ")[0]} Kitchen ${city} #${n}`;

        const r: Restaurant = {
          id: uid("rest"),
          orgId,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
          cuisine,
          city,
          state,
          timezone: "America/Los_Angeles",
          brandVoice: `Local ${cuisine} restaurant in ${city}. Friendly, reliable, community-first. Never corporate fluff.`,
          brandColors: { primary: "#ea580c", secondary: "#0f172a" },
          locations: 1 + ((existing + i) % 4),
          createdAt: new Date().toISOString(),
        };
        s.restaurants.push(r);

        for (const t of templates) {
          const copy: Integration = {
            ...t,
            id: uid("int"),
            restaurantId: r.id,
            status: "disconnected",
            lastSyncAt: undefined,
          };
          s.integrations.push(copy);
        }

        s.analytics.push({
          restaurantId: r.id,
          period: "last_30_days",
          revenue: 40000 + ((existing + i) * 1370) % 120000,
          orders: 800 + ((existing + i) * 17) % 3000,
          avgTicket: 28 + ((existing + i) % 20),
          newCustomers: 40 + ((existing + i) * 3) % 200,
          loyaltyRedemptions: 20 + ((existing + i) * 2) % 150,
          contentPublished: 5 + ((existing + i) % 30),
          adSpend: 200 + ((existing + i) * 11) % 2000,
          adRoas: 2 + ((existing + i) % 40) / 10,
          reviewAvg: 3.8 + ((existing + i) % 12) / 10,
          reviewCount: 10 + ((existing + i) * 5) % 200,
          topItems: [
            { name: "House Special", qty: 100, revenue: 2000 },
            { name: "Seasonal Bowl", qty: 80, revenue: 1600 },
          ],
          revenueByDay: [],
          channelMix: [
            { channel: "Dine-in", revenue: 20000, pct: 50 },
            { channel: "Takeout", revenue: 10000, pct: 25 },
            { channel: "Delivery", revenue: 10000, pct: 25 },
          ],
        });

        // Minimal offer + customer so switching tenant isn't empty
        s.offers.push({
          id: uid("off"),
          restaurantId: r.id,
          name: "Welcome 10%",
          code: `WELCOME${n}`,
          description: "New guest welcome offer",
          type: "percent",
          value: 10,
          channels: ["app", "pos", "social"],
          status: "active",
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 90 * 86400000).toISOString(),
          redemptions: (n * 3) % 50,
          revenueAttributed: (n * 120) % 5000,
          audience: "new",
          stackable: false,
          createdAt: new Date().toISOString(),
        });

        created.push({ id: r.id, name: r.name, city: r.city });
      }

      addAudit(s, {
        actor: "system",
        action: "tenants.seeded",
        entityType: "org",
        entityId: orgId,
        meta: { count: requested, total: s.restaurants.length },
      });
    });

    const s = getStore();
    return NextResponse.json({
      ok: true,
      created: created.length,
      totalRestaurants: s.restaurants.length,
      sample: created.slice(0, 5),
      message:
        s.restaurants.length >= 100
          ? "Scale demo ready for agency UI. For 100–1000 LIVE clients with isolation, deploy Supabase RLS (migrations) — do not rely on in-memory store."
          : "Tenants seeded. Switch restaurants in Settings.",
      productionNote:
        "Restaurant business data must be Postgres-backed with RLS. In-memory is for product demo only.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const s = getStore();
  return NextResponse.json({
    totalRestaurants: s.restaurants.length,
    activeRestaurantId: s.activeRestaurantId,
    demoMode: s.demoMode,
    capacityHint:
      "POST /api/tenants/seed { count: 25 } to add demo tenants. Cap 500 in memory. Real multi-client = Supabase.",
  });
}
