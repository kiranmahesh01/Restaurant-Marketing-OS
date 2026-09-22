import { createInitialStore } from "./demo-data";
import type {
  AuditLog,
  SupportTicket,
  BlastSegment,
  Campaign,
  ContentItem,
  ContentPlatform,
  ContentStatus,
  Customer,
  MediaAsset,
  MessageBlast,
  Notification,
  Offer,
  Order,
  Restaurant,
  Review,
  StoreShape,
} from "./types";
import { uid } from "./utils";
import { generateContentLocal } from "./ai-content";

const GLOBAL_KEY = "__RMOS_STORE__";

type GlobalStore = {
  data: StoreShape;
};

function getGlobal(): GlobalStore {
  const g = globalThis as unknown as Record<string, GlobalStore | undefined>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { data: createInitialStore() };
  }
  const data = g[GLOBAL_KEY]!.data;
  // Backward-safe for hot reload / partial seeds
  if (!data.media) data.media = [];
  if (!data.blasts) data.blasts = [];
  if (!data.tickets) data.tickets = [];
  if (!data.activeUserId) data.activeUserId = data.users?.[0]?.id || "";
  return g[GLOBAL_KEY]!;
}

export function getStore(): StoreShape {
  return getGlobal().data;
}

export function setStore(next: StoreShape) {
  getGlobal().data = next;
}

export function mutateStore(fn: (s: StoreShape) => void): StoreShape {
  const s = structuredClone(getStore());
  fn(s);
  setStore(s);
  return s;
}

export function activeRestaurantId() {
  return getStore().activeRestaurantId;
}

export function scoped<T extends { restaurantId: string }>(items: T[], restaurantId?: string) {
  const rid = restaurantId || activeRestaurantId();
  return items.filter((i) => i.restaurantId === rid);
}

export function addAudit(
  s: StoreShape,
  partial: Omit<AuditLog, "id" | "createdAt" | "restaurantId"> & { restaurantId?: string }
) {
  s.auditLogs.unshift({
    id: uid("aud"),
    restaurantId: partial.restaurantId || s.activeRestaurantId,
    actor: partial.actor,
    action: partial.action,
    entityType: partial.entityType,
    entityId: partial.entityId,
    meta: partial.meta,
    createdAt: new Date().toISOString(),
  });
}

export function addNotification(
  s: StoreShape,
  partial: Omit<Notification, "id" | "createdAt" | "read" | "restaurantId"> & {
    restaurantId?: string;
    read?: boolean;
  }
) {
  s.notifications.unshift({
    id: uid("ntf"),
    restaurantId: partial.restaurantId || s.activeRestaurantId,
    type: partial.type,
    title: partial.title,
    body: partial.body,
    href: partial.href,
    read: partial.read ?? false,
    createdAt: new Date().toISOString(),
  });
}

export function getActiveUser() {
  const s = getStore();
  return s.users.find((u) => u.id === s.activeUserId) || s.users[0];
}

export function switchUser(userId: string) {
  return mutateStore((s) => {
    const u = s.users.find((x) => x.id === userId);
    if (!u) throw new Error("User not found");
    s.activeUserId = userId;
    // Client personas lock to their restaurants; admin keeps current or first
    if (u.portal === "client" && u.restaurantIds.length) {
      if (!u.restaurantIds.includes(s.activeRestaurantId)) {
        s.activeRestaurantId = u.restaurantIds[0];
      }
    }
    addAudit(s, {
      actor: u.name,
      action: "session.switch_user",
      entityType: "user",
      entityId: u.id,
      meta: { role: u.role, portal: u.portal },
    });
  });
}

