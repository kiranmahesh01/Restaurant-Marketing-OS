import { withWorkspace, errorResponse } from "@/lib/server/workspace";
import { NextResponse } from "next/server";
import { getDashboardBundle } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
  try {
    return NextResponse.json(getDashboardBundle());
  } catch (e) {
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});
