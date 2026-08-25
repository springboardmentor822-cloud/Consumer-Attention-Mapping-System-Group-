"use client";
import React, { useState } from 'react';
import SysSettingsTab from './SysSettingsTab';
import StoreLayoutTab from './StoreLayoutTab';
import ExportTab from './ExportTab';

export default function GlobalSettingsTab({ role = 'Administrator' }: { role?: 'Store Manager' | 'Retail Analyst' | 'Marketing Manager' | 'Administrator' }) {
  const [subTab, setSubTab] = useState<'sys' | 'layout' | 'export'>('sys');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('sys')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'sys' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Configuration</button>
        <button onClick={() => setSubTab('layout')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'layout' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Store Layout</button>
        <button onClick={() => setSubTab('export')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'export' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:bg-slate-900'}`}>Export Data</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'sys' && <SysSettingsTab />}
        {subTab === 'layout' && <StoreLayoutTab />}
        {subTab === 'export' && <ExportTab role={role} />}
      </div>
    </div>
  );
}