export function getDashboardBundle(restaurantId?: string) {
  const s = getStore();
  const user = s.users.find((u) => u.id === s.activeUserId) || s.users[0];
  const rid = restaurantId || s.activeRestaurantId;
  const restaurant = s.restaurants.find((r) => r.id === rid) || s.restaurants[0];

  // Restaurant list: admin sees all; client sees assigned only
  const restaurants =
    user?.role === "platform_admin" || user?.portal === "admin"
      ? s.restaurants
      : s.restaurants.filter((r) => (user?.restaurantIds || []).includes(r.id));

  const ticketsAll = s.tickets || [];
  const tickets =
    user?.portal === "admin"
      ? ticketsAll.slice(0, 100)
      : ticketsAll.filter((t) => t.restaurantId === rid).slice(0, 50);

  return {
    demoMode: s.demoMode,
    restaurant,
    restaurants,
    user,
    users: s.users,
    portal: user?.portal || "client",
    role: user?.role || "viewer",
    content: scoped(s.content, rid),
    offers: scoped(s.offers, rid),
    customers: scoped(s.customers, rid),
    orders: scoped(s.orders, rid),
    reviews: scoped(s.reviews, rid),
    integrations: scoped(s.integrations, rid),
    notifications: scoped(s.notifications, rid),
    auditLogs: scoped(s.auditLogs, rid).slice(0, 50),
    campaigns: scoped(s.campaigns, rid),
    ads: scoped(s.ads, rid),
    analytics: s.analytics.find((a) => a.restaurantId === rid) || s.analytics[0],
    media: scoped(s.media || [], rid),
    blasts: scoped(s.blasts || [], rid),
    tickets,
    orgStats:
      user?.portal === "admin"
        ? {
            restaurantCount: s.restaurants.length,
            openTickets: ticketsAll.filter((t) => t.status === "open" || t.status === "in_progress").length,
            contentPending: s.content.filter((c) => c.status === "pending_approval").length,
            activeOffers: s.offers.filter((o) => o.status === "active").length,
            totalCustomers: s.customers.length,
            totalOrders: s.orders.length,
          }
        : null,
  };
}

