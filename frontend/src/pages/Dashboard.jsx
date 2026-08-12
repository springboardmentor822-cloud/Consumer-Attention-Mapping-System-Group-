import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import MarketingDashboard from "./MarketingDashboard";
import RetailAnalystDashboard from "../roles/retail-analyst/RetailAnalystDashboard";
import StoreManagerDashboard from "../roles/store-manager/StoreManagerDashboard";
import { 
  Users, UserCheck, Package, LayoutDashboard, Layers, Map, Video, 
  VideoOff, Activity, Clock, Eye, AlertTriangle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

import KpiCard from "../components/dashboard/KpiCard";
import LiveCameraCard from "../components/dashboard/LiveCameraCard";
import AlertPanel from "../components/dashboard/AlertPanel";
import SystemHealth from "../components/dashboard/SystemHealth";

// --- MOCK DATA FOR CHARTS & LISTS ---
const footfallData = [
  { time: '08:00', count: 45 }, { time: '10:00', count: 120 },
  { time: '12:00', count: 350 }, { time: '14:00', count: 280 },
  { time: '16:00', count: 410 }, { time: '18:00', count: 320 },
  { time: '20:00', count: 150 }, { time: '22:00', count: 40 },
];

const attentionData = [
  { name: 'Mon', score: 78 }, { name: 'Tue', score: 82 },
  { name: 'Wed', score: 80 }, { name: 'Thu', score: 85 },
  { name: 'Fri', score: 89 }, { name: 'Sat', score: 92 },
  { name: 'Sun', score: 88 },
];

const shelfOccupancyData = [
  { name: 'Beverages', value: 85, fill: '#3b82f6' },
  { name: 'Snacks', value: 65, fill: '#8b5cf6' },
  { name: 'Produce', value: 45, fill: '#ef4444' },
  { name: 'Dairy', value: 92, fill: '#10b981' },
];

const generateAlerts = (metrics) => {
  const alerts = [
    { type: 'stock', title: 'Low Stock: Produce A', desc: 'Shelf 3 occupancy is below 20%.', time: '10:24 AM' },
    { type: 'camera', title: 'Camera Offline', desc: 'Parking Camera lost connection.', time: '10:18 AM' }
  ];
  
  if (metrics?.abandonment_rate > 30) {
    alerts.unshift({ type: 'warning', title: 'High Abandonment', desc: `Abandonment rate reached ${metrics.abandonment_rate}%. Review checkout or aisle flow.`, time: 'Just now' });
  }
  
  if (metrics?.capture_rate < 10 && metrics?.total_entries > 5) {
    alerts.unshift({ type: 'critical', title: 'Low Capture Rate', desc: `Only ${metrics.capture_rate}% of passerbys are engaging. Endcaps may need adjusting.`, time: 'Just now' });
  }

  return alerts;
};

const recentActivity = [
  { action: 'Store Opened', target: 'AK retail store', time: '08:00 AM', type: 'info' },
  { action: 'Analytics Started', target: 'AI Engine', time: '08:05 AM', type: 'success' },
];

function AdminOverview() {
  const [store, setStore] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId = null;
    async function loadDashboardData() {
      try {
        const storeRes = await api.get("/stores").catch(() => ({ data: [] }));
        if (storeRes.data.length > 0) {
          const currentStore = storeRes.data[0];
          setStore(currentStore);
          
          const [metricsRes, reportsRes, camerasRes, zonesRes, shelvesRes, productsRes] = await Promise.all([
            api.get(`/analytics/stores/${currentStore.id}/retail-metrics`).catch(() => ({ data: {} })),
            api.get(`/analytics/stores/${currentStore.id}/reports`).catch(() => ({ data: {} })),
            api.get(`/cameras/${currentStore.id}`).catch(() => ({ data: [] })),
            api.get(`/zones/${currentStore.id}`).catch(() => ({ data: [] })),
            api.get(`/shelves/1`).catch(() => ({ data: [] })),
            api.get(`/products`).catch(() => ({ data: [] }))
          ]);

          setMetrics(metricsRes.data);
          setReports(reportsRes.data);
          setCameras(camerasRes.data);
          setZones(zonesRes.data);
          setShelves(shelvesRes.data);
          setProducts(productsRes.data);

          intervalId = setInterval(async () => {
             const mRes = await api.get(`/analytics/stores/${currentStore.id}/retail-metrics`).catch(() => ({ data: metrics }));
             if(mRes.data) setMetrics(mRes.data);
             const rRes = await api.get(`/analytics/stores/${currentStore.id}/reports`).catch(() => ({ data: reports }));
             if(rRes.data) setReports(rRes.data);
             const cRes = await api.get(`/cameras/${currentStore.id}`).catch(() => ({ data: cameras }));
             if(cRes.data) setCameras(cRes.data);
          }, 3000);
        }
      } catch (err) {
        console.error("Dashboard init error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  const totalProds = products.reduce((acc, p) => acc + (p.current_count || p.detected_count || 1), 0) || (metrics?.current_products || 0);
  const activeCameras = cameras.filter(c => (c.status || '').toLowerCase() === 'online').length;
  const offlineCameras = cameras.filter(c => (c.status || '').toLowerCase() !== 'online').length;

  const dynamicFootfall = reports?.attention_map_distribution?.map(d => ({
    time: d.hour,
    count: d.value
  })).reverse() || footfallData;

  const dynamicShelfOccupancy = shelves.slice(0, 5).map((s, idx) => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    return {
      name: s.name || s.label || `Shelf ${idx}`,
      value: s.occupancy || Math.floor(Math.random() * 100),
      fill: colors[idx % colors.length]
    };
  });
  const renderShelfOccupancy = dynamicShelfOccupancy.length > 0 ? dynamicShelfOccupancy : shelfOccupancyData;

  if (loading) {
    return (
      <Layout title="Enterprise AI Analytics">
        <div className="flex flex-col items-center justify-center h-[60vh] text-indigo-400">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold tracking-widest uppercase">Initializing AI Engine...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enterprise Overview">
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <KpiCard title="Current Customers" value={metrics?.current_customers || 0} icon={<Users className="w-5 h-5 text-blue-400" />} trend="up" trendValue="Live" colorClass="text-blue-400" gradientClass="bg-blue-500" />
          <KpiCard title="People Detected" value={metrics?.total_entries || 0} icon={<UserCheck className="w-5 h-5 text-indigo-400" />} trend="up" trendValue="Live" colorClass="text-indigo-400" gradientClass="bg-indigo-500" />
          <KpiCard title="Capture Rate" value={`${metrics?.capture_rate || 0}%`} icon={<Users className="w-5 h-5 text-emerald-400" />} trend="up" trendValue="Live" colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
          <KpiCard title="Abandonment Rate" value={`${metrics?.abandonment_rate || 0}%`} icon={<AlertTriangle className="w-5 h-5 text-red-400" />} trend="down" trendValue="Live" colorClass="text-red-400" gradientClass="bg-red-500" />
          <KpiCard title="Products Detected" value={totalProds} icon={<Package className="w-5 h-5 text-amber-400" />} trend="up" trendValue="Live" colorClass="text-amber-400" gradientClass="bg-amber-500" />
          
          <KpiCard title="Avg Dwell Time" value={`${metrics?.average_dwell_time || 0.0}s`} icon={<Clock className="w-5 h-5 text-purple-400" />} trend="up" trendValue="Live" colorClass="text-purple-400" gradientClass="bg-purple-500" />
          <KpiCard title="Avg Attention Time" value={`${metrics?.average_attention_time || 0.0}s`} icon={<Eye className="w-5 h-5 text-pink-400" />} trend="up" trendValue="Live" colorClass="text-pink-400" gradientClass="bg-pink-500" />
          <KpiCard title="Time to Notice" value={`${metrics?.average_time_to_notice || 0.0}s`} icon={<Activity className="w-5 h-5 text-blue-400" />} trend="down" trendValue="Live" colorClass="text-blue-400" gradientClass="bg-blue-500" />
          <KpiCard title="Attention Score" value={`${metrics?.average_attention_score || metrics?.attention_score || 0}%`} icon={<Eye className="w-5 h-5 text-emerald-400" />} trend="up" trendValue="Live" colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
          <KpiCard title="Store Occupancy" value={`${metrics?.shelf_occupancy || 0}%`} icon={<Activity className="w-5 h-5 text-orange-400" />} trend="up" trendValue="Live" colorClass="text-orange-400" gradientClass="bg-orange-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Current Shelves</span><span className="font-bold text-white">{shelves.length}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Current Zones</span><span className="font-bold text-white">{zones.length}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Active Cameras</span><span className="font-bold text-emerald-400">{activeCameras}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Offline Cameras</span><span className="font-bold text-red-400">{offlineCameras}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Total Camera Feeds</span><span className="font-bold text-blue-400">{cameras.length}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Low Stock Shelves</span><span className="font-bold text-orange-400">{metrics?.low_stock_shelves || 0}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Highest Traffic Zone</span><span className="font-bold text-purple-400 text-xs truncate max-w-[80px] text-right">{reports?.top_performing_zone || "N/A"}</span></div>
           <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center"><span className="text-xs text-slate-400">Live AI Analytics</span><span className="font-bold text-emerald-400 text-xs">Active</span></div>
        </div>

        {/* Middle Section: Charts & Overviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white">Customer Footfall (Today)</h3>
                <select className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
             </div>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicFootfall} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2}} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-1 h-[360px]">
             <AlertPanel alerts={generateAlerts(metrics)} />
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
             <h3 className="text-sm font-bold text-white mb-4">Attention Score Trend</h3>
             <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981'}} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
             <h3 className="text-sm font-bold text-white mb-4">Shelf Occupancy by Zone</h3>
             <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={renderShelfOccupancy} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                      {renderShelfOccupancy.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-center space-y-2 text-[10px]">
                  {renderShelfOccupancy.map((s, i) => (
                     <div key={i} className="flex items-center gap-1.5 truncate max-w-[80px]">
                        <span className="w-2 h-2 shrink-0 rounded-full" style={{backgroundColor: s.fill}}></span>
                        <span className="text-slate-300 truncate">{s.name} ({s.value}%)</span>
                     </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-1">
             <SystemHealth healthData={{cpu: 45, memory: 72, gpu: 89, db: 15, storage: 60}} />
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
             <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
             <div className="relative border-l border-slate-700 ml-2 space-y-4">
                {recentActivity.map((act, idx) => (
                  <div key={idx} className="relative pl-4">
                    <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#0b1121] ${act.type === 'success' ? 'bg-emerald-500' : act.type === 'info' ? 'bg-blue-500' : 'bg-slate-500'}`}></span>
                    <p className="text-xs font-bold text-slate-200">{act.action}</p>
                    <div className="flex justify-between items-center mt-0.5">
                       <span className="text-[10px] text-slate-400">{act.target}</span>
                       <span className="text-[9px] text-slate-500">{act.time}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "marketing_manager") {
    return <MarketingDashboard />;
  }

  if (user?.role === "retail_analyst") {
    return <RetailAnalystDashboard />;
  }

  if (user?.role === "store_manager") {
    return <StoreManagerDashboard />;
  }

  return <AdminOverview />;
}
