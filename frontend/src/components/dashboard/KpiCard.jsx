import React from "react";

export default function KpiCard({ title, value, icon, trend, trendValue, colorClass, gradientClass }) {
  return (
    <div className={`relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg group hover:border-slate-500 transition-all duration-300`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${gradientClass} group-hover:opacity-40 transition-opacity`}></div>
      
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl bg-slate-800 border border-slate-700 ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : trend === 'down' ? 'text-red-400 bg-red-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
      </div>
    </div>
  );
}
