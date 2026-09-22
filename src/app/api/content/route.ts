import { NextRequest, NextResponse } from "next/server";
import { createContent, getActiveUser, getStore, scoped, updateContent } from "@/lib/store";
import { canApprove, canMutate } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ content: scoped(s.content) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = getActiveUser();
    if (body.action === "approve" || body.action === "reject") {
      if (!canApprove(user?.role)) {
        return NextResponse.json({ error: "Your role cannot approve content" }, { status: 403 });
      }
    } else if (!canMutate(user?.role)) {
      return NextResponse.json({ error: "Viewer role is read-only" }, { status: 403 });
    }
    if (body.action === "update" && body.id) {
      const item = updateContent(body.id, body.patch || {});
      return NextResponse.json({ content: item });
    }
    if (body.action === "approve" && body.id) {
      const item = updateContent(body.id, {
        status: "approved",
        approvedBy: body.approvedBy || "Alex Rivera",
      });
      return NextResponse.json({ content: item });
    }
    if (body.action === "reject" && body.id) {
      const item = updateContent(body.id, {
        status: "rejected",
        rejectionReason: body.reason || "Needs revision",
      });
      return NextResponse.json({ content: item });
    }
    if (body.action === "schedule" && body.id) {
      const item = updateContent(body.id, {
        status: "scheduled",
        scheduledAt: body.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      });
      return NextResponse.json({ content: item });
    }
    if (body.action === "publish" && body.id) {
      // Placeholder: real publish hits Meta/TikTok/etc when connected
      const item = updateContent(body.id, {
        status: "published",
        publishedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        content: item,
        publish: {
          ok: true,
          demo: true,
          message:
            "Marked published in-app. Connect Instagram/Facebook/TikTok integrations to push live.",
        },
      });
    }
    if (!body.title || !body.body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }
    const item = createContent(body);
    return NextResponse.json({ content: item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
