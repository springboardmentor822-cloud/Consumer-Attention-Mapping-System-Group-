"use client";
import React, { useEffect, useState } from 'react';

interface ZoneData {
  id: string;
  name: string;
  traffic_type: string;
  footfall_share: number;
  conversion_rate: number;
  conversion_metric_label: string;
  color: string; 
}

// Map color strings to Tailwind classes safely so they aren't purged in production
const colorMap: Record<string, { bg: string, text: string, bar: string, border: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500', border: 'border-cyan-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500', border: 'border-purple-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500', border: 'border-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500', border: 'border-rose-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500', border: 'border-blue-500/20' },
};

export default function ZoneTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchZones = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/zones?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") {
          setZones(data.data);
        }
      } catch (err) {
        console.error("Zones fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchZones();
    return () => { isMounted = false; };
  }, [timeFilter]);

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Zone Performance & Traffic</h3>
            <p className="text-xs text-slate-400 mt-1">Live physical zone metrics dynamically generated from the POS dataset.</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
            Dataset Sync Active
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-cyan-400 font-mono text-sm animate-pulse">Syncing zone data...</div>
        ) : zones.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">No zone data available for this range.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone, idx) => {
              const theme = colorMap[zone.color] || colorMap.cyan;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${theme.bg} ${theme.text} ${theme.border}`}>
                        {zone.id}
                      </span>
                      <h4 className="text-lg font-bold text-slate-200 mt-2">{zone.name}</h4>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">{zone.traffic_type}</span>
                  </div>
                  
                  <div className="space-y-4 pt-2 border-t border-slate-800/60">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Footfall Share</span>
                        <span className="font-bold text-slate-200">{zone.footfall_share}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${theme.bar} rounded-full`} style={{ width: `${zone.footfall_share}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">
                        <span>{zone.conversion_metric_label}</span>
                        <span className="font-bold text-slate-200">{zone.conversion_rate ? `${zone.conversion_rate}%` : 'N/A'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${theme.bar} rounded-full opacity-70`} style={{ width: `${zone.conversion_rate || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}