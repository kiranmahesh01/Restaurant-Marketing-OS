import { withWorkspace, writers, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { getStore, scoped, updateReview } from "@/lib/store";
import { generateContentLocal } from "@/lib/ai-content";

export const dynamic = "force-dynamic";

async function getHandler() {
  const s = getStore();
  return NextResponse.json({ reviews: scoped(s.reviews) });
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "reply" && body.id) {
      let replyBody = body.replyBody as string | undefined;
      if (body.ai && !replyBody) {
        const s = getStore();
        const review = scoped(s.reviews).find((r) => r.id === body.id);
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
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {roles: writers});
