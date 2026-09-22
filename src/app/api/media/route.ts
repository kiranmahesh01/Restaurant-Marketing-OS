import { NextRequest, NextResponse } from "next/server";
import { createMediaAsset, deleteMediaAsset, getStore, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = getStore();
  return NextResponse.json({ media: scoped(s.media || []) });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
        return NextResponse.json({ error: "file required" }, { status: 400 });
      }
      const f = file as File;
      if (f.size > 2_500_000) {
        return NextResponse.json(
          { error: "Demo upload max 2.5MB — use Supabase Storage for larger assets" },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await f.arrayBuffer());
      const b64 = buf.toString("base64");
      const mime = f.type || "application/octet-stream";
      const dataUrl = `data:${mime};base64,${b64}`;
      const kind = mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : "other";
      const asset = createMediaAsset({
        name: f.name,
        url: dataUrl,
        mimeType: mime,
        size: f.size,
        kind,
        source: "upload",
        tags: String(form.get("tags") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      return NextResponse.json({
        asset,
        demo: true,
        message: "Stored in demo memory as data URI. Production: Supabase Storage bucket `media`.",
      });
    }

    const body = await req.json();
    if (body.action === "delete" && body.id) {
      deleteMediaAsset(body.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "create_stock" || body.url) {
      const asset = createMediaAsset({
        name: body.name || "Asset",
        url: body.url,
        mimeType: body.mimeType || "image/svg+xml",
        size: body.size || 0,
        kind: body.kind || "image",
        source: body.source || "stock",
        tags: body.tags || [],
      });
      return NextResponse.json({ asset });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Media failed" },
      { status: 400 }
    );
  }
}
