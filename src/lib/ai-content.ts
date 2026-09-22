import type { ContentPlatform, Restaurant } from "./types";

export type GenerateInput = {
  restaurant: Pick<Restaurant, "name" | "cuisine" | "city" | "brandVoice">;
  goal:
    | "promo"
    | "new_item"
    | "behind_scenes"
    | "loyalty"
    | "event"
    | "ugc_reply"
    | "story"
    | "ad_primary"
    | "email_subject"
    | "sms";
  platform: ContentPlatform | "multi";
  topic: string;
  offerCode?: string;
  tone?: "warm" | "bold" | "playful" | "elegant" | "urgent";
  includeHashtags?: boolean;
  length?: "short" | "medium" | "long";
  /** Force a provider for this call; default uses AI_PROVIDER env */
  provider?: AiProviderName;
};

export type AiProviderName = "auto" | "demo" | "openai" | "anthropic";

export type GenerateResult = {
  title: string;
  body: string;
  hashtags: string[];
  platforms: ContentPlatform[];
  cta: string;
  variants: { platform: ContentPlatform; body: string }[];
  altHooks: string[];
  demo: boolean;
  provider: "demo-engine" | "openai" | "anthropic";
  model?: string;
  errorFallback?: string;
};

export type AiStatus = {
  preferred: AiProviderName;
  activeProvider: "demo-engine" | "openai" | "anthropic";
  openai: { configured: boolean; model: string };
  anthropic: { configured: boolean; model: string };
  demo: { configured: true; model: "local-template-engine" };
  message: string;
  howTo: { openai: string; anthropic: string; switch: string };
};

const PLATFORM_DEFAULTS: Record<string, ContentPlatform[]> = {
  multi: ["instagram", "facebook", "tiktok"],
  instagram: ["instagram"],
  facebook: ["facebook"],
  tiktok: ["tiktok"],
  x: ["x"],
  linkedin: ["linkedin"],
  google_business: ["google_business"],
  email: ["email"],
  sms: ["sms"],
};

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildSystemPrompt() {
  return `You are the social and CRM content engine for a restaurant brand.
Write high-converting, brand-safe copy. Never invent fake reviews or false scarcity.
Always respect channel norms (SMS short with STOP, Instagram scannable, email with greeting).
Return ONLY valid JSON with keys:
title (string), body (string), hashtags (string array), cta (string), altHooks (string array of 3),
variants (array of {platform, body} for instagram, facebook, tiktok, sms, email).`;
}

function buildUserPrompt(input: GenerateInput) {
  return `Restaurant: ${input.restaurant.name}
Cuisine: ${input.restaurant.cuisine}
City: ${input.restaurant.city}
Brand voice: ${input.restaurant.brandVoice}
Goal: ${input.goal}
Primary platform: ${input.platform}
Topic / brief: ${input.topic}
Offer code: ${input.offerCode || "none"}
Tone: ${input.tone || "warm"}
Length: ${input.length || "medium"}
Include hashtags: ${input.includeHashtags !== false}
Write channel-native copy. If offer code exists, include it naturally.`;
}

function parseModelJson(raw: string, fallback: GenerateResult, provider: "openai" | "anthropic", model: string): GenerateResult {
  let parsed: Record<string, unknown> = {};
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { ...fallback, errorFallback: "Model returned non-JSON; used demo engine body merge" };
  }

  const variantsRaw = Array.isArray(parsed.variants) ? parsed.variants : fallback.variants;
  const variants = (variantsRaw as { platform?: string; body?: string }[])
    .filter((v) => v && v.platform && v.body)
    .map((v) => ({
      platform: v.platform as ContentPlatform,
      body: String(v.body),
    }));

  return {
    ...fallback,
    title: String(parsed.title || fallback.title),
    body: String(parsed.body || fallback.body),
    hashtags: Array.isArray(parsed.hashtags)
      ? (parsed.hashtags as unknown[]).map(String)
      : fallback.hashtags,
    cta: String(parsed.cta || fallback.cta),
    altHooks: Array.isArray(parsed.altHooks)
      ? (parsed.altHooks as unknown[]).map(String)
      : fallback.altHooks,
    variants: variants.length ? variants : fallback.variants,
    demo: false,
    provider,
    model,
  };
}

/**
 * Local demo AI engine — always works offline (no keys).
 */
