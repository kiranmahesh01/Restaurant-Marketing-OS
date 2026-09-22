import { NextResponse } from "next/server";
import { getDashboardBundle, resetDemo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  resetDemo();
  return NextResponse.json({ ok: true, bundle: getDashboardBundle() });
}
