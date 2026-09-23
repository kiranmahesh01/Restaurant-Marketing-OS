import { withWorkspace, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { getDashboardBundle, getStore, switchUser } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
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

async function postHandler(req: NextRequest) {
  try {
    if (!getStore().demoMode) return NextResponse.json({error:"Persona switching is disabled in live mode"},{status:403});
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
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {});
