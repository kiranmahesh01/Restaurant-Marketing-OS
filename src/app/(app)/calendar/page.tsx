"use client";

import { useDashboard } from "@/lib/hooks";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function CalendarPage() {
  const { data, loading } = useDashboard();
  if (loading || !data) return <p className="text-sm text-ink-500">Loading…</p>;

  const items = [
    ...data.content
      .filter((c) => c.scheduledAt || c.publishedAt || c.status === "scheduled")
      .map((c) => ({
        id: c.id,
        when: c.scheduledAt || c.publishedAt || c.updatedAt,
        title: c.title,
        type: "content" as const,
        meta: c.platforms.join(", "),
        status: c.status,
      })),
    ...data.offers.map((o) => ({
      id: o.id,
      when: o.startsAt,
      title: `Offer: ${o.name}`,
      type: "offer" as const,
      meta: o.code,
      status: o.status,
    })),
    ...data.campaigns.map((c) => ({
      id: c.id,
      when: c.startAt,
      title: `Campaign: ${c.name}`,
      type: "campaign" as const,
      meta: c.channels.join(", "),
      status: c.status,
    })),
  ].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

  // Group by date
  const groups: Record<string, typeof items> = {};
  for (const it of items) {
    const key = formatDate(it.when);
    groups[key] = groups[key] || [];
    groups[key].push(it);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader
        title="Calendar"
        subtitle="Unified content, offers, and campaigns — promo calendar style"
      />
      <div className="space-y-6">
        {Object.entries(groups).map(([day, list]) => (
          <div key={day}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{day}</h3>
            <Card className="divide-y divide-ink-100">
              {list.map((it) => (
                <div key={it.id + it.type} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          it.type === "offer" ? "brand" : it.type === "campaign" ? "info" : "neutral"
                        }
                      >
                        {it.type}
                      </Badge>
                      <p className="truncate text-sm font-medium text-ink-900">{it.title}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      {formatDateTime(it.when)} · {it.meta}
                    </p>
                  </div>
                  <Badge
                    tone={
                      it.status === "active" || it.status === "published" || it.status === "approved"
                        ? "success"
                        : it.status === "scheduled"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {it.status}
                  </Badge>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
