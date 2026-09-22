import { NextRequest, NextResponse } from "next/server";
import { getStore, ingestOrder, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ orders: scoped(s.orders) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "ingest_demo") {
      const order = ingestOrder({
        channel: body.channel || "dine_in",
        posSource: body.posSource || "demo_pos",
        total: body.total || 42.5,
        subtotal: body.subtotal || 38,
        tax: body.tax || 3.9,
        tip: body.tip || 0.6,
        items: body.items || [
          { name: "Chef Special", qty: 1, price: 24 },
          { name: "Side Salad", qty: 1, price: 8 },
          { name: "Iced Tea", qty: 2, price: 3 },
        ],
        customerId: body.customerId,
        customerName: body.customerName,
        offerCode: body.offerCode,
      });
      return NextResponse.json({ order, demo: true });
    }
    if (!body.total) {
      return NextResponse.json({ error: "total required" }, { status: 400 });
    }
    const order = ingestOrder(body);
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
