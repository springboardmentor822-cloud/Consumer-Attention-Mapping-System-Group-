import React from 'react';

export default function CampaignTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">A/B Campaign Performance</h3>
            <p className="text-slate-400 text-sm mt-1">Measuring physical endcap displays using AI attention and conversion metrics.</p>
          </div>
          <button className="mt-4 md:mt-0 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition">
            + New Campaign Test
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border border-slate-700 bg-slate-950/50 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Control Group</div>
            <h4 className="text-cyan-400 font-bold text-lg mb-1">Display A (Standard Shelf)</h4>
            <p className="text-slate-400 text-xs mb-6">Location: Aisle 4, Section B</p>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-800/80 pb-3">
                <span className="text-slate-300 text-sm font-medium">Avg. Attention Time</span>
                <span className="text-slate-100 font-bold text-lg">4.2s</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800/80 pb-3">
                <span className="text-slate-300 text-sm font-medium">Physical Pickup Rate</span>
                <span className="text-slate-100 font-bold text-lg">12.5%</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-300 text-sm font-medium">Final Conversion Rate</span>
                <span className="text-slate-100 font-bold text-lg">3.1%</span>
              </div>
            </div>
          </div>

          <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 right-0 bg-emerald-500 text-emerald-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Test Variant (Winner)</div>
            <h4 className="text-emerald-400 font-bold text-lg mb-1">Display B (Interactive Endcap)</h4>
            <p className="text-slate-400 text-xs mb-6">Location: Aisle 1 (High Traffic Zone)</p>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-emerald-900/50 pb-3">
                <span className="text-slate-300 text-sm font-medium">Avg. Attention Time</span>
                <span className="text-emerald-400 font-bold text-lg">8.7s <span className="text-xs ml-2 text-emerald-500 font-normal bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 107%</span></span>
              </div>
              <div className="flex justify-between items-end border-b border-emerald-900/50 pb-3">
                <span className="text-slate-300 text-sm font-medium">Physical Pickup Rate</span>
                <span className="text-emerald-400 font-bold text-lg">28.4% <span className="text-xs ml-2 text-emerald-500 font-normal bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 127%</span></span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-slate-300 text-sm font-medium">Final Conversion Rate</span>
                <span className="text-emerald-400 font-bold text-lg">9.2% <span className="text-xs ml-2 text-emerald-500 font-normal bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 196%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}