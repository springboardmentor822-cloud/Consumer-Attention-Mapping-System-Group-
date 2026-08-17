import React from "react";
import { Navigate } from "react-router-dom";
import { getSession, hasRole, getHomeRoute } from "../utils/auth";

const ROLE_INFO = {
  admin: { label: "Administrator Portal", icon: "🛡️", color: "from-indigo-600 to-blue-600", border: "border-indigo-500/40", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
  store_manager: { label: "Store Manager Portal", icon: "🏪", color: "from-emerald-600 to-teal-600", border: "border-emerald-500/40", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  retail_analyst: { label: "Retail Analyst Portal", icon: "📈", color: "from-cyan-600 to-blue-600", border: "border-cyan-500/40", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  marketing_manager: { label: "Marketing Manager Portal", icon: "📢", color: "from-amber-600 to-orange-600", border: "border-amber-500/40", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
};

/**
 * ProtectedRoute - Guards a portal route
 * @param {string} requiredRoleKey - "admin" | "store_manager" | "retail_analyst" | "marketing_manager"
 */
export default function ProtectedRoute({ children, requiredRoleKey }) {
  const session = getSession();

  // Not logged in at all → redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → show Access Denied
  if (!hasRole(requiredRoleKey)) {
    const required = ROLE_INFO[requiredRoleKey] || ROLE_INFO.store_manager;
    const current = ROLE_INFO[session.roleKey] || ROLE_INFO.store_manager;
    const myHomeRoute = getHomeRoute(session.role);

    return (
      <div className="min-h-screen bg-[#060A14] flex items-center justify-center p-6 font-sans">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-lg bg-[#0F172A] border border-rose-500/30 rounded-3xl p-8 shadow-2xl shadow-rose-900/20 text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-4xl">
            🔒
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Access Denied</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              You don't have permission to access the <span className="text-rose-400 font-bold">{required.label}</span>.
            </p>
          </div>

          {/* Current vs Required role */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl text-left">
              <span className="text-slate-500 block mb-1">Your Role</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${current.badge}`}>
                <span>{current.icon}</span>
                <span>{session.role}</span>
              </span>
            </div>
            <div className="bg-[#070C18] border border-[#1E293B] p-3 rounded-xl text-left">
              <span className="text-slate-500 block mb-1">Required Role</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${required.badge}`}>
                <span>{required.icon}</span>
                <span>{required.label.replace(" Portal", "")}</span>
              </span>
            </div>
          </div>

          {/* Email info */}
          <p className="text-slate-500 text-xs font-mono">Logged in as: {session.email}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={myHomeRoute}
              className={`flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${current.color} hover:opacity-90 transition text-center`}
            >
              Go to My Portal
            </a>
            <a
              href="/login"
              className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-300 bg-[#1E293B] hover:bg-[#273552] transition text-center border border-[#273552]"
            >
              Switch Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
