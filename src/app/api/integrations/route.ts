import { NextRequest, NextResponse } from "next/server";
import { getStore, scoped, setIntegrationStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({
    integrations: scoped(s.integrations),
    demoMode: s.demoMode,
    note: "Connection toggles are simulated in demo mode. Set env vars and implement OAuth to go live.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "connect" && body.id) {
      // Simulate connection — real impl exchanges OAuth codes / validates keys
      const integration = setIntegrationStatus(body.id, "connected");
      return NextResponse.json({
        integration,
        demo: true,
        message: `Marked ${integration.provider} connected (demo). Provide ${integration.envKeys.join(", ")} for production.`,
      });
    }
    if (body.action === "disconnect" && body.id) {
      const integration = setIntegrationStatus(body.id, "disconnected");
      return NextResponse.json({ integration });
    }
    if (body.action === "test_publish") {
      return NextResponse.json({
        ok: false,
        demo: true,
        message:
          "Social publish placeholder. Wire Meta Graph / TikTok Content Posting API using tokens from connected integrations.",
        checklist: [
          "META_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID",
          "FACEBOOK_PAGE_ID",
          "TIKTOK_ACCESS_TOKEN",
        ],
      });
    }
    if (body.action === "test_video_render") {
      return NextResponse.json({
        ok: false,
        demo: true,
        message:
          "Video render placeholder for Creatomate or Shotstack. Upload media → pick template → render → attach to content.",
        checklist: ["CREATOMATE_API_KEY", "CREATOMATE_TEMPLATE_ID", "or SHOTSTACK_API_KEY"],
      });
    }
    if (body.action === "test_ads") {
      return NextResponse.json({
        ok: false,
        demo: true,
        message: "Ads connector placeholder for Meta Marketing API + Google Ads API.",
        checklist: ["META_AD_ACCOUNT_ID", "GOOGLE_ADS_CUSTOMER_ID"],
      });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
