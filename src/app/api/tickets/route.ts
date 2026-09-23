import { withWorkspace, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { createTicket, getDashboardBundle, updateTicket } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
  const bundle = getDashboardBundle();
  return NextResponse.json({ tickets: bundle.tickets, portal: bundle.portal });
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "update" && body.id) {
      const ticket = updateTicket(body.id, body.patch || {});
      return NextResponse.json({ ticket });
    }
    if (!body.subject || !body.body) {
      return NextResponse.json({ error: "subject and body required" }, { status: 400 });
    }
    const ticket = createTicket(body);
    return NextResponse.json({ ticket });
  } catch (e) {
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {});
