import { NextRequest, NextResponse } from "next/server";
import { createMediaAsset } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Compatibility alias — same behavior as POST /api/media multipart */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const f = file as File;
    if (f.size > 2_500_000) {
      return NextResponse.json({ error: "Demo upload max 2.5MB" }, { status: 400 });
    }
    const buf = Buffer.from(await f.arrayBuffer());
    const mime = f.type || "application/octet-stream";
    const asset = createMediaAsset({
      name: f.name,
      url: `data:${mime};base64,${buf.toString("base64")}`,
      mimeType: mime,
      size: f.size,
      kind: mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : "other",
      source: "upload",
    });
    return NextResponse.json({ asset, demo: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
