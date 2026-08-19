'use client';

import React from 'react';
import { ShoppingBag, Eye, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';

export default function BeforeAfterPromotionLift() {
  const metrics = [
    {
      id: 'pickups',
      title: 'Product Pickups',
      icon: ShoppingBag,
      beforeVal: 120,
      afterVal: 310,
      lift: '+158%',
      beforeUnit: 'pickups',
      afterUnit: 'pickups',
      barBeforeWidth: '38%',
      barAfterWidth: '95%',
    },
    {
      id: 'attention',
      title: 'Avg Attention Time',
      icon: Eye,
      beforeVal: '4.2s',
      afterVal: '8.1s',
      lift: '+92%',
      beforeUnit: 'seconds / visitor',
      afterUnit: 'seconds / visitor',
      barBeforeWidth: '45%',
      barAfterWidth: '90%',
    },
    {
      id: 'conversion',
      title: 'Conversion Rate',
      icon: TrendingUp,
      beforeVal: '12%',
      afterVal: '28%',
      lift: '+133%',
      beforeUnit: 'checkout conversion',
      afterUnit: 'checkout conversion',
      barBeforeWidth: '40%',
      barAfterWidth: '92%',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            BEFORE vs. AFTER PROMOTION LIFT (DUAL-BAR COMPARISON)
          </h3>
          <p className="text-xs text-slate-400">Baseline performance period vs. promotional placement campaign period</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-slate-300">Before Promotion</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-300">After Promotion</span>
          </div>
        </div>
      </div>

      {/* Dual Bar Metric Row Cards */}
      <div className="space-y-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Icon size={16} />
                  </div>
                  <span className="font-bold text-white text-xs">{item.title}</span>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                  <ArrowUpRight size={14} />
                  <span>{item.lift} LIFT</span>
                </div>
              </div>

              {/* Bars */}
              <div className="space-y-1.5 pt-1 text-xs">
                {/* Before Bar */}
                <div className="flex items-center space-x-3">
                  <span className="w-16 font-mono text-[10px] text-slate-400 font-bold">BEFORE</span>
                  <div className="flex-1 bg-slate-900 rounded-lg h-6 overflow-hidden flex items-center px-2">
                    <div
                      className="bg-blue-500 h-full rounded-md transition-all duration-500 flex items-center justify-end px-2 text-[11px] font-black text-white"
                      style={{ width: item.barBeforeWidth }}
                    >
                      {item.beforeVal}
                    </div>
                  </div>
                </div>

                {/* After Bar */}
                <div className="flex items-center space-x-3">
                  <span className="w-16 font-mono text-[10px] text-emerald-400 font-bold">AFTER</span>
                  <div className="flex-1 bg-slate-900 rounded-lg h-6 overflow-hidden flex items-center px-2">
                    <div
                      className="bg-emerald-500 h-full rounded-md transition-all duration-500 flex items-center justify-end px-2 text-[11px] font-black text-white"
                      style={{ width: item.barAfterWidth }}
                    >
                      {item.afterVal}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
