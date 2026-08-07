import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function KpiCard({ title, value, change, isPositive, subtext, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    violet: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 text-violet-400',
  };

  const badgeColor = isPositive === true
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : isPositive === false
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    : 'bg-slate-700/50 text-slate-300 border-slate-600/30';

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-slate-900/80 p-5 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/10 bg-gradient-to-br ${colorMap[color] || colorMap.indigo}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="rounded-lg bg-slate-800/80 p-2.5 shadow-inner border border-slate-700/50">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
        {change && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${badgeColor}`}>
            {isPositive === true && <ArrowUpRight className="h-3 w-3" />}
            {isPositive === false && <ArrowDownRight className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
          <Activity className="h-3 w-3 text-slate-500" />
          {subtext}
        </p>
      )}
    </div>
  );
}