export function createTicket(input: {
  subject: string;
  body: string;
  priority?: SupportTicket["priority"];
  category?: SupportTicket["category"];
  restaurantId?: string;
}) {
  return mutateStore((s) => {
    if (!s.tickets) s.tickets = [];
    const user = s.users.find((u) => u.id === s.activeUserId) || s.users[0];
    const rid = input.restaurantId || s.activeRestaurantId;
    const rest = s.restaurants.find((r) => r.id === rid);
    const t: SupportTicket = {
      id: uid("tkt"),
      restaurantId: rid,
      restaurantName: rest?.name || "Restaurant",
      createdBy: user?.name || "User",
      priority: input.priority || "medium",
      category: input.category || "other",
      subject: input.subject,
      body: input.body,
      status: "open",
      assignee: "Sam Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    s.tickets.unshift(t);
    addAudit(s, {
      actor: t.createdBy,
      action: "ticket.created",
      entityType: "ticket",
      entityId: t.id,
    });
    addNotification(s, {
      type: "system",
      title: "Support ticket opened",
      body: t.subject,
      href: user?.portal === "admin" ? "/admin" : "/support",
    });
  }).tickets[0];
}

export function updateTicket(
  id: string,
  patch: Partial<SupportTicket>
) {
  return mutateStore((s) => {
    const idx = (s.tickets || []).findIndex((t) => t.id === id);
    if (idx < 0) throw new Error("Ticket not found");
    s.tickets[idx] = {
      ...s.tickets[idx],
      ...patch,
      id: s.tickets[idx].id,
      updatedAt: new Date().toISOString(),
    };
    addAudit(s, {
      actor: getActiveUser()?.name || "User",
      action: `ticket.${patch.status || "updated"}`,
      entityType: "ticket",
      entityId: id,
    });
  }).tickets.find((t) => t.id === id)!;
}

export function segmentCustomers(restaurantId: string, segment: BlastSegment): Customer[] {
  const s = getStore();
  const list = scoped(s.customers, restaurantId).filter((c) => c.marketingOptIn);
  const now = new Date();
  switch (segment) {
    case "all_opted_in":
      return list;
    case "loyalty":
      return list.filter((c) => c.tier !== "bronze" || c.points >= 200);
    case "vip":
      return list.filter((c) => c.tier === "gold" || c.tier === "platinum" || c.tags.includes("vip"));
    case "lapsed":
      return list.filter((c) => {
        if (c.tags.includes("lapsed") || c.tags.includes("winback")) return true;
        if (!c.lastVisitAt) return true;
        const days = (now.getTime() - new Date(c.lastVisitAt).getTime()) / 86400000;
        return days >= 30;
      });
    case "new":
      return list.filter((c) => c.visitCount <= 2 || c.tags.includes("new"));
    case "birthday_month":
      return list.filter((c) => {
        if (!c.birthday) return false;
        const m = Number(c.birthday.slice(5, 7));
        return m === now.getMonth() + 1;
      });
    default:
      return list;
  }
}

export function createMediaAsset(
  input: Partial<MediaAsset> & { name: string; url: string }
): MediaAsset {
  return mutateStore((s) => {
    if (!s.media) s.media = [];
    const asset: MediaAsset = {
      id: uid("media"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      name: input.name,
      mimeType: input.mimeType || "image/jpeg",
      size: input.size || 0,
      url: input.url,
      kind: input.kind || (input.mimeType?.startsWith("video/") ? "video" : "image"),
      width: input.width,
      height: input.height,
      source: input.source || "upload",
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
    };
    s.media.unshift(asset);
    addAudit(s, {
      actor: "Alex Rivera",
      action: "media.uploaded",
      entityType: "media",
      entityId: asset.id,
      meta: { name: asset.name, kind: asset.kind },
    });
  }).media[0];
}

export function deleteMediaAsset(id: string) {
  return mutateStore((s) => {
    s.media = (s.media || []).filter((m) => m.id !== id);
    addAudit(s, {
      actor: "Alex Rivera",
      action: "media.deleted",
      entityType: "media",
      entityId: id,
    });
  });
}

export function createBlast(
  input: Partial<MessageBlast> & { name: string; body: string; channel: "sms" | "email" }
): MessageBlast {
  return mutateStore((s) => {
    if (!s.blasts) s.blasts = [];
    const segment = (input.segment || "all_opted_in") as BlastSegment;
    const audience = segmentCustomers(input.restaurantId || s.activeRestaurantId, segment);
    const channel = input.channel;
    const eligible =
      channel === "sms"
        ? audience.filter((c) => !!c.phone)
        : audience.filter((c) => !!c.email);

    const blast: MessageBlast = {
      id: uid("blast"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      name: input.name,
      channel,
      segment,
      subject: input.subject,
      body: input.body,
      offerId: input.offerId,
      offerCode: input.offerCode,
      status: input.status || "draft",
      audienceCount: eligible.length,
      sentCount: 0,
      scheduledAt: input.scheduledAt,
      demo: true,
      createdAt: new Date().toISOString(),
    };
    s.blasts.unshift(blast);
    addAudit(s, {
      actor: "Alex Rivera",
      action: "blast.created",
      entityType: "blast",
      entityId: blast.id,
      meta: { segment, channel, audience: blast.audienceCount },
    });
  }).blasts[0];
}

export function sendBlast(id: string) {
  return mutateStore((s) => {
    const idx = (s.blasts || []).findIndex((b) => b.id === id);
    if (idx < 0) throw new Error("Blast not found");
    const blast = s.blasts[idx];
    // Demo send — no Twilio/Mailchimp call
    s.blasts[idx] = {
      ...blast,
      status: "sent",
      sentCount: blast.audienceCount,
      sentAt: new Date().toISOString(),
      demo: true,
    };
    addAudit(s, {
      actor: "Alex Rivera",
      action: "blast.sent_demo",
      entityType: "blast",
      entityId: id,
      meta: { sentCount: blast.audienceCount, channel: blast.channel },
    });
    addNotification(s, {
      type: "campaign",
      title: `${blast.channel.toUpperCase()} blast logged`,
      body: `“${blast.name}” marked sent to ${blast.audienceCount} guests (demo — connect Twilio/Mailchimp to deliver).`,
      href: "/blasts",
    });
  }).blasts.find((b) => b.id === id)!;
}

export type CampaignDropInput = {
  name: string;
  topic: string;
  offerMode: "new" | "existing";
  existingOfferId?: string;
  offer?: {
    name: string;
    code: string;
    description?: string;
    type?: Offer["type"];
    value?: number;
    audience?: Offer["audience"];
    channels?: Offer["channels"];
  };
  platforms: ContentPlatform[];
  tone?: "warm" | "bold" | "playful" | "elegant" | "urgent";
  mediaUrls?: string[];
  scheduleAt?: string;
  submitForApproval?: boolean;
  activateOffer?: boolean;
  objective?: Campaign["objective"];
  budget?: number;
};

export function createCampaignDrop(input: CampaignDropInput) {
  let result: {
    campaign: Campaign;
    offer: Offer;
    content: ContentItem[];
  } | null = null;

  mutateStore((s) => {
    const rid = s.activeRestaurantId;
    const restaurant = s.restaurants.find((r) => r.id === rid)!;
    const startAt = new Date().toISOString();
    const endAt = new Date(Date.now() + 21 * 86400000).toISOString();

    let offer: Offer;
    if (input.offerMode === "existing" && input.existingOfferId) {
      const found = s.offers.find((o) => o.id === input.existingOfferId);
      if (!found) throw new Error("Offer not found");
      offer = found;
      if (input.activateOffer && offer.status !== "active") {
        offer.status = "active";
      }
    } else {
      if (!input.offer?.name || !input.offer?.code) {
        throw new Error("Offer name and code required");
      }
      offer = {
        id: uid("off"),
        restaurantId: rid,
        name: input.offer.name,
        code: input.offer.code.toUpperCase(),
        description: input.offer.description || input.topic,
        type: input.offer.type || "percent",
        value: input.offer.value ?? 15,
        channels: input.offer.channels || ["app", "pos", "social", "email", "sms"],
        status: input.activateOffer ? "active" : "scheduled",
        startsAt: startAt,
        endsAt: endAt,
        redemptions: 0,
        revenueAttributed: 0,
        audience: input.offer.audience || "all",
        stackable: false,
        createdAt: new Date().toISOString(),
      };
      s.offers.unshift(offer);
    }

    const campaign: Campaign = {
      id: uid("cmp"),
      restaurantId: rid,
      name: input.name,
      objective: input.objective || "launch",
      status: "active",
      budget: input.budget ?? 500,
      spent: 0,
      channels: Array.from(
        new Set([...input.platforms.map(String), ...offer.channels])
      ),
      startAt,
      endAt: input.scheduleAt || endAt,
      metrics: { impressions: 0, clicks: 0, conversions: 0, roas: 0 },
    };
    s.campaigns.unshift(campaign);

    const platforms =
      input.platforms.length > 0
        ? input.platforms
        : (["instagram", "facebook", "sms"] as ContentPlatform[]);

    // One multi-platform post + channel-native variants for sms/email if selected
    const primaryPlatforms = platforms.filter((p) => p !== "sms" && p !== "email");
    const contentItems: ContentItem[] = [];

    const gen = generateContentLocal({
      restaurant,
      goal: "promo",
      platform: primaryPlatforms[0] || "instagram",
      topic: input.topic,
      offerCode: offer.code,
      tone: input.tone || "warm",
      includeHashtags: true,
      length: "medium",
    });

    const status: ContentStatus = input.scheduleAt
      ? "scheduled"
      : input.submitForApproval === false
        ? "approved"
        : "pending_approval";

    if (primaryPlatforms.length) {
      const item: ContentItem = {
        id: uid("cnt"),
        restaurantId: rid,
        title: `${input.name} — social`,
        body: gen.body,
        hashtags: gen.hashtags,
        platforms: primaryPlatforms,
        status,
        mediaUrls: input.mediaUrls || [],
        mediaType: input.mediaUrls?.length ? "image" : "none",
        scheduledAt: input.scheduleAt,
        createdBy: "Campaign Drop",
        aiGenerated: true,
        campaignId: campaign.id,
        offerId: offer.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.content.unshift(item);
      contentItems.push(item);
    }

    if (platforms.includes("sms")) {
      const smsGen = generateContentLocal({
        restaurant,
        goal: "sms",
        platform: "sms",
        topic: input.topic,
        offerCode: offer.code,
        tone: input.tone || "urgent",
        length: "short",
        includeHashtags: false,
      });
      const sms: ContentItem = {
        id: uid("cnt"),
        restaurantId: rid,
        title: `${input.name} — SMS`,
        body: smsGen.body.slice(0, 160),
        hashtags: [],
        platforms: ["sms"],
        status,
        mediaUrls: [],
        mediaType: "none",
        scheduledAt: input.scheduleAt,
        createdBy: "Campaign Drop",
        aiGenerated: true,
        campaignId: campaign.id,
        offerId: offer.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.content.unshift(sms);
      contentItems.push(sms);
    }

    if (platforms.includes("email")) {
      const emailGen = generateContentLocal({
        restaurant,
        goal: "email_subject",
        platform: "email",
        topic: input.topic,
        offerCode: offer.code,
        tone: input.tone || "warm",
        length: "medium",
        includeHashtags: false,
      });
      const email: ContentItem = {
        id: uid("cnt"),
        restaurantId: rid,
        title: `${input.name} — email`,
        body: emailGen.variants.find((v) => v.platform === "email")?.body || emailGen.body,
        hashtags: [],
        platforms: ["email"],
        status,
        mediaUrls: input.mediaUrls || [],
        mediaType: input.mediaUrls?.length ? "image" : "none",
        scheduledAt: input.scheduleAt,
        createdBy: "Campaign Drop",
        aiGenerated: true,
        campaignId: campaign.id,
        offerId: offer.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      s.content.unshift(email);
      contentItems.push(email);
    }

    addAudit(s, {
      actor: "Alex Rivera",
      action: "campaign.drop_created",
      entityType: "campaign",
      entityId: campaign.id,
      meta: {
        offerId: offer.id,
        contentIds: contentItems.map((c) => c.id),
        platforms,
      },
    });
    addNotification(s, {
      type: "campaign",
      title: "Campaign drop ready",
      body: `“${campaign.name}” created with offer ${offer.code} and ${contentItems.length} content piece(s).`,
      href: status === "pending_approval" ? "/approvals" : "/calendar",
    });
    if (status === "pending_approval") {
      addNotification(s, {
        type: "approval",
        title: "Drop content awaits approval",
        body: `${contentItems.length} asset(s) from “${campaign.name}” need review.`,
        href: "/approvals",
      });
    }

    result = { campaign, offer, content: contentItems };
  });

  return result!;
}

export function createContent(
  input: Partial<ContentItem> & { title: string; body: string }
): ContentItem {
  return mutateStore((s) => {
    const item: ContentItem = {
      id: uid("cnt"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      title: input.title,
      body: input.body,
      hashtags: input.hashtags || [],
      platforms: input.platforms || ["instagram"],
      status: (input.status as ContentStatus) || "draft",
      mediaUrls: input.mediaUrls || [],
      mediaType: input.mediaType || "none",
      scheduledAt: input.scheduledAt,
      createdBy: input.createdBy || "Alex Rivera",
      aiGenerated: !!input.aiGenerated,
      campaignId: input.campaignId,
      offerId: input.offerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    s.content.unshift(item);
    addAudit(s, {
      actor: item.createdBy,
      action: item.aiGenerated ? "content.generated" : "content.created",
      entityType: "content",
      entityId: item.id,
    });
    if (item.status === "pending_approval") {
      addNotification(s, {
        type: "approval",
        title: "Content awaiting approval",
        body: `“${item.title}” is ready for review.`,
        href: "/approvals",
      });
    }
  }).content[0];
}

export function updateContent(id: string, patch: Partial<ContentItem>) {
  return mutateStore((s) => {
    const idx = s.content.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Content not found");
    const prev = s.content[idx];
    s.content[idx] = {
      ...prev,
      ...patch,
      id: prev.id,
      restaurantId: prev.restaurantId,
      updatedAt: new Date().toISOString(),
    };
    addAudit(s, {
      actor: patch.approvedBy || patch.createdBy || "Alex Rivera",
      action: `content.${patch.status || "updated"}`,
      entityType: "content",
      entityId: id,
      meta: patch as Record<string, unknown>,
    });
  }).content.find((c) => c.id === id)!;
}

export function createOffer(input: Partial<Offer> & { name: string; code: string }): Offer {
  return mutateStore((s) => {
    const offer: Offer = {
      id: uid("off"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description || "",
      type: input.type || "percent",
      value: input.value ?? 10,
      channels: input.channels || ["app", "pos", "social"],
      status: input.status || "draft",
      startsAt: input.startsAt || new Date().toISOString(),
      endsAt: input.endsAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      minOrder: input.minOrder,
      maxRedemptions: input.maxRedemptions,
      redemptions: 0,
      revenueAttributed: 0,
      audience: input.audience || "all",
      stackable: !!input.stackable,
      createdAt: new Date().toISOString(),
    };
    s.offers.unshift(offer);
    addAudit(s, {
      actor: "Alex Rivera",
      action: "offer.created",
      entityType: "offer",
      entityId: offer.id,
    });
  }).offers[0];
}

export function updateOffer(id: string, patch: Partial<Offer>) {
  return mutateStore((s) => {
    const idx = s.offers.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error("Offer not found");
    s.offers[idx] = { ...s.offers[idx], ...patch, id: s.offers[idx].id };
    addAudit(s, {
      actor: "Alex Rivera",
      action: `offer.${patch.status || "updated"}`,
      entityType: "offer",
      entityId: id,
    });
  }).offers.find((o) => o.id === id)!;
}

export function createCustomer(input: Partial<Customer> & { name: string }): Customer {
  return mutateStore((s) => {
    const c: Customer = {
      id: uid("cus"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      tier: input.tier || "bronze",
      points: input.points ?? 0,
      lifetimeSpend: input.lifetimeSpend ?? 0,
      visitCount: input.visitCount ?? 0,
      lastVisitAt: input.lastVisitAt,
      tags: input.tags || [],
      source: input.source || "import",
      birthday: input.birthday,
      marketingOptIn: input.marketingOptIn ?? true,
      createdAt: new Date().toISOString(),
    };
    s.customers.unshift(c);
    addAudit(s, {
      actor: "Alex Rivera",
      action: "customer.created",
      entityType: "customer",
      entityId: c.id,
    });
  }).customers[0];
}

export function updateReview(id: string, patch: Partial<Review>) {
  return mutateStore((s) => {
    const idx = s.reviews.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Review not found");
    s.reviews[idx] = { ...s.reviews[idx], ...patch, id: s.reviews[idx].id };
    addAudit(s, {
      actor: "Alex Rivera",
      action: patch.replied ? "review.replied" : "review.updated",
      entityType: "review",
      entityId: id,
    });
  }).reviews.find((r) => r.id === id)!;
}

export function markNotificationsRead(ids?: string[]) {
  return mutateStore((s) => {
    s.notifications = s.notifications.map((n) =>
      !ids || ids.includes(n.id) ? { ...n, read: true } : n
    );
  }).notifications;
}

export function setIntegrationStatus(
  id: string,
  status: "connected" | "disconnected" | "error" | "pending"
) {
  return mutateStore((s) => {
    const idx = s.integrations.findIndex((i) => i.id === id);
    if (idx < 0) throw new Error("Integration not found");
    s.integrations[idx] = {
      ...s.integrations[idx],
      status,
      lastSyncAt: status === "connected" ? new Date().toISOString() : s.integrations[idx].lastSyncAt,
    };
    addAudit(s, {
      actor: "Alex Rivera",
      action: `integration.${status}`,
      entityType: "integration",
      entityId: id,
    });
  }).integrations.find((i) => i.id === id)!;
}

export function onboardRestaurant(input: {
  name: string;
  cuisine: string;
  city: string;
  state: string;
  brandVoice?: string;
}): Restaurant {
  return mutateStore((s) => {
    const r: Restaurant = {
      id: uid("rest"),
      orgId: s.restaurants[0]?.orgId || "org_demo",
      name: input.name,
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      cuisine: input.cuisine,
      city: input.city,
      state: input.state,
      timezone: "America/Los_Angeles",
      brandVoice:
        input.brandVoice ||
        "Friendly, local, and confident. Celebrate great food and community.",
      brandColors: { primary: "#ea580c", secondary: "#0f172a" },
      locations: 1,
      createdAt: new Date().toISOString(),
    };
    s.restaurants.push(r);
    s.activeRestaurantId = r.id;
    // Seed empty integration shells for new restaurant
    const templates = s.integrations.filter((i) => i.restaurantId === s.restaurants[0].id);
    for (const t of templates) {
      s.integrations.push({
        ...t,
        id: uid("int"),
        restaurantId: r.id,
        status: "disconnected",
        lastSyncAt: undefined,
      });
    }
    s.analytics.push({
      restaurantId: r.id,
      period: "last_30_days",
      revenue: 0,
      orders: 0,
      avgTicket: 0,
      newCustomers: 0,
      loyaltyRedemptions: 0,
      contentPublished: 0,
      adSpend: 0,
      adRoas: 0,
      reviewAvg: 0,
      reviewCount: 0,
      topItems: [],
      revenueByDay: [],
      channelMix: [],
    });
    addAudit(s, {
      restaurantId: r.id,
      actor: "Alex Rivera",
      action: "restaurant.onboarded",
      entityType: "restaurant",
      entityId: r.id,
    });
  }).restaurants.slice(-1)[0];
}

export function switchRestaurant(id: string) {
  return mutateStore((s) => {
    if (!s.restaurants.find((r) => r.id === id)) throw new Error("Restaurant not found");
    const user = s.users.find((u) => u.id === s.activeUserId);
    if (
      user &&
      user.portal === "client" &&
      user.restaurantIds.length &&
      !user.restaurantIds.includes(id)
    ) {
      throw new Error("You do not have access to this restaurant");
    }
    s.activeRestaurantId = id;
    addAudit(s, {
      actor: user?.name || "User",
      action: "session.switch_restaurant",
      entityType: "restaurant",
      entityId: id,
    });
  });
}

export function ingestOrder(input: Partial<Order> & { total: number }): Order {
  return mutateStore((s) => {
    const order: Order = {
      id: uid("ord"),
      restaurantId: input.restaurantId || s.activeRestaurantId,
      externalId: input.externalId || `POS-${Date.now()}`,
      channel: input.channel || "dine_in",
      posSource: input.posSource || "manual",
      customerId: input.customerId,
      customerName: input.customerName,
      items: input.items || [{ name: "Custom Item", qty: 1, price: input.total }],
      subtotal: input.subtotal ?? input.total,
      tax: input.tax ?? 0,
      tip: input.tip ?? 0,
      total: input.total,
      offerCode: input.offerCode,
      status: input.status || "completed",
      orderedAt: input.orderedAt || new Date().toISOString(),
    };
    s.orders.unshift(order);
    if (order.offerCode) {
      const off = s.offers.find(
        (o) => o.code === order.offerCode && o.restaurantId === order.restaurantId
      );
      if (off) {
        off.redemptions += 1;
        off.revenueAttributed += order.total;
      }
    }
    if (order.customerId) {
      const cus = s.customers.find((c) => c.id === order.customerId);
      if (cus) {
        cus.visitCount += 1;
        cus.lifetimeSpend += order.total;
        cus.points += Math.round(order.total);
        cus.lastVisitAt = order.orderedAt;
      }
    }
    addAudit(s, {
      actor: "system",
      action: "order.ingested",
      entityType: "order",
      entityId: order.id,
      meta: { source: order.posSource },
    });
  }).orders[0];
}

export function resetDemo() {
  setStore(createInitialStore());
  return getStore();
}
