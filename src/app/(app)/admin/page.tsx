"use client";

import { useEffect, useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Building2, Headphones, Shield, Activity } from "lucide-react";

type Checklist = {
  ok: boolean;
  score: number;
  passed: number;
  total: number;
  items: {
    id: string;
    owner: string;
    area: string;
    title: string;
    ok: boolean;
    fix: string;
    detail?: string;
  }[];
  agents: { roster: { agent: string; job: string }[] };
};

export default function AdminPage() {
  const { data, reload, loading } = useDashboard();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/ops/checklist")
      .then((r) => r.json())
      .then(setChecklist)
      .catch(() => null);
  }, [data?.restaurant?.id, data?.tickets?.length]);

  if (loading || !data) {
    return <p className="text-sm text-ink-500">Loading Admin HQ…</p>;
  }

  if (data.portal !== "admin" && data.role !== "platform_admin") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-amber-700" />
        <h1 className="mt-3 text-lg font-semibold text-ink-900">Admin only</h1>
        <p className="mt-2 text-sm text-ink-600">
          You are signed in as <strong>{data.user?.name}</strong> ({data.role}). Switch to{" "}
          <strong>Sam Admin</strong> in the header persona menu to open Platform Admin HQ.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
          Back to client overview
        </Link>
      </div>
    );
  }

  const stats = data.orgStats;

  async function resolveTicket(id: string) {
    await fetchJSON("/api/tickets", {
      method: "POST",
      body: JSON.stringify({ action: "update", id, patch: { status: "resolved" } }),
    });
    setMsg("Ticket resolved");
    reload();
  }

  return (
    <div className="animate-fade-in mx-auto max-w-7xl">
      <PageHeader
        title="Admin HQ"
        subtitle="Platform operator view — all client restaurants, tickets, launch checklist (agency / SaaS)"
        actions={
          <Badge tone="brand">
            <Shield className="mr-1 h-3 w-3" /> Platform admin
          </Badge>
        }
      />
      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Client restaurants"
          value={formatNumber(stats?.restaurantCount || data.restaurants.length)}
          hint="Multi-tenant org"
          icon={<Building2 className="h-4 w-4" />}
        />
        <Stat
          label="Open tickets"
          value={formatNumber(stats?.openTickets || 0)}
          hint="Service desk SLA"
          icon={<Headphones className="h-4 w-4" />}
        />
        <Stat
          label="Pending approvals"
          value={formatNumber(stats?.contentPending || 0)}
          hint="Across org content"
        />
        <Stat
          label="Launch score"
          value={checklist ? `${checklist.score}%` : "—"}
          hint={checklist ? `${checklist.passed}/${checklist.total} checks` : "Loading…"}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Client portfolio"
            subtitle="Click switch in Settings or use restaurant switcher"
            action={
              <Link href="/settings" className="text-xs font-medium text-brand-700 hover:underline">
                Manage
              </Link>
            }
          />
          <div className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {data.restaurants.slice(0, 40).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{r.name}</p>
                  <p className="text-[11px] text-ink-500">
                    {r.city}, {r.state} · {r.cuisine}
                  </p>
                </div>
                {r.id === data.restaurant.id ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await fetchJSON("/api/restaurants", {
                        method: "POST",
                        body: JSON.stringify({ action: "switch", id: r.id }),
                      });
                      reload();
                    }}
                  >
                    Open
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Service desk" subtitle="Client tickets — big companies never ignore small issues" />
          <div className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {(data.tickets || []).length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-ink-500">No tickets</p>
            ) : (
              (data.tickets || []).map((t) => (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        t.priority === "urgent" || t.priority === "high"
                          ? "danger"
                          : t.priority === "medium"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {t.priority}
                    </Badge>
                    <Badge tone={t.status === "resolved" ? "success" : "info"}>{t.status}</Badge>
                    <span className="text-[11px] text-ink-400">{t.restaurantName}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink-900">{t.subject}</p>
                  <p className="line-clamp-2 text-[11px] text-ink-500">{t.body}</p>
                  {t.status !== "resolved" ? (
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="outline"
                      onClick={() => resolveTicket(t.id)}
                    >
                      Resolve
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Go-live checklist (every small thing)"
          subtitle="QSR-style readiness before promising a client results"
        />
        <div className="divide-y divide-ink-100">
          {(checklist?.items || []).map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3 px-5 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={it.ok ? "success" : "warn"}>{it.ok ? "pass" : "fix"}</Badge>
                  <Badge tone="neutral">{it.area}</Badge>
                  <span className="text-[11px] text-ink-400">{it.owner}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-ink-900">{it.title}</p>
                <p className="text-[11px] text-ink-500">
                  {it.fix}
                  {it.detail ? ` · ${it.detail}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="text-sm font-semibold text-ink-900">Team agents (who owns what)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(checklist?.agents.roster || []).map((a) => (
            <div key={a.agent} className="rounded-xl bg-ink-50 p-3">
              <p className="text-sm font-semibold text-ink-900">{a.agent}</p>
              <p className="mt-1 text-xs text-ink-600">{a.job}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
