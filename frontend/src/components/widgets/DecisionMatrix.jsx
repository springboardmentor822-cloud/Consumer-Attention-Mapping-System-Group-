import React from 'react';
import { Sparkles, CheckCircle2, ArrowUpRight, Zap } from 'lucide-react';

export default function DecisionMatrix({ recommendations }) {
  const recList = recommendations || [
    { id: 'rec-1', title: 'Increase Visibility of Product C on Shelf B', detail: 'High attention, low conversion detected.', impact: 'High Impact', badge: 'high' },
    { id: 'rec-2', title: 'Extend Weekend Bonanza Campaign', detail: 'Performing well with high engagement.', impact: 'Medium Impact', badge: 'medium' },
    { id: 'rec-3', title: 'Relocate Product D to Shelf A', detail: 'Low visibility detected on current shelf.', impact: 'Medium Impact', badge: 'medium' },
    { id: 'rec-4', title: 'Increase Promotion in 6 PM - 9 PM Slot', detail: 'High footfall but low conversion in this time window.', impact: 'Low Impact', badge: 'low' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h4 className="font-semibold text-white">AI Recommendations & Priority Matrix</h4>
        </div>
        <span className="rounded bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300 border border-amber-500/20">
          Powered by AGY AI
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recList.map((item) => {
          const badgeClass = item.badge === 'high'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : item.badge === 'medium'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-blue-500/10 text-blue-400 border-blue-500/30';

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-semibold text-sm text-slate-100">{item.title}</h5>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${badgeClass}`}>
                    {item.impact}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{item.detail}</p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" /> Action Suggested
                </span>
                <button className="flex items-center gap-1 rounded bg-indigo-600/80 px-2.5 py-1 text-xs text-white hover:bg-indigo-500 transition-all">
                  Apply <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
