"use client";

import { useEffect, useState } from "react";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Badge, Button, Card, CardHeader, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { CONTENT_GOALS, PLATFORMS } from "@/lib/ai-content";
import type { GenerateResult } from "@/lib/ai-content";
import { Sparkles, Copy, Save, Send, Wand2, Upload, Image as ImageIcon, X } from "lucide-react";
import type { MediaAsset } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function ContentPage() {
  const { data, reload } = useDashboard();
  const [topic, setTopic] = useState("Weekend brunch with lemon ricotta pancakes");
  const [goal, setGoal] = useState("promo");
  const [platform, setPlatform] = useState("multi");
  const [tone, setTone] = useState("warm");
  const [offerCode, setOfferCode] = useState("BRUNCH15");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiProvider, setAiProvider] = useState("auto");
  const [aiStatus, setAiStatus] = useState<{
    activeProvider: string;
    message: string;
    openai: { configured: boolean; model: string };
    anthropic: { configured: boolean; model: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((j) => setAiStatus(j))
      .catch(() => null);
  }, []);

  async function generate() {
    setGenerating(true);
    setStatusMsg("");
    try {
      const res = await fetchJSON<GenerateResult>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ topic, goal, platform, tone, offerCode: offerCode || undefined, provider: aiProvider === "auto" ? undefined : aiProvider }),
      });
      setResult(res);
      setTitle(res.title);
      setBody(res.body);
      setHashtags((res.hashtags || []).join(" "));
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  async function save(as: "draft" | "pending_approval") {
    try {
      await fetchJSON("/api/content", {
        method: "POST",
        body: JSON.stringify({
          title: title || topic,
          body,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
          platforms: result?.platforms || ["instagram", "facebook"],
          status: as,
          aiGenerated: !!result,
          offerId: data?.offers.find((o) => o.code === offerCode)?.id,
          mediaUrls: selectedMedia,
          mediaType: selectedMedia.length ? "image" : "none",
        }),
      });
      setStatusMsg(as === "draft" ? "Saved as draft" : "Submitted for approval");
      reload();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  function applyVariant(v: { platform: string; body: string }) {
    setBody(v.body);
    setStatusMsg(`Applied ${v.platform} variant`);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-7xl">
      <PageHeader
        title="Content Studio"
        subtitle="AI captions for Instagram, Facebook, TikTok, SMS, email — brand-voice aware"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/campaigns"
              className="inline-flex h-9 items-center rounded-xl border border-ink-200 bg-white px-3 text-xs font-medium text-ink-800 hover:bg-ink-50"
            >
              Campaign Drop
            </a>
            <Badge tone="brand">
              <Sparkles className="mr-1 h-3 w-3" />
              {result
                ? result.provider === "openai"
                  ? `OpenAI · ${result.model || "chatgpt"}`
                  : result.provider === "anthropic"
                    ? `Claude · ${result.model || "anthropic"}`
                    : "Demo AI engine"
                : aiStatus
                  ? aiStatus.activeProvider === "openai"
                    ? "OpenAI ready"
                    : aiStatus.activeProvider === "anthropic"
                      ? "Claude ready"
                      : "Demo AI engine"
                  : "AI"}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Generate" subtitle="Like a brand content engine for every channel" />
          <div className="space-y-3 p-5">
            <div>
              <Label>Topic / brief</Label>
              <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Goal</Label>
                <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                  {CONTENT_GOALS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div>
              <Label>AI provider</Label>
              <Select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                <option value="auto">Auto (best available key)</option>
                <option value="openai">OpenAI / ChatGPT</option>
                <option value="anthropic">Anthropic / Claude</option>
                <option value="demo">Demo engine (offline)</option>
              </Select>
              {aiStatus ? (
                <p className="mt-1 text-[11px] text-ink-500">
                  Active: <strong>{aiStatus.activeProvider}</strong>
                  {" · "}OpenAI {aiStatus.openai.configured ? "✓" : "—"}
                  {" · "}Claude {aiStatus.anthropic.configured ? "✓" : "—"}
                </p>
              ) : null}
            </div>
            <Button className="w-full" onClick={generate} disabled={generating}>
              <Wand2 className="h-4 w-4" />
              {generating ? "Generating…" : "Generate with AI"}
            </Button>
            <p className="text-[11px] leading-relaxed text-ink-500">
              Demo engine always works. For ChatGPT set <code className="rounded bg-ink-100 px-1">OPENAI_API_KEY</code>.
              For Claude set <code className="rounded bg-ink-100 px-1">ANTHROPIC_API_KEY</code>.
              Switch with <code className="rounded bg-ink-100 px-1">AI_PROVIDER=auto|openai|anthropic|demo</code>.
              See Settings → AI providers.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Editor"
            subtitle="Edit, then save draft or send to approvals"
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => save("draft")} disabled={!body}>
                  <Save className="h-3.5 w-3.5" /> Draft
                </Button>
                <Button size="sm" onClick={() => save("pending_approval")} disabled={!body}>
                  <Send className="h-3.5 w-3.5" /> Submit
                </Button>
              </div>
            }
          />
          <div className="space-y-3 p-5">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Caption…" />
            </div>
            <div>
              <Label>Hashtags</Label>
              <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#tags" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="mb-0">Media library</Label>
                <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      setStatusMsg("");
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/media", { method: "POST", body: fd });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || "Upload failed");
                        setSelectedMedia((prev) => [...prev, json.asset.url]);
                        setStatusMsg(`Attached ${json.asset.name}`);
                        reload();
                      } catch (err) {
                        setStatusMsg(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {(data?.media || []).map((m: MediaAsset) => {
                  const on = selectedMedia.includes(m.url);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setSelectedMedia((prev) =>
                          on ? prev.filter((u) => u !== m.url) : [...prev, m.url]
                        )
                      }
                      className={`relative aspect-square overflow-hidden rounded-lg ring-2 ${
                        on ? "ring-brand-500" : "ring-transparent hover:ring-ink-200"
                      }`}
                      title={m.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                      {on ? (
                        <span className="absolute right-1 top-1 rounded-full bg-brand-600 p-0.5 text-white">
                          <ImageIcon className="h-3 w-3" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {selectedMedia.length ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{selectedMedia.length} attached</Badge>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-800"
                    onClick={() => setSelectedMedia([])}
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-ink-400">Click thumbnails to attach to this post.</p>
              )}
            </div>

            {result?.cta ? (
              <p className="text-xs text-ink-600">
                Suggested CTA: <span className="font-medium text-ink-900">{result.cta}</span>
              </p>
            ) : null}
            {statusMsg ? <p className="text-xs font-medium text-brand-700">{statusMsg}</p> : null}

            {result?.variants?.length ? (
              <div>
                <p className="mb-2 text-xs font-medium text-ink-600">Channel variants</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.variants.map((v) => (
                    <button
                      key={v.platform}
                      type="button"
                      onClick={() => applyVariant(v)}
                      className="rounded-xl border border-ink-200 bg-ink-50/50 p-3 text-left hover:border-brand-300 hover:bg-brand-50/30"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <Badge tone="neutral">{v.platform}</Badge>
                        <Copy className="h-3 w-3 text-ink-400" />
                      </div>
                      <p className="line-clamp-3 text-[11px] text-ink-600">{v.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent content" subtitle="All statuses for this restaurant" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-[11px] uppercase text-ink-400">
              <tr>
                <th className="px-5 py-2 font-medium">Title</th>
                <th className="px-5 py-2 font-medium">Platforms</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.content || []).map((c) => (
                <tr key={c.id} className="border-b border-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{c.title}</p>
                    <p className="line-clamp-1 text-[11px] text-ink-500">{c.body}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-600">{c.platforms.join(", ")}</td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        c.status === "published" || c.status === "approved"
                          ? "success"
                          : c.status === "pending_approval"
                            ? "warn"
                            : c.status === "scheduled"
                              ? "info"
                              : "neutral"
                      }
                    >
                      {c.status.replace("_", " ")}
                    </Badge>
                    {c.aiGenerated ? <span className="ml-2 text-[10px] text-ink-400">AI</span> : null}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-500">{formatDateTime(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
