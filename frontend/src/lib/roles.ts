import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  Camera,
  Grid3x3,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MapPin,
  Package,
  Settings,
  ShieldAlert,
  Tag,
  UserCircle,
  UserCheck,
  Users,
  Video,
} from "lucide-react";

export type Role = "Admin" | "Store Manager" | "Retail Analyst" | "Marketing Manager";

export const ROLES: Role[] = ["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"];

export const ROLE_HOME: Record<Role, string> = {
  Admin: "/admin",
  "Store Manager": "/store",
  "Retail Analyst": "/analyst",
  "Marketing Manager": "/marketing",
};

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

export function getNavSections(role: Role | undefined): NavSection[] {
  const dashboard: NavItem[] = role
    ? [{ to: ROLE_HOME[role], label: "Dashboard", icon: LayoutDashboard }]
    : [];

  const workspace: NavItem[] = [
    { to: "/video", label: "Video Processing", icon: Video },
    { to: "/camera-grid", label: "Camera Grid", icon: Grid3x3 },
    { to: "/live-tracking", label: "Live Tracking", icon: Activity },
    { to: "/cameras", label: "Cameras", icon: Camera },
    { to: "/zones", label: "Zones", icon: MapPin },
  ];

  const analytics: NavItem[] = [];
  if (role === "Retail Analyst") {
    analytics.push(
      { to: "/analyst/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/analyst/customer-analytics", label: "Customer Analytics", icon: Users },
      { to: "/analyst/product-analysis", label: "Product Analysis", icon: Package },
      { to: "/analyst/shelf-analysis", label: "Shelf Analysis", icon: LayoutGrid },
      { to: "/analyst/store-reports", label: "Store Reports", icon: Building2 },
    );
  } else if (role === "Marketing Manager") {
    analytics.push(
      { to: "/marketing/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/marketing/promotions", label: "Promotions", icon: Tag },
    );
  }

  const management: NavItem[] = [];
  if (role === "Admin") {
    management.push(
      { to: "/users", label: "Users", icon: Users },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/stores", label: "Stores", icon: Building2 },
      { to: "/shelves", label: "Shelves", icon: LayoutGrid },
      { to: "/products", label: "Products", icon: Package },
    );
  } else if (role === "Store Manager") {
    management.push(
      { to: "/shelves", label: "Shelves", icon: LayoutGrid },
      { to: "/products", label: "Products", icon: Package },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/employees", label: "Employees", icon: UserCheck },
      { to: "/security-alerts", label: "Security Alerts", icon: ShieldAlert },
    );
  } else if (role === "Retail Analyst") {
    // Read-only for this role - ResourcePage already hides Add/Edit/Delete
    // via canWrite(), so reusing the existing pages is safe as-is.
    management.push(
      { to: "/shelves", label: "Shelves", icon: LayoutGrid },
      { to: "/products", label: "Products", icon: Package },
    );
  } else if (role === "Marketing Manager") {
    // View Products / Inventory (read-only) per role spec - canWrite() still
    // gates Add/Edit/Delete to Admin/Store Manager only.
    management.push({ to: "/products", label: "Products", icon: Package });
  }

  const account: NavItem[] = [
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const sections: NavSection[] = [{ title: null, items: dashboard }];
  if (analytics.length) {
    sections.push({ title: role === "Marketing Manager" ? "Marketing" : "Analytics", items: analytics });
  }
  sections.push({ title: "Workspace", items: workspace });
  if (management.length) sections.push({ title: "Management", items: management });
  sections.push({ title: "Account", items: account });
  return sections;
}
