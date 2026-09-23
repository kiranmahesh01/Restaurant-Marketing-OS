import { withWorkspace, writers, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import {
  createBlast,
  getActiveUser,
  getStore,
  scoped,
  segmentCustomers,
  sendBlast,
} from "@/lib/store";
import { canMutate } from "@/lib/rbac";
import { generateContentLocal } from "@/lib/ai-content";
import type { BlastSegment } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const s = getStore();
  const segment = req.nextUrl.searchParams.get("previewSegment") as BlastSegment | null;
  const channel = req.nextUrl.searchParams.get("channel") as "sms" | "email" | null;
  const payload: Record<string, unknown> = { blasts: scoped(s.blasts || []) };
  if (segment) {
    let audience = segmentCustomers(s.activeRestaurantId, segment);
    if (channel === "sms") audience = audience.filter((c) => !!c.phone);
    if (channel === "email") audience = audience.filter((c) => !!c.email);
    payload.preview = {
      segment,
      channel,
      count: audience.length,
      sample: audience.slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        tier: c.tier,
        tags: c.tags,
      })),
    };
  }
  return NextResponse.json(payload);
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action !== "ai_draft" && !canMutate(getActiveUser()?.role)) {
      return NextResponse.json({ error: "Viewer role is read-only" }, { status: 403 });
    }

    if (body.action === "send" && body.id) {
      const blast = sendBlast(body.id);
      return NextResponse.json({
        blast,
        demo: true,
        message:
          "Logged as sent in demo. Wire Twilio (SMS) or Mailchimp/SendGrid (email) using integration env keys to deliver for real.",
      });
    }

    if (body.action === "ai_draft") {
      const s = getStore();
      const restaurant = s.restaurants.find((r) => r.id === s.activeRestaurantId)!;
      const channel = body.channel === "email" ? "email" : "sms";
      const gen = generateContentLocal({
        restaurant,
        goal: channel === "sms" ? "sms" : "email_subject",
        platform: channel,
        topic: body.topic || body.name || "loyalty offer",
        offerCode: body.offerCode,
        tone: body.tone || "warm",
        length: channel === "sms" ? "short" : "medium",
        includeHashtags: false,
      });
      return NextResponse.json({
        subject: channel === "email" ? gen.title : undefined,
        body:
          channel === "email"
            ? gen.variants.find((v) => v.platform === "email")?.body || gen.body
            : gen.body.slice(0, 160),
        provider: gen.provider,
      });
    }

    if (!body.name || !body.body || !body.channel) {
      return NextResponse.json({ error: "name, body, channel required" }, { status: 400 });
    }

    const blast = createBlast({
      name: body.name,
      body: body.body,
      channel: body.channel,
      segment: body.segment || "all_opted_in",
      subject: body.subject,
      offerId: body.offerId,
      offerCode: body.offerCode,
      status: "draft",
    });

    return NextResponse.json({ blast });
  } catch (e) {
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {roles: writers});
