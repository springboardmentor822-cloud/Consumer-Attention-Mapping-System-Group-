'use client';

import React from 'react';
import { ArrowRight, Footprints, Layers } from 'lucide-react';

export default function SankeyDiagram() {
  const nodes = [
    { id: 'entrance', label: 'Store Entrance (10,000)', count: '10,000', color: 'from-blue-600 to-indigo-600', width: 'w-full' },
    { id: 'aisle1', label: 'Aisle 1: Grocery (4,500)', count: '4,500', color: 'from-emerald-600 to-teal-600', width: 'w-11/12' },
    { id: 'aisle2', label: 'Aisle 2: Beverages & Snacks (3,000)', count: '3,000', color: 'from-amber-600 to-yellow-600', width: 'w-9/12' },
    { id: 'aisle3', label: 'Aisle 3: Apparel (2,500)', count: '2,500', color: 'from-purple-600 to-pink-600', width: 'w-8/12' },
    { id: 'checkout', label: 'Checkout Billing (7,800 Total Conversion)', count: '7,800', color: 'from-blue-500 to-cyan-400', width: 'w-full' },
  ];

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <Footprints size={16} className="text-blue-400" />
          CUSTOMER JOURNEY SANKEY DIAGRAM (FLOW PATHING)
        </h4>
        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
          Node Flow Vectoring
        </span>
      </div>

      {/* Visual Sankey Nodes Flow */}
      <div className="space-y-3 relative py-2">
        {/* Node 1: Entrance */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 w-full">
            <span className="font-bold text-blue-400 w-28 shrink-0">Store Entrance</span>
            <div className="h-7 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-lg flex items-center px-3 text-white font-black text-xs shadow w-full">
              10,000 Visitors (100%)
            </div>
          </div>
        </div>

        {/* Connectors */}
        <div className="pl-32 pr-4 flex justify-between text-[10px] text-slate-500 font-mono">
          <span>↓ 45% Flow</span>
          <span>↓ 30% Flow</span>
          <span>↓ 25% Flow</span>
        </div>

        {/* Node 2: Aisle Split */}
        <div className="grid grid-cols-3 gap-3 pl-32">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-xs">
            <div className="font-bold text-emerald-400 text-[11px]">Aisle 1: Grocery</div>
            <div className="text-slate-300 font-mono">4,500 visitors</div>
            <div className="text-[10px] text-emerald-500/80 mt-1">Avg Dwell: 3m 10s</div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800/60 text-xs">
            <div className="font-bold text-amber-400 text-[11px]">Aisle 2: Beverages</div>
            <div className="text-slate-300 font-mono">3,000 visitors</div>
            <div className="text-[10px] text-amber-500/80 mt-1">Avg Dwell: 4m 45s</div>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-800/60 text-xs">
            <div className="font-bold text-purple-400 text-[11px]">Aisle 3: Apparel</div>
            <div className="text-slate-300 font-mono">2,500 visitors</div>
            <div className="text-[10px] text-purple-500/80 mt-1">Avg Dwell: 6m 20s</div>
          </div>
        </div>

        {/* Connectors */}
        <div className="pl-32 flex justify-center text-[10px] text-slate-500 font-mono my-1">
          <span>↓ Merging into Checkout Lanes</span>
        </div>

        {/* Node 3: Checkout Billing */}
        <div className="flex items-center space-x-3 w-full">
          <span className="font-bold text-emerald-400 w-28 shrink-0">Checkout Billing</span>
          <div className="h-7 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 rounded-lg flex items-center px-3 text-white font-black text-xs shadow w-full">
            7,800 Purchased (78% Overall Conversion Rate)
          </div>
        </div>
      </div>
    </div>
  );
}
