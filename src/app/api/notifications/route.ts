import { NextRequest, NextResponse } from "next/server";
import { getStore, markNotificationsRead, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ notifications: scoped(s.notifications) });
}

export async function POST(req: NextRequest) {
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
