"use client";

import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function OrdersPage() {
  const { data, reload } = useDashboard();
  const [msg, setMsg] = useState("");

  async function ingest() {
    const customers = data?.customers || [];
    const cus = customers[Math.floor(Math.random() * Math.max(customers.length, 1))];
    const offers = (data?.offers || []).filter((o) => o.status === "active");
    const offer = offers[Math.floor(Math.random() * Math.max(offers.length, 1))];
    const res = await fetchJSON<{ order: { externalId: string; total: number } }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        action: "ingest_demo",
        customerId: cus?.id,
        offerCode: Math.random() > 0.5 ? offer?.code : undefined,
        channel: ["dine_in", "app", "takeout", "delivery"][Math.floor(Math.random() * 4)],
      }),
    });
    setMsg(`Ingested ${res.order.externalId} · ${formatCurrency(res.order.total)}`);
    reload();
  }

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="Orders / POS"
        subtitle="Ingest from Toast, Square, Clover — demo simulator included"
        actions={
          <Button onClick={ingest}>Simulate POS order</Button>
        }
      />
      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
              <tr>
                <th className="px-5 py-2">Order</th>
                <th className="px-5 py-2">Channel</th>
                <th className="px-5 py-2">Items</th>
                <th className="px-5 py-2">Offer</th>
                <th className="px-5 py-2">Total</th>
                <th className="px-5 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders || []).map((o) => (
                <tr key={o.id} className="border-b border-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{o.externalId}</p>
                    <p className="text-[11px] text-ink-500">{o.posSource}</p>
                  </td>
                  <td className="px-5 py-3 capitalize">{o.channel.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-xs text-ink-600">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </td>
                  <td className="px-5 py-3">
                    {o.offerCode ? <Badge tone="brand">{o.offerCode}</Badge> : "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-3 text-xs text-ink-500">{formatDateTime(o.orderedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 p-5 text-sm text-ink-600">
        <p className="font-semibold text-ink-900">POS webhook contract (placeholder)</p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-ink-900 p-4 text-[11px] text-ink-100">
{`POST /api/orders
{
  "externalId": "TOAST-123",
  "posSource": "toast",
  "channel": "dine_in",
  "total": 54.2,
  "items": [{"name":"Burger","qty":1,"price":17}],
  "customerId": "cus_xxx",
  "offerCode": "BRUNCH15"
}`}
        </pre>
        <p className="mt-3 text-xs">
          On ingest: order stored · offer redemption incremented · loyalty points awarded · audit log written.
        </p>
      </Card>
    </div>
  );
}
