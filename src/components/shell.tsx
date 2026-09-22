"use client";

import { Sidebar } from "./sidebar";
import { useDashboard, fetchJSON } from "@/lib/hooks";
import { Bell, RefreshCw, ChevronDown } from "lucide-react";
import { Button, Badge } from "./ui";
import { useState } from "react";
import { relativeTime } from "@/lib/utils";
import { roleLabel } from "@/lib/rbac";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data, loading, reload } = useDashboard();
  const [showNotes, setShowNotes] = useState(false);
  const [showPersona, setShowPersona] = useState(false);

  const pending = data?.content.filter((c) => c.status === "pending_approval").length || 0;
  const unread = data?.notifications.filter((n) => !n.read).length || 0;

  async function markRead() {
    await fetchJSON("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "read_all" }),
    });
    reload();
  }

  async function switchPersona(userId: string) {
    await fetchJSON("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "switch_user", userId }),
    });
    setShowPersona(false);
    reload();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-grid-fade">
      <Sidebar
        restaurantName={data?.restaurant?.name}
        pendingApprovals={pending}
        unread={unread}
        role={data?.role}
        portal={data?.portal}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-ink-200/80 bg-white/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <Badge tone={data?.portal === "admin" ? "brand" : "info"}>
              {data?.portal === "admin" ? "ADMIN PORTAL" : "CLIENT PORTAL"}
            </Badge>
            <span className="hidden sm:inline">
              {data?.demoMode ? "Demo · switch persona to preview roles" : "Live mode"}
            </span>
            {loading ? <span className="text-ink-400">Syncing…</span> : null}
            {data?.role === "viewer" ? (
              <Badge tone="warn">Read-only</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => reload()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowNotes((v) => !v)}>
                <Bell className="h-4 w-4" />
                {unread ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-500" />
                ) : null}
              </Button>
              {showNotes ? (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-ink-200 bg-white p-2 shadow-soft">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-semibold text-ink-800">Notifications</p>
                    <button
                      onClick={markRead}
                      className="text-[11px] text-brand-700 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(data?.notifications || []).slice(0, 8).map((n) => (
                      <Link
                        key={n.id}
                        href={n.href || "/dashboard"}
                        onClick={() => setShowNotes(false)}
                        className="block rounded-xl px-3 py-2 hover:bg-ink-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-ink-900">{n.title}</p>
                          {!n.read ? (
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                          ) : null}
                        </div>
                        <p className="text-[11px] text-ink-500">{n.body}</p>
                        <p className="mt-1 text-[10px] text-ink-400">
                          {relativeTime(n.createdAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Persona switcher = demo login as Admin vs Client roles */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersona((v) => !v)}
                className="ml-1 flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 hover:bg-ink-50"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                    data?.portal === "admin" ? "bg-brand-600" : "bg-ink-900"
                  }`}
                >
                  {data?.user?.name?.slice(0, 1) || "A"}
                </div>
                <div className="hidden leading-tight sm:block text-left">
                  <p className="text-xs font-medium text-ink-900">{data?.user?.name || "…"}</p>
                  <p className="text-[10px] text-ink-500">{roleLabel(data?.role)}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              {showPersona ? (
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-ink-200 bg-white p-2 shadow-soft">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                    Switch persona (demo login)
                  </p>
                  {(data?.users || []).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => switchPersona(u.id)}
                      className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-ink-50 ${
                        u.id === data?.user?.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                          u.portal === "admin" ? "bg-brand-600" : "bg-ink-800"
                        }`}
                      >
                        {u.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-900">{u.name}</p>
                        <p className="text-[11px] text-ink-500">
                          {roleLabel(u.role)} · {u.portal} portal
                        </p>
                        <p className="truncate text-[10px] text-ink-400">{u.email}</p>
                      </div>
                    </button>
                  ))}
                  <p className="mt-1 border-t border-ink-100 px-2 pt-2 text-[10px] leading-relaxed text-ink-400">
                    Admin sees all clients + tickets. Owner/Marketer see one restaurant. Viewer is
                    read-only — how big restaurant groups separate duties.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
