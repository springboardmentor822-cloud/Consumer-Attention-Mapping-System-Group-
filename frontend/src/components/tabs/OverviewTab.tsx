"use client";
import React, { useEffect, useRef, useState } from 'react';
import { CAMERA_ZONE_MAP } from '@/lib/storeZones';

interface KpiItem { label: string; val: string; trend?: string; icon?: string; }
interface ProductData { category: string; sku_prefix: string; units_sold: number; revenue: number; avg_price: number; live_pickups?: number; live_comparisons?: number; }
interface TrendPoint { time: string; value: number; }
interface ZoneBreakdown { zone: string; avg_dwell: number; sessions: number; }
interface DurationBucket { label: string; count: number; pct: number; }
interface ShelfZone { zone: string; engagement_score: number; avg_dwell_seconds: number; }
interface SegmentCluster { id: number; label: string; size: number; share: number; avg_spend: number; avg_rating: number; }
interface SystemAlert { id: string; severity: 'critical' | 'warning' | 'info'; type: string; message: string; status: string; }
interface CameraStatusItem { camera_id: number; zone_name: string; status: 'online' | 'stale' | 'never_reported'; seconds_since_last_frame: number | null; }
interface AttractivenessScore { category: string; raw_metrics: { att_s: number; intx: number; pick: number; conv: number; rep: number }; attractiveness_score: number; }
interface RegisteredUser { email: string; role: string; }
interface Recommendation { id: number; priority: string; sku: string; action: string; reason: string; }
interface JourneyFlowNode { id: string; label: string; value: number | string; pct: string; }

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

const DONUT_PALETTE = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];

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

