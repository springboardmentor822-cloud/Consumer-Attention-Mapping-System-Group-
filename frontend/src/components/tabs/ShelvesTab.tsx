"use client";
import React, { useEffect, useState } from 'react';

interface ZoneEngagement {
  zone: string;
  camera_id: number;
  avg_dwell_seconds: number;
  engagement_score: number;
  sessions: number;
  status: string;
}

export default function ShelvesTab() {
  const [zones, setZones] = useState<ZoneEngagement[]>([]);
  const [hasData, setHasData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShelves = () => {
    fetch('/api/backend/v1/dashboard/shelves', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setZones(data.data || []);
          setHasData(!!data.has_data);
          setMessage(data.message || null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Shelves fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShelves();
    const interval = setInterval(fetchShelves, 5000);
    return () => clearInterval(interval);
  }, []);

  const getGlowColor = (score: number) => {
    if (score >= 80) return 'shadow-[inset_0_0_30px_rgba(239,68,68,0.4)] border-rose-500/50';
    if (score >= 50) return 'shadow-[inset_0_0_30px_rgba(245,158,11,0.4)] border-amber-500/50';
    if (score >= 25) return 'shadow-[inset_0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50';
    return 'shadow-[inset_0_0_15px_rgba(148,163,184,0.1)] border-slate-700';
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-rose-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 25) return 'text-blue-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Zone-Level Shelf Engagement</h2>
          <p className="text-xs text-slate-400 mt-1">Real camera-tracked dwell time per store zone, normalized against the busiest zone.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2 mr-2">
            <button onClick={() => alert("This button isn't wired to real backend logic. To actually add a shelf zone, use Store Layout Studio's \"+ Add Node\" then \"Publish Planogram\" — that writes to the real StoreZoneDB table this tab reads from.")} className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors">
              + Add Shelf
            </button>
            <button onClick={() => alert("This button isn't wired to real backend logic. To actually remove a shelf zone, use Store Layout Studio, select the node, and choose \"Delete Node\" — that writes to the real StoreZoneDB table this tab reads from.")} className="bg-rose-600/20 text-rose-400 border border-rose-600/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600/30 transition-colors">
              - Remove Shelf
            </button>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Live Tracking</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          This tab previously showed fake Top/Middle/Bottom shelf-tier scores. Person-bounding-box tracking can tell
          us <em>which zone</em> and <em>how long</em> someone dwelled there, but not which vertical shelf tier they
          reached toward — that needs wrist/pose tracking, which isn&apos;t running yet. Shown below is real, zone-level
          engagement instead.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="lg:col-span-2 text-center py-12 text-cyan-400 font-mono text-xs animate-pulse">
            Loading zone engagement telemetry...
          </div>
        ) : !hasData ? (
          <div className="lg:col-span-2 text-center py-12">
            <p className="text-slate-400 text-sm">{message || "No completed shopper sessions yet."}</p>
            <p className="text-slate-600 text-xs mt-2">Open the Cameras tab to start live tracking on shelf-facing feeds.</p>
          </div>
        ) : (
          zones.map((zone, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-inner flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-200">{zone.zone}</h3>
                <span className="text-xs font-mono text-slate-500">Camera {zone.camera_id}</span>
              </div>

              <div className={`relative rounded-lg p-5 border-2 transition-all duration-500 ${getGlowColor(zone.engagement_score)}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Engagement Score</p>
                    <p className={`text-3xl font-bold ${getTextColor(zone.engagement_score)}`}>
                      {zone.engagement_score}<span className="text-sm font-normal text-slate-500 ml-1">/ 100</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-mono mb-1">Status</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700 ${getTextColor(zone.engagement_score)}`}>
                      {zone.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-800/50 text-xs text-slate-400">
                  <span>Avg Dwell: <span className="text-slate-200 font-bold">{zone.avg_dwell_seconds}s</span></span>
                  <span>Sessions: <span className="text-slate-200 font-bold">{zone.sessions}</span></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}