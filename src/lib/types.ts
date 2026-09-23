export type Restaurant = {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  cuisine: string;
  city: string;
  state: string;
  timezone: string;
  logoUrl?: string;
  brandVoice: string;
  brandColors: { primary: string; secondary: string };
  locations: number;
  website?: string;
  phone?: string;
  createdAt: string;
};

/** platform_admin = agency/SaaS operator · owner = restaurant owner · others = staff */
export type UserRole =
  | "platform_admin"
  | "owner"
  | "manager"
  | "marketer"
  | "viewer";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantIds: string[];
  avatarUrl?: string;
  /** What this persona is allowed to see in the product */
  portal: "admin" | "client";
};

export type SupportTicket = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  createdBy: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: "content" | "offers" | "pos" | "integrations" | "billing" | "ai" | "other";
  subject: string;
  body: string;
  status: "open" | "in_progress" | "waiting_client" | "resolved";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "linkedin"
  | "google_business"
  | "email"
  | "sms";

export type ContentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "failed";

export type ContentItem = {
  id: string;
  restaurantId: string;
  title: string;
  body: string;
  hashtags: string[];
  platforms: ContentPlatform[];
  status: ContentStatus;
  mediaUrls: string[];
  mediaType: "image" | "video" | "carousel" | "none";
  scheduledAt?: string;
  publishedAt?: string;
  createdBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  aiGenerated: boolean;
  campaignId?: string;
  offerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Offer = {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string;
  type: "percent" | "fixed" | "bogo" | "free_item" | "bundle" | "loyalty_boost";
  value: number;
  channels: ("app" | "pos" | "online" | "social" | "email" | "sms" | "in_store")[];
  status: "draft" | "active" | "scheduled" | "paused" | "expired";
  startsAt: string;
  endsAt: string;
  minOrder?: number;
  maxRedemptions?: number;
  redemptions: number;
  revenueAttributed: number;
  audience: "all" | "new" | "loyalty" | "lapsed" | "vip";
  stackable: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  restaurantId: string;
  name: string;
  email?: string;
  phone?: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  lifetimeSpend: number;
  visitCount: number;
  lastVisitAt?: string;
  tags: string[];
  source: "pos" | "online" | "app" | "walk_in" | "import";
  birthday?: string;
  marketingOptIn: boolean;
  createdAt: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  externalId: string;
  channel: "dine_in" | "takeout" | "delivery" | "app" | "kiosk" | "catering";
  posSource: string;
  customerId?: string;
  customerName?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  offerCode?: string;
  status: "completed" | "refunded" | "cancelled";
  orderedAt: string;
};

export type Review = {
  id: string;
  restaurantId: string;
  platform: "google" | "yelp" | "tripadvisor" | "facebook" | "doorDash" | "uberEats";
  rating: number;
  author: string;
  body: string;
  replied: boolean;
  replyBody?: string;
  sentiment: "positive" | "neutral" | "negative";
  createdAt: string;
};

export type Integration = {
  id: string;
  restaurantId: string;
  provider:
    | "meta"
    | "google_ads"
    | "instagram"
    | "facebook"
    | "tiktok"
    | "x"
    | "creatomate"
    | "shotstack"
    | "toast"
    | "square"
    | "clover"
    | "opentable"
    | "doordash"
    | "mailchimp"
    | "twilio"
    | "openai";
  category: "social" | "ads" | "video" | "pos" | "reviews" | "comms" | "ai";
  status: "connected" | "disconnected" | "error" | "pending";
  lastSyncAt?: string;
  configHint: string;
  envKeys: string[];
};

export type Notification = {
  id: string;
  restaurantId: string;
  type: "approval" | "review" | "order" | "campaign" | "system" | "loyalty";
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  restaurantId: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export type Campaign = {
  id: string;
  restaurantId: string;
  name: string;
  objective: "awareness" | "traffic" | "conversions" | "loyalty" | "launch";
  status: "draft" | "active" | "paused" | "completed";
  budget: number;
  spent: number;
  channels: string[];
  startAt: string;
  endAt: string;
  metrics: { impressions: number; clicks: number; conversions: number; roas: number };
};

export type AdAccount = {
  id: string;
  restaurantId: string;
  platform: "meta" | "google";
  name: string;
  status: "connected" | "disconnected" | "error";
  spend30d: number;
  impressions30d: number;
  clicks30d: number;
  conversions30d: number;
};

export type AnalyticsSnapshot = {
  restaurantId: string;
  period: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  newCustomers: number;
  loyaltyRedemptions: number;
  contentPublished: number;
  adSpend: number;
  adRoas: number;
  reviewAvg: number;
  reviewCount: number;
  topItems: { name: string; qty: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  channelMix: { channel: string; revenue: number; pct: number }[];
};

export type MediaAsset = {
  storagePath?: string;
  id: string;
  restaurantId: string;
  name: string;
  mimeType: string;
  size: number;
  /** data URI or public URL */
  url: string;
  kind: "image" | "video" | "other";
  width?: number;
  height?: number;
  source: "upload" | "stock" | "render";
  tags: string[];
  createdAt: string;
};

export type BlastSegment =
  | "all_opted_in"
  | "loyalty"
  | "vip"
  | "lapsed"
  | "new"
  | "birthday_month";

export type MessageBlast = {
  id: string;
  restaurantId: string;
  name: string;
  channel: "sms" | "email";
  segment: BlastSegment;
  subject?: string;
  body: string;
  offerId?: string;
  offerCode?: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  audienceCount: number;
  sentCount: number;
  scheduledAt?: string;
  sentAt?: string;
  demo: boolean;
  createdAt: string;
};

export type StoreShape = {
  restaurants: Restaurant[];
  users: UserProfile[];
  content: ContentItem[];
  offers: Offer[];
  customers: Customer[];
  orders: Order[];
  reviews: Review[];
  integrations: Integration[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  campaigns: Campaign[];
  ads: AdAccount[];
  analytics: AnalyticsSnapshot[];
  media: MediaAsset[];
  blasts: MessageBlast[];
  tickets: SupportTicket[];
  activeRestaurantId: string;
  activeUserId: string;
  demoMode: boolean;
};
