"use client";
import React, { useState } from 'react';
import CamerasTab from './CamerasTab';
import HeatmapTab from './HeatmapTab';
import StoreLayoutTab from './StoreLayoutTab';

export default function LiveFloorTab({ timeFilter }: { timeFilter: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'cameras' | 'heatmap' | 'layout'>('heatmap');

  return (
    <div className="w-full flex flex-col h-[calc(100vh-120px)] space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button 
          onClick={() => setActiveSubTab('heatmap')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'heatmap' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          Spatial Density Map
        </button>
        <button 
          onClick={() => setActiveSubTab('cameras')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'cameras' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          Live Vision Nodes
        </button>
        <button 
          onClick={() => setActiveSubTab('layout')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'layout' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          Physical Planogram
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto w-full">
        {activeSubTab === 'heatmap' && <HeatmapTab timeFilter={timeFilter} />}
        {activeSubTab === 'cameras' && <CamerasTab />}
        {activeSubTab === 'layout' && <StoreLayoutTab />}
      </div>
    </div>
  );
}