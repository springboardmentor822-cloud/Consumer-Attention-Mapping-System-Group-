'use client';

import React, { useState, useEffect } from 'react';

interface RecommendationItem {
  id: number;
  store_id: number;
  shelf_id?: number;
  product_id?: number;
  timestamp: string;
  issue_type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommended_action: string;
  expected_uplift: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export default function RecommendationFeed({ storeId = 1 }: { storeId?: number }) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/recommendations?store_id=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (err) {
        console.error("Recommendations fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [storeId, BACKEND_URL]);

  const handleAction = async (id: number, actionType: 'acknowledged' | 'resolved') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/recommendations/${id}/action?status_update=${actionType}`, {
        method: 'POST'
      });
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((rec) => (rec.id === id ? { ...rec, status: actionType } : rec))
        );
      }
    } catch (err) {
      console.error("Action update error:", err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium Priority</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Low Priority</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Automated Optimization Recommendations
          </h3>
          <p className="text-xs text-slate-400">Heuristic diagnostic tree alerts for store managers & analysts</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {recommendations.filter(r => r.status === 'active').length} Active Alerts
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading diagnostic recommendations...</div>
      ) : recommendations.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">No active store recommendations at this time.</div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-lg border transition-all ${
                rec.status === 'resolved'
                  ? 'bg-slate-950/40 border-slate-800 opacity-60'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-indigo-500/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(rec.priority)}
                  <h4 className="text-sm font-semibold text-slate-100">{rec.title}</h4>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  {rec.expected_uplift}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-2 leading-relaxed">{rec.description}</p>

              <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800/90 mb-3 text-xs text-indigo-300">
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Recommended Action:</span>
                {rec.recommended_action}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Status: <span className="font-semibold text-slate-300 uppercase">{rec.status}</span>
                </span>
                <div className="flex items-center gap-2">
                  {rec.status === 'active' && (
                    <button
                      onClick={() => handleAction(rec.id, 'acknowledged')}
                      className="px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
                    >
                      Acknowledge
                    </button>
                  )}
                  {rec.status !== 'resolved' && (
                    <button
                      onClick={() => handleAction(rec.id, 'resolved')}
                      className="px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition shadow-sm"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
