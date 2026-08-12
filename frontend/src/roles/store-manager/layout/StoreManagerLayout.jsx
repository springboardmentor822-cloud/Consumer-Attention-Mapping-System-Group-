import StoreManagerSidebar from "./StoreManagerSidebar";
import { Search, Bell, Activity, RefreshCw } from "lucide-react";

export default function StoreManagerLayout({ children, activeTab, setActiveTab }) {
  return (
    <div className="flex h-screen bg-[#0b1121] text-slate-100 font-sans antialiased overflow-hidden">
      <StoreManagerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Store Top Operational Bar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Store Manager Control • {activeTab.replace("-", " ")}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search store assets..."
                className="bg-slate-950 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 text-white outline-none focus:border-emerald-500 w-48"
              />
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ALL 14 CAMERAS ONLINE
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
