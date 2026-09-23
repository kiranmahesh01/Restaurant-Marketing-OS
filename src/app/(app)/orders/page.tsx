"use client";

import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function OrdersPage() {
  const { data, reload } = useDashboard();
  const [msg, setMsg] = useState("");
  const [total,setTotal]=useState("");
  const [reference,setReference]=useState("");
  async function saveOrder(e:React.FormEvent){e.preventDefault();try{await fetchJSON("/api/orders",{method:"POST",body:JSON.stringify({total:Number(total),externalId:reference,posSource:"manual"})});setMsg("Order saved");setTotal("");setReference("");reload();}catch(e){setMsg(e instanceof Error?e.message:"Unable to save");}}

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
        subtitle={data?.demoMode ? "Demo order simulator" : "Recorded sales and manual orders"}
        actions={
          data?.demoMode ? <Button onClick={ingest}>Simulate POS order</Button> : null
        }
      />
      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      {!data?.demoMode && <form onSubmit={saveOrder} className="mb-5 flex flex-wrap gap-3"><input aria-label="Order reference" required value={reference} onChange={e=>setReference(e.target.value)} placeholder="Order reference" className="rounded-lg border p-2"/><input aria-label="Order total" required type="number" min="0" step="0.01" value={total} onChange={e=>setTotal(e.target.value)} placeholder="Total" className="rounded-lg border p-2"/><Button type="submit">Save order</Button></form>}
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

      {!data?.demoMode && <Card className="mt-6 p-5 text-sm text-ink-600">Automatic POS imports are not connected. Record orders manually until your POS provider is configured. Reusing an order reference does not create a duplicate.</Card>}
    </div>
  );
}
