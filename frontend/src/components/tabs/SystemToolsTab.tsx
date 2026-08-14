"use client";
import React, { useState } from 'react';
import AlertsTab from './AlertsTab';
import ExportTab from './ExportTab';

export default function SystemToolsTab() {
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'export'>('alerts');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button 
          onClick={() => setActiveSubTab('alerts')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'alerts' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          Alerts & Notifications
        </button>
        <button 
          onClick={() => setActiveSubTab('export')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'export' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          Export Engine
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeSubTab === 'alerts' && <AlertsTab />}
        {activeSubTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}