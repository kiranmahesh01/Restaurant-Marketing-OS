"use client";

import { useMemo, useState } from "react";
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
import type { ContentPlatform } from "@/lib/types";
import { Check, ChevronRight, Rocket, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = ["Offer", "Channels & creative", "Schedule & launch"] as const;

const PLATFORM_OPTS: { id: ContentPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "google_business", label: "Google Business" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
];

export default function CampaignDropPage() {
  const { data, reload } = useDashboard();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<{
    campaign: { id: string; name: string };
    offer: { code: string; name: string };
    content: { id: string; title: string; platforms: string[] }[];
  } | null>(null);

  const [name, setName] = useState("Weekend Brunch Drop");
  const [topic, setTopic] = useState("15% off weekend brunch — lemon ricotta pancakes & smoked salmon boards");
  const [offerMode, setOfferMode] = useState<"new" | "existing">("new");
  const [existingOfferId, setExistingOfferId] = useState("");
  const [offerName, setOfferName] = useState("Weekend Brunch 15%");
  const [offerCode, setOfferCode] = useState("BRUNCH15");
  const [offerValue, setOfferValue] = useState("15");
  const [offerType, setOfferType] = useState("percent");
  const [audience, setAudience] = useState("all");
  const [platforms, setPlatforms] = useState<ContentPlatform[]>([
    "instagram",
    "facebook",
    "sms",
  ]);
  const [tone, setTone] = useState("warm");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [scheduleAt, setScheduleAt] = useState("");
  const [submitForApproval, setSubmitForApproval] = useState(true);
  const [activateOffer, setActivateOffer] = useState(true);
  const [budget, setBudget] = useState("500");

  const media = data?.media || [];

  const canNext = useMemo(() => {
    if (step === 0) {
      if (!name.trim() || !topic.trim()) return false;
      if (offerMode === "new") return !!(offerName.trim() && offerCode.trim());
      return !!existingOfferId;
    }
    if (step === 1) return platforms.length > 0;
    return true;
  }, [
    step,
    name,
    topic,
    offerMode,
    offerName,
    offerCode,
    existingOfferId,
    platforms,
  ]);

  function togglePlatform(id: ContentPlatform) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function toggleMedia(url: string) {
    setSelectedMedia((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  async function launch() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetchJSON<{
        campaign: { id: string; name: string };
        offer: { code: string; name: string };
        content: { id: string; title: string; platforms: string[] }[];
        message: string;
      }>("/api/campaigns/drop", {
        method: "POST",
        body: JSON.stringify({
          name,
          topic,
          offerMode,
          existingOfferId: offerMode === "existing" ? existingOfferId : undefined,
          offer:
            offerMode === "new"
              ? {
                  name: offerName,
                  code: offerCode,
                  description: topic,
                  type: offerType,
                  value: Number(offerValue),
                  audience,
                  channels: ["app", "pos", "social", "email", "sms"],
                }
              : undefined,
          platforms,
          tone,
          mediaUrls: selectedMedia,
          scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
          submitForApproval,
          activateOffer,
          budget: Number(budget) || 500,
          objective: "launch",
        }),
      });
      setResult(res);
      setMsg(res.message);
      reload();
      setStep(2);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <PageHeader
        title="Campaign Drop"
        subtitle="One wizard — offer + multi-channel creative + schedule (how chains launch LTOs)"
        actions={
          <Badge tone="brand">
            <Rocket className="mr-1 h-3 w-3" /> QSR-style
          </Badge>
        }
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step || result
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-brand-600 text-white"
                    : "bg-ink-200 text-ink-600"
              )}
            >
              {i < step || result ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                i === step ? "text-ink-900" : "text-ink-500"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <div className="mx-1 h-px flex-1 bg-ink-200" />
            ) : null}
          </div>
        ))}
      </div>

      {msg && !result ? (
        <Card className="mb-4 border-brand-200 bg-brand-50/40 p-3 text-sm text-ink-800">{msg}</Card>
      ) : null}

      {result ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Drop launched</h2>
              <p className="mt-1 text-sm text-ink-600">
                Campaign <strong>{result.campaign.name}</strong> with offer{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-semibold">
                  {result.offer.code}
                </code>{" "}
                and {result.content.length} content piece(s).
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {result.content.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm"
              >
                <span className="font-medium text-ink-800">{c.title}</span>
                <span className="text-xs text-ink-500">{c.platforms.join(", ")}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/approvals"
              className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
            >
              Review approvals
            </Link>
            <Link
              href="/calendar"
              className="inline-flex h-10 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              Open calendar
            </Link>
            <Link
              href="/offers"
              className="inline-flex h-10 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              Offers hub
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setMsg("");
                setStep(0);
              }}
            >
              Create another
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          {step === 0 ? (
            <>
              <CardHeader
                title="1 · Offer & brief"
                subtitle="Single promo ID that will flow to app, POS, and social"
              />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Campaign name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Creative brief / topic</Label>
                  <Textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What are you promoting?"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Offer source</Label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={offerMode === "new" ? "primary" : "outline"}
                      onClick={() => setOfferMode("new")}
                    >
                      Create new offer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={offerMode === "existing" ? "primary" : "outline"}
                      onClick={() => setOfferMode("existing")}
                    >
                      Use existing
                    </Button>
                  </div>
                </div>
                {offerMode === "existing" ? (
                  <div className="sm:col-span-2">
                    <Label>Existing offer</Label>
                    <Select
                      value={existingOfferId}
                      onChange={(e) => setExistingOfferId(e.target.value)}
                    >
                      <option value="">Select…</option>
                      {(data?.offers || []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} — {o.name} ({o.status})
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Offer name</Label>
                      <Input value={offerName} onChange={(e) => setOfferName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                        {["percent", "fixed", "bogo", "loyalty_boost", "bundle"].map((t) => (
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
                        value={offerValue}
                        onChange={(e) => setOfferValue(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Audience</Label>
                      <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                        {["all", "new", "loyalty", "lapsed", "vip"].map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <CardHeader
                title="2 · Channels & creative"
                subtitle="AI will draft native copy per channel; attach media from library"
              />
              <div className="space-y-5 p-5">
                <div>
                  <Label>Channels</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PLATFORM_OPTS.map((p) => {
                      const on = platforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                            on
                              ? "bg-brand-600 text-white ring-brand-600"
                              : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50"
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tone</Label>
                    <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                      {["warm", "bold", "playful", "elegant", "urgent"].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Budget (tracking)</Label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="mb-0">Media from library</Label>
                    <Link href="/content" className="text-[11px] font-medium text-brand-700 hover:underline">
                      Manage in Content Studio
                    </Link>
                  </div>
                  {media.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-6 text-center text-xs text-ink-500">
                      No media yet — upload in Content Studio, or launch without images.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {media.map((m) => {
                        const on = selectedMedia.includes(m.url);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMedia(m.url)}
                            className={cn(
                              "relative aspect-square overflow-hidden rounded-xl ring-2 transition",
                              on ? "ring-brand-500" : "ring-transparent hover:ring-ink-200"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                            {on ? (
                              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            ) : (
                              <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[9px] text-white">
                                <ImageIcon className="inline h-2.5 w-2.5" /> {m.name.slice(0, 12)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <CardHeader
                title="3 · Schedule & launch"
                subtitle="Submit for approval (recommended) or auto-approve; optional schedule time"
              />
              <div className="space-y-4 p-5">
                <div>
                  <Label>Schedule (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-ink-500">
                    Leave empty to queue without a clock time. Scheduled items appear on Calendar.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    checked={submitForApproval}
                    onChange={(e) => setSubmitForApproval(e.target.checked)}
                    className="rounded border-ink-300"
                  />
                  Submit content for approval before publish
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-800">
                  <input
                    type="checkbox"
                    checked={activateOffer}
                    onChange={(e) => setActivateOffer(e.target.checked)}
                    className="rounded border-ink-300"
                  />
                  Activate offer on POS / app channels now
                </label>

                <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
                  <p className="font-semibold text-ink-900">Launch summary</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                    <li>
                      Campaign: <strong>{name}</strong>
                    </li>
                    <li>
                      Offer:{" "}
                      <strong>
                        {offerMode === "new"
                          ? `${offerCode} (${offerName})`
                          : data?.offers.find((o) => o.id === existingOfferId)?.code || "—"}
                      </strong>
                    </li>
                    <li>Channels: {platforms.join(", ")}</li>
                    <li>Media attached: {selectedMedia.length}</li>
                    <li>
                      Content status:{" "}
                      {scheduleAt
                        ? "scheduled"
                        : submitForApproval
                          ? "pending approval"
                          : "approved"}
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between border-t border-ink-100 px-5 py-4">
            <Button
              variant="ghost"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < 2 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={busy || !canNext} onClick={launch}>
                <Rocket className="h-4 w-4" />
                {busy ? "Launching…" : "Launch drop"}
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="mt-6 p-5">
        <h3 className="text-sm font-semibold text-ink-900">Why this wizard exists</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">
          McDonald’s and Starbucks don’t “make an Instagram post” in isolation — they authorize an
          LTO, map it to POS/app codes, then cascade creative to every channel with one promo ID.
          Campaign Drop is that cascade for your restaurant group.
        </p>
      </Card>

      {(data?.campaigns || []).length ? (
        <Card className="mt-6">
          <CardHeader title="Recent campaigns" subtitle="Including drops + seeded demos" />
          <div className="divide-y divide-ink-100">
            {data!.campaigns.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{c.name}</p>
                  <p className="text-[11px] text-ink-500">
                    {c.objective} · {c.channels.slice(0, 4).join(", ")}
                  </p>
                </div>
                <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
