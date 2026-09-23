"use client";

import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { Plug, Video, Share2 } from "lucide-react";

export default function IntegrationsPage() {
  const { data, reload } = useDashboard();
  const [msg, setMsg] = useState("");

  async function connect(id: string, on: boolean) {
    const res = await fetchJSON<{ message?: string }>("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: on ? "connect" : "disconnect", id }),
    });
    setMsg(res.message || (on ? "Connected" : "Disconnected"));
    reload();
  }

  async function test(action: string) {
    const res = await fetchJSON<{ message: string }>("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    setMsg(res.message);
  }

  const groups = ["social", "ads", "pos", "video", "comms", "ai", "reviews"] as const;

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="Integrations"
        subtitle={data?.demoMode ? "Preview integration controls in demo mode" : "External delivery services require connection before use"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button disabled={!data?.demoMode} size="sm" variant="outline" onClick={() => test("test_publish")}>
              <Share2 className="h-3.5 w-3.5" /> Test publish
            </Button>
            <Button disabled={!data?.demoMode} size="sm" variant="outline" onClick={() => test("test_video_render")}>
              <Video className="h-3.5 w-3.5" /> Test video
            </Button>
          </div>
        }
      />
      {msg ? (
        <Card className="mb-4 border-brand-200 bg-brand-50/50 p-4 text-sm text-ink-800">{msg}</Card>
      ) : null}

      {!data?.demoMode && <Card className="mb-6 p-5">Social publishing, SMS/email delivery, ad sync, video rendering and POS imports are not connected. Your saved drafts and customer records remain available. Ask your administrator to configure the providers your restaurant uses.</Card>}
      {groups.map((g) => {
        const list = (data?.integrations || []).filter((i) => i.category === g);
        if (!list.length) return null;
        return (
          <div key={g} className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{g}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((i) => (
                <Card key={i.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                        <Plug className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize text-ink-900">
                          {i.provider.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">{i.configHint}</p>
                      </div>
                    </div>
                    <Badge tone={i.status === "connected" ? "success" : "neutral"}>{i.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {i.envKeys.map((k) => (
                      <code
                        key={k}
                        className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-700"
                      >
                        {k}
                      </code>
                    ))}
                  </div>
                  {i.lastSyncAt ? (
                    <p className="mt-2 text-[10px] text-ink-400">
                      Last sync {formatDateTime(i.lastSyncAt)}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    {i.status === "connected" ? (
                      <Button size="sm" variant="outline" onClick={() => connect(i.id, false)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => connect(i.id, true)}>
                        Connect (demo)
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
