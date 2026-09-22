"use client";

import { useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, CardHeader, Input, Label, PageHeader, Textarea } from "@/components/ui";

export default function SettingsPage() {
  const { data, reload } = useDashboard();
  const [form, setForm] = useState({
    name: "",
    cuisine: "Contemporary",
    city: "",
    state: "CA",
    brandVoice: "",
  });
  const [msg, setMsg] = useState("");

  async function onboard() {
    try {
      await fetchJSON("/api/restaurants", {
        method: "POST",
        body: JSON.stringify({ action: "onboard", ...form }),
      });
      setMsg(`Onboarded ${form.name}`);
      setForm({ name: "", cuisine: "Contemporary", city: "", state: "CA", brandVoice: "" });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  async function switchTo(id: string) {
    await fetchJSON("/api/restaurants", {
      method: "POST",
      body: JSON.stringify({ action: "switch", id }),
    });
    setMsg("Switched restaurant");
    reload();
  }

  async function reset() {
    await fetchJSON("/api/demo/reset", { method: "POST" });
    setMsg("Demo data reset");
    reload();
  }

  const r = data?.restaurant;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Restaurant profile, multi-tenant switcher, demo controls" />
      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      <Card className="mb-6">
        <CardHeader title="Active restaurant" subtitle="Brand voice feeds AI content" />
        <div className="space-y-2 p-5 text-sm">
          <p>
            <span className="text-ink-500">Name:</span>{" "}
            <span className="font-medium">{r?.name}</span>
          </p>
          <p>
            <span className="text-ink-500">Cuisine:</span> {r?.cuisine}
          </p>
          <p>
            <span className="text-ink-500">Location:</span> {r?.city}, {r?.state}
          </p>
          <p>
            <span className="text-ink-500">Timezone:</span> {r?.timezone}
          </p>
          <p>
            <span className="text-ink-500">Locations:</span> {r?.locations}
          </p>
          <div className="rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">
            <p className="mb-1 font-semibold text-ink-500">Brand voice</p>
            {r?.brandVoice}
          </div>
          <div className="flex gap-2 pt-2">
            <div
              className="h-8 w-8 rounded-lg"
              style={{ background: r?.brandColors.primary }}
              title="primary"
            />
            <div
              className="h-8 w-8 rounded-lg"
              style={{ background: r?.brandColors.secondary }}
              title="secondary"
            />
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Restaurants in org" subtitle="Multi-tenant switch (RLS-ready IDs)" />
        <div className="divide-y divide-ink-100">
          {(data?.restaurants || []).map((rest) => (
            <div key={rest.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">{rest.name}</p>
                <p className="text-[11px] text-ink-500">
                  {rest.city}, {rest.state} · {rest.id}
                </p>
              </div>
              {rest.id === data?.restaurant.id ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => switchTo(rest.id)}>
                  Switch
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <CardHeader title="Onboard another restaurant" subtitle="Creates scoped empty analytics + integrations" />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Cuisine</Label>
            <Input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Brand voice</Label>
            <Textarea
              rows={3}
              value={form.brandVoice}
              onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
              placeholder="How should AI sound for this brand?"
            />
          </div>
          <div>
            <Button onClick={onboard} disabled={!form.name || !form.city}>
              Onboard
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold">Environment</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">
          Copy <code className="rounded bg-ink-100 px-1">.env.example</code> →{" "}
          <code className="rounded bg-ink-100 px-1">.env.local</code>. Demo mode runs without any keys.
          Supabase, OpenAI, Meta, Google, POS, and video keys are optional until you leave demo mode.
        </p>
        <p className="mt-2 text-xs text-ink-500">
          Mode: <Badge tone="brand">{data?.demoMode ? "demo" : "live"}</Badge>
        </p>
      </Card>


      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold text-ink-900">AI providers (ChatGPT + Claude)</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          Content Studio and blasts use a multi-provider engine. Without keys, the local demo AI still
          generates captions. Add keys for production-quality ChatGPT (OpenAI) and/or Claude (Anthropic).
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-ink-600">
          <li>
            <strong>OpenAI / ChatGPT:</strong>{" "}
            <code className="rounded bg-ink-100 px-1">OPENAI_API_KEY</code> + optional{" "}
            <code className="rounded bg-ink-100 px-1">OPENAI_MODEL=gpt-4o-mini</code>
          </li>
          <li>
            <strong>Anthropic / Claude:</strong>{" "}
            <code className="rounded bg-ink-100 px-1">ANTHROPIC_API_KEY</code> + optional{" "}
            <code className="rounded bg-ink-100 px-1">ANTHROPIC_MODEL=claude-sonnet-4-20250514</code>
          </li>
          <li>
            <strong>Switch:</strong>{" "}
            <code className="rounded bg-ink-100 px-1">AI_PROVIDER=auto|openai|anthropic|demo</code>
          </li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const r = await fetch("/api/ai/status");
              const j = await r.json();
              setMsg(
                `AI active=${j.activeProvider} · OpenAI ${j.openai?.configured ? "ON " + j.openai.model : "off"} · Claude ${j.anthropic?.configured ? "ON " + j.anthropic.model : "off"}`
              );
            }}
          >
            Check AI status
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              const r = await fetch("/api/ai/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selfTest: true }),
              });
              const j = await r.json();
              setMsg(
                j.selfTest
                  ? `Self-test OK · provider=${j.selfTest.provider} · ${j.selfTest.bodyPreview}`
                  : j.error || "Self-test failed"
              );
            }}
          >
            Run AI self-test
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-ink-500">
          Local: put keys in <code className="rounded bg-ink-100 px-1">.env.local</code> and restart{" "}
          <code className="rounded bg-ink-100 px-1">npm run dev</code>. Production: Vercel → Environment
          Variables → redeploy. Never commit keys to git.
        </p>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold text-ink-900">System health</h3>
        <p className="mt-1 text-xs text-ink-600">
          Production check before client demos. Also open{" "}
          <a className="font-medium text-brand-700 hover:underline" href="/api/health" target="_blank" rel="noreferrer">
            /api/health
          </a>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const r = await fetch("/api/health");
              const j = await r.json();
              setMsg(
                j.ok
                  ? `Health OK · ${j.tenants?.restaurants || 0} restaurants · demo=${j.demoMode}`
                  : `Health FAIL · ${JSON.stringify(j.checks?.filter((c: { ok: boolean }) => !c.ok) || j)}`
              );
            }}
          >
            Run health check
          </Button>
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="text-sm font-semibold text-ink-900">Multi-client scale (agency / franchise)</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          Seed demo restaurants to stress-test switching tenants (up to hundreds in memory).{" "}
          <strong>100–1000 live clients require Supabase + RLS</strong> — in-memory is for product
          demos only. Restaurant data is not a joke: never run production on the demo store.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 25, 50, 100].map((n) => (
            <Button
              key={n}
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const res = await fetchJSON<{ totalRestaurants: number; message: string }>(
                    "/api/tenants/seed",
                    { method: "POST", body: JSON.stringify({ count: n }) }
                  );
                  setMsg(`${res.message} Total: ${res.totalRestaurants}`);
                  reload();
                } catch (e) {
                  setMsg(e instanceof Error ? e.message : "Seed failed");
                }
              }}
            >
              Seed +{n}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-800">Danger zone</h3>
        <p className="mt-1 text-xs text-ink-600">Reset in-memory demo store to factory sample data.</p>
        <Button className="mt-3" variant="danger" size="sm" onClick={reset}>
          Reset demo data
        </Button>
      </Card>
    </div>
  );
}