// Real-data donut — a plain stroke-dasharray SVG ring, no chart library.
// Renders "No data yet" instead of an empty ring when every value is 0,
// so an untracked metric doesn't look like a real "0% everything" result.
const MiniDonut = ({ segments, centerLabel }: { segments: { label: string; value: number; color?: string }[]; centerLabel?: string }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600 min-h-[100px]">No data yet</div>;
  const r = 34, cx = 40, cy = 40, circumference = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <div className="flex-1 flex items-center gap-4 min-h-[100px]">
      <svg viewBox="0 0 80 80" className="w-24 h-24 shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const offset = -(cumulative / total) * circumference;
          cumulative += seg.value;
          return (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color || DONUT_PALETTE[i % DONUT_PALETTE.length]}
              strokeWidth="10" strokeDasharray={`${dash} ${circumference}`} strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        {centerLabel && <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">{centerLabel}</span>}
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[9px] text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color || DONUT_PALETTE[i % DONUT_PALETTE.length] }} />
            <span className="truncate">{seg.label}</span>
            <span className="text-slate-300 font-bold ml-auto shrink-0">{total > 0 ? `${Math.round((seg.value / total) * 100)}%` : '0%'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Real 5-axis radar for the attractiveness scoring breakdown — all 5 raw
// metrics (att_s, intx, pick, conv, rep) are already normalized 0-100 by
// calculate_and_store_scores() server-side, so no further scaling here.
const RADAR_AXES = ['Attention', 'Interaction', 'Pickup', 'Conversion', 'Repeat'];
const MiniRadar = ({ series }: { series: { label: string; color: string; values: number[] }[] }) => {
  if (series.length === 0) return <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600 min-h-[140px]">No data yet</div>;
  const cx = 60, cy = 60, maxR = 46;
  const angleFor = (i: number) => (Math.PI * 2 * i) / RADAR_AXES.length - Math.PI / 2;
  const pointFor = (i: number, val: number) => {
    const r = (Math.max(0, Math.min(100, val)) / 100) * maxR;
    return [cx + r * Math.cos(angleFor(i)), cy + r * Math.sin(angleFor(i))];
  };
  return (
    <div className="flex-1 flex flex-col items-center gap-2 min-h-[140px]">
      <svg viewBox="0 0 120 120" className="w-32 h-32">
        {[0.33, 0.66, 1].map((f, gi) => (
          <polygon key={gi} points={RADAR_AXES.map((_, i) => pointFor(i, f * 100).join(',')).join(' ')} fill="none" stroke="#1e293b" strokeWidth="1" />
        ))}
        {RADAR_AXES.map((label, i) => {
          const [x, y] = pointFor(i, 100);
          return <line key={label} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />;
        })}
        {series.slice(0, 4).map((s, si) => (
          <polygon
            key={si}
            points={s.values.map((v, i) => pointFor(i, v).join(',')).join(' ')}
            fill={s.color} fillOpacity={0.15} stroke={s.color} strokeWidth="1.5"
          />
        ))}
        {RADAR_AXES.map((label, i) => {
          const [x, y] = pointFor(i, 118);
          return <text key={label} x={x} y={y} fontSize="7" fill="#64748b" textAnchor="middle" dominantBaseline="middle">{label}</text>;
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {series.slice(0, 4).map((s, i) => (
          <div key={i} className="flex items-center gap-1 text-[8px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// Real scatter — attention (att_s) vs conversion (conv), both already 0-100
// from the same attractiveness table the radar above reads.
const MiniScatter = ({ points }: { points: { x: number; y: number; label: string; color: string }[] }) => {
  if (points.length === 0) return <div className="flex-1 flex items-center justify-center text-[10px] text-slate-600 min-h-[140px]">No data yet</div>;
  return (
    <div className="flex-1 flex flex-col min-h-[140px]">
      <svg viewBox="0 0 120 100" className="w-full flex-1">
        <line x1="10" y1="90" x2="115" y2="90" stroke="#334155" strokeWidth="1" />
        <line x1="10" y1="5" x2="10" y2="90" stroke="#334155" strokeWidth="1" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={10 + (p.x / 100) * 105} cy={90 - (p.y / 100) * 85} r="3.5" fill={p.color} fillOpacity="0.85" />
          </g>
        ))}
        <text x="62" y="99" fontSize="6" fill="#64748b" textAnchor="middle">Attention →</text>
        <text x="4" y="50" fontSize="6" fill="#64748b" textAnchor="middle" transform="rotate(-90, 4, 50)">Conversion →</text>
      </svg>
      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 justify-center">
        {points.map((p, i) => (
          <div key={i} className="flex items-center gap-1 text-[8px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} /> {p.label}
          </div>
        ))}
      </div>
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

  useEffect(() => {
    fetch('/api/backend/v1/layout', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.status === "success") setDynamicZones(data.data); })
      .catch(err => console.error("Layout fetch error:", err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHeatmapData = () => {
      fetch('/api/backend/v1/dashboard/heatmap', { credentials: 'include' })
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
  }, [heatPoints, dynamicZones]);

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
  const [durationBuckets, setDurationBuckets] = useState<DurationBucket[]>([]);
  const [shelfZones, setShelfZones] = useState<ShelfZone[]>([]);
  const [behaviorTrend, setBehaviorTrend] = useState<TrendPoint[]>([]);
  const [segments, setSegments] = useState<SegmentCluster[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Role-specific extras — only fetched for the role that uses them.
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatusItem[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [attractiveness, setAttractiveness] = useState<AttractivenessScore[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [journeyZones, setJourneyZones] = useState<JourneyFlowNode[]>([]);
  // Manual-recompute state for the Marketing Manager's "Recalculate Now"
  // button — calculate_and_store_scores() otherwise only runs at server
  // startup or on the scheduler's 15-minute tick, which is a long wait
  // while testing with a freshly-completed camera session.
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);

  const refetchMarketingExtras = async () => {
    try {
      const [attrRes, recsRes] = await Promise.all([
        fetch('/api/backend/v1/dashboard/attractiveness', { credentials: 'include' }),
        fetch('/api/backend/v1/recommendations', { credentials: 'include' }),
      ]);
      const attrData = await attrRes.json();
      if (attrData.status === "success") setAttractiveness(attrData.data || []);
      const recsData = await recsRes.json();
      setRecommendations(Array.isArray(recsData) ? recsData : []);
    } catch (err) {
      console.error("Marketing extras fetch error:", err);
    }
  };

  const handleRecalculateNow = async () => {
    setRecalculating(true);
    setRecalcMessage(null);
    try {
      const res = await fetch('/api/backend/v1/dashboard/attractiveness/recalculate', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      setRecalcMessage(data.message || null);
      if (data.status === 'success' && data.wrote_data) {
        await refetchMarketingExtras();
      }
    } catch (err) {
      console.error("Recalculate error:", err);
      setRecalcMessage('Could not reach the backend to recalculate scores.');
    } finally {
      setRecalculating(false);
    }
  };

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
          fetch(`/api/backend/v1/dashboard/telemetry?role=${encodeURIComponent(role)}&time_filter=${timeFilter}`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/products?time_filter=${timeFilter}`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/dwell`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/shelves`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/behavior`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/segmentation?time_filter=${timeFilter}`, { credentials: 'include' }),
          fetch(`/api/backend/v1/dashboard/alerts`, { credentials: 'include' }),
        ]);

        const telData = await telRes.json();
        if (isMounted && telData) {
          if (telData.kpis) setKpis(telData.kpis);
          if (telData.insights) setInsights(telData.insights);
        }

        const prodData = await prodRes.json();
        if (isMounted && prodData.status === "success") setProducts(prodData.data || []);

        const dwellData = await dwellRes.json();
        if (isMounted && dwellData.status === "success") {
          setDwellTrend(dwellData.data.trend || []);
          setSessionCountTrend(dwellData.data.session_count_trend || []);
          setZoneBreakdown(dwellData.data.zone_breakdown || []);
          setDurationBuckets(dwellData.data.duration_buckets || []);
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

  // Role-specific extras, fetched only for the role that renders them —
  // no point pulling admin user lists for a Store Manager, etc.
  useEffect(() => {
    let isMounted = true;
    const fetchExtras = async () => {
      try {
        if (role === 'Administrator') {
          const [camRes, usersRes] = await Promise.all([
            fetch('/api/backend/v1/dashboard/camera-status', { credentials: 'include' }),
            fetch('/api/backend/v1/admin/users', { credentials: 'include' }),
          ]);
          const camData = await camRes.json();
          if (isMounted && camData.status === "success") setCameraStatuses(camData.data || []);
          const usersData = await usersRes.json();
          if (isMounted && usersData.status === "success") setRegisteredUsers(usersData.data || []);
        } else if (role === 'Marketing Manager') {
          await refetchMarketingExtras();
        } else if (role === 'Retail Analyst') {
          const journeyRes = await fetch(`/api/backend/v1/dashboard/journey?time_filter=${timeFilter}`, { credentials: 'include' });
          const journeyData = await journeyRes.json();
          if (isMounted && journeyData.status === "success") setJourneyZones(journeyData.data?.zones || []);
        }
      } catch (err) {
        console.error("Overview extras fetch error:", err);
      }
    };
    fetchExtras();
    return () => { isMounted = false; };
  }, [role, timeFilter]);

  const alertStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return { icon: '🚨', color: 'text-rose-400' };
      case 'warning': return { icon: '⚠️', color: 'text-amber-400' };
      default: return { icon: 'ℹ️', color: 'text-emerald-400' };
    }
  };

  const topByRevenue = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const topByPickups = [...products].filter(p => (p.live_pickups || 0) > 0).sort((a, b) => (b.live_pickups || 0) - (a.live_pickups || 0)).slice(0, 5);
  const totalPickups = products.reduce((sum, p) => sum + (p.live_pickups || 0), 0);
  const totalComparisons = products.reduce((sum, p) => sum + (p.live_comparisons || 0), 0);

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
                    <img src={`/api/backend/camera/stream/${cam.id}`} alt={cam.name} className="absolute inset-0 w-full h-full object-cover" />
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
            <h3 className="text-sm font-bold mb-2">Customers by Zone</h3>
            <MiniHBarList items={zoneBreakdown.map(z => ({ label: z.zone, value: z.sessions }))} color="#3b82f6" />
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
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
             <h3 className="text-sm font-bold mb-2">Product Interaction</h3>
             <p className="text-[9px] text-slate-500 mb-1">Picked vs. Compared — from live camera tracking, not a 4-way Picked/Viewed/Returned/Compared split (only these 2 are actually measured).</p>
             <MiniDonut segments={[{ label: 'Picked', value: totalPickups, color: '#10b981' }, { label: 'Compared', value: totalComparisons, color: '#a855f7' }]} />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">Top Picked Products</h3>
             <table className="w-full text-left text-[10px] text-slate-300">
               <thead className="border-b border-slate-800"><tr><th className="pb-1">Category</th><th className="pb-1 text-right">Pickups</th></tr></thead>
               <tbody className="divide-y divide-slate-800/50">
                 {topByPickups.length > 0 ? topByPickups.map((p, i) => (
                   <tr key={i}><td className="py-2">{p.category}</td><td className="text-emerald-400 text-right">{p.live_pickups}</td></tr>
                 )) : (<tr><td colSpan={2} className="py-2 text-slate-500">No pickups detected yet</td></tr>)}
               </tbody>
             </table>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
             <h3 className="text-sm font-bold mb-3">Live System Insights</h3>
             <ul className="space-y-2 text-[10px] text-slate-400 font-mono list-disc pl-4">
               {insights.length > 0 ? insights.map((item, idx) => (<li key={idx} className="text-cyan-400"><span className="text-slate-400">{item}</span></li>)) : (<li className="animate-pulse">Analyzing telemetry...</li>)}
             </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <button onClick={() => alert("Not wired to navigation from this screen yet — open Export Data from System Tools in the sidebar.")} className="bg-blue-600/20 text-blue-400 border border-blue-600/30 py-4 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors">📊 Export Data</button>
          <button onClick={() => alert("Not wired to navigation from this screen yet — open the Cameras tab from Live Floor in the sidebar.")} className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 py-4 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors">📹 Open Cameras</button>
          <button onClick={() => alert("Not wired to navigation from this screen yet — open System Settings from the sidebar.")} className="bg-amber-600/20 text-amber-400 border border-amber-600/30 py-4 rounded-lg text-xs font-bold hover:bg-amber-600/30 transition-colors">⚙️ Settings</button>
          <button onClick={() => alert("API key management isn't built anywhere in this backend yet — no key-issuing endpoint exists.")} className="bg-purple-600/20 text-purple-400 border border-purple-600/30 py-4 rounded-lg text-xs font-bold hover:bg-purple-600/30 transition-colors">🔑 API Keys</button>
        </div>
      </div>
    );
  }

  if (role === 'Retail Analyst') {
    return (
      <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <h3 className="text-sm font-bold mb-2">Customer Segmentation (K-Means)</h3>
            <MiniDonut segments={segments.map(s => ({ label: s.label, value: s.size }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Consumer Journey Flow</h3>
            <p className="text-[9px] text-slate-500 mb-1">Completed sessions per camera zone (real, time-filtered).</p>
            <MiniHBarList items={journeyZones.map(z => ({ label: z.label, value: Number(z.value) }))} color="#06b6d4" />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Dwell Time Distribution</h3>
            <MiniDonut segments={durationBuckets.map(b => ({ label: b.label, value: b.count }))} />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Zone Performance (Engagement Score)</h3>
            <MiniHBarList items={shelfZones.map(z => ({ label: z.zone, value: z.engagement_score }))} color="#10b981" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Traffic Flow Heatmap</h3>
            <div className="flex-1 rounded-lg border border-slate-800 relative overflow-hidden min-h-[180px]"><MiniHeatmap /></div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Shopping Behaviour — Interacted vs Purchased</h3>
            <p className="text-[9px] text-slate-500 mb-1">"Visited" isn't tracked per category (only 3 of 6 categories have camera coverage) — showing what's real.</p>
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-[100px]">
              <MiniHBarList items={products.map(p => ({ label: p.category, value: p.live_pickups || 0 }))} color="#a855f7" />
              <MiniHBarList items={products.map(p => ({ label: p.category, value: p.units_sold }))} color="#10b981" />
            </div>
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
            <h3 className="text-sm font-bold mb-3">AI Insights &amp; Key Takeaways</h3>
            <ul className="space-y-3 text-[10px] text-slate-400 list-disc pl-4">
              {insights.map((item, index) => (<li key={index} className="text-emerald-400"><span className="text-slate-400">{item}</span></li>))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'Marketing Manager') {
    const attractivenessSeries = attractiveness.slice(0, 4).map((a, i) => ({
      label: a.category, color: DONUT_PALETTE[i % DONUT_PALETTE.length],
      values: [a.raw_metrics.att_s, a.raw_metrics.intx, a.raw_metrics.pick, a.raw_metrics.conv, a.raw_metrics.rep],
    }));
    const scatterPoints = attractiveness.slice(0, 6).map((a, i) => ({
      x: a.raw_metrics.att_s, y: a.raw_metrics.conv, label: a.category, color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }));

    return (
      <div className="w-full min-w-0 space-y-4 animate-in fade-in duration-500 text-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</span><span className="text-slate-500 text-sm">{kpi.icon}</span></div>
              <p className="text-xl font-bold text-slate-100">{kpi.val}</p>
              <p className="text-[9px] text-slate-500 mt-1">{kpi.trend}</p>
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
            <MiniDonut segments={segments.map(s => ({ label: s.label, value: s.share }))} />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Shelf Zone Engagement</h3>
            <MiniHBarList items={shelfZones.map(z => ({ label: z.zone, value: z.engagement_score }))} color="#10b981" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="text-sm font-bold">Product Attractiveness Score</h3>
              <button
                onClick={handleRecalculateNow}
                disabled={recalculating}
                className="shrink-0 text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                title="This widget (and Attention vs Conversion / Marketing Recommendations) only recomputes on server startup or every 15 minutes otherwise."
              >
                {recalculating ? 'Recalculating…' : '↻ Recalculate Now'}
              </button>
            </div>
            <p className="text-[9px] text-slate-500 mb-1">Weighted: Attention 35% · Interaction 25% · Pickup 20% · Conversion 15% · Repeat 5%</p>
            {recalcMessage && <p className="text-[9px] text-amber-400 mb-1">{recalcMessage}</p>}
            <MiniRadar series={attractivenessSeries} />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Attention vs Conversion</h3>
            <MiniScatter points={scatterPoints} />
          </div>
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
            <h3 className="text-sm font-bold mb-2">Marketing Recommendations</h3>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px]">
              {recommendations.length > 0 ? recommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${rec.priority === 'High' ? 'text-rose-400 bg-rose-500/10' : 'text-cyan-400 bg-cyan-500/10'}`}>{rec.priority}</span>
                  <p className="text-[10px] text-slate-200 font-bold mt-1">{rec.action}</p>
                  <p className="text-[9px] text-slate-500">{rec.reason}</p>
                </div>
              )) : <p className="text-[10px] text-slate-500">No recommendations yet — these populate once completed shopper sessions produce zone-level data.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TRUE ADMINISTRATOR OVERVIEW (IT Ops specific)
  const roleCounts = registeredUsers.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const cameraStatusCounts = cameraStatuses.reduce<Record<string, number>>((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});

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
                    <img src={`/api/backend/camera/stream/${cam.id}`} alt={cam.name} className="absolute inset-0 w-full h-full object-cover" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold mb-2">Camera Status Overview</h3>
          <p className="text-[9px] text-slate-500 mb-1">Real heartbeat check — no camera "maintenance"/"error" state exists, only online / stale / never reported.</p>
          <MiniDonut segments={[
            { label: 'Online', value: cameraStatusCounts.online || 0, color: '#10b981' },
            { label: 'Stale', value: cameraStatusCounts.stale || 0, color: '#f59e0b' },
            { label: 'Never Reported', value: cameraStatusCounts.never_reported || 0, color: '#64748b' },
          ]} />
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col">
          <h3 className="text-sm font-bold mb-2">User Distribution by Role</h3>
          <MiniDonut segments={Object.entries(roleCounts).map(([roleName, count]) => ({ label: roleName, value: count }))} centerLabel={`${registeredUsers.length} Total Users`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <button
           onClick={() => alert("Not wired to real backend logic — there's no backup job anywhere in this codebase. See the Backup tab under Security & Audit for the same note.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">💾</span>
            <span className="text-xs font-bold text-slate-300">Backup Database</span>
         </button>

         <button
           onClick={() => alert("Not wired to real backend logic — there's no remote restart endpoint for the tracking pipeline. Restarting it means restarting the FastAPI process itself.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🔄</span>
            <span className="text-xs font-bold text-slate-300">Restart ML Engine</span>
         </button>

         <button
           onClick={() => alert("Not wired to real backend logic — there's no firewall or IP-blocking logic anywhere in this codebase. See the Firewall tab under Security & Audit for the same note.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🛡️</span>
            <span className="text-xs font-bold text-slate-300">Update Firewall</span>
         </button>

         <button
           onClick={() => alert("Not wired to real backend logic — there's no API key issuance system anywhere in this codebase; authentication is session-cookie based only.")}
           className="bg-slate-950 border border-slate-800 py-6 rounded-xl text-center hover:bg-slate-900 transition-colors cursor-pointer group"
         >
            <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">🔑</span>
            <span className="text-xs font-bold text-slate-300">Manage API Keys</span>
         </button>
      </div>
    </div>
  );
}
