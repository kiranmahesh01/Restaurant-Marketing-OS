import { NextRequest, NextResponse } from "next/server";
import { getDashboardBundle, getStore, onboardRestaurant, switchRestaurant } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({
    restaurants: s.restaurants,
    activeRestaurantId: s.activeRestaurantId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "switch" && body.id) {
      switchRestaurant(body.id);
      return NextResponse.json(getDashboardBundle(body.id));
    }
    if (body.action === "onboard") {
      if (!body.name || !body.city) {
        return NextResponse.json({ error: "name and city required" }, { status: 400 });
      }
      const restaurant = onboardRestaurant({
        name: body.name,
        cuisine: body.cuisine || "Contemporary",
        city: body.city,
        state: body.state || "CA",
        brandVoice: body.brandVoice,
      });
      return NextResponse.json({ restaurant, bundle: getDashboardBundle(restaurant.id) });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
