import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Video, Users, TrendingUp, BarChart2, Package, 
  Flame, Bell, FileText, Clock, Settings, ShoppingBag 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuthStore();

  const allMenuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'MARKETING_MANAGER', 'ADMINISTRATOR'] },
    { id: 'cameras', label: 'Live Cameras', icon: Video, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'ADMINISTRATOR'] },
    { id: 'visitors', label: 'Visitors', icon: Users, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'ADMINISTRATOR'] },
    { id: 'traffic', label: 'Store Traffic', icon: TrendingUp, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'ADMINISTRATOR'] },
    { id: 'shelf', label: 'Shelf Performance', icon: BarChart2, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'ADMINISTRATOR'] },
    { id: 'product_interaction', label: 'Product Interaction', icon: Package, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'MARKETING_MANAGER', 'ADMINISTRATOR'] },
    { id: 'heatmaps', label: 'Heatmap', icon: Flame, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'MARKETING_MANAGER', 'ADMINISTRATOR'] },
    { id: 'alerts', label: 'Alerts', icon: Bell, roles: ['STORE_MANAGER', 'ADMINISTRATOR'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['STORE_MANAGER', 'RETAIL_ANALYST', 'MARKETING_MANAGER', 'ADMINISTRATOR'] },
    { id: 'activities', label: 'Activities', icon: Clock, roles: ['STORE_MANAGER', 'ADMINISTRATOR'] },
    { id: 'admin', label: 'Admin Security & Logs', icon: Settings, roles: ['ADMINISTRATOR'] },
  ];

  const userRole = user?.role || 'STORE_MANAGER';
  const allowedMenuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const getPortalTitle = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'Administrator Console';
      case 'RETAIL_ANALYST': return 'Analyst Portal';
      case 'MARKETING_MANAGER': return 'Marketing Console';
      case 'STORE_MANAGER':
      default: return 'Store Manager Portal';
    }
  };

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 shrink-0 hidden md:block min-h-[calc(100vh-65px)] p-4 font-sans">
      <div className="space-y-6">
        {/* Dynamic Brand Header */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-wider">CAMS</h1>
            <p className="text-[10px] text-slate-400 font-medium">{getPortalTitle(userRole)}</p>
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            SIDEBAR NAVIGATION
          </div>
          <nav className="space-y-1">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Real-time Status Card */}
        <div className="bg-[#0f172a] rounded-xl p-3.5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">SYSTEM STATUS</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-xs font-extrabold text-emerald-400 mb-1">RTSP AI Feeds Active</div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between">
            <span>FPS: 30.0</span>
            <span>Latency: 14ms</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
