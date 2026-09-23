import { withWorkspace } from "@/lib/server/workspace";
import { NextResponse } from "next/server";
import { getAiStatus, generateContent } from "@/lib/ai-content";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET — which AI providers are configured and which will run */
async function getHandler() {
  return NextResponse.json({
    ok: true,
    ...getAiStatus(),
    testHint: "POST /api/ai/status with {\"selfTest\":true} to run a live generate smoke test",
  });
}

/** POST — optional self-test generate */
async function postHandler(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const status = getAiStatus();
    if (!body.selfTest) {
      return NextResponse.json({ ok: true, ...status });
    }

    const s = getStore();
    const restaurant = s.restaurants.find((r) => r.id === s.activeRestaurantId) || s.restaurants[0];
    const result = await generateContent({
      restaurant,
      goal: "promo",
      platform: "instagram",
      topic: body.topic || "AI provider self-test lunch special",
      offerCode: body.offerCode || "TEST10",
      tone: "warm",
      provider: body.provider,
    });

    return NextResponse.json({
      ok: true,
      status,
      selfTest: {
        provider: result.provider,
        model: result.model,
        demo: result.demo,
        title: result.title,
        bodyPreview: result.body.slice(0, 160),
        errorFallback: result.errorFallback || null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "AI status failed" },
      { status: 500 }
    );
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {});
