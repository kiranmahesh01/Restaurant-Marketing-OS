"use client";

import { useDashboard } from "@/lib/hooks";
import { Badge, Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { formatCurrency, formatNumber, relativeTime, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  Megaphone,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const { data, loading } = useDashboard();

  if (loading || !data) {
    return <div className="animate-pulse text-sm text-ink-500">Loading command center…</div>;
  }

  const a = data.analytics;
  const pending = data.content.filter((c) => c.status === "pending_approval").length;
  const activeOffers = data.offers.filter((o) => o.status === "active").length;

  return (
    <div className="animate-fade-in mx-auto max-w-7xl">
      <PageHeader
        title="Overview"
        subtitle={`${data.restaurant.name} · ${data.restaurant.city}, ${data.restaurant.state} · last 30 days`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/campaigns"
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
            >
              Launch campaign drop <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/content"
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              Content studio
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Revenue"
          value={formatCurrency(a.revenue)}
          hint={`${formatNumber(a.orders)} orders · avg ${formatCurrency(a.avgTicket)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <Stat
          label="New guests"
          value={formatNumber(a.newCustomers)}
          hint={`${formatNumber(a.loyaltyRedemptions)} loyalty redemptions`}
          icon={<Users className="h-4 w-4" />}
        />
        <Stat
          label="Ad ROAS"
          value={`${a.adRoas}x`}
          hint={`${formatCurrency(a.adSpend)} spend · ${a.contentPublished} posts`}
          icon={<Megaphone className="h-4 w-4" />}
        />
        <Stat
          label="Review avg"
          value={a.reviewAvg.toFixed(1)}
          hint={`${a.reviewCount} reviews · ${pending} awaiting approval`}
          icon={<Star className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue trend" subtitle="Last 14 days · dine-in + digital" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.revenueByDay}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v || 0)), "Revenue"]}
                  contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ea580c" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Channel mix" subtitle="Revenue share" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.channelMix} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="channel" width={72} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v || 0))}
                  contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Active offers"
            subtitle="Central promo calendar"
            action={
              <Link href="/offers" className="text-xs font-medium text-brand-700 hover:underline">
                Manage
              </Link>
            }
          />
          <div className="divide-y divide-ink-100">
            {data.offers
              .filter((o) => o.status === "active" || o.status === "scheduled")
              .slice(0, 4)
              .map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{o.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {o.code} · {formatNumber(o.redemptions)} redemptions
                    </p>
                  </div>
                  <Badge tone={o.status === "active" ? "success" : "info"}>{o.status}</Badge>
                </div>
              ))}
            {!activeOffers ? (
              <p className="px-5 py-6 text-center text-xs text-ink-500">No active offers</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Content pipeline"
            subtitle="Draft → approve → publish"
            action={
              <Link href="/approvals" className="text-xs font-medium text-brand-700 hover:underline">
                Approvals
              </Link>
            }
          />
          <div className="divide-y divide-ink-100">
            {data.content.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{c.title}</p>
                  <p className="text-[11px] text-ink-500">
                    {c.platforms.slice(0, 2).join(", ")}
                    {c.aiGenerated ? " · AI" : ""}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Needs attention" subtitle="Reviews & tasks" />
          <div className="space-y-2 p-4">
            {data.reviews
              .filter((r) => !r.replied && r.rating <= 3)
              .slice(0, 3)
              .map((r) => (
                <Link
                  key={r.id}
                  href="/reviews"
                  className="block rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2 hover:bg-ink-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-ink-900">
                      {r.rating}★ · {r.platform}
                    </p>
                    <span className="text-[10px] text-ink-400">{relativeTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-ink-600">{r.body}</p>
                </Link>
              ))}
            {data.notifications
              .filter((n) => !n.read)
              .slice(0, 2)
              .map((n) => (
                <div key={n.id} className="rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-2">
                  <p className="text-xs font-medium text-ink-900">{n.title}</p>
                  <p className="text-[11px] text-ink-600">{n.body}</p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top sellers" subtitle="Qty & revenue" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
                <tr>
                  <th className="px-5 py-2 font-medium">Item</th>
                  <th className="px-5 py-2 font-medium">Qty</th>
                  <th className="px-5 py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {a.topItems.map((t) => (
                  <tr key={t.name} className="border-b border-ink-50">
                    <td className="px-5 py-2.5 font-medium text-ink-800">{t.name}</td>
                    <td className="px-5 py-2.5 text-ink-600">{formatNumber(t.qty)}</td>
                    <td className="px-5 py-2.5 text-ink-600">{formatCurrency(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent orders"
            subtitle="POS / app ingest"
            action={
              <Link href="/orders" className="text-xs font-medium text-brand-700 hover:underline">
                All orders
              </Link>
            }
          />
          <div className="divide-y divide-ink-100">
            {data.orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{o.externalId}</p>
                    <p className="text-[11px] capitalize text-ink-500">
                      {o.channel.replace("_", " ")} · {o.posSource}
                      {o.offerCode ? ` · ${o.offerCode}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">{formatCurrency(o.total)}</p>
                  <p className="text-[10px] text-ink-400">{formatDate(o.orderedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="How big chains run this" subtitle="Design principles baked into this OS" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {[
            {
              t: "One offer source of truth",
              d: "McD/Starbucks push LTOs from a central promo calendar to app, POS, OOH, and social simultaneously — our Offers Hub mirrors that.",
            },
            {
              t: "Loyalty is the CRM",
              d: "Tiers + points + personalized offers beat generic blasts. Guests and redemptions stay restaurant-scoped for multi-unit groups.",
            },
            {
              t: "Content with guardrails",
              d: "Brand voice + approval workflow lets local marketers move fast without breaking national brand standards.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl bg-ink-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-brand-700">
                <FileText className="h-4 w-4" />
                <p className="text-sm font-semibold text-ink-900">{x.t}</p>
              </div>
              <p className="text-xs leading-relaxed text-ink-600">{x.d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published" || status === "approved"
      ? "success"
      : status === "pending_approval"
        ? "warn"
        : status === "rejected" || status === "failed"
          ? "danger"
          : status === "scheduled"
            ? "info"
            : "neutral";
  return <Badge tone={tone as "success"}>{status.replace("_", " ")}</Badge>;
}
