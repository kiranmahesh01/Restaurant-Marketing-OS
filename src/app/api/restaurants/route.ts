import { withWorkspace, managers, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { getDashboardBundle, getStore, onboardRestaurant, switchRestaurant } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
  const s = getStore();
  return NextResponse.json({
    restaurants: getDashboardBundle().restaurants,
    activeRestaurantId: s.activeRestaurantId,
  });
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "switch" && body.id) {
      if (!getStore().demoMode) {
        const bundle = getDashboardBundle();
        if (!bundle.restaurants.some(r => r.id === body.id)) return NextResponse.json({error: "Restaurant access denied"}, {status:403});
        const response = NextResponse.json({ok:true});
        response.cookies.set("rmos_restaurant", body.id, {httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV === "production",path:"/"});
        return response;
      }
      switchRestaurant(body.id);
      return NextResponse.json(getDashboardBundle(body.id));
    }
    if (body.action === "onboard") {
      if (!getStore().demoMode) return NextResponse.json({error:"Use the restaurant setup page",redirect:"/onboarding"},{status:400});
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
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {roles: managers});
