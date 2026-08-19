'use client';

import React, { useState } from 'react';
import { Search, Bell, Calendar, Activity, Zap, CheckCircle2, ShieldAlert, LogOut, User } from 'lucide-react';
import { MOCK_ALERTS } from '@/lib/cams-data';

export default function Header({ selectedStore, currentUser, onLogout }) {
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Store Title & Live Indicator */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            {selectedStore.name}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE SIMULATION
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            3 Zones Monitored  •  6 Camera Feeds  •  YOLOv8 + ByteTrack  •  Homography KDE Enabled
          </p>
        </div>
      </div>

      {/* Right: Stream Telemetry, Date, Alerts & User Logout */}
      <div className="flex items-center space-x-4">
        {/* Stream Telemetry Status Pills */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
          <Zap size={13} className="text-amber-400 animate-pulse" />
          <span>Redis Streams: <strong className="text-emerald-400">30 FPS</strong></span>
          <span className="text-slate-600">|</span>
          <span>Worker: <strong className="text-blue-400">x100 Batch</strong></span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsMenu(!showAlertsMenu)}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/70 text-slate-300 hover:text-white relative transition-colors"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-slate-900">
              4
            </span>
          </button>

          {showAlertsMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-400" />
                  Live System Alerts (4)
                </h4>
                <span className="text-[10px] text-blue-400 hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {MOCK_ALERTS.map((alert) => (
                  <div key={alert.id} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start space-x-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></div>
                    <div>
                      <div className="font-bold text-slate-200">{alert.title}</div>
                      <div className="text-[11px] text-slate-400">{alert.subtitle}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{alert.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Badge & Logout Button */}
        {currentUser && (
          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-1.5 pl-3 rounded-xl">
            <div className="text-right text-xs">
              <div className="font-bold text-white leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{currentUser.role}</div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
              title="Logout session"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
