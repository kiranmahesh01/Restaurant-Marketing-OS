import { NextRequest, NextResponse } from "next/server";
import { getDashboardBundle, getStore, switchUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  const bundle = getDashboardBundle();
  return NextResponse.json({
    users: s.users,
    activeUserId: s.activeUserId,
    activeRestaurantId: s.activeRestaurantId,
    user: bundle.user,
    portal: bundle.portal,
    role: bundle.role,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "switch_user" && body.userId) {
      switchUser(body.userId);
      return NextResponse.json({
        ok: true,
        bundle: getDashboardBundle(),
        message: "Persona switched — nav and data scope updated",
      });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Session failed" },
      { status: 400 }
    );
  }
}
