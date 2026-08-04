import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Treemap
} from 'recharts';
import { Eye, TrendingUp, Clock, Shuffle, UserCheck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#6366f1'];

interface Kpis {
  avg_attention_seconds: number;
  avg_dwell_seconds: number;
  repeat_visitors: number;
  avg_session_minutes: number;
  engagement_score: number;
}

interface SegmentItem {
  segment: string;
  percentage: number;
  description: string;
}

interface AttentionPoint {
  shelf_name: string;
  avg_attention_seconds: number;
}

interface ProductAttentionPoint {
  product_name: string;
  avg_attention_seconds: number;
}

interface BehaviorPoint {
  product_name: string;
  category: string;
  views: number;
  pickups: number;
  returns: number;
  purchases: number;
  ignore_rate: number;
}

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

interface RetailAnalystData {
  store_id?: string;
  kpis: Kpis;
  segmentation: SegmentItem[];
  attention_analytics: {
    avg_attention_per_shelf: AttentionPoint[];
    avg_attention_per_product: ProductAttentionPoint[];
  };
  shopping_behavior: BehaviorPoint[];
  sankey_data: SankeyData;
  dwell_time_distribution: { dwell_range_seconds: string; frequency: number }[];
}

interface ActiveDot {
  id: string;
  x: number;
  y: number;
  gaze: string | null;
  age: number;
  zoneId?: number;
}

interface HeatPoint {
  x: number;
  y: number;
  val: number;
  timestamp: number;
}

interface RetailAnalystDashboardProps {
  storeId: string;
  token: string | null;
}

export default function RetailAnalystDashboard({ storeId, token }: RetailAnalystDashboardProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<RetailAnalystData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDots, setActiveDots] = useState<ActiveDot[]>([]);

  // Rolling heatmap points (with timestamp for decay)
  const trafficPoints = useRef<HeatPoint[]>([]);
  const storeAttentionPoints = useRef<HeatPoint[]>([]);
  const shelfPoints = useRef<HeatPoint[]>([]);
  const zonePoints = useRef<HeatPoint[]>([]);

  // Canvas Refs
  const canvasTraffic = useRef<HTMLCanvasElement | null>(null);
  const canvasStoreAttention = useRef<HTMLCanvasElement | null>(null);
  const canvasShelf = useRef<HTMLCanvasElement | null>(null);
  const canvasZone = useRef<HTMLCanvasElement | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/analyst/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load analyst dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);

    const ws = new WebSocket(`ws://localhost:8000/api/ws/${storeId}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "COORDINATES") {
          const { shopper_id, x, y, gaze_facing_shelf_id, zone_id } = payload;
          const now = Date.now();
          
          setActiveDots(prev => {
            const list = prev.filter(dot => dot.id !== shopper_id);
            list.push({ id: shopper_id, x, y, gaze: gaze_facing_shelf_id, age: now, zoneId: zone_id });
            return list;
          });

          trafficPoints.current.push({ x, y, val: 1, timestamp: now });
          if (gaze_facing_shelf_id) {
            shelfPoints.current.push({ x, y, val: 1.5, timestamp: now });
            storeAttentionPoints.current.push({ x, y, val: 1.2, timestamp: now });
          }
          if (zone_id) {
            zonePoints.current.push({ x, y, val: 0.8, timestamp: now });
          }
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [storeId]);

  useEffect(() => {
    const decayInterval = setInterval(() => {
      const cutoff = Date.now() - 30000;
      trafficPoints.current = trafficPoints.current.filter(p => p.timestamp > cutoff);
      storeAttentionPoints.current = storeAttentionPoints.current.filter(p => p.timestamp > cutoff);
      shelfPoints.current = shelfPoints.current.filter(p => p.timestamp > cutoff);
      zonePoints.current = zonePoints.current.filter(p => p.timestamp > cutoff);
      setActiveDots(prev => prev.filter(dot => Date.now() - dot.age < 5000));
    }, 1000);
    return () => clearInterval(decayInterval);
  }, []);

  const drawHeatmapOnCanvas = (canvas: HTMLCanvasElement | null, points: HeatPoint[]) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a1a2b';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
    }

    points.forEach((pt) => {
      const age = Date.now() - pt.timestamp;
      const decay = Math.max(0.1, 1 - age / 30000);
      const radius = 16;
      const gradient = ctx.createRadialGradient(pt.x * 0.3, pt.y * 0.3, 2, pt.x * 0.3, pt.y * 0.3, radius);
      gradient.addColorStop(0, `rgba(244, 63, 94, ${0.7 * decay})`);
      gradient.addColorStop(0.5, `rgba(234, 179, 8, ${0.3 * decay})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pt.x * 0.3, pt.y * 0.3, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  useEffect(() => {
    if (loading || !data) return;
    drawHeatmapOnCanvas(canvasTraffic.current, trafficPoints.current);
    drawHeatmapOnCanvas(canvasStoreAttention.current, storeAttentionPoints.current);
    drawHeatmapOnCanvas(canvasShelf.current, shelfPoints.current);
    drawHeatmapOnCanvas(canvasZone.current, zonePoints.current);
  }, [activeDots, data, loading]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-101 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
      <p className="text-slate-400 text-xs">Loading Executive Dashboard...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-101 p-4">
      <AlertTriangle className="text-rose-500 w-10 h-10 mb-2" />
      <p className="text-slate-500 text-xs">{error || "Connection offline"}</p>
    </div>
  );

  const kpis = data.kpis || { avg_attention_seconds: 0, avg_dwell_seconds: 0, repeat_visitors: 0, avg_session_minutes: 0, engagement_score: 0 };

  const segmentationData = [
    { name: 'High Value', value: 3728, percentage: 20, color: '#6366f1' },
    { name: 'Frequent Shoppers', value: 5643, percentage: 33, color: '#3b82f6' },
    { name: 'Occasional Shoppers', value: 6187, percentage: 30, color: '#10b981' },
    { name: 'New Visitors', value: 3084, percentage: 17, color: '#f59e0b' }
  ];

  const dwellDistributionData = [
    { name: '0 - 10s', value: 28, color: '#6366f1' },
    { name: '10 - 30s', value: 34, color: '#3b82f6' },
    { name: '30 - 60s', value: 24, color: '#10b981' },
    { name: '60s+', value: 14, color: '#f59e0b' }
  ];

  const shoppingBehaviorData = [
    { category: 'Electronics', Visited: 8500, Interacted: 4800, Purchased: 2400 },
    { category: 'Apparel', Visited: 7200, Interacted: 5200, Purchased: 1800 },
    { category: 'Home & Living', Visited: 6800, Interacted: 4100, Purchased: 1200 },
    { category: 'Personal Care', Visited: 5400, Interacted: 4400, Purchased: 2100 }
  ];

  const treemapData = [
    { name: 'Snacks Dept', size: 1200, fill: '#6366f1' },
    { name: 'Beverages Dept', size: 950, fill: '#10b981' },
    { name: 'Apparel Dept', size: 800, fill: '#f59e0b' }
  ];

  const zones = [
    { name: "Electronics", val: 82 },
    { name: "Apparel", val: 76 },
    { name: "Home & Living", val: 68 },
    { name: "Personal Care", val: 61 },
    { name: "Groceries", val: 54 }
  ];

  const mockHourlyTrend = [
    { hour: '09:00', duration: 4.8, count: 22, dwell: 18 },
    { hour: '11:00', duration: 7.2, count: 58, dwell: 28 },
    { hour: '13:00', duration: 5.6, count: 48, dwell: 22 },
    { hour: '15:00', duration: 7.8, count: 72, dwell: 32 },
    { hour: '17:00', duration: 8.5, count: 88, dwell: 36 },
    { hour: '19:00', duration: 6.7, count: 64, dwell: 26 }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Visitors", val: "18,642", change: "+12.6%", trend: "vs last 7 days", color: "text-indigo-400" },
          { label: "Avg. Attention Time", val: "6.42s", change: "+14.3%", trend: "vs last 7 days", color: "text-indigo-400" },
          { label: "Avg. Dwell Time", val: "28.6s", change: "+8.7%", trend: "vs last 7 days", color: "text-indigo-400" },
          { label: "Conversion Rate", val: "23.8%", change: "+6.5%", trend: "vs last 7 days", color: "text-emerald-400" },
          { label: "Sales today", val: "₹8.92L", change: "+18.4%", trend: "vs last 7 days", color: "text-rose-455" },
          { label: "AOV", val: "₹1,245", change: "+9.1%", trend: "vs last 7 days", color: "text-cyan-400" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#0c0c14] border border-slate-850 p-4 rounded-xl shadow-md">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{kpi.label}</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-100">{kpi.val}</span>
              <span className={`text-[10px] font-bold ${kpi.color}`}>{kpi.change}</span>
            </div>
            <p className="text-[9px] text-slate-550 mt-1">{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* ROW 2: Consumer Journey, Attention Analytics, Customer Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Consumer Journey Preview */}
        <div
          onClick={() => navigate('/dashboard/consumer-journey')}
          className="lg:col-span-5 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Consumer Journey Summary</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="relative bg-[#08080f]/50 p-1.5 rounded-lg border border-slate-900 overflow-x-auto">
              <svg className="w-full h-32" viewBox="0 0 420 220">
                <path d="M 50 40 C 110 40, 110 50, 170 50" fill="none" stroke="rgba(99, 102, 241, 0.45)" strokeWidth={12} />
                <path d="M 50 110 C 110 110, 110 90, 170 90" fill="none" stroke="rgba(59, 130, 246, 0.45)" strokeWidth={18} />
                <path d="M 250 50 C 300 50, 310 70, 370 70" fill="none" stroke="rgba(99, 102, 241, 0.45)" strokeWidth={14} />
                <path d="M 250 90 C 300 90, 310 120, 370 120" fill="none" stroke="rgba(59, 130, 246, 0.45)" strokeWidth={12} />
                <g fill="#94a3b8" fontSize={11} fontWeight="bold">
                  <text x={10} y={115}>Entry</text>
                  <text x={170} y={80}>Aisle</text>
                  <text x={330} y={100}>Checkout</text>
                </g>
              </svg>
            </div>
            <div className="text-[10px] space-y-2 font-semibold text-slate-400">
              <p>Total Entries: <span className="text-slate-100 font-bold">18,642</span></p>
              <p>Common Path: <span className="text-indigo-400 font-bold">Entrance 2 ➔ Apparel</span></p>
              <p>Highest Drop-off: <span className="text-rose-500 font-bold">Personal Care</span></p>
            </div>
          </div>
        </div>

        {/* Attention Analytics */}
        <div
          onClick={() => navigate('/dashboard/attention-analytics')}
          className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Attention Analytics Summary</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={8} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Tooltip />
                <Area type="monotone" dataKey="duration" stroke="#818cf8" fill="rgba(129, 140, 248, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segmentation */}
        <div
          onClick={() => navigate('/dashboard/customer-segmentation')}
          className="lg:col-span-3 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Customer Segmentation</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="h-24 flex justify-center items-center mt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={22} outerRadius={36}>
                  {segmentationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-[8px] text-slate-500 font-bold uppercase leading-none">Total</p>
              <p className="text-[10px] font-black text-slate-100 leading-tight">18.6K</p>
            </div>
          </div>
          <div className="space-y-1 text-[8px] text-slate-400 mt-2">
            {segmentationData.slice(0, 3).map((seg, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: seg.color }}></span>{seg.name}</span>
                <span className="font-bold text-slate-300">{seg.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: Shopping Behaviour, Zone Performance, Heatmap Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Shopping Behaviour */}
        <div
          onClick={() => navigate('/dashboard/shopping-behaviour')}
          className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Shopping Behaviour Summary</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shoppingBehaviorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={8} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Bar dataKey="Interacted" fill="#10b981" />
                <Bar dataKey="Purchased" fill="#818cf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Performance Summary */}
        <div
          onClick={() => navigate('/dashboard/zone-performance')}
          className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Zone Performance Summary</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="space-y-2">
            {zones.slice(0, 3).map((zone, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>{zone.name}</span>
                  <span>{zone.val}</span>
                </div>
                <div className="w-full bg-[#161625] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${zone.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Preview Cards */}
        <div
          onClick={() => navigate('/dashboard/traffic-flow')}
          className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Heatmap Previews (Click to View)</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Traffic", ref: canvasTraffic },
              { label: "Attention", ref: canvasStoreAttention },
              { label: "Shelf", ref: canvasShelf },
              { label: "Zone", ref: canvasZone }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="relative border border-slate-900 rounded overflow-hidden aspect-[4/3] w-full bg-black">
                  <canvas ref={item.ref} width={120} height={90} className="w-full h-full block" />
                </div>
                <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4: Dwell Time Summary, AI Insights, Key Takeaways */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dwell Time Summary */}
        <div
          onClick={() => navigate('/dashboard/dwell-time-analysis')}
          className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 cursor-pointer hover:border-indigo-500/50 transition duration-200"
        >
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Dwell Time Summary</span>
            <span className="text-indigo-400 hover:underline flex items-center">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <div className="h-32 flex justify-center items-center relative">
            <svg className="w-40 h-28" viewBox="0 0 200 100">
              <path
                d="M 100 10 C 130 30, 140 50, 100 90 C 60 50, 70 30, 100 10 Z"
                fill="#ec4899"
                fillOpacity={0.2}
                stroke="#ec4899"
                strokeWidth={1.5}
              />
              <line x1="100" y1="20" x2="100" y2="80" stroke="#ef4444" strokeWidth={1} />
              <circle cx="100" cy="50" r={3} fill="#10b981" />
              <text x="110" y="53" fill="#94a3b8" fontSize={8} fontWeight="bold">Median: 28.6s</text>
            </svg>
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">AI Insights</span>
          <div className="space-y-3.5 text-xs font-semibold text-slate-300">
            <div className="flex items-start space-x-2">
              <span className="text-xs text-indigo-400 mt-0.5">★</span>
              <p className="leading-relaxed">Electronics zone has the highest engagement this week.</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-xs text-indigo-400 mt-0.5">★</span>
              <p className="leading-relaxed">Checkout attention dropped by 8%.</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-xs text-indigo-400 mt-0.5">★</span>
              <p className="leading-relaxed">Average dwell time increased by 6%.</p>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Key Takeaways</span>
          <div className="space-y-3 text-xs font-semibold text-slate-350">
            <div className="bg-[#08080f] p-3 rounded border border-slate-900">
              <span className="text-indigo-400 block font-bold">Engagement Lift</span>
              <p className="text-slate-400 mt-1">Engagement index is up by 9.7% compared to last week.</p>
            </div>
            <div className="bg-[#08080f] p-3 rounded border border-slate-900">
              <span className="text-emerald-450 block font-bold">Dwell Time Lift</span>
              <p className="text-slate-400 mt-1">Dwell duration increased by 8.7% across all active store zones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
