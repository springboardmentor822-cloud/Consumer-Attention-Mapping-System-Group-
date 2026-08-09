import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavSections, type Role } from "../../lib/roles";
import { cn } from "../../lib/utils";

const COLLAPSE_KEY = "cams_sidebar_collapsed";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  const role = user?.role as Role | undefined;
  const sections = getNavSections(role);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 272 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden lg:flex flex-shrink-0 flex-col border-r border-white/10 bg-panel/80 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 p-5">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-xl font-bold text-transparent">
              CAMS
            </h1>
            <p className="text-xs text-slate-400">Retail Intelligence</p>
          </div>
        )}
        <button
          onClick={toggle}
          className="focus-ring grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {sections.map((section, index) => (
          <div key={section.title ?? `section-${index}`}>
            {section.title && !collapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin" || item.to === "/store" || item.to === "/analyst" || item.to === "/marketing"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-glow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title={collapsed ? "Logout" : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </motion.aside>
  );
}
