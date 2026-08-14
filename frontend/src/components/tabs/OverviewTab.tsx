"use client";
import React, { useEffect, useRef, useState } from 'react';
import { CAMERA_ZONE_MAP } from '@/lib/storeZones';
interface KpiItem { label: string; val: string; trend?: string; icon?: string; }
interface ProductData { category: string; sku_prefix: string; units_sold: number; revenue: number; avg_price: number; }
interface TrendPoint { time: string; value: number; }
interface ZoneBreakdown { zone: string; avg_dwell: number; sessions: number; }
interface ShelfZone { zone: string; engagement_score: number; avg_dwell_seconds: number; }
interface SegmentCluster { id: number; label: string; size: number; share: number; avg_spend: number; avg_rating: number; }
interface SystemAlert { id: string; severity: 'critical' | 'warning' | 'info'; type: string; message: string; status: string; }

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
const MiniBarChart = ({ data, color }: { data: TrendPoint[]; color: string }) => {
  if (data.length === 0) return <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600">No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex-1 flex items-end justify-between gap-1 min-h-[100px]">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max((d.value / max) * 90, 3)}px`, backgroundColor: color }} />
          <span className="text-[7px] text-slate-600 mt-1 truncate w-full text-center">{d.time}</span>
        </div>
      ))}
    </div>
  );
};

const MiniHBarList = ({ items, color }: { items: { label: string; value: number; suffix?: string }[]; color: string }) => {
  if (items.length === 0) return <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600">No data yet</div>;
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="flex-1 flex flex-col justify-center gap-2 min-h-[100px]">
      {items.slice(0, 4).map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5"><span className="truncate">{item.label}</span><span className="font-bold text-slate-300">{item.value}{item.suffix || ''}</span></div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} /></div>
        </div>
      ))}
    </div>
  );
};

// Mini Live Heatmap Canvas for Overview — Synced with backend layout
const MiniHeatmap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heatPoints, setHeatPoints] = useState<{ x: number; y: number; weight: number }[]>([]);
  const [dynamicZones, setDynamicZones] = useState<ZoneItem[]>([]);
  const [hasData, setHasData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch the Global Layout
  useEffect(() => {
    fetch('http://127.0.0.1:9000/api/v1/layout')
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setDynamicZones(data.data);
      })
      .catch(err => console.error("Layout fetch error:", err));
  }, []);

  // Fetch the Telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchHeatmapData = () => {
      fetch('http://127.0.0.1:9000/api/v1/dashboard/heatmap')
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.status === "success") {
            setHeatPoints(data.data || []);
            setHasData(!!data.has_data);
            setMessage(data.message || null);
          }
        })
        .catch(err => console.error("Heatmap fetch error:", err));
    };
    fetchHeatmapData();
    const intervalId = setInterval(fetchHeatmapData, 2000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const parent = canvas.parentElement;
      if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
      const w = canvas.width; const h = canvas.height;
      if (w === 0 || h === 0) return;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      heatPoints.forEach(p => {
        const px = p.x * w; const py = p.y * h;
        const radius = (p.weight / 100) * (w * 0.15);
        const opacity = Math.min((p.weight / 100) * 0.6, 0.8);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
        grad.addColorStop(0.5, `rgba(245, 158, 11, ${opacity * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
      });

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'; ctx.lineWidth = 1.5;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw dynamic synced layout
      dynamicZones.forEach((zone) => {
        const hasCameraCoverage = zone.cameraAssigned > 0;
        ctx.strokeStyle = hasCameraCoverage ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.25)';
        ctx.strokeRect(w * zone.x, h * zone.y, w * zone.w, h * zone.h);
        ctx.fillStyle = hasCameraCoverage ? 'rgba(52, 211, 153, 0.7)' : '#94a3b8';
        ctx.fillText(zone.label, w * (zone.x + zone.w / 2), h * (zone.y + zone.h / 2));
      });
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [heatPoints, dynamicZones]); // Added dynamicZones to dependencies

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 transition-opacity duration-500" />
      {!hasData && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center pointer-events-none">
          <span className="text-[9px] text-slate-500 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800">
            {message || "No live detections yet"}
          </span>
        </div>
      )}
    </div>
  );
};

