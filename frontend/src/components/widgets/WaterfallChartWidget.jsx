import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

export default function WaterfallChartWidget({ title = 'Sales Lift Waterfall Chart', data }) {
  const steps = data || [
    { name: 'Baseline Sales', value: 5.6, isTotal: false, type: 'start' },
    { name: 'Promo Banner Lift', value: 1.2, isTotal: false, type: 'add' },
    { name: 'Shelf Placement', value: 1.1, isTotal: false, type: 'add' },
    { name: 'Discount Attraction', value: 1.0, isTotal: false, type: 'add' },
    { name: 'Final Revenue', value: 8.9, isTotal: true, type: 'total' },
  ];

  const maxVal = 10;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          +58.9% Total Lift
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="flex h-56 items-end justify-between gap-3 pt-6 pb-6">
          {steps.map((step, idx) => {
            const barHeightPct = (step.value / maxVal) * 100;
            const barColor = step.type === 'total'
              ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
              : step.type === 'start'
              ? 'bg-gradient-to-t from-blue-600 to-indigo-400'
              : 'bg-gradient-to-t from-amber-500 to-orange-400';

            return (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-white">₹{step.value}L</span>
                <div className="w-full bg-slate-900/50 rounded-t h-40 flex items-end justify-center px-2">
                  <div
                    className={`w-full rounded-t transition-all duration-500 shadow-lg ${barColor}`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium text-center line-clamp-1">
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
