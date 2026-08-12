import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  BarChart3, 
  Route, 
  Eye, 
  Users, 
  Activity, 
  Clock, 
  TrendingUp, 
  MapPin, 
  PieChart, 
  Tag, 
  Sparkles, 
  FileText, 
  Download, 
  Settings, 
  LogOut, 
  User, 
  Search, 
  Lock,
  ChevronDown
} from "lucide-react";

export default function RetailAnalystLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
    { key: "journey", label: "Customer Journey Analysis", icon: <Route className="w-4 h-4 text-indigo-400" /> },
    { key: "attention", label: "Attention Analytics", icon: <Eye className="w-4 h-4 text-emerald-400" /> },
    { key: "segmentation", label: "Customer Segmentation", icon: <Users className="w-4 h-4 text-purple-400" /> },
    { key: "behaviour", label: "Shopping Behaviour Analysis", icon: <Activity className="w-4 h-4 text-amber-400" /> },
    { key: "dwell", label: "Dwell Time Analytics", icon: <Clock className="w-4 h-4 text-rose-400" /> },
    { key: "traffic", label: "Traffic Flow Analysis", icon: <TrendingUp className="w-4 h-4 text-blue-400" /> },
    { key: "zone", label: "Zone Performance", icon: <MapPin className="w-4 h-4 text-teal-400" /> },
    { key: "product", label: "Product Analytics", icon: <PieChart className="w-4 h-4 text-indigo-400" /> },
    { key: "category", label: "Category Performance", icon: <Tag className="w-4 h-4 text-emerald-400" /> },
    { key: "insights", label: "AI Insights", icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    { key: "reports", label: "Reports", icon: <FileText className="w-4 h-4 text-slate-400" /> },
    { key: "export", label: "Export Data", icon: <Download className="w-4 h-4 text-slate-400" /> },
    { key: "settings", label: "Settings (Read-Only)", icon: <Settings className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div className="flex h-screen bg-[#0b1121] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Retail Analyst Custom Sidebar */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Platform Badge */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                RA
              </div>
              <div>
                <h1 className="text-xs font-black text-white uppercase tracking-wider">Retail Analyst</h1>
                <p className="text-[10px] text-cyan-400 font-mono font-semibold">Read-Only Analytics Suite</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Analyst Modules</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9px]">Read-Only</span>
            </div>

            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === item.key
                    ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold shrink-0 text-xs">
                {user?.full_name?.slice(0, 2).toUpperCase() || "RA"}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user?.full_name || "Retail Analyst"}</div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Read-Only Role
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize">
              Retail Analyst Platform • {activeTab.replace("-", " ")}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter analytics data..."
                className="bg-slate-950 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 text-white outline-none focus:border-cyan-500 w-48"
              />
            </div>
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold rounded-full text-[10px]">
              LIVE DEMO STORE #01
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
