import { withWorkspace, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai-content";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const s = getStore();
    if(body.restaurantId && body.restaurantId!==s.activeRestaurantId) return NextResponse.json({error:"Restaurant access denied"},{status:403});
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
    return errorResponse(e);
  }
}

export const POST = withWorkspace(postHandler, {});
