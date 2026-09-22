"use client";

import { useDashboard } from "@/lib/hooks";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const { data, loading } = useDashboard();
  if (loading || !data) return <p className="text-sm text-ink-500">Loading…</p>;

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader title="Audit logs" subtitle="Immutable activity trail per restaurant tenant" />
      <Card className="divide-y divide-ink-100">
        {data.auditLogs.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-4 px-5 py-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{a.action}</Badge>
                <span className="text-xs text-ink-500">
                  {a.entityType}/{a.entityId}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-800">
                <span className="font-medium">{a.actor}</span>
                {a.meta ? (
                  <span className="text-ink-500"> · {JSON.stringify(a.meta)}</span>
                ) : null}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-ink-400">{formatDateTime(a.createdAt)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
