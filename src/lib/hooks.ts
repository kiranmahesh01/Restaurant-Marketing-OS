"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoreShape, UserProfile, UserRole, SupportTicket } from "./types";

export type DashboardData = {
  demoMode: boolean;
  restaurant: StoreShape["restaurants"][0];
  restaurants: StoreShape["restaurants"];
  user: UserProfile;
  users: UserProfile[];
  portal: "admin" | "client";
  role: UserRole;
  content: StoreShape["content"];
  offers: StoreShape["offers"];
  customers: StoreShape["customers"];
  orders: StoreShape["orders"];
  reviews: StoreShape["reviews"];
  integrations: StoreShape["integrations"];
  notifications: StoreShape["notifications"];
  auditLogs: StoreShape["auditLogs"];
  campaigns: StoreShape["campaigns"];
  ads: StoreShape["ads"];
  analytics: StoreShape["analytics"][0];
  media: StoreShape["media"];
  blasts: StoreShape["blasts"];
  tickets: SupportTicket[];
  orgStats: {
    restaurantCount: number;
    openTickets: number;
    contentPending: number;
    activeOffers: number;
    totalCustomers: number;
    totalOrders: number;
  } | null;
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json();
  if (res.status === 401) window.location.assign("/login");
  if (data.code === "ONBOARDING_REQUIRED") window.location.assign("/onboarding");
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const bundle = await fetchJSON<DashboardData>("/api/dashboard");
      setData(bundle);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export { fetchJSON };
