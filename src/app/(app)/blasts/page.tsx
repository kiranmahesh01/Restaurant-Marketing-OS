"use client";

import { useEffect, useState } from "react";
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
import type { BlastSegment, MessageBlast } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Mail, MessageSquare, Send, Sparkles, Users } from "lucide-react";

const SEGMENTS: { id: BlastSegment; label: string; hint: string }[] = [
  { id: "all_opted_in", label: "All opted-in", hint: "Marketing opt-in guests" },
  { id: "loyalty", label: "Loyalty", hint: "Silver+ or 200+ points" },
  { id: "vip", label: "VIP / Gold+", hint: "Gold, Platinum, vip tag" },
  { id: "lapsed", label: "Lapsed", hint: "30+ days or winback tag" },
  { id: "new", label: "New guests", hint: "≤2 visits" },
  { id: "birthday_month", label: "Birthday month", hint: "Birthday this month" },
];

type Preview = {
  segment: string;
  channel: string | null;
  count: number;
  sample: { id: string; name: string; email?: string; phone?: string; tier: string; tags: string[] }[];
};

export default function BlastsPage() {
  const { data, reload } = useDashboard();
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [segment, setSegment] = useState<BlastSegment>("lapsed");
  const [name, setName] = useState("Win-back this week");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [offerCode, setOfferCode] = useState("WELCOME10");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchJSON<{ preview?: Preview }>(
          `/api/blasts?previewSegment=${segment}&channel=${channel}`
        );
        if (!cancelled) setPreview(res.preview || null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [segment, channel]);

  async function aiDraft() {
    setBusy(true);
    try {
      const res = await fetchJSON<{ subject?: string; body: string }>("/api/blasts", {
        method: "POST",
        body: JSON.stringify({
          action: "ai_draft",
          channel,
          topic: name,
          offerCode: offerCode || undefined,
          tone: channel === "sms" ? "urgent" : "warm",
        }),
      });
      setBody(res.body);
      if (res.subject) setSubject(res.subject);
      setMsg("AI draft applied");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAndOptionallySend(send: boolean) {
    setBusy(true);
    setMsg("");
    try {
      const offer = data?.offers.find((o) => o.code === offerCode);
      const created = await fetchJSON<{ blast: MessageBlast }>("/api/blasts", {
        method: "POST",
        body: JSON.stringify({
          name,
          body,
          channel,
          segment,
          subject: channel === "email" ? subject : undefined,
          offerCode: offerCode || undefined,
          offerId: offer?.id,
        }),
      });
      if (send) {
        const sent = await fetchJSON<{ blast: MessageBlast; message: string }>("/api/blasts", {
          method: "POST",
          body: JSON.stringify({ action: "send", id: created.blast.id }),
        });
        setMsg(sent.message);
      } else {
        setMsg("Blast saved as draft");
      }
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendExisting(id: string) {
    setBusy(true);
    try {
      const res = await fetchJSON<{ message: string }>("/api/blasts", {
        method: "POST",
        body: JSON.stringify({ action: "send", id }),
      });
      setMsg(res.message);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  const blasts = data?.blasts || [];

  return (
    <div className="animate-fade-in mx-auto max-w-6xl">
      <PageHeader
        title="SMS & Email Blasts"
        subtitle="Segment loyalty CRM → draft → send (demo logs delivery until Twilio/Mailchimp connect)"
        actions={
          <Badge tone="info">
            <Users className="mr-1 h-3 w-3" /> HighLevel-style outbound
          </Badge>
        }
      />

      {msg ? (
        <Card className="mb-4 border-brand-200 bg-brand-50/50 p-3 text-sm text-ink-800">{msg}</Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Compose" subtitle="Respects marketing opt-in + channel contact fields" />
          <div className="space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Channel</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={channel === "sms" ? "primary" : "outline"}
                    onClick={() => setChannel("sms")}
                    className="flex-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> SMS
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={channel === "email" ? "primary" : "outline"}
                    onClick={() => setChannel("email")}
                    className="flex-1"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                </div>
              </div>
              <div>
                <Label>Segment</Label>
                <Select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as BlastSegment)}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label>Campaign name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Offer code (optional)</Label>
              <Select value={offerCode} onChange={(e) => setOfferCode(e.target.value)}>
                <option value="">None</option>
                {(data?.offers || []).map((o) => (
                  <option key={o.id} value={o.code}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </Select>
            </div>
            {channel === "email" ? (
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            ) : null}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Body {channel === "sms" ? "(160 chars ideal)" : ""}</Label>
                <Button type="button" size="sm" variant="outline" onClick={aiDraft} disabled={busy}>
                  <Sparkles className="h-3.5 w-3.5" /> AI draft
                </Button>
              </div>
              <Textarea
                rows={channel === "sms" ? 4 : 8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  channel === "sms"
                    ? "Restaurant: message… code XXX. Reply STOP to opt out."
                    : "Hi {{first_name}}, …"
                }
              />
              {channel === "sms" ? (
                <p className="mt-1 text-[11px] text-ink-400">{body.length} characters</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={busy || !body || !name}
                onClick={() => saveAndOptionallySend(false)}
              >
                Save draft
              </Button>
              <Button disabled={busy || !body || !name} onClick={() => saveAndOptionallySend(true)}>
                <Send className="h-4 w-4" /> Save & send (demo)
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-ink-500">
              Demo send writes audit + notification only. Production: Twilio for SMS, Mailchimp/SendGrid
              for email — see Integrations env keys.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Audience preview"
            subtitle={SEGMENTS.find((s) => s.id === segment)?.hint}
            action={
              <Badge tone="brand">{preview?.count ?? "…"} guests</Badge>
            }
          />
          <div className="divide-y divide-ink-100">
            {(preview?.sample || []).map((g) => (
              <div key={g.id} className="px-5 py-3">
                <p className="text-sm font-medium text-ink-900">{g.name}</p>
                <p className="text-[11px] text-ink-500">
                  {g.tier}
                  {channel === "sms" ? ` · ${g.phone || "no phone"}` : ` · ${g.email || "no email"}`}
                  {g.tags.length ? ` · ${g.tags.join(", ")}` : ""}
                </p>
              </div>
            ))}
            {!preview?.sample?.length ? (
              <p className="px-5 py-8 text-center text-xs text-ink-500">
                No guests in this segment for {channel}.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Blast history" subtitle="Drafts and demo sends" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
              <tr>
                <th className="px-5 py-2">Name</th>
                <th className="px-5 py-2">Channel</th>
                <th className="px-5 py-2">Segment</th>
                <th className="px-5 py-2">Audience</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">When</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {blasts.map((b) => (
                <tr key={b.id} className="border-b border-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{b.name}</p>
                    <p className="line-clamp-1 text-[11px] text-ink-500">{b.body}</p>
                  </td>
                  <td className="px-5 py-3 uppercase">{b.channel}</td>
                  <td className="px-5 py-3 text-xs">{b.segment}</td>
                  <td className="px-5 py-3">
                    {b.sentCount || 0}/{b.audienceCount}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        b.status === "sent" ? "success" : b.status === "draft" ? "neutral" : "info"
                      }
                    >
                      {b.status}
                    </Badge>
                    {b.demo ? <span className="ml-1 text-[10px] text-ink-400">demo</span> : null}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-500">
                    {formatDateTime(b.sentAt || b.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    {b.status === "draft" ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => sendExisting(b.id)}>
                        Send
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
