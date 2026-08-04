import React from 'react';

interface PageProps {
  storeId: string;
  token: string | null;
}

export default function ZonePerformance({ storeId, token }: PageProps) {
  const zones = [
    { name: "Electronics", val: 82 },
    { name: "Apparel", val: 76 },
    { name: "Home & Living", val: 68 },
    { name: "Personal Care", val: 61 },
    { name: "Groceries", val: 54 },
    { name: "Footfall Zone", val: 48 }
  ];

  return (
    <div className="space-y-6 text-slate-100 max-w-2xl mx-auto">
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-6 shadow-lg space-y-6">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-3">Zone Performance Analytics</span>
        <div className="space-y-4">
          {zones.map((zone, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-350">
                <span>{zone.name} Zone</span>
                <span className="text-indigo-400">{zone.val} / 100</span>
              </div>
              <div className="w-full bg-[#161625] h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${zone.val}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
