"use client";
import React, { useState } from 'react';
import InfraTab from './InfraTab';
import DeviceHealthTab from './DeviceHealthTab';
import DeviceMgmtTab from './DeviceMgmtTab';
import ApiPerformanceTab from './ApiPerformanceTab';

export default function HardwareInfraTab() {
  const [subTab, setSubTab] = useState<'infra' | 'health' | 'mgmt' | 'api'>('infra');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('infra')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'infra' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Infrastructure</button>
        <button onClick={() => setSubTab('health')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'health' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Device Health</button>
        <button onClick={() => setSubTab('mgmt')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'mgmt' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:bg-slate-900'}`}>Device Mgmt</button>
        <button onClick={() => setSubTab('api')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'api' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:bg-slate-900'}`}>API Performance</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'infra' && <InfraTab />}
        {subTab === 'health' && <DeviceHealthTab />}
        {subTab === 'mgmt' && <DeviceMgmtTab />}
        {subTab === 'api' && <ApiPerformanceTab />}
      </div>
    </div>
  );
}