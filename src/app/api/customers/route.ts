import { NextRequest, NextResponse } from "next/server";
import { createCustomer, getStore, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ customers: scoped(s.customers) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const customer = createCustomer(body);
    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
