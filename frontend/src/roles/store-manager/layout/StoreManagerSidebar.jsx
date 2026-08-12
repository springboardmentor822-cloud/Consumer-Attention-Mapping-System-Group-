import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  TrendingUp, 
  Layers, 
  Package, 
  MapPin, 
  Bell, 
  FileText, 
  Clock, 
  Sliders, 
  LogOut, 
  ShieldAlert,
  Building2
} from "lucide-react";

export default function StoreManagerSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" /> },
    { key: "cameras", label: "Live Cameras", icon: <Video className="w-4 h-4 text-emerald-400" /> },
    { key: "visitors", label: "Visitors", icon: <Users className="w-4 h-4 text-cyan-400" /> },
    { key: "traffic", label: "Store Traffic", icon: <TrendingUp className="w-4 h-4 text-purple-400" /> },
    { key: "shelves", label: "Shelf Performance", icon: <Layers className="w-4 h-4 text-amber-400" /> },
    { key: "products", label: "Product Interaction", icon: <Package className="w-4 h-4 text-blue-400" /> },
    { key: "heatmaps", label: "Heatmaps", icon: <MapPin className="w-4 h-4 text-rose-400" /> },
    { key: "alerts", label: "Alerts", icon: <Bell className="w-4 h-4 text-red-400" /> },
    { key: "reports", label: "Reports", icon: <FileText className="w-4 h-4 text-slate-400" /> },
    { key: "activities", label: "Activities", icon: <Clock className="w-4 h-4 text-slate-400" /> },
    { key: "settings", label: "Settings", icon: <Sliders className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20">
              SM
            </div>
            <div>
              <h1 className="text-xs font-black text-white uppercase tracking-wider">Store Operations</h1>
              <p className="text-[10px] text-emerald-400 font-mono font-bold">Store Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Operational Modules Navigation */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)] custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Store Control</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">Live</span>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === item.key
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
            {user?.full_name?.slice(0, 2).toUpperCase() || "SM"}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{user?.full_name || "Store Manager"}</div>
            <div className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" /> AK retail store
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
  );
}
