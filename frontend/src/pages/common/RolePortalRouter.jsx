import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSession, logout } from "../../utils/auth";
import DynamicSubPageRenderer from "./DynamicSubPageRenderer";
import PortalDataFilter from "../../components/PortalDataFilter";
import { useCams } from "../../services/CamsContext";

// ── Portal configuration per role ────────────────────────────────────────────

const PORTAL_CONFIG = {
  "Administrator": {
    icon: "🛡️",
    label: "Administrator Portal",
    accent: {
      gradient: "from-indigo-600 to-blue-600",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
      activeBg: "bg-gradient-to-r from-indigo-600 to-blue-600",
      activeText: "text-white",
      hoverBg: "hover:bg-indigo-500/10",
      notifBg: "bg-indigo-500",
    },
    tabs: [
      { id: "Dashboard",                 icon: "📊", label: "Dashboard" },
      { id: "User & Access Management",  icon: "👥", label: "User & Access Mgmt" },
      { id: "Store & Device Management", icon: "🏪", label: "Store & Device Mgmt" },
      { id: "Shelf Management",          icon: "📦", label: "Shelf Management" },
      { id: "Consumer Analytics",        icon: "📈", label: "Consumer Analytics" },
      { id: "AI & Infrastructure",       icon: "🤖", label: "AI & Infrastructure" },
      { id: "Security & Audit",          icon: "🛡️", label: "Security & Audit" },
      { id: "Reports & Export",          icon: "📄", label: "Reports & Export" },
      { id: "Notifications",             icon: "🔔", label: "Notifications" },

      { id: "Backup & Recovery",         icon: "💾", label: "Backup & Recovery" },
      { id: "System Settings",           icon: "⚙️", label: "System Settings" },
      { id: "Profile & Support",          icon: "👤", label: "Profile & Support" },
    ],
  },

  "Store Manager": {
    icon: "🏪",
    label: "Store Manager Portal",
    accent: {
      gradient: "from-emerald-600 to-teal-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      activeBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
      activeText: "text-white",
      hoverBg: "hover:bg-emerald-500/10",
      notifBg: "bg-emerald-500",
    },
    tabs: [
      { id: "Dashboard",          icon: "📊", label: "Dashboard" },
      { id: "Live Cameras",       icon: "📹", label: "Live Cameras" },
      { id: "Visitors",           icon: "👥", label: "Visitors" },
      { id: "Store Traffic",      icon: "🚶", label: "Store Traffic" },
      { id: "Shelf Management",   icon: "📦", label: "Shelf Management" },
      { id: "Shelf Performance",  icon: "📈", label: "Shelf Performance" },
      { id: "Product Interaction", icon: "🛍️", label: "Product Interaction" },
      { id: "Heat Map",           icon: "🌡️", label: "Heat Map" },
      { id: "Alerts",             icon: "🔔", label: "Alerts" },
      { id: "Reports",            icon: "📄", label: "Reports" },
      { id: "Settings",           icon: "⚙️", label: "Settings" },
    ],
  },

  "Retail Analyst": {
    icon: "📈",
    label: "Retail Analyst Portal",
    accent: {
      gradient: "from-cyan-600 to-blue-600",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      activeBg: "bg-gradient-to-r from-cyan-600 to-blue-600",
      activeText: "text-white",
      hoverBg: "hover:bg-cyan-500/10",
      notifBg: "bg-cyan-500",
    },
    tabs: [
      { id: "Dashboard",                       icon: "📊", label: "Dashboard" },
      { id: "Consumer Behavior Intelligence",  icon: "🧠", label: "Consumer Behavior Intelligence" },
      { id: "Shopping Behavior Analysis",      icon: "🛒", label: "Shopping Behavior" },
      { id: "Dwell Time Analysis",        icon: "⏱️", label: "Dwell Time" },
      { id: "Traffic Flow Analysis",      icon: "🚶", label: "Traffic Flow" },
      { id: "Zone Performance",           icon: "📍", label: "Zone Performance" },
      { id: "Product Analytics",          icon: "📦", label: "Product Analytics" },
      { id: "Category Performance",       icon: "🏷️", label: "Category Performance" },
      { id: "AI Insights",                icon: "🤖", label: "AI Insights" },
      { id: "Reports",                    icon: "📄", label: "Reports" },
      { id: "Export Data",                icon: "💾", label: "Export Data" },
      { id: "Settings",                   icon: "⚙️", label: "Settings" },
    ],
  },

  "Marketing Manager": {
    icon: "📢",
    label: "Marketing Manager Portal",
    accent: {
      gradient: "from-amber-600 to-orange-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      activeBg: "bg-gradient-to-r from-amber-600 to-orange-600",
      activeText: "text-white",
      hoverBg: "hover:bg-amber-500/10",
      notifBg: "bg-amber-500",
    },
    tabs: [
      { id: "Dashboard",                icon: "📊", label: "Dashboard" },
      { id: "Campaign Performance",     icon: "📣", label: "Campaign Performance" },
      { id: "Promotion Effectiveness",  icon: "🏷️", label: "Promotion Effectiveness" },
      { id: "Product Visibility",       icon: "👁️", label: "Product Visibility" },
      { id: "Product Attractiveness",   icon: "✨", label: "Product Attractiveness" },
      { id: "Customer Engagement",      icon: "💬", label: "Customer Engagement" },
      { id: "Conversion Analysis",      icon: "🔄", label: "Conversion Analysis" },
      { id: "Attention Insights",       icon: "🧠", label: "Attention Insights" },
      { id: "Traffic Insights",         icon: "🚶", label: "Traffic Insights" },
      { id: "Marketing Recommendations", icon: "🤖", label: "AI Recommendations" },
      { id: "Action Center",            icon: "⚡", label: "Action Center" },
      { id: "Campaign Reports",         icon: "📋", label: "Campaign Reports" },
      { id: "Export Reports",           icon: "💾", label: "Export Reports" },
      { id: "Settings",                 icon: "⚙️", label: "Settings" },
    ],
  },
};

