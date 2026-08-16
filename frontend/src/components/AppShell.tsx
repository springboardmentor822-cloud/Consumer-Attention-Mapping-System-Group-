import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { Reticle } from "./ui";

type NavItem = { to: string; label: string; key: string; end?: boolean };

// Each role gets its own nav - this is the piece that was missing before:
// everyone used to see the same four links no matter who logged in.
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  administrator: [
    { to: "/admin", label: "Admin Dashboard", key: "01", end: true },
    { to: "/dashboard", label: "Store Dashboard", key: "02", end: true },
    { to: "/", label: "Stores", key: "03", end: true },
    { to: "/cameras", label: "Cameras", key: "04" },
    { to: "/camera-grid", label: "Camera Grid", key: "05" },
    { to: "/catalog", label: "Shelves & Products", key: "06" },
    { to: "/layout", label: "Store Layout", key: "07" },
    { to: "/analytics", label: "Analytics", key: "08" },
    { to: "/tracking", label: "Live Tracking", key: "09" },
    { to: "/admin/users", label: "Users", key: "10" },
  ],
  store_manager: [
    { to: "/dashboard", label: "Dashboard", key: "01", end: true },
    { to: "/", label: "Stores", key: "02", end: true },
    { to: "/cameras", label: "Cameras", key: "03" },
    { to: "/camera-grid", label: "Camera Grid", key: "04" },
    { to: "/catalog", label: "Shelves & Products", key: "05" },
    { to: "/layout", label: "Store Layout", key: "06" },
    { to: "/analytics", label: "Analytics", key: "07" },
    { to: "/tracking", label: "Live Tracking", key: "08" },
  ],
  marketing_manager: [
    { to: "/marketing", label: "Campaign Dashboard", key: "01", end: true },
  ],
  retail_analyst: [
    { to: "/analyst", label: "Analyst Dashboard", key: "01", end: true },
    { to: "/layout", label: "Store Layout", key: "02" },
    { to: "/camera-grid", label: "Camera Grid", key: "03" },
    { to: "/tracking", label: "Live Tracking", key: "04" },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user ? NAV_BY_ROLE[user.role] : [];

  return (
    <div className="min-h-screen flex bg-base">
      <aside className="w-60 shrink-0 border-r border-hairline bg-panel flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-hairline">
          <Reticle className="h-5 w-5 text-signal" />
          <span className="font-display font-semibold text-sm tracking-tight">
            ATTENTION<span className="text-signal">MAP</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-panel-raised text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-panel-raised/60"
                }`
              }
            >
              <span className="font-mono text-[10px] text-signal">{item.key}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-hairline">
          <p className="text-sm text-text-primary truncate">{user?.full_name}</p>
          <p className="font-mono text-[11px] text-text-muted uppercase tracking-wide truncate">
            {user?.role.replace("_", " ")}
          </p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 text-xs text-text-muted hover:text-signal transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
