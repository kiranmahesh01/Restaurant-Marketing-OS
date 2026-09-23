import { withWorkspace, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { getStore, markNotificationsRead, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
  const s = getStore();
  return NextResponse.json({ notifications: scoped(s.notifications) });
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "read_all") {
      const notifications = markNotificationsRead();
      return NextResponse.json({ notifications: scoped(notifications) });
    }
    if (body.action === "read" && body.ids) {
      const notifications = markNotificationsRead(body.ids);
      return NextResponse.json({ notifications: scoped(notifications) });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {});
