"use client";

import { useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, PageHeader, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export default function ReviewsPage() {
  const { data, reload } = useDashboard();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  async function reply(id: string, ai = false) {
    await fetchJSON("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        action: "reply",
        id,
        ai,
        replyBody: drafts[id],
      }),
    });
    setMsg(ai ? "AI reply posted" : "Reply posted");
    reload();
  }

  const reviews = data?.reviews || [];
  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader
        title="Reviews"
        subtitle={`Avg ${avg.toFixed(1)}★ · AI reply assist · Google / Yelp / delivery apps`}
        actions={msg ? <Badge tone="brand">{msg}</Badge> : undefined}
      />

      <div className="space-y-4">
        {reviews.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-ink-900">{r.rating}★</span>
                <Badge tone="neutral">{r.platform}</Badge>
                <Badge
                  tone={
                    r.sentiment === "positive"
                      ? "success"
                      : r.sentiment === "negative"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {r.sentiment}
                </Badge>
              </div>
              <span className="text-[11px] text-ink-400">{formatDateTime(r.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-ink-800">{r.author}</p>
            <p className="mt-2 text-sm text-ink-700">{r.body}</p>
            {r.replied ? (
              <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
                <p className="text-[11px] font-semibold uppercase text-ink-400">Your reply</p>
                {r.replyBody}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Write a reply…"
                  value={drafts[r.id] || ""}
                  onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => reply(r.id, false)} disabled={!drafts[r.id]}>
                    Post reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reply(r.id, true)}>
                    <Sparkles className="h-3.5 w-3.5" /> AI reply
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
