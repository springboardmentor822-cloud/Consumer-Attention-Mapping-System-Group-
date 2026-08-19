'use client';

import React from 'react';
import {
  LayoutDashboard,
  Video,
  Users,
  TrendingUp,
  Grid,
  ShoppingBag,
  Flame,
  Bell,
  FileText,
  Activity,
  Settings,
  ShieldCheck,
  HardDrive,
  Cpu,
  LogOut,
  ChevronDown,
  Store,
  Eye,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { STORES } from '@/lib/cams-data';

export default function Sidebar({
  currentUser,
  activeRole,
  activeTab,
  setActiveTab,
  selectedStore,
  setSelectedStore
}) {
  // Define strict role-allowed navigation tabs
  const getAllowedTabs = () => {
    if (currentUser?.role === 'Admin') {
      return [
        { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard },
        { id: 'cameras', label: 'Fleet Cameras', icon: Video },
        { id: 'system', label: 'System Health', icon: Cpu },
        { id: 'reports', label: 'Audit & Reports', icon: FileText },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ];
    }
    if (currentUser?.role === 'Store Manager') {
      return [
        { id: 'overview', label: 'Store Dashboard', icon: LayoutDashboard },
        { id: 'cameras', label: 'Live Camera Feeds', icon: Video, badge: '6 LIVE' },
        { id: 'visitors', label: 'Shopper Tracking', icon: Users },
        { id: 'traffic', label: 'Store Traffic & Velocity', icon: TrendingUp },
        { id: 'shelf', label: 'Shelf Performance', icon: Grid },
        { id: 'products', label: 'Product Interaction', icon: ShoppingBag },
        { id: 'alerts', label: 'Real-Time Alerts', icon: Bell, alertCount: 4 },
        { id: 'reports', label: 'Export Reports', icon: FileText },
      ];
    }
    if (currentUser?.role === 'Retail Analyst') {
      return [
        { id: 'overview', label: 'Analyst Dashboard', icon: LayoutDashboard },
        { id: 'heatmap', label: '2D Homography Heatmap', icon: Flame, badge: 'KDE' },
        { id: 'visitors', label: 'Shopper Trajectories', icon: Users },
        { id: 'shelf', label: 'Attractiveness Scores', icon: Grid },
        { id: 'reports', label: 'Analyst Exports', icon: FileText },
      ];
    }
    if (currentUser?.role === 'Marketing Manager') {
      return [
        { id: 'overview', label: 'Marketing Dashboard', icon: LayoutDashboard },
        { id: 'promo', label: 'Promotional Displays', icon: Eye },
        { id: 'traffic', label: 'Campaign Visibility', icon: TrendingUp },
        { id: 'reports', label: 'Campaign Reports', icon: FileText },
      ];
    }
    return [];
  };

  const allowedTabs = getAllowedTabs();

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-300 select-none overflow-y-auto custom-scrollbar">
      <div>
        {/* Top Header Logo */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 border border-blue-400/30">
              C
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
                CAMS
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono border border-blue-500/30">v2.4</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Consumer Attention Intelligence</p>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Store Selector */}
        <div className="px-3 py-3 border-b border-slate-800/60">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1.5">
            Active Store (Multi-Tenant)
          </label>
          <div className="relative">
            <select
              value={selectedStore.id}
              onChange={(e) => {
                const s = STORES.find(st => st.id === e.target.value);
                if (s) setSelectedStore(s);
              }}
              className="w-full bg-slate-950/80 border border-slate-700/80 text-white text-xs rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-blue-500 transition-colors font-medium cursor-pointer"
            >
              {STORES.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* User Role Security Banner */}
        <div className="p-3 border-b border-slate-800/60">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
            Authenticated Access Level
          </label>
          <div className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-xs font-bold ${currentUser?.badgeColor}`}>
            <Lock size={15} className="shrink-0" />
            <div className="truncate">
              <div className="leading-tight">{currentUser?.role}</div>
              <div className="text-[10px] opacity-80 font-normal font-mono">Restricted Viewport</div>
            </div>
          </div>
        </div>

        {/* Strict Role-Filtered Navigation Tabs */}
        <div className="px-2 py-3 space-y-1 text-xs font-medium">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2 flex items-center justify-between">
            <span>{currentUser?.role} Navigation</span>
            <Lock size={10} className="text-slate-500" />
          </div>

          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                    {tab.badge}
                  </span>
                )}
                {tab.alertCount && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {tab.alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Authenticated User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
            {currentUser?.avatar || 'US'}
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'User'}</div>
            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              JWT Isolated Role
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
