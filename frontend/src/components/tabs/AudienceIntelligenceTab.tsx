"use client";
import React, { useState } from 'react';
import TrafficTab from './TrafficTab';
import VisitorsTab from './VisitorsTab';
import SegmentationTab from './SegmentationTab';

export default function AudienceIntelligenceTab({ timeFilter }: { timeFilter: string }) {
  const [subTab, setSubTab] = useState<'traffic' | 'demographics' | 'segmentation'>('traffic');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('traffic')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'traffic' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Traffic Flow</button>
        <button onClick={() => setSubTab('demographics')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'demographics' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:bg-slate-900'}`}>Demographics</button>
        <button onClick={() => setSubTab('segmentation')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'segmentation' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Segmentation</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'traffic' && <TrafficTab timeFilter={timeFilter} />}
        {subTab === 'demographics' && <VisitorsTab timeFilter={timeFilter} />}
        {subTab === 'segmentation' && <SegmentationTab timeFilter={timeFilter} />}
      </div>
    </div>
  );
}