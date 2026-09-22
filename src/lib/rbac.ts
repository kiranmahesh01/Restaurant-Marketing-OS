import type { UserRole } from "./types";

/**
 * Role-based access — how multi-unit restaurant groups + agencies separate duties.
 * platform_admin = SaaS/agency ops (you)
 * owner = restaurant decision maker
 * manager = GM / multi-location
 * marketer = content + campaigns
 * viewer = read-only investor/partner
 */

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[] | "*";
  portals: Array<"admin" | "client"> | "*";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Admin HQ", roles: ["platform_admin"], portals: ["admin"] },
  { href: "/dashboard", label: "Overview", roles: "*", portals: "*" },
  {
    href: "/campaigns",
    label: "Campaign Drop",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/content",
    label: "Content Studio",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/approvals",
    label: "Approvals",
    roles: ["platform_admin", "owner", "manager"],
    portals: "*",
  },
  { href: "/calendar", label: "Calendar", roles: "*", portals: "*" },
  {
    href: "/offers",
    label: "Offers Hub",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/blasts",
    label: "SMS & Email",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/ads",
    label: "Ads",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/orders",
    label: "Orders / POS",
    roles: ["platform_admin", "owner", "manager"],
    portals: "*",
  },
  {
    href: "/customers",
    label: "Customers & Loyalty",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/reviews",
    label: "Reviews",
    roles: ["platform_admin", "owner", "manager", "marketer"],
    portals: "*",
  },
  {
    href: "/integrations",
    label: "Integrations",
    roles: ["platform_admin", "owner", "manager"],
    portals: "*",
  },
  {
    href: "/audit",
    label: "Audit Logs",
    roles: ["platform_admin", "owner", "manager"],
    portals: "*",
  },
  { href: "/support", label: "Support", roles: "*", portals: "*" },
  {
    href: "/settings",
    label: "Settings",
    roles: ["platform_admin", "owner", "manager"],
    portals: "*",
  },
  { href: "/docs", label: "Docs", roles: "*", portals: "*" },
];

export function canAccess(
  role: UserRole | undefined,
  portal: "admin" | "client" | undefined,
  href: string
) {
  const item = NAV_ITEMS.find((n) => n.href === href);
  if (!item) return true;
  const roleOk = item.roles === "*" || (role ? item.roles.includes(role) : false);
  const portalOk =
    item.portals === "*" || (portal ? item.portals.includes(portal) : false);
  return roleOk && portalOk;
}

export function navFor(role: UserRole | undefined, portal: "admin" | "client" | undefined) {
  return NAV_ITEMS.filter((n) => canAccess(role, portal, n.href));
}

export function canMutate(role: UserRole | undefined) {
  return role !== "viewer";
}

export function canApprove(role: UserRole | undefined) {
  return role === "platform_admin" || role === "owner" || role === "manager";
}

export function roleLabel(role: UserRole | string | undefined) {
  switch (role) {
    case "platform_admin":
      return "Platform Admin";
    case "owner":
      return "Restaurant Owner";
    case "manager":
      return "Manager";
    case "marketer":
      return "Marketer";
    case "viewer":
      return "Viewer (read-only)";
    default:
      return role || "User";
  }
}
