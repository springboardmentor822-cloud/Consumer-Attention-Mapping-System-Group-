import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface PageProps {
  storeId: string;
  token: string | null;
}

export default function ConsumerJourney({ storeId, token }: PageProps) {
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/dashboards/analyst/${storeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load journey statistics");
        const json = await res.json();
        setData(json.sankey_data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId, token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
      <span className="text-xs">Loading Consumer Journey...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400 p-4">
      <AlertTriangle className="text-rose-500 w-10 h-10 mb-2" />
      <span className="text-xs">{error || "Connection offline"}</span>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flow Diagram */}
        <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Consumer Journey Flow</span>
          <div className="flex flex-col space-y-3 justify-center items-center py-4 bg-[#0f0f18] rounded-lg border border-slate-850 text-xs font-bold">
            <span className="bg-indigo-650/10 border border-indigo-500/20 px-4 py-2 rounded text-indigo-300">Entrance</span>
            <span className="text-slate-650">↓</span>
            <span className="bg-amber-650/10 border border-amber-500/20 px-4 py-2 rounded text-amber-300">Promo Aisle</span>
            <span className="text-slate-650">↓</span>
            <span className="bg-emerald-650/10 border border-emerald-500/20 px-4 py-2 rounded text-emerald-300">Display Shelf</span>
            <span className="text-slate-650">↓</span>
            <span className="bg-rose-650/10 border border-rose-500/20 px-4 py-2 rounded text-rose-300">Checkout Counter</span>
          </div>
        </div>

        {/* Sankey Diagram */}
        <div className="lg:col-span-8 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Customer Journey Sankey Diagram</span>
          <div className="relative bg-[#08080f]/50 p-2 rounded-lg border border-slate-900 overflow-x-auto">
            <svg className="w-full h-full min-h-[220px]" viewBox="0 0 420 220">
              {/* Entrance connections to in-store zones */}
              <path d="M 50 40 C 110 40, 110 50, 170 50" fill="none" stroke="rgba(99, 102, 241, 0.45)" strokeWidth={12} />
              <path d="M 50 110 C 110 110, 110 90, 170 90" fill="none" stroke="rgba(59, 130, 246, 0.45)" strokeWidth={18} />
              <path d="M 50 180 C 110 180, 110 140, 170 130" fill="none" stroke="rgba(16, 185, 129, 0.45)" strokeWidth={8} />

              {/* Zones connections to checkout/exit */}
              <path d="M 250 50 C 300 50, 310 70, 370 70" fill="none" stroke="rgba(99, 102, 241, 0.45)" strokeWidth={14} />
              <path d="M 250 90 C 300 90, 310 120, 370 120" fill="none" stroke="rgba(59, 130, 246, 0.45)" strokeWidth={12} />
              <path d="M 250 130 C 300 130, 310 170, 370 170" fill="none" stroke="rgba(16, 185, 129, 0.45)" strokeWidth={6} />

              {/* Node Labels */}
              <g>
                <rect x={10} y={20} width={80} height={35} rx={4} fill="#11111b" stroke="#334155" />
                <text x={18} y={35} fill="#94a3b8" fontSize={7} fontWeight="bold">Entrance 1</text>
                <text x={18} y={48} fill="#f8fafc" fontSize={8} fontWeight="black">8,426 (45%)</text>

                <rect x={10} y={90} width={80} height={35} rx={4} fill="#11111b" stroke="#334155" />
                <text x={18} y={105} fill="#94a3b8" fontSize={7} fontWeight="bold">Entrance 2</text>
                <text x={18} y={118} fill="#f8fafc" fontSize={8} fontWeight="black">6,231 (33%)</text>

                <rect x={10} y={160} width={80} height={35} rx={4} fill="#11111b" stroke="#334155" />
                <text x={18} y={175} fill="#94a3b8" fontSize={7} fontWeight="bold">Entrance 3</text>
                <text x={18} y={188} fill="#f8fafc" fontSize={8} fontWeight="black">3,985 (22%)</text>

                <rect x={170} y={30} width={80} height={30} rx={4} fill="#11111b" stroke="#6366f1" />
                <text x={178} y={42} fill="#94a3b8" fontSize={7} fontWeight="bold">Electronics</text>
                <text x={178} y={54} fill="#6366f1" fontSize={8} fontWeight="black">4,821 (25%)</text>

                <rect x={170} y={75} width={80} height={30} rx={4} fill="#11111b" stroke="#3b82f6" />
                <text x={178} y={87} fill="#94a3b8" fontSize={7} fontWeight="bold">Apparel</text>
                <text x={178} y={99} fill="#3b82f6" fontSize={8} fontWeight="black">5,214 (28%)</text>

                <rect x={170} y={120} width={80} height={30} rx={4} fill="#11111b" stroke="#10b981" />
                <text x={178} y={132} fill="#94a3b8" fontSize={7} fontWeight="bold">Home & Living</text>
                <text x={178} y={144} fill="#10b981" fontSize={8} fontWeight="black">4,156 (22%)</text>

                <rect x={330} y={50} width={80} height={30} rx={4} fill="#11111b" stroke="#334155" />
                <text x={338} y={62} fill="#94a3b8" fontSize={7} fontWeight="bold">Checkout</text>
                <text x={338} y={74} fill="#f8fafc" fontSize={8} fontWeight="black">8,892 (48%)</text>

                <rect x={330} y={100} width={80} height={30} rx={4} fill="#11111b" stroke="#334155" />
                <text x={338} y={112} fill="#94a3b8" fontSize={7} fontWeight="bold">Exit 2</text>
                <text x={338} y={124} fill="#f8fafc" fontSize={8} fontWeight="black">6,125 (33%)</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
