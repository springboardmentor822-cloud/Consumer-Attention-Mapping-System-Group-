import React, { useState } from 'react';
import {
  Store,
  BrainCircuit,
  Target,
  ShieldCheck,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  User,
  Layers,
  ChevronDown,
} from 'lucide-react';

import StoreManagerDashboard from './views/StoreManagerDashboard';
import RetailAnalystDashboard from './views/RetailAnalystDashboard';
import MarketingManagerDashboard from './views/MarketingManagerDashboard';
import AdminDashboard from './views/AdminDashboard';

export default function App() {
  const [activeRole, setActiveRole] = useState('store_manager');
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState('May 16 - May 22, 2025');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roles = [
    { id: 'store_manager', label: 'Store Manager', icon: Store, color: 'text-indigo-400', user: 'Store Operations Team' },
    { id: 'retail_analyst', label: 'Retail Analyst', icon: BrainCircuit, color: 'text-purple-400', user: 'Riya Mehta' },
    { id: 'marketing_manager', label: 'Marketing Manager', icon: Target, color: 'text-amber-400', user: 'Ananya Sharma' },
    { id: 'administrator', label: 'Administrator', icon: ShieldCheck, color: 'text-emerald-400', user: 'System Admin' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const activeRoleData = roles.find((r) => r.id === activeRole) || roles[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Global Header Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 py-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                ATTENTION AI <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Enterprise BI v2.5</span>
              </h1>
              <p className="text-[11px] text-slate-400">Role-Based Spatial Analytics & Store Intelligence</p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1.5 overflow-x-auto">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : role.color}`} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Right User & Action Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              Sync
            </button>

            <button
              onClick={() => alert('Exporting PDF/CSV analytics report...')}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>

            {/* Profile Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-400">
                {activeRoleData.user.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white">{activeRoleData.user}</div>
                <div className="text-[10px] text-slate-400">{activeRoleData.label}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Filter Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 px-6 py-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Store Dropdown */}
            <div className="flex items-center gap-2 text-slate-400">
              <Store className="h-3.5 w-3.5 text-indigo-400" />
              <span>Store:</span>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Stores (Enterprise)</option>
                <option value="store-01">City Mall Superstore</option>
                <option value="store-02">Metro Plaza Express</option>
                <option value="store-03">Central Hub Outlet</option>
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Timeframe:</span>
              <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-white font-medium">
                {dateRange}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> System Status: Normal Operations
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="px-6 py-6 max-w-[1700px] mx-auto">
        {activeRole === 'store_manager' && <StoreManagerDashboard />}
        {activeRole === 'retail_analyst' && <RetailAnalystDashboard />}
        {activeRole === 'marketing_manager' && <MarketingManagerDashboard />}
        {activeRole === 'administrator' && <AdminDashboard />}
      </main>
    </div>
  );
}
