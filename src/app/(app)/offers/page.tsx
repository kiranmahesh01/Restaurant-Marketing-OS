"use client";

import { useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, CardHeader, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Pause, Play, Plus, Tag } from "lucide-react";

export default function OffersPage() {
  const { data, reload } = useDashboard();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    type: "percent",
    value: "15",
    audience: "all",
  });
  const [msg, setMsg] = useState("");

  async function create() {
    try {
      await fetchJSON("/api/offers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          status: "draft",
          channels: ["app", "pos", "social", "email"],
        }),
      });
      setMsg("Offer created");
      setShowForm(false);
      setForm({ name: "", code: "", description: "", type: "percent", value: "15", audience: "all" });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggle(id: string, status: string) {
    await fetchJSON("/api/offers", {
      method: "POST",
      body: JSON.stringify({ action: status === "active" ? "pause" : "activate", id }),
    });
    reload();
  }

  const offers = data?.offers || [];
  const attributed = offers.reduce((s, o) => s + o.revenueAttributed, 0);
  const redemptions = offers.reduce((s, o) => s + o.redemptions, 0);

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="Offers Hub"
        subtitle="Single source of truth for promos — app, POS, social, email (QSR-style)"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New offer
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-ink-500">Attributed revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(attributed)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Total redemptions</p>
          <p className="mt-1 text-2xl font-semibold">{formatNumber(redemptions)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-ink-500">Active offers</p>
          <p className="mt-1 text-2xl font-semibold">
            {offers.filter((o) => o.status === "active").length}
          </p>
        </Card>
      </div>

      {showForm ? (
        <Card className="mb-6">
          <CardHeader title="Create offer" subtitle="Pushes conceptually to every channel once activated" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {["percent", "fixed", "bogo", "free_item", "bundle", "loyalty_boost"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {["all", "new", "loyalty", "lapsed", "vip"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={create} disabled={!form.name || !form.code}>
                Save offer
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      <div className="grid gap-4">
        {offers.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Tag className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold text-ink-900">{o.name}</h3>
                  <Badge
                    tone={
                      o.status === "active"
                        ? "success"
                        : o.status === "paused"
                          ? "warn"
                          : o.status === "scheduled"
                            ? "info"
                            : "neutral"
                    }
                  >
                    {o.status}
                  </Badge>
                  <code className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-800">
                    {o.code}
                  </code>
                </div>
                <p className="mt-2 text-sm text-ink-600">{o.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.channels.map((c) => (
                    <Badge key={c} tone="neutral">
                      {c}
                    </Badge>
                  ))}
                  <Badge tone="brand">{o.audience}</Badge>
                  <Badge tone="info">{o.type}</Badge>
                </div>
                <p className="mt-3 text-[11px] text-ink-400">
                  {formatDate(o.startsAt)} → {formatDate(o.endsAt)} · {formatNumber(o.redemptions)}{" "}
                  redemptions · {formatCurrency(o.revenueAttributed)} attributed
                  {o.stackable ? " · stackable" : " · non-stackable"}
                </p>
              </div>
              <div className="flex gap-2">
                {(o.status === "active" || o.status === "paused" || o.status === "draft" || o.status === "scheduled") && (
                  <Button
                    size="sm"
                    variant={o.status === "active" ? "outline" : "primary"}
                    onClick={() => toggle(o.id, o.status)}
                  >
                    {o.status === "active" ? (
                      <>
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Activate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-5">
        <h3 className="text-sm font-semibold text-ink-900">Enterprise pattern</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          McDonald’s App Deals and Starbucks Stars campaigns are authored once, validated against POS
          menu codes, targeted by segment (new, lapsed, gold), then distributed to mobile, in-store
          screens, and paid social with the same promo ID. This hub is that ledger for independent and
          multi-unit restaurants — wire POS connectors so redemptions write back automatically.
        </p>
      </Card>
    </div>
  );
}
