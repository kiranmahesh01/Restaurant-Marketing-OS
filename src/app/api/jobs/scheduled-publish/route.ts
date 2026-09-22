import { NextRequest, NextResponse } from "next/server";
import { getStore, updateContent } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Cron-style worker placeholder.
 * Secure with CRON_SECRET header in production (Vercel Cron / external scheduler).
 *
 * Finds scheduled content due for publish and marks published (demo).
 * Real impl: call Meta/TikTok adapters per platform, handle partial failures.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const hdr = req.headers.get("authorization") || req.headers.get("x-cron-secret");
    if (hdr !== `Bearer ${secret}` && hdr !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const s = getStore();
  const now = Date.now();
  const due = s.content.filter(
    (c) =>
      c.status === "scheduled" &&
      c.scheduledAt &&
      new Date(c.scheduledAt).getTime() <= now
  );

  const published = [];
  for (const c of due) {
    published.push(
      updateContent(c.id, {
        status: "published",
        publishedAt: new Date().toISOString(),
      })
    );
  }

  return NextResponse.json({
    ok: true,
    demo: true,
    processed: published.length,
    ids: published.map((p) => p.id),
    message:
      published.length === 0
        ? "No scheduled posts due."
        : "Marked due posts published in-app. Wire social adapters for live delivery.",
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
