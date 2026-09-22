import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-content";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const s = getStore();
    const restaurant =
      s.restaurants.find((r) => r.id === (body.restaurantId || s.activeRestaurantId)) ||
      s.restaurants[0];

    if (!body.topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const result = await generateContent({
      restaurant,
      goal: body.goal || "promo",
      platform: body.platform || "multi",
      topic: body.topic,
      offerCode: body.offerCode,
      tone: body.tone || "warm",
      includeHashtags: body.includeHashtags !== false,
      length: body.length || "medium",
      provider: body.provider, // optional: openai | anthropic | demo | auto
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