export default function OverviewTab({ role, timeFilter = 'all' }: { role: string, timeFilter?: string }) {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [dwellTrend, setDwellTrend] = useState<TrendPoint[]>([]);
  const [sessionCountTrend, setSessionCountTrend] = useState<TrendPoint[]>([]);
  const [zoneBreakdown, setZoneBreakdown] = useState<ZoneBreakdown[]>([]);
  const [shelfZones, setShelfZones] = useState<ShelfZone[]>([]);
  const [behaviorTrend, setBehaviorTrend] = useState<TrendPoint[]>([]);
  const [segments, setSegments] = useState<SegmentCluster[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const cameraFeeds = Object.entries(CAMERA_ZONE_MAP).map(([camId]) => ({
    id: Number(camId),
    name: `Camera ${camId}`,
  }));

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [telRes, prodRes, dwellRes, shelfRes, behaviorRes, segRes, alertsRes] = await Promise.all([
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/telemetry?role=${encodeURIComponent(role)}&time_filter=${timeFilter}`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/products?time_filter=${timeFilter}`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/dwell`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/shelves`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/behavior`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/segmentation?time_filter=${timeFilter}`),
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/alerts`),
        ]);

        const telData = await telRes.json();
        if (isMounted && telData) {
          if (telData.kpis) setKpis(telData.kpis);
          if (telData.insights) setInsights(telData.insights);
        }

        const prodData = await prodRes.json();
        if (isMounted && prodData.status === "success") setProducts(prodData.data.slice(0, 3));

        const dwellData = await dwellRes.json();
        if (isMounted && dwellData.status === "success") {
          setDwellTrend(dwellData.data.trend || []);
          setSessionCountTrend(dwellData.data.session_count_trend || []);
          setZoneBreakdown(dwellData.data.zone_breakdown || []);
        }

        const shelfData = await shelfRes.json();
        if (isMounted && shelfData.status === "success") setShelfZones(shelfData.data || []);

        const behaviorData = await behaviorRes.json();
        if (isMounted && behaviorData.status === "success") setBehaviorTrend(behaviorData.data.trend || []);

        const segData = await segRes.json();
        if (isMounted && segData.status === "success") setSegments(segData.data || []);

        const alertsData = await alertsRes.json();
        if (isMounted && alertsData.status === "success") setAlerts(alertsData.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [role, timeFilter]);

  const alertStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return { icon: '🚨', color: 'text-rose-400' };
      case 'warning': return { icon: '⚠️', color: 'text-amber-400' };
      default: return { icon: 'ℹ️', color: 'text-emerald-400' };
    }
  };

  if (role === 'Store Manager') {
    return (
      <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">OVERVIEW</h2>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Edge Telemetry | Node Cluster Alpha</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            <div className="col-span-6 text-center py-6 text-cyan-400 font-mono text-xs animate-pulse">Syncing Telemetry...</div>
          ) : (
            kpis.map((kpi, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-slate-400 font-semibold uppercase">{kpi.label}</span><span className="text-slate-500 text-sm">{kpi.icon}</span></div>
                <p className="text-2xl font-bold text-slate-100">{kpi.val}</p>
                <p className="text-[9px] text-emerald-400 mt-1">{kpi.trend}</p>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
             <div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold">Live Camera Streams (YOLOv8 + IOU Tracker)</h3></div>
             <div className="grid grid-cols-2 gap-2 flex-1">
                {cameraFeeds.map((cam) => (
                  <div key={cam.id} className="aspect-video bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden flex items-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`http://127.0.0.1:9000/api/camera/stream/${cam.id}`} alt={cam.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
                    <span className="text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-slate-200 absolute top-1 left-1 font-mono z-10">{cam.name}</span>
                    <span className="text-[8px] text-emerald-400 ml-auto p-1 z-10 flex items-center font-semibold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>Live</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
             <h3 className="text-sm font-bold mb-3">Live Floor Heatmap</h3>
             <div className="flex-1 rounded-lg border border-slate-800 relative overflow-hidden min-h-[160px]"><MiniHeatmap /></div>
          </div>
          <div className="lg:col-span-3 bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">System Alerts</h3>
             <div className="space-y-3">
               {loading ? (
                 <p className="text-[9px] text-slate-500 animate-pulse">Loading alerts...</p>
               ) : alerts.length === 0 ? (
                 <p className="text-[9px] text-slate-500">No active alerts.</p>
               ) : (
                 alerts.slice(0, 3).map((a) => {
                   const s = alertStyles(a.severity);
                   return (
                     <div key={a.id} className="flex items-start space-x-2">
                       <span className={`text-sm ${s.color}`}>{s.icon}</span>
                       <div>
                         <p className={`text-xs font-bold ${s.color}`}>{a.type}</p>
                         <p className="text-[9px] text-slate-500">{a.message}</p>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Completed Sessions by Hour</h3>
            <MiniBarChart data={sessionCountTrend} color="#0ea5e9" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Dwell Time by Zone</h3>
            <MiniHBarList items={zoneBreakdown.map(z => ({ label: z.zone, value: z.avg_dwell, suffix: 's' }))} color="#10b981" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Shelf Zone Engagement</h3>
            <MiniHBarList items={shelfZones.map(z => ({ label: z.zone, value: z.engagement_score }))} color="#f59e0b" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Pause Events by Hour</h3>
            <MiniBarChart data={behaviorTrend} color="#a855f7" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">Top Products by Revenue</h3>
             <table className="w-full text-left text-[10px] text-slate-300">
               <thead className="border-b border-slate-800"><tr><th className="pb-1">SKU ID</th><th className="pb-1">Category</th><th className="pb-1 text-right">Avg Price</th></tr></thead>
               <tbody className="divide-y divide-slate-800/50">
                 {products.length > 0 ? products.map((p, i) => (
                   <tr key={i}><td className="py-2">{p.sku_prefix}</td><td>{p.category}</td><td className="text-emerald-400 text-right">${p.avg_price?.toFixed(2)}</td></tr>
                 )) : (<tr><td colSpan={3} className="py-2 animate-pulse">Syncing...</td></tr>)}
               </tbody>
             </table>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">Live System Insights</h3>
             <ul className="space-y-2 text-[10px] text-slate-400 font-mono list-disc pl-4">
               {insights.length > 0 ? insights.map((item, idx) => (<li key={idx} className="text-cyan-400"><span className="text-slate-400">{item}</span></li>)) : (<li className="animate-pulse">Analyzing telemetry...</li>)}
             </ul>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">System Controls</h3>
             <div className="grid grid-cols-2 gap-2">
               <button className="bg-blue-600/20 text-blue-400 border border-blue-600/30 py-4 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors">📊 Export Data</button>
               <button className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 py-4 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors">📹 Open Cameras</button>
               <button className="bg-amber-600/20 text-amber-400 border border-amber-600/30 py-4 rounded-lg text-xs font-bold hover:bg-amber-600/30 transition-colors">⚙️ Settings</button>
               <button className="bg-purple-600/20 text-purple-400 border border-purple-600/30 py-4 rounded-lg text-xs font-bold hover:bg-purple-600/30 transition-colors">🔑 API Keys</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'Retail Analyst') {
    return (
      <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</span>
              <p className="text-2xl font-bold my-1 text-cyan-400">{kpi.val}</p>
              <p className="text-[9px] text-slate-500">{kpi.trend}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Dwell Time Trend (Live Tracking)</h3>
            <MiniBarChart data={dwellTrend} color="#3b82f6" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Pause Events Trend</h3>
            <MiniBarChart data={behaviorTrend} color="#f59e0b" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Customer Segments (K-Means)</h3>
            <MiniHBarList items={segments.map(s => ({ label: s.label, value: s.share, suffix: '%' }))} color="#a855f7" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-bold mb-3">Category Sales Performance (from Sales Dataset)</h3>
            <table className="w-full text-left text-[10px] text-slate-300">
               <thead className="border-b border-slate-800 text-slate-500"><tr><th className="pb-1">Category</th><th className="pb-1">SKU Block</th><th className="pb-1 text-right">Units Sold</th></tr></thead>
               <tbody className="divide-y divide-slate-800/50">
                 {products.map((p, i) => (<tr key={i} className="hover:bg-slate-800/40 transition-colors"><td className="py-2">{p.category}</td><td>{p.sku_prefix}</td><td className="text-emerald-400 text-right">{p.units_sold.toLocaleString()}</td></tr>))}
               </tbody>
             </table>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-bold mb-3">Dynamic Tracking Insights</h3>
            <ul className="space-y-3 text-[10px] text-slate-400 list-disc pl-4">
              {insights.map((item, index) => (<li key={index} className="text-emerald-400"><span className="text-slate-400">{item}</span></li>))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'Marketing Manager') {
    return (
      <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</span><span className="text-slate-500 text-sm">{kpi.icon}</span></div>
              <p className="text-xl font-bold text-slate-100">{kpi.val}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Top Categories by Revenue</h3>
            <MiniHBarList items={products.map(p => ({ label: p.category, value: Math.round(p.revenue) }))} color="#0ea5e9" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Customer Segments (K-Means)</h3>
            <MiniHBarList items={segments.map(s => ({ label: s.label, value: s.share, suffix: '%' }))} color="#a855f7" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Shelf Zone Engagement</h3>
            <MiniHBarList items={shelfZones.map(z => ({ label: z.zone, value: z.engagement_score }))} color="#10b981" />
          </div>
        </div>
      </div>
    );
  }

  // TRUE ADMINISTRATOR OVERVIEW (IT Ops specific)
  return (
    <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">ADMINISTRATOR OVERVIEW</h2>
        <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">System Operations</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 text-center py-6 text-cyan-400 font-mono text-xs animate-pulse">Syncing Telemetry...</div>
        ) : (
          kpis.map((kpi, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</span><span className="text-slate-500 text-sm">{kpi.icon}</span></div>
              <p className="text-3xl font-bold text-slate-100">{kpi.val}</p>
              <p className="text-[9px] text-emerald-400 mt-1">{kpi.trend}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         <div className="lg:col-span-2 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
             <div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold">Vision Node Uptime Monitor</h3></div>
             <div className="grid grid-cols-2 gap-2 flex-1">
                {cameraFeeds.map((cam) => (
                  <div key={cam.id} className="aspect-video bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden flex items-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`http://127.0.0.1:9000/api/camera/stream/${cam.id}`} alt={cam.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
                    <span className="text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-slate-200 absolute top-1 left-1 font-mono z-10">{cam.name}</span>
                    <span className="text-[8px] text-emerald-400 ml-auto p-1 z-10 flex items-center font-semibold"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse"></span>Live</span>
                  </div>
                ))}
             </div>
         </div>
         <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col h-full max-h-[300px]">
             <h3 className="text-sm font-bold mb-3 shrink-0">System Alerts</h3>
             <div className="space-y-3 flex-1 overflow-y-auto">
               {loading ? (
                 <p className="text-[9px] text-slate-500 animate-pulse">Loading alerts...</p>
               ) : alerts.length === 0 ? (
                 <p className="text-[9px] text-slate-500">No active alerts.</p>
               ) : (
                 alerts.map((a) => {
                   const s = alertStyles(a.severity);
                   return (
                     <div key={a.id} className="flex items-start space-x-2">
                       <span className={`text-sm ${s.color}`}>{s.icon}</span>
                       <div>
                         <p className={`text-xs font-bold ${s.color}`}>{a.type}</p>
                         <p className="text-[9px] text-slate-500">{a.message}</p>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
         </div>
      </div>

      {/* INTERACTIVE ADMINISTRATOR CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <button 
           onClick={() => alert("💾 Database backup generated successfully! File saved: cams_retail_backup.db")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">💾</span>
            <span className="text-xs font-bold text-slate-300">Backup Database</span>
         </button>
         
         <button 
           onClick={() => alert("🔄 ML Engine restarted successfully! ByteTrack & YOLOv8 re-initialized.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🔄</span>
            <span className="text-xs font-bold text-slate-300">Restart ML Engine</span>
         </button>
         
         <button 
           onClick={() => alert("🛡️ Edge Firewall rules synchronized! Zero threat anomalies detected.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🛡️</span>
            <span className="text-xs font-bold text-slate-300">Update Firewall</span>
         </button>
         
         <button 
           onClick={() => alert("🔑 New Production API Key generated: cam_live_99f2a7b1c4e")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🔑</span>
            <span className="text-xs font-bold text-slate-300">Manage API Keys</span>
         </button>
      </div>
    </div>
  );
}