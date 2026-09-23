import { withWorkspace, writers, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { createOffer, getActiveUser, getStore, scoped, updateOffer } from "@/lib/store";
import { canMutate } from "@/lib/rbac";

export const dynamic = "force-dynamic";

async function getHandler() {
  const s = getStore();
  return NextResponse.json({ offers: scoped(s.offers) });
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (!canMutate(getActiveUser()?.role)) {
      return NextResponse.json({ error: "Viewer role is read-only" }, { status: 403 });
    }
    if (body.action === "update" && body.id) {
      const offer = updateOffer(body.id, body.patch || {});
      return NextResponse.json({ offer });
    }
    if (body.action === "activate" && body.id) {
      const offer = updateOffer(body.id, { status: "active" });
      return NextResponse.json({ offer });
    }
    if (body.action === "pause" && body.id) {
      const offer = updateOffer(body.id, { status: "paused" });
      return NextResponse.json({ offer });
    }
    if (!body.name || !body.code) {
      return NextResponse.json({ error: "name and code required" }, { status: 400 });
    }
    const offer = createOffer(body);
    return NextResponse.json({ offer });
  } catch (e) {
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {roles: writers});
