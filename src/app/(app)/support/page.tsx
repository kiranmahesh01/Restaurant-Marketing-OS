"use client";

import { useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Headphones } from "lucide-react";

export default function SupportPage() {
  const { data, reload } = useDashboard();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("other");
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!subject || !body) return;
    await fetchJSON("/api/tickets", {
      method: "POST",
      body: JSON.stringify({ subject, body, priority, category }),
    });
    setSubject("");
    setBody("");
    setMsg("Ticket sent to platform admin — you’ll see status updates here");
    reload();
  }

  const isAdmin = data?.portal === "admin";

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader
        title={isAdmin ? "Support desk" : "Get help"}
        subtitle={
          isAdmin
            ? "All client tickets across the portfolio"
            : `Tell us what’s broken for ${data?.restaurant?.name || "your restaurant"} — small issues included`
        }
        actions={
          <Badge tone="info">
            <Headphones className="mr-1 h-3 w-3" /> Service
          </Badge>
        }
      />
      {msg ? <p className="mb-3 text-xs font-medium text-brand-700">{msg}</p> : null}

      {!isAdmin ? (
        <Card className="mb-6">
          <CardHeader title="New ticket" subtitle="Owner/marketer → platform team (like enterprise CS)" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short problem title" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {["content", "offers", "pos", "integrations", "billing", "ai", "other"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Details</Label>
              <Textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What did you try? What should happen? When do you need it?"
              />
            </div>
            <div>
              <Button onClick={submit} disabled={!subject || !body}>
                Submit ticket
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Tickets" subtitle={isAdmin ? "Portfolio" : "Your restaurant"} />
        <div className="divide-y divide-ink-100">
          {(data?.tickets || []).map((t) => (
            <div key={t.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    t.status === "resolved"
                      ? "success"
                      : t.priority === "high" || t.priority === "urgent"
                        ? "danger"
                        : "warn"
                  }
                >
                  {t.status}
                </Badge>
                <Badge tone="neutral">{t.priority}</Badge>
                <Badge tone="info">{t.category}</Badge>
                {isAdmin ? <span className="text-[11px] text-ink-400">{t.restaurantName}</span> : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-ink-900">{t.subject}</p>
              <p className="mt-1 text-xs text-ink-600">{t.body}</p>
              <p className="mt-2 text-[11px] text-ink-400">
                {t.createdBy} · {formatDateTime(t.createdAt)}
                {t.assignee ? ` · assignee ${t.assignee}` : ""}
              </p>
              {isAdmin && t.status !== "resolved" ? (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await fetchJSON("/api/tickets", {
                      method: "POST",
                      body: JSON.stringify({
                        action: "update",
                        id: t.id,
                        patch: { status: "resolved" },
                      }),
                    });
                    reload();
                  }}
                >
                  Mark resolved
                </Button>
              ) : null}
            </div>
          ))}
          {!(data?.tickets || []).length ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">No tickets yet.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
