import { adminClient } from "@/lib/server/supabase";
import { storeContext } from "@/lib/server/context";
import { randomUUID } from "node:crypto";
import { withWorkspace, writers, errorResponse } from "@/lib/server/workspace";
import { NextRequest, NextResponse } from "next/server";
import { createMediaAsset, deleteMediaAsset, getStore, scoped } from "@/lib/store";

export const dynamic = "force-dynamic";

async function getHandler() {
  const s = getStore();
  return NextResponse.json({ media: scoped(s.media || []) });
}

async function postHandler(req: NextRequest) {
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
      if (!["image/png","image/jpeg","image/webp","image/gif","video/mp4","video/webm"].includes(f.type)) return NextResponse.json({error:"Unsupported media type"},{status:400});
      const buf = Buffer.from(await f.arrayBuffer());
      const b64 = buf.toString("base64");
      const mime = f.type || "application/octet-stream";
      let dataUrl = `data:${mime};base64,${b64}`;
      let storagePath: string | undefined;
      if (!getStore().demoMode) {
        storagePath = `${getStore().activeRestaurantId}/${randomUUID()}`;
        const db=adminClient();
        const {error}=await db.storage.from("rmos-media").upload(storagePath,buf,{contentType:mime,upsert:false});
        if(error) return NextResponse.json({error:"Media upload failed. Check storage setup."},{status:503});
        const path=storagePath;
        storeContext.getStore()?.rollback?.push(async()=>{await db.storage.from("rmos-media").remove([path]);});
        dataUrl="https://storage.invalid/pending";
      }
      const kind = mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : "other";
      const asset = createMediaAsset({
        storagePath,
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
      if (storagePath) {
        asset.url=`/api/media/file?id=${asset.id}`;
      }
      return NextResponse.json({
        asset,
        demo: getStore().demoMode,
        message: getStore().demoMode ? "Stored in demo memory" : "Saved to private media storage",
      });
    }

    const body = await req.json();
    if (body.action === "delete" && body.id) {
      const asset=scoped(getStore().media).find(m=>m.id===body.id);
      deleteMediaAsset(body.id);
      if(asset?.storagePath && !getStore().demoMode) {
        const path=asset.storagePath;
        storeContext.getStore()?.afterCommit?.push(async()=>{await adminClient().storage.from("rmos-media").remove([path]);});
      }
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
    return errorResponse(e);
  }
}

export const GET = withWorkspace(getHandler, {});

export const POST = withWorkspace(postHandler, {roles: writers});
