"use client";
import React, { useEffect, useState } from 'react';

interface ClusterSegment {
  id: number;
  label: string;
  size: number;
  share: number;
  avg_spend: number;
  avg_rating: number;
}

interface BehavioralSegment {
  label: string;
  count: number;
  share: number;
}

export default function SegmentationTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [segments, setSegments] = useState<ClusterSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [behavioral, setBehavioral] = useState<BehavioralSegment[]>([]);
  const [behavioralHasData, setBehavioralHasData] = useState(false);
  const [behavioralMessage, setBehavioralMessage] = useState<string | null>(null);
  const [behavioralLoading, setBehavioralLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/v1/dashboard/segmentation?time_filter=${timeFilter}`, { credentials: 'include' });
        const data = await res.json();
        if (isMounted && data.status === "success") setSegments(data.data);
      } catch (err) {
        console.error("Segmentation fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  // Real, camera-derived shopper archetypes (Explorers, Quick Buyers, Comparison
  // Shoppers, Impulse Buyers, Brand Loyal Customers) — a separate real data
  // source from the purchase-based K-Means clusters above. See backend
  // /dashboard/behavioral-segments for the honesty notes on why these two
  // can't currently be joined to the same shopper.
  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/v1/dashboard/behavioral-segments', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.status === "success") {
          setBehavioral(data.data || []);
          setBehavioralHasData(!!data.has_data);
          setBehavioralMessage(data.message || null);
        }
      })
      .catch(err => console.error("Behavioral segments fetch error:", err))
      .finally(() => { if (isMounted) setBehavioralLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const segmentColor = (label: string) => {
    switch (label) {
      case 'Impulse Buyer': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Comparison Shopper': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Explorer': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Quick Buyer': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      {/* Real, camera-derived behavioral archetypes (spec Step 1) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100">Behavioral Shopper Segments</h3>
          <p className="text-xs text-slate-400 mt-1">
            Classified from real camera-tracked movement (dwell duration, pause count, zone) — distinct from the
            purchase-based clusters below, which come from the sales CSV instead.
          </p>
        </div>

        {behavioralLoading ? (
          <div className="text-cyan-400 font-mono text-sm py-8 text-center animate-pulse">Loading behavioral segments...</div>
        ) : !behavioralHasData ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">{behavioralMessage || "No completed shopper sessions yet."}</p>
            <p className="text-slate-600 text-xs mt-2">Open the Cameras tab to start live tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {behavioral.map((seg, idx) => (
              <div key={idx} className={`border rounded-xl p-4 ${segmentColor(seg.label)}`}>
                <p className="text-xs font-bold uppercase tracking-wider">{seg.label}</p>
                <p className="text-2xl font-bold mt-2 text-slate-100">{seg.share}%</p>
                <p className="text-[10px] text-slate-500 mt-1">{seg.count} sessions</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing purchase-based K-Means clusters */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100">K-Means Customer Segmentation</h3>
          <p className="text-xs text-slate-400 mt-1">Unsupervised machine learning clustering driven by transaction totals, quantities, and ratings.</p>
        </div>

        {loading ? (
          <div className="text-cyan-400 font-mono text-sm py-12 text-center animate-pulse">Running K-Means algorithm on CSV features...</div>
        ) : segments.length === 0 ? (
          <div className="text-slate-500 font-mono text-sm py-12 text-center">Not enough data to run K-Means clustering for this time period.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {segments.map((seg) => (
              <div key={seg.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                  Cluster #{seg.id}
                </span>
                <h4 className="text-lg font-bold text-slate-100 mt-3 mb-1">{seg.label}</h4>
                <p className="text-2xl font-bold text-emerald-400 mb-4">{seg.share}% <span className="text-xs text-slate-400 font-normal">of dataset</span></p>
                
                <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cohort Size:</span>
                    <span className="font-mono text-slate-200">{seg.size} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Transaction Spend:</span>
                    <span className="font-mono text-slate-200">${seg.avg_spend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Customer Rating:</span>
                    <span className="font-mono text-amber-400">{seg.avg_rating.toFixed(1)} / 10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}