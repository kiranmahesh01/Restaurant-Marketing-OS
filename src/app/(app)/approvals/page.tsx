"use client";

import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { Check, X, CalendarClock, Megaphone } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function ApprovalsPage() {
  const { data, reload } = useDashboard();
  const [msg, setMsg] = useState("");

  const queue = (data?.content || []).filter((c) =>
    ["pending_approval", "approved", "rejected"].includes(c.status)
  );

  async function act(id: string, action: string, extra?: Record<string, string>) {
    try {
      await fetchJSON("/api/content", {
        method: "POST",
        body: JSON.stringify({ action, id, ...extra }),
      });
      setMsg(`${action} ✓`);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader
        title="Approvals"
        subtitle="Brand-safe workflow: draft → review → schedule/publish"
        actions={msg ? <Badge tone="brand">{msg}</Badge> : null}
      />

      <div className="space-y-4">
        {queue.length === 0 ? (
          <Card className="p-10 text-center text-sm text-ink-500">No items in the approval queue.</Card>
        ) : null}
        {queue.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-ink-900">{c.title}</h3>
                  <Badge
                    tone={
                      c.status === "approved"
                        ? "success"
                        : c.status === "rejected"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {c.status.replace("_", " ")}
                  </Badge>
                  {c.aiGenerated ? <Badge tone="info">AI</Badge> : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{c.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.platforms.map((p) => (
                    <Badge key={p} tone="neutral">
                      {p}
                    </Badge>
                  ))}
                  {c.hashtags.map((h) => (
                    <span key={h} className="text-[11px] text-brand-700">
                      {h}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-ink-400">
                  By {c.createdBy} · {formatDateTime(c.createdAt)}
                  {c.rejectionReason ? ` · Rejected: ${c.rejectionReason}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                {c.status === "pending_approval" ? (
                  <>
                    <Button size="sm" onClick={() => act(c.id, "approve")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => act(c.id, "reject", { reason: "Needs stronger CTA / brand fit" })}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                ) : null}
                {c.status === "approved" ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => act(c.id, "schedule")}>
                      <CalendarClock className="h-3.5 w-3.5" /> Schedule +1d
                    </Button>
                    <Button size="sm" onClick={() => act(c.id, "publish")}>
                      <Megaphone className="h-3.5 w-3.5" /> Publish
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
