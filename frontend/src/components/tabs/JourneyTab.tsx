"use client";
import React, { useEffect, useState } from 'react';

interface FlowNode {
  id: string;
  label: string;
  value: number | string;
  pct: string;
}

interface JourneyData {
  entries: FlowNode[];
  zones: FlowNode[];
  exits: FlowNode[];
}

interface JourneyResponse {
  status: string;
  data: JourneyData;
  has_camera_data: boolean;
  has_entrance_exit_data: boolean;
  message: string | null;
  note: string;
}

interface ZoneItem {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  category: string;
  cameraAssigned: number;
}

const FlowCard = ({ node, top, left }: { node: FlowNode; top: string; left: string }) => {
  if (!node) return null;
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 border border-slate-700/50 rounded-xl p-3 w-32 md:w-40 text-center z-10 shadow-xl backdrop-blur-sm transition-transform hover:scale-105"
      style={{ top, left }}
    >
      <h4 className="text-[10px] md:text-xs font-bold text-slate-300 mb-1">{node.label}</h4>
      <p className="text-sm md:text-lg font-bold text-slate-100">
        {Number(node.value).toLocaleString()} <span className="text-[9px] md:text-xs text-slate-400 font-normal">({node.pct})</span>
      </p>
    </div>
  );
};

export default function JourneyTab({ timeFilter = 'all' }: { timeFilter?: string }) {
  const [data, setData] = useState<JourneyData | null>(null);
  const [dynamicZones, setDynamicZones] = useState<ZoneItem[]>([]);
  const [hasCameraData, setHasCameraData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Dynamic Layout
  useEffect(() => {
    fetch('http://127.0.0.1:9000/api/v1/layout')
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setDynamicZones(data.data);
      })
      .catch(err => console.error("Layout fetch error:", err));
  }, []);

  // 2. Fetch Journey Data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:9000/api/v1/dashboard/journey?time_filter=${timeFilter}`);
        const resData: JourneyResponse = await res.json();
        if (isMounted && resData.status === "success") {
          setData(resData.data);
          setHasCameraData(!!resData.has_camera_data);
          setMessage(resData.message ?? null);
          setNote(resData.note ?? null);
        }
      } catch (err) {
        console.error("Journey fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [timeFilter]);

  // Helper to get SVG coordinates (viewBox is 100x60)
  const getSvgCenter = (zone: ZoneItem) => {
    return {
      x: (zone.x + zone.w / 2) * 100,
      y: (zone.y + zone.h / 2) * 60
    };
  };

  // Dynamically map path lines between sequential cameras (1->2->3->4)
  const orderedCameras = [1, 2, 3, 4]
    .map(id => dynamicZones.find(z => z.cameraAssigned === id))
    .filter(Boolean) as ZoneItem[];

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Consumer Journey Flow</h3>
            <p className="text-xs text-slate-400 mt-1">Real per-camera session counts, dynamically mapped to your custom floor plan.</p>
          </div>
        </div>

        {note && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 flex items-start gap-2">
            <span>ℹ️</span>
            <span>{note}</span>
          </div>
        )}

        {loading || !data || dynamicZones.length === 0 ? (
          <div className="flex items-center justify-center text-cyan-400 font-mono text-sm animate-pulse" style={{ height: 460 }}>
            Analyzing Trajectory Flow Data...
          </div>
        ) : (
          <div className="relative w-full bg-[#0a0f1c] rounded-xl border border-slate-800/50 overflow-hidden shadow-inner" style={{ height: 460 }}>

            {/* Dynamic Floor Plan SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad-blue" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#0ea5e9"/></linearGradient>
                <linearGradient id="grad-emerald" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#34d399"/></linearGradient>
              </defs>

              {/* Store outline */}
              <rect x="2" y="2" width="96" height="56" rx="1" fill="none" stroke="#334155" strokeWidth="0.5" />

              {/* Dynamically render paths between camera nodes */}
              {orderedCameras.map((cam, idx) => {
                if (idx === orderedCameras.length - 1) return null;
                const nextCam = orderedCameras[idx + 1];
                const p1 = getSvgCenter(cam);
                const p2 = getSvgCenter(nextCam);
                
                // Draw dashed directional line between sequential cameras
                return (
                  <path 
                    key={`path-${idx}`} 
                    d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} 
                    stroke="url(#grad-blue)" 
                    strokeWidth="0.4" 
                    fill="none" 
                    opacity="0.6" 
                    strokeDasharray="1.5 1.5" 
                  />
                );
              })}

              {/* Draw Zones from Database */}
              {dynamicZones.map((zone) => {
                const isCamera = zone.cameraAssigned > 0;
                const isShelf = zone.category === 'Product Display';
                const x = zone.x * 100, y = zone.y * 60, w = zone.w * 100, h = zone.h * 60;
                return (
                  <g key={zone.id}>
                    <rect
                      x={x} y={y} width={w} height={h} rx={isCamera ? 0.8 : 1.2}
                      fill={isCamera ? '#0f2e22' : isShelf ? '#1e293b' : '#0f172a'}
                      stroke={isCamera ? '#10b981' : isShelf ? '#475569' : '#f59e0b'}
                      strokeWidth="0.3"
                    />
                    <text x={x + w / 2} y={y + h / 2} fontSize={isCamera ? 1.8 : 2.2} fill={isCamera ? '#34d399' : isShelf ? '#64748b' : '#fbbf24'} textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
                      {isCamera ? `CAM ${zone.cameraAssigned}` : zone.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Camera Data FlowCards overlay */}
            {hasCameraData && data.zones.map((z) => {
              // Parse out the digit from "cam1", "cam2", etc.
              const camMatch = z.id.match(/\d+/);
              if (!camMatch) return null;
              
              const camId = parseInt(camMatch[0], 10);
              const targetZone = dynamicZones.find(zone => zone.cameraAssigned === camId);
              if (!targetZone) return null;

              // Calculate top/left percentages from the zone properties
              const top = `${(targetZone.y + targetZone.h / 2) * 100}%`;
              const left = `${(targetZone.x + targetZone.w / 2) * 100}%`;

              return <FlowCard key={z.id} node={z} top={top} left={left} />;
            })}
          </div>
        )}

        {!loading && data && !hasCameraData && (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm">{message || "No completed shopper sessions yet."}</p>
            <p className="text-slate-600 text-xs mt-2">Open the Cameras tab to start live tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}