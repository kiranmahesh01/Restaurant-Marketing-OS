"use client";

import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, CardHeader, PageHeader } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useState } from "react";

export default function AdsPage() {
  const { data } = useDashboard();
  const [msg, setMsg] = useState("");

  async function testAds() {
    const res = await fetchJSON<{ message: string; checklist: string[] }>("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: "test_ads" }),
    });
    setMsg(res.message);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="Ads"
        subtitle="Meta + Google connectors · campaign performance"
        actions={
          <Button variant="outline" onClick={testAds}>
            Test ads connector
          </Button>
        }
      />
      {msg ? (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{msg}</Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(data?.ads || []).map((ad) => (
          <Card key={ad.id} className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">{ad.name}</h3>
              <Badge tone={ad.status === "connected" ? "success" : "warn"}>{ad.status}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-ink-500">Spend 30d</p>
                <p className="font-semibold">{formatCurrency(ad.spend30d)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-500">Impressions</p>
                <p className="font-semibold">{formatNumber(ad.impressions30d)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-500">Clicks</p>
                <p className="font-semibold">{formatNumber(ad.clicks30d)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-500">Conversions</p>
                <p className="font-semibold">{formatNumber(ad.conversions30d)}</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-ink-500">
              Demo metrics shown. Connect via Integrations and implement Marketing API calls to sync live.
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Campaigns" subtitle="Cross-channel objectives" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
              <tr>
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">Budget</th>
                <th className="px-5 py-2">Spent</th>
                <th className="px-5 py-2">ROAS</th>
                <th className="px-5 py-2">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {(data?.campaigns || []).map((c) => (
                <tr key={c.id} className="border-b border-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {c.objective} · {c.channels.join(", ")}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-3">{formatCurrency(c.budget)}</td>
                  <td className="px-5 py-3">{formatCurrency(c.spent)}</td>
                  <td className="px-5 py-3">{c.metrics.roas}x</td>
                  <td className="px-5 py-3">{c.metrics.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