// ── Live clock hook ───────────────────────────────────────────────────────────

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RolePortalRouter({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const { globalFilter, setGlobalFilter } = useCams();
  const config = PORTAL_CONFIG[role] || PORTAL_CONFIG["Store Manager"];
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef(null);
  const now = useLiveClock();

  // Scroll to top immediately whenever active tab, route, or role changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
      if (typeof mainRef.current.scrollTo === "function") {
        mainRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  }, [activeTab, location.pathname, role]);

  const email = session?.email || "user@cams.com";
  const fullName = (session?.fullName || "User").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const initials = nameParts.length > 1 
    ? ((nameParts[0]?.[0] || "") + (nameParts[1]?.[0] || "")).toUpperCase() 
    : (fullName.substring(0, 2) || "U").toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  });
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#060A14] flex font-sans text-slate-100 overflow-hidden">

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-[#0A1020] border-r border-[#1E293B] transition-all duration-300 z-40
          ${sidebarCollapsed ? "w-16" : "w-60"}
          ${mobileMenuOpen ? "fixed inset-y-0 left-0 w-60 z-50" : "hidden lg:flex"}
        `}
      >
        {/* Sidebar brand */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-[#1E293B] ${sidebarCollapsed ? "justify-center px-2" : ""}`}>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${config.accent.gradient} flex items-center justify-center flex-shrink-0 shadow-lg text-sm`}>
            {config.icon}
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xs font-black text-white leading-tight truncate">CAMS Enterprise</h1>
              <p className="text-[9px] text-slate-500 font-mono truncate">AI Retail Intelligence</p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!sidebarCollapsed && (
          <div className={`mx-3 mt-3 px-3 py-2 rounded-xl ${config.accent.bg} border ${config.accent.border}`}>
            <p className={`text-[10px] font-black uppercase tracking-wider ${config.accent.text} truncate`}>
              {fullName}
            </p>
            <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">{email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2 scrollbar-none">
          {config.tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                title={sidebarCollapsed ? tab.label : ""}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group
                  ${isActive
                    ? `${config.accent.activeBg} ${config.accent.activeText} shadow-sm font-bold`
                    : `text-slate-400 ${config.accent.hoverBg} hover:text-white font-medium`
                  }
                  ${sidebarCollapsed ? "justify-center px-2" : ""}
                `}
              >
                <span className={`text-sm flex-shrink-0 ${isActive ? "" : "opacity-70 group-hover:opacity-100"}`}>
                  {tab.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="text-[11px] truncate">{tab.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer – collapse toggle & logout */}
        <div className={`border-t border-[#1E293B] p-2 space-y-1`}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-white rounded-xl hover:bg-[#1E293B] transition text-xs"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "→" : "← Collapse"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
          >
            <span>🚪</span>
            {!sidebarCollapsed && <span className="text-[11px] font-bold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#060A14]/95 backdrop-blur-md border-b border-[#1E293B] px-4 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg"
            >
              ☰
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono min-w-0">
              <span className={`font-bold ${config.accent.text} truncate`}>{role}</span>
              <span>/</span>
              <span className={`px-2 py-0.5 rounded-md ${config.accent.bg} ${config.accent.text} border ${config.accent.border} font-bold truncate max-w-[200px]`}>
                {activeTab}
              </span>
            </div>
          </div>

          {/* Right: Date Range Filter, clock, notifications, user */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Global Date Filter */}
            <PortalDataFilter filter={globalFilter} onChange={setGlobalFilter} />

            {/* Live clock */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] font-black text-white font-mono">{formattedTime}</span>
              <span className="text-[9px] text-slate-500 font-mono">{formattedDate}</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button className="w-8 h-8 bg-[#111827] border border-[#1E293B] rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center justify-center text-sm">
                🔔
              </button>
              <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${config.accent.notifBg} text-black text-[8px] font-black rounded-full flex items-center justify-center`}>
                3
              </span>
            </div>

            {/* User avatar + info */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.accent.gradient} flex items-center justify-center text-xs font-black text-white shadow-sm`}>
                {initials}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold text-white leading-none truncate max-w-[140px]">{fullName}</span>
                <span className="text-[9px] text-slate-500 font-mono leading-none mt-0.5 max-w-[140px] truncate">{email}</span>
              </div>
            </div>

            {/* Logout (header shortcut) */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] hover:bg-rose-500/10 text-rose-400 text-[11px] font-bold rounded-lg transition border border-[#273552] hover:border-rose-500/30"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto p-5">
            <DynamicSubPageRenderer
              role={role}
              activeTab={activeTab}
              onNavigateTab={setActiveTab}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
