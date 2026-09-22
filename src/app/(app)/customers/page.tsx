"use client";

import { useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

const tierTone = {
  bronze: "neutral" as const,
  silver: "info" as const,
  gold: "warn" as const,
  platinum: "brand" as const,
};

export default function CustomersPage() {
  const { data, reload } = useDashboard();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");

  async function add() {
    if (!name) return;
    await fetchJSON("/api/customers", {
      method: "POST",
      body: JSON.stringify({ name, email, tier: "bronze", source: "import" }),
    });
    setName("");
    setEmail("");
    reload();
  }

  const customers = (data?.customers || []).filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email?.toLowerCase().includes(q.toLowerCase()) ||
      c.tags.some((t) => t.includes(q.toLowerCase()))
  );

  const tiers = ["platinum", "gold", "silver", "bronze"] as const;
  const tierCounts = Object.fromEntries(
    tiers.map((t) => [t, (data?.customers || []).filter((c) => c.tier === t).length])
  );

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="Customers & Loyalty"
        subtitle="Tiers, points, tags — CRM patterned after major rewards programs"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {tiers.map((t) => (
          <Card key={t} className="p-4">
            <p className="text-xs capitalize text-ink-500">{t}</p>
            <p className="mt-1 text-2xl font-semibold">{tierCounts[t]}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6 p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Add guest</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" />
          </div>
          <div className="flex-1">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@…" />
          </div>
          <div className="flex items-end">
            <Button onClick={add}>Add</Button>
          </div>
        </div>
      </Card>

      <div className="mb-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, tags…"
          className="max-w-sm"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
              <tr>
                <th className="px-5 py-2">Guest</th>
                <th className="px-5 py-2">Tier</th>
                <th className="px-5 py-2">Points</th>
                <th className="px-5 py-2">LTV</th>
                <th className="px-5 py-2">Visits</th>
                <th className="px-5 py-2">Tags</th>
                <th className="px-5 py-2">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{c.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {c.email || c.phone || "—"} · {c.source}
                      {!c.marketingOptIn ? " · opted out" : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={tierTone[c.tier]}>{c.tier}</Badge>
                  </td>
                  <td className="px-5 py-3">{formatNumber(c.points)}</td>
                  <td className="px-5 py-3">{formatCurrency(c.lifetimeSpend)}</td>
                  <td className="px-5 py-3">{c.visitCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} tone="neutral">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-500">
                    {c.lastVisitAt ? formatDate(c.lastVisitAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 grid gap-4 p-5 sm:grid-cols-3">
        {[
          {
            t: "Starbucks-style stars",
            d: "Points per dollar, tier thresholds unlock member pricing and freebies. Birthday + double-point weeks live as Offers with audience=loyalty.",
          },
          {
            t: "McD app personalization",
            d: "Segment lapsed vs VIP; push different deal codes. Win-back tags on this list feed SMS/email campaigns.",
          },
          {
            t: "HighLevel-style CRM",
            d: "Pipeline tags, opt-in flags, and multi-channel messaging scaffolds — extend with Twilio/Mailchimp connectors.",
          },
        ].map((x) => (
          <div key={x.t}>
            <p className="text-sm font-semibold text-ink-900">{x.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">{x.d}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
