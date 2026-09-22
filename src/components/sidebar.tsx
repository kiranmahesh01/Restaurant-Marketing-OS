"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  CheckCheck,
  CalendarDays,
  Megaphone,
  ShoppingBag,
  Users,
  Star,
  Settings,
  Tag,
  Plug,
  ScrollText,
  BookOpen,
  ChefHat,
  Rocket,
  MessageSquare,
  Shield,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navFor } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin": Shield,
  "/dashboard": LayoutDashboard,
  "/campaigns": Rocket,
  "/content": Sparkles,
  "/approvals": CheckCheck,
  "/calendar": CalendarDays,
  "/offers": Tag,
  "/blasts": MessageSquare,
  "/ads": Megaphone,
  "/orders": ShoppingBag,
  "/customers": Users,
  "/reviews": Star,
  "/integrations": Plug,
  "/audit": ScrollText,
  "/support": Headphones,
  "/settings": Settings,
  "/docs": BookOpen,
};

export function Sidebar({
  restaurantName,
  pendingApprovals,
  unread,
  role,
  portal,
}: {
  restaurantName?: string;
  pendingApprovals?: number;
  unread?: number;
  role?: UserRole;
  portal?: "admin" | "client";
}) {
  const pathname = usePathname();
  const items = navFor(role, portal);

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-ink-200 bg-ink-900 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30">
          <ChefHat className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">Restaurant OS</p>
          <p className="truncate text-[11px] text-white/60">
            {portal === "admin" ? "Admin · multi-client" : "Client · marketing ops"}
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            {portal === "admin" ? "Working as admin on" : "Your restaurant"}
          </p>
          <p className="truncate text-sm font-medium">{restaurantName || "Loading…"}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICONS[item.href] || LayoutDashboard;
          const badge =
            item.href === "/approvals" && pendingApprovals
              ? pendingApprovals
              : item.href === "/dashboard" && unread
                ? unread
                : item.href === "/admin" && unread
                  ? unread
                  : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-white/20" : "bg-brand-500 text-white"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-500/20 to-white/5 p-3 ring-1 ring-white/10">
          <p className="text-xs font-semibold">
            {portal === "admin" ? "You = platform team" : "You = restaurant team"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/60">
            Switch persona in the header to see Admin vs Client views. Viewer role is read-only.
          </p>
        </div>
      </div>
    </aside>
  );
}
