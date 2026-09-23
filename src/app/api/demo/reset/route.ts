import { withWorkspace } from "@/lib/server/workspace";
import { NextResponse } from "next/server";
import { getDashboardBundle, resetDemo } from "@/lib/store";

export const dynamic = "force-dynamic";

async function postHandler() {
  resetDemo();
  return NextResponse.json({ ok: true, bundle: getDashboardBundle() });
}

export const POST = withWorkspace(postHandler, {demoOnly: true});
