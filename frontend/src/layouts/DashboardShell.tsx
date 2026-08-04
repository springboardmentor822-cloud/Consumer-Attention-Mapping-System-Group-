import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/axios';

// Component Dashboards
import AdminDashboard from '../components/AdminDashboard';
import RetailAnalystDashboard from '../components/RetailAnalystDashboard';
import MarketingManagerDashboard from '../components/MarketingManagerDashboard';

// Lucide Icons
import {
  Store,
  Camera,
  Users,
  Compass,
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
  Home,
  TrendingUp,
  Layers,
  Package,
  Flame,
  FileText,
  Clock,
  Settings as SettingsIcon,
  Shield,
  Menu,
  Shuffle,
  Eye,
  UserCheck,
  Megaphone,
  Server,
  Award
} from 'lucide-react';

import StoresCRUD from '../pages/StoresCRUD';
import ZonesCRUD from '../pages/ZonesCRUD';
import ShelvesCRUD from '../pages/ShelvesCRUD';
import ProductsCRUD from '../pages/ProductsCRUD';
import CamerasCRUD from '../pages/CamerasCRUD';
import UsersCRUD from '../pages/UsersCRUD';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import ConsumerJourney from '../pages/ConsumerJourney';
import AttentionAnalytics from '../pages/AttentionAnalytics';
import CustomerSegmentation from '../pages/CustomerSegmentation';
import ShoppingBehaviour from '../pages/ShoppingBehaviour';
import DwellTimeAnalysis from '../pages/DwellTimeAnalysis';
import TrafficFlow from '../pages/TrafficFlow';
import ZonePerformance from '../pages/ZonePerformance';

// Standalone Store Manager Pages
import OverviewPage from '../pages/OverviewPage';
import LiveCamerasPage from '../pages/LiveCamerasPage';
import VisitorsPage from '../pages/VisitorsPage';
import StoreTrafficPage from '../pages/StoreTrafficPage';
import ShelfPerformancePage from '../pages/ShelfPerformancePage';
import ProductInteractionPage from '../pages/ProductInteractionPage';
import LiveHeatmapPage from '../pages/LiveHeatmapPage';
import AlertCenterPage from '../pages/AlertCenterPage';
import ActivitiesPage from '../pages/ActivitiesPage';

interface StoreItem {
  id: string;
  name: string;
  location: string;
}

