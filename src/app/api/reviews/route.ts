import { NextRequest, NextResponse } from "next/server";
import { getStore, scoped, updateReview } from "@/lib/store";
import { generateContentLocal } from "@/lib/ai-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ reviews: scoped(s.reviews) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "reply" && body.id) {
      let replyBody = body.replyBody as string | undefined;
      if (body.ai && !replyBody) {
        const s = getStore();
        const review = s.reviews.find((r) => r.id === body.id);
        const restaurant = s.restaurants.find((r) => r.id === s.activeRestaurantId)!;
        const gen = generateContentLocal({
          restaurant,
          goal: "ugc_reply",
          platform: "google_business",
          topic: review?.body || "guest feedback",
          tone: review && review.rating <= 2 ? "warm" : "warm",
          length: "short",
          includeHashtags: false,
        });
        replyBody = gen.body;
      }
      const review = updateReview(body.id, {
        replied: true,
        replyBody: replyBody || "Thank you for your feedback — we appreciate you.",
      });
      return NextResponse.json({ review });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
