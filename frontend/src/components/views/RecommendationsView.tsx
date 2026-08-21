import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Sparkles, ArrowUpRight, ShieldAlert } from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    api.getRecommendations('STORE-812').then((res) => setRecs(res));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Automated Merchandising Recommendation Engine</h2>
          <p className="text-xs text-slate-400">Rule matrix optimizations for SKU placement, pricing checks, and eye-level relocation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recs.map((rec) => (
          <div key={rec.id} className="bi-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-300 border border-rose-500">
                {rec.priority} PRIORITY
              </span>
              <span className="text-xs font-bold text-emerald-400">+{rec.expected_conversion_uplift}% Uplift</span>
            </div>
            <div className="text-sm font-extrabold text-white">{rec.action}</div>
            <div className="text-xs text-slate-300">{rec.reason}</div>
            <div className="pt-3 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
              <span>SKU: {rec.sku}</span>
              <span>Shelf: {rec.shelf_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