export function generateContentLocal(input: GenerateInput): GenerateResult {
  const tone = input.tone || "warm";
  const seed = hash(`${input.topic}|${input.goal}|${input.platform}|${tone}`);
  const name = input.restaurant.name;
  const city = input.restaurant.city;
  const cuisine = input.restaurant.cuisine;
  const offer = input.offerCode ? ` Use code ${input.offerCode}.` : "";

  const hooks = [
    `${city} — this one's for you.`,
    `Fresh from the pass at ${name}.`,
    `A little ${cuisine.toLowerCase()} magic, coming right up.`,
    `Your weeknight just got an upgrade.`,
    `Because good food shouldn't wait for a special occasion.`,
    `Same kitchen. New reason to swing by.`,
  ];

  const ctas = [
    "Reserve tonight",
    "Order ahead on the app",
    "Show this post at the host stand",
    "Tap the link in bio",
    "Join loyalty in 30 seconds",
    "Share with your crew",
  ];

  const goalLines: Record<GenerateInput["goal"], string[]> = {
    promo: [
      `${pick(hooks, seed)} ${input.topic}.${offer} Limited time — while it lasts.`,
      `Offer alert: ${input.topic}.${offer} Available across dine-in, takeout, and the app — just like the big chains keep national deals in one place.`,
    ],
    new_item: [
      `New on the menu: ${input.topic}. Crafted for ${city} tastes, plated with ${cuisine.toLowerCase()} soul.`,
      `Meet ${input.topic} — the dish your group chat will argue about (in a good way).`,
    ],
    behind_scenes: [
      `Behind the line: ${input.topic}. Real prep, real people, zero fluff.`,
      `Sunrise prep at ${name}. ${input.topic} starts long before service.`,
    ],
    loyalty: [
      `Members first: ${input.topic}.${offer} Points, perks, and the occasional double-dip week.`,
      `Loyalty that feels less like a punch card and more like a thank-you. ${input.topic}.${offer}`,
    ],
    event: [
      `Mark it: ${input.topic}. ${name} is hosting — ${city}, pull up.`,
      `Event energy: ${input.topic}. Tables are limited; good vibes aren't.`,
    ],
    ugc_reply: [
      `We're blushing — thanks for shouting out ${input.topic}. See you soon at ${name}.`,
      `This made our whole expo line smile. ${input.topic} hits different when guests share it.`,
    ],
    story: [
      `${input.topic} — swipe-up energy, story-length. Come hungry.`,
      `Quick hit: ${input.topic}.${offer}`,
    ],
    ad_primary: [
      `${input.topic} at ${name}. ${city}'s favorite ${cuisine.toLowerCase()} stop.${offer}`,
      `Craving ${input.topic}? ${name} delivers the goods — order or dine in.`,
    ],
    email_subject: [
      `${input.topic} — inside for ${name} guests`,
      `Your ${city} invite: ${input.topic}`,
    ],
    sms: [
      `${name}: ${input.topic}.${offer} Reply STOP to opt out.`,
      `${name} drop: ${input.topic}.${offer} Open the app to claim.`,
    ],
  };

  const tonePrefix: Record<string, string> = {
    warm: "",
    bold: "Big move. ",
    playful: "Okay, hear us out — ",
    elegant: "A note from the team: ",
    urgent: "Tonight only. ",
  };

  const base = pick(goalLines[input.goal], seed);
  let body = `${tonePrefix[tone]}${base}`;

  const platform = input.platform as string;
  if (platform === "x") {
    body = body.slice(0, 240);
  } else if (platform === "sms") {
    body = body.slice(0, 160);
  } else if (platform === "linkedin") {
    body += ` Ideal for teams and neighborhood partners who care about local dining done right.`;
  } else if (platform === "tiktok") {
    body = `POV: you find ${input.topic} at ${name} 🔥 ${offer}`.trim();
  } else if (input.length === "long" && platform !== "sms") {
    body += ` Consistent offer messaging across app, POS, and social — one code, every channel.`;
  } else if (input.length === "short") {
    body = body.split(".")[0] + "." + offer;
  }

  const tagPool = [
    `#${city.replace(/\s/g, "")}Eats`,
    `#${name.replace(/\s/g, "")}`,
    "#SupportLocal",
    "#Foodie",
    "#RestaurantLife",
    "#ChefSpecial",
    "#LoyaltyRewards",
    "#HappyHour",
    "#FarmToTable",
    "#WeeknightDinner",
  ];
  const hashtags =
    input.includeHashtags === false
      ? []
      : [tagPool[seed % tagPool.length], tagPool[(seed + 3) % tagPool.length], tagPool[(seed + 5) % tagPool.length]];

  const platforms = PLATFORM_DEFAULTS[input.platform] || ["instagram"];

  return {
    title: pick(
      [input.topic.slice(0, 48), `${input.goal.replace(/_/g, " ")} — ${input.topic}`.slice(0, 60), `${name}: ${input.topic}`.slice(0, 60)],
      seed
    ),
    body,
    hashtags,
    platforms,
    cta: pick(ctas, seed + 1),
    variants: [
      { platform: "instagram", body: `${body}\n\n${hashtags.join(" ")}` },
      { platform: "facebook", body: `${body}\n\nTag someone who needs this.` },
      { platform: "tiktok", body: `POV: ${input.topic} at ${name} 🔥${offer}` },
      { platform: "sms", body: `${name}: ${input.topic}.${offer}`.slice(0, 160) },
      {
        platform: "email",
        body: `Subject idea: ${input.topic}\n\nHi {{first_name}},\n\n${body}\n\nSee you soon,\n${name}`,
      },
    ],
    altHooks: hooks.slice(0, 4),
    demo: true,
    provider: "demo-engine",
    model: "local-template-engine",
  };
}

async function generateOpenAI(input: GenerateInput, fallback: GenerateResult): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return parseModelJson(raw, fallback, "openai", model);
}

