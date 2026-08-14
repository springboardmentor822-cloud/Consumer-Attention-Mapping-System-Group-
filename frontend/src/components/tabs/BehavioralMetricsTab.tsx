"use client";
import React, { useState } from 'react';
import BehaviorTab from './BehaviorTab';
import AttentionTab from './AttentionTab';
import DwellTab from './DwellTab';

export default function BehavioralMetricsTab({ timeFilter }: { timeFilter: string }) {
  const [subTab, setSubTab] = useState<'behavior' | 'attention' | 'dwell'>('behavior');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('behavior')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'behavior' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Shopping Behavior</button>
        <button onClick={() => setSubTab('attention')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'attention' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:bg-slate-900'}`}>Attention Analytics</button>
        <button onClick={() => setSubTab('dwell')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'dwell' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Dwell Time</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'behavior' && <BehaviorTab />}
        {subTab === 'attention' && <AttentionTab />}
        {subTab === 'dwell' && <DwellTab />}
      </div>
    </div>
  );
}