const DashboardShell: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load stores from API
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiClient.get<StoreItem[]>('/api/stores/');
        setStores(res.data);
        if (res.data.length > 0) {
          setActiveStoreId(res.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching stores", err);
      }
    };
    fetchStores();
  }, []);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const getActiveState = (pathSuffix: string) => {
    if (pathSuffix === '' || pathSuffix === 'overview') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/dashboard/overview';
    }
    return location.pathname === `/dashboard/${pathSuffix}` || location.pathname.startsWith(`/dashboard/${pathSuffix}`);
  };

  const renderSidebarContent = () => {
    if (user?.role === 'Store Manager') {
      return (
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Live Feed Modules</p>
          <nav className="space-y-1 text-xs">
            {[
              { name: 'Overview', id: 'overview', icon: Home },
              { name: 'Live Cameras', id: 'live-cameras', icon: Camera },
              { name: 'Visitors', id: 'visitors', icon: Users },
              { name: 'Store Traffic', id: 'store-traffic', icon: TrendingUp },
              { name: 'Shelf Performance', id: 'shelf-performance', icon: Layers },
              { name: 'Product Interaction', id: 'product-interaction', icon: Package },
              { name: 'Heatmap', id: 'heatmap', icon: Flame },
              { name: 'Alerts', id: 'alerts', icon: Bell },
              { name: 'Reports', id: 'reports', icon: FileText },
              { name: 'Activities', id: 'activities', icon: Clock },
              { name: 'Settings', id: 'settings', icon: SettingsIcon },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => navigate(`/dashboard/${sec.id === 'overview' ? '' : sec.id}`)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition text-left ${
                  getActiveState(sec.id === 'overview' ? '' : sec.id) ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : ''
                }`}
              >
                <sec.icon className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{sec.name}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6">
            <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Workspace Nodes</p>
            <nav className="space-y-1 text-xs text-slate-400">
              {[
                { name: 'Store Configs', path: 'stores' },
                { name: 'Zone Configurations', path: 'zones' },
                { name: 'Aisle Shelf Mappings', path: 'shelves' },
                { name: 'Retail SKU Catalog', path: 'products' },
                { name: 'Camera Hub', path: 'cameras' }
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(`/dashboard/${item.path}`)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    getActiveState(item.path) ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'hover:bg-slate-900'
                  }`}
                >
                  <Store className="w-4 h-4 text-indigo-500/80" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      );
    } else if (user?.role === 'Retail Analyst') {
      return (
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Analyst Modules</p>
          <nav className="space-y-1 text-xs">
            {[
              { name: 'Overview', id: 'overview', icon: Home, path: '' },
              { name: 'Consumer Journey', id: 'consumer-journey', icon: Shuffle, path: 'consumer-journey' },
              { name: 'Attention Analytics', id: 'attention-analytics', icon: Eye, path: 'attention-analytics' },
              { name: 'Customer Segmentation', id: 'customer-segmentation', icon: UserCheck, path: 'customer-segmentation' },
              { name: 'Shopping Behaviour', id: 'shopping-behaviour', icon: TrendingUp, path: 'shopping-behaviour' },
              { name: 'Dwell Time Analysis', id: 'dwell-time-analysis', icon: Clock, path: 'dwell-time-analysis' },
              { name: 'Traffic Flow Heatmap', id: 'traffic-flow', icon: Flame, path: 'traffic-flow' },
              { name: 'Zone Performance', id: 'zone-performance', icon: Layers, path: 'zone-performance' },
              { name: 'Executive Reports', id: 'reports', icon: FileText, path: 'reports' },
              { name: 'Settings', id: 'settings', icon: SettingsIcon, path: 'settings' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => navigate(`/dashboard/${sec.path}`)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition text-left ${
                  getActiveState(sec.path) ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : ''
                }`}
              >
                <sec.icon className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{sec.name}</span>
              </button>
            ))}
          </nav>
        </div>
      );
    } else if (user?.role === 'Marketing Manager') {
      return (
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Marketing Modules</p>
          <nav className="space-y-1 text-xs">
            {[
              { name: 'Overview', id: 'overview', icon: Home },
              { name: 'Campaign Performance', id: 'marketing/performance', icon: Megaphone },
              { name: 'Promotion Effectiveness', id: 'marketing/promotions', icon: TrendingUp },
              { name: 'Product Visibility', id: 'marketing/visibility', icon: Eye },
              { name: 'Product Attractiveness', id: 'marketing/attractiveness', icon: Award },
              { name: 'Executive Reports', id: 'reports', icon: FileText },
              { name: 'Settings', id: 'settings', icon: SettingsIcon },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => navigate(`/dashboard/${sec.id === 'overview' ? '' : sec.id}`)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition text-left ${
                  getActiveState(sec.id === 'overview' ? '' : sec.id) ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : ''
                }`}
              >
                <sec.icon className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{sec.name}</span>
              </button>
            ))}
          </nav>
        </div>
      );
    } else if (user?.role === 'Administrator') {
      return (
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">System Control</p>
          <nav className="space-y-1 text-xs">
            {[
              { name: 'Dashboard Overview', id: 'overview', icon: Home },
              { name: 'User Management', id: 'admin/users', icon: Users },
              { name: 'Camera Management', id: 'admin/cameras', icon: Camera },
              { name: 'System Monitoring', id: 'admin/monitoring', icon: Server },
              { name: 'Audit Logs', id: 'admin/logs', icon: FileText },
              { name: 'Settings', id: 'settings', icon: SettingsIcon },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => navigate(`/dashboard/${sec.id === 'overview' ? '' : sec.id}`)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition text-left ${
                  getActiveState(sec.id === 'overview' ? '' : sec.id) ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : ''
                }`}
              >
                <sec.icon className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{sec.name}</span>
              </button>
            ))}
          </nav>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-[#0d0d15]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-lg text-white font-bold">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hidden md:inline">
              CAMS Portal
            </span>
          </Link>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Store Selector */}
          <div className="relative">
            <select
              value={activeStoreId}
              onChange={(e) => setActiveStoreId(e.target.value)}
              className="bg-[#121218] border border-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200 font-bold"
            >
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.location})
                </option>
              ))}
            </select>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1.5 hover:bg-slate-800 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/50 text-xs">
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name}</p>
                <p className="text-[9px] text-slate-550 leading-none mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#121218] border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/dashboard/settings'); }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-slate-800 text-slate-300"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-slate-800 text-rose-455 border-t border-slate-850"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-[#0d0d15]/50 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-6">
              {renderSidebarContent()}
            </div>

            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
              <span>Security Shield Active</span>
              <Shield className="w-4 h-4 text-indigo-500" />
            </div>
          </aside>
        )}

        {/* Dashboard Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="w-full space-y-6">
            {/* Dynamic Breadcrumbs */}
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="hover:text-slate-350 cursor-pointer">Platform</span>
              <span>/</span>
              <span className="hover:text-slate-350 cursor-pointer">Layouts</span>
              <span>/</span>
              <span className="text-indigo-400">{user?.role}</span>
            </div>

            {/* Dashboard Inner Render via Sub-Routing */}
            {!activeStoreId ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Store className="w-12 h-12 mb-4 animate-bounce text-indigo-500" />
                <span>Please create a Store Layout to load Dashboard statistics.</span>
              </div>
            ) : (
              <Routes>
                {/* Dynamic Landing Routes based on User Role */}
                <Route path="/" element={
                  user?.role === 'Retail Analyst' 
                    ? <RetailAnalystDashboard storeId={activeStoreId} token={token} section="overview" />
                    : user?.role === 'Marketing Manager'
                    ? <MarketingManagerDashboard storeId={activeStoreId} token={token} section="overview" />
                    : user?.role === 'Administrator'
                    ? <OverviewPage storeId={activeStoreId} token={token} />
                    : <OverviewPage storeId={activeStoreId} token={token} />
                } />
                <Route path="/overview" element={
                  user?.role === 'Retail Analyst' 
                    ? <RetailAnalystDashboard storeId={activeStoreId} token={token} section="overview" />
                    : user?.role === 'Marketing Manager'
                    ? <MarketingManagerDashboard storeId={activeStoreId} token={token} section="overview" />
                    : user?.role === 'Administrator'
                    ? <OverviewPage storeId={activeStoreId} token={token} />
                    : <OverviewPage storeId={activeStoreId} token={token} />
                } />

                {/* Core Store Manager sections */}
                <Route path="/live-cameras" element={<LiveCamerasPage storeId={activeStoreId} token={token} />} />
                <Route path="/visitors" element={<VisitorsPage storeId={activeStoreId} token={token} />} />
                <Route path="/store-traffic" element={<StoreTrafficPage storeId={activeStoreId} token={token} />} />
                <Route path="/shelf-performance" element={<ShelfPerformancePage storeId={activeStoreId} token={token} />} />
                <Route path="/product-interaction" element={<ProductInteractionPage storeId={activeStoreId} token={token} />} />
                <Route path="/heatmap" element={<LiveHeatmapPage storeId={activeStoreId} token={token} />} />
                <Route path="/alerts" element={<AlertCenterPage storeId={activeStoreId} token={token} />} />
                <Route path="/activities" element={<ActivitiesPage storeId={activeStoreId} token={token} />} />

                {/* Core Retail Analyst sections */}
                <Route path="/consumer-journey" element={<ConsumerJourney storeId={activeStoreId} token={token} />} />
                <Route path="/attention-analytics" element={<AttentionAnalytics storeId={activeStoreId} token={token} />} />
                <Route path="/customer-segmentation" element={<CustomerSegmentation storeId={activeStoreId} token={token} />} />
                <Route path="/shopping-behaviour" element={<ShoppingBehaviour storeId={activeStoreId} token={token} />} />
                <Route path="/dwell-time-analysis" element={<DwellTimeAnalysis storeId={activeStoreId} token={token} />} />
                <Route path="/traffic-flow" element={<TrafficFlow storeId={activeStoreId} token={token} />} />
                <Route path="/zone-performance" element={<ZonePerformance storeId={activeStoreId} token={token} />} />

                {/* Core Marketing Manager sections */}
                <Route path="/marketing/performance" element={<MarketingManagerDashboard storeId={activeStoreId} token={token} section="campaign-performance" />} />
                <Route path="/marketing/promotions" element={<MarketingManagerDashboard storeId={activeStoreId} token={token} section="promotion-effectiveness" />} />
                <Route path="/marketing/visibility" element={<MarketingManagerDashboard storeId={activeStoreId} token={token} section="overview" />} />
                <Route path="/marketing/attractiveness" element={<MarketingManagerDashboard storeId={activeStoreId} token={token} section="overview" />} />

                {/* Core Administrator sections */}
                <Route path="/admin/users" element={<AdminDashboard storeId={activeStoreId} token={token} section="users" />} />
                <Route path="/admin/cameras" element={<AdminDashboard storeId={activeStoreId} token={token} section="cameras" />} />
                <Route path="/admin/monitoring" element={<AdminDashboard storeId={activeStoreId} token={token} section="monitoring" />} />
                <Route path="/admin/logs" element={<AdminDashboard storeId={activeStoreId} token={token} section="logs" />} />

                {/* Dedicated page views */}
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />

                {/* Workspace CRUD configs */}
                <Route path="/stores" element={<StoresCRUD />} />
                <Route path="/zones" element={<ZonesCRUD />} />
                <Route path="/shelves" element={<ShelvesCRUD />} />
                <Route path="/products" element={<ProductsCRUD />} />
                <Route path="/cameras" element={<CamerasCRUD />} />
                <Route path="/users" element={<UsersCRUD />} />
              </Routes>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
