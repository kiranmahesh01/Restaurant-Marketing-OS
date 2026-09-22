import { NextRequest, NextResponse } from "next/server";
import { createCampaignDrop } from "@/lib/store";
import type { ContentPlatform } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.topic) {
      return NextResponse.json({ error: "name and topic required" }, { status: 400 });
    }

    const platforms = (body.platforms || ["instagram", "facebook", "sms"]) as ContentPlatform[];

    const result = createCampaignDrop({
      name: body.name,
      topic: body.topic,
      offerMode: body.offerMode === "existing" ? "existing" : "new",
      existingOfferId: body.existingOfferId,
      offer: body.offer,
      platforms,
      tone: body.tone || "warm",
      mediaUrls: body.mediaUrls || [],
      scheduleAt: body.scheduleAt,
      submitForApproval: body.submitForApproval !== false,
      activateOffer: body.activateOffer !== false,
      objective: body.objective || "launch",
      budget: body.budget != null ? Number(body.budget) : 500,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      message:
        "Campaign drop created: offer + multi-channel content + campaign record. Approve in Approvals or view Calendar.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Drop failed" },
      { status: 400 }
    );
  }
}