async function generateAnthropic(input: GenerateInput, fallback: GenerateResult): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.8,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserPrompt(input) + "\n\nRespond with JSON only, no markdown." }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw =
    (Array.isArray(data.content)
      ? data.content.map((c: { text?: string }) => c.text || "").join("")
      : "") || "{}";
  return parseModelJson(raw, fallback, "anthropic", model);
}

export function getAiStatus(): AiStatus {
  const preferred = (process.env.AI_PROVIDER || "auto").toLowerCase() as AiProviderName;
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const anthropicKey = !!process.env.ANTHROPIC_API_KEY;

  let active: AiStatus["activeProvider"] = "demo-engine";
  if (preferred === "openai" && openaiKey) active = "openai";
  else if (preferred === "anthropic" && anthropicKey) active = "anthropic";
  else if (preferred === "demo") active = "demo-engine";
  else if (preferred === "auto") {
    if (openaiKey) active = "openai";
    else if (anthropicKey) active = "anthropic";
    else active = "demo-engine";
  } else if (preferred === "openai" && !openaiKey) active = "demo-engine";
  else if (preferred === "anthropic" && !anthropicKey) active = "demo-engine";

  const message =
    active === "demo-engine"
      ? "Local demo AI is active (works without keys). Add OPENAI_API_KEY and/or ANTHROPIC_API_KEY for ChatGPT/Claude quality."
      : active === "openai"
        ? "Using OpenAI (ChatGPT models)."
        : "Using Anthropic (Claude models).";

  return {
    preferred: ["auto", "demo", "openai", "anthropic"].includes(preferred) ? preferred : "auto",
    activeProvider: active,
    openai: {
      configured: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    anthropic: {
      configured: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    },
    demo: { configured: true, model: "local-template-engine" },
    message,
    howTo: {
      openai:
        "Get a key at https://platform.openai.com/api-keys → set OPENAI_API_KEY=sk-... and optional OPENAI_MODEL=gpt-4o-mini (or gpt-4o).",
      anthropic:
        "Get a key at https://console.anthropic.com/ → set ANTHROPIC_API_KEY=sk-ant-... and optional ANTHROPIC_MODEL=claude-sonnet-4-20250514.",
      switch:
        "Set AI_PROVIDER=auto|openai|anthropic|demo in .env.local (local) or Vercel Environment Variables (production). Restart/redeploy after change.",
    },
  };
}

/**
 * Multi-provider generator:
 * - AI_PROVIDER=auto → OpenAI if key, else Anthropic if key, else demo
 * - AI_PROVIDER=openai|anthropic|demo → force that path (falls back to demo on error)
 */
export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  const local = generateContentLocal(input);
  const preferred = (input.provider || process.env.AI_PROVIDER || "auto").toLowerCase() as AiProviderName;
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const anthropicKey = !!process.env.ANTHROPIC_API_KEY;

  const order: Array<"openai" | "anthropic" | "demo"> = [];
  if (preferred === "demo") order.push("demo");
  else if (preferred === "openai") order.push("openai", "demo");
  else if (preferred === "anthropic") order.push("anthropic", "demo");
  else {
    // auto
    if (openaiKey) order.push("openai");
    if (anthropicKey) order.push("anthropic");
    order.push("demo");
  }

  let lastError = "";
  for (const p of order) {
    if (p === "demo") {
      return lastError ? { ...local, errorFallback: lastError } : local;
    }
    try {
      if (p === "openai") {
        if (!openaiKey) {
          lastError = "OpenAI requested but OPENAI_API_KEY not set";
          continue;
        }
        return await generateOpenAI(input, local);
      }
      if (p === "anthropic") {
        if (!anthropicKey) {
          lastError = "Anthropic requested but ANTHROPIC_API_KEY not set";
          continue;
        }
        return await generateAnthropic(input, local);
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Provider failed";
      // try next
    }
  }
  return { ...local, errorFallback: lastError || "All providers failed" };
}

export const CONTENT_GOALS = [
  { id: "promo", label: "Promo / Offer", desc: "Drive redemptions like national QSR drops" },
  { id: "new_item", label: "New menu item", desc: "Launch LTO or signature dish" },
  { id: "loyalty", label: "Loyalty / CRM", desc: "Points, tiers, member-only" },
  { id: "event", label: "Event / RSVP", desc: "Brunch, live music, tastings" },
  { id: "behind_scenes", label: "Behind the scenes", desc: "Chef, prep, culture" },
  { id: "story", label: "Stories / short", desc: "Ephemeral story copy" },
  { id: "ad_primary", label: "Ad primary text", desc: "Paid social primary" },
  { id: "email_subject", label: "Email", desc: "Subject + body scaffold" },
  { id: "sms", label: "SMS blast", desc: "160-char loyalty/offer" },
  { id: "ugc_reply", label: "UGC reply", desc: "Respond to guest posts" },
] as const;

export const PLATFORMS: { id: ContentPlatform | "multi"; label: string }[] = [
  { id: "multi", label: "Multi-platform" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "x", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "google_business", label: "Google Business" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
];
