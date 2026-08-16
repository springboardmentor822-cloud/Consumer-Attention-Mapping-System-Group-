"use client";
import React, { useEffect, useState } from 'react';

interface Recommendation {
  id: number;
  priority: string;
  sku: string;
  action: string;
  reason: string;
}

export default function RecsTab() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/v1/recommendations', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (isMounted) setRecs(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Recommendations fetch error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const priorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return { badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'High Priority' };
      default: return { badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', label: 'Medium Priority' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-2">Merchandising Recommendations</h3>
        <p className="text-slate-400 text-sm mb-6">
          Rule-based suggestions generated from real per-zone attractiveness scores (Attention Duration, Interaction
          Frequency, Pickup-Pause Rate, Purchase Conversion, Repeat Engagement) — recalculated every 15 minutes as
          camera tracking data accumulates.
        </p>

        {loading ? (
          <div className="text-center py-12 text-cyan-400 font-mono text-xs animate-pulse">Loading recommendations...</div>
        ) : recs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No recommendations yet.</p>
            <p className="text-slate-600 text-xs mt-2">
              These populate once completed shopper sessions from the Cameras tab produce enough zone-level data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recs.map((rec) => {
              const style = priorityStyle(rec.priority);
              return (
                <div key={rec.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${style.badge}`}>
                    {style.label}
                  </span>
                  <h4 className="text-slate-100 font-bold text-base mt-3 mb-1">{rec.action}</h4>
                  <p className="text-slate-500 text-[10px] font-mono mb-2">{rec.sku}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
