import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StoreFloorMapHeatmap } from '../heatmaps/StoreFloorMapHeatmap';
import { CameraPreviewCard } from '../common/CameraPreviewCard';
import { 
  Users, Clock, ShoppingCart, Video, AlertTriangle, ArrowUpRight, 
  CheckCircle, Sparkles, TrendingUp, ChevronRight, FileText, Settings as SettingsIcon,
  Flame, PieChart as PieIcon, BarChart2, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

interface StoreManagerDashboardProps {
  onOpenDedicatedCameraPage?: (cameraId: string) => void;
}

export const StoreManagerDashboard: React.FC<StoreManagerDashboardProps> = ({ onOpenDedicatedCameraPage }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.getStoreManagerDashboard('STORE-812')
      .then((res) => { if (mounted) setData(res); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Store Manager Dashboard Telemetry...
      </div>
    );
  }

  const handleSelectCamera = (id: string) => {
    if (onOpenDedicatedCameraPage) {
      onOpenDedicatedCameraPage(id);
    }
  };

  // Recharts Colors
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Visitors Over Time Data
  const visitorsOverTime = [
    { time: '9 AM', visitors: 85 },
    { time: '12 PM', visitors: 160 },
    { time: '3 PM', visitors: 280 },
    { time: '6 PM', visitors: 210 },
    { time: '9 PM', visitors: 110 }
  ];

  // Visitors by Zone Data
  const visitorsByZone = [
    { zone: 'Entrance', count: 120 },
    { zone: 'Aisle A', count: 86 },
    { zone: 'Aisle B', count: 132 },
    { zone: 'Aisle C', count: 94 },
    { zone: 'Checkout', count: 42 }
  ];

  // New vs Returning Visitors Data
  const newVsReturning = [
    { name: 'New Visitors', value: 896, percentage: 72, color: '#6366f1' },
    { name: 'Returning Visitors', value: 352, percentage: 28, color: '#10b981' }
  ];

  // Traffic by Zone Donut
  const trafficByZone = [
    { name: 'High Traffic', value: 40, color: '#ef4444' },
    { name: 'Medium Traffic', value: 35, color: '#f59e0b' },
    { name: 'Low Traffic', value: 25, color: '#10b981' }
  ];

  // 6 Live Cameras Definition matching reference image
  const demoCameras = [
    { id: 'CAM-01', name: '1. Entrance', ip_address: '192.168.1.101', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-02', name: '2. Aisle A', ip_address: '192.168.1.102', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-03', name: '3. Aisle B', ip_address: '192.168.1.103', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-04', name: '4. Promotion Area', ip_address: '192.168.1.104', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-05', name: '5. Checkout', ip_address: '192.168.1.105', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-06', name: '6. Exit', ip_address: '192.168.1.106', resolution: '1920x1080', status: 'ONLINE' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP OPERATIONAL KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Today's Visitors</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">1,248</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +12.5% vs yesterday
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Current Customers</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white">78</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Live in store now</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Avg. Dwell Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">3m 42s</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +8.3% engagement
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Products Picked</span>
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">362</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +15.7% conversion
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">24.6%</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +5.6% checkout
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase">Cameras Online</span>
            <Video className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">8/8</div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">All online & healthy</div>
        </div>
      </div>

      {/* 2. LIVE CAMERAS SECTION */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Live Cameras - Synchronized Feeds</h3>
          </div>
          <span className="status-pill-online px-3 py-1 rounded-full text-xs font-extrabold flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
            Click Any Camera to Open Full Page
          </span>
        </div>
        <div className="bi-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {demoCameras.map((cam) => (
            <CameraPreviewCard
              key={cam.id}
              id={cam.id}
              name={cam.name}
              ipAddress={cam.ip_address}
              resolution={cam.resolution}
              status={cam.status}
              onOpenDedicatedPage={handleSelectCamera}
            />
          ))}
        </div>
      </div>

      {/* 3. VISITORS SECTION */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm text-white">Visitors Analytics & Demographics</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Real-time visitor counts & trends</span>
        </div>
        <div className="bi-card-body grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitors Over Time */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">Visitors Over Time</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visitors by Zone */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">Visitors by Zone</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitorsByZone}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="zone" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New vs Returning Visitors */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">New vs Returning Visitors</div>
            <div className="h-52 flex items-center justify-between">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={newVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {newVsReturning.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-45% space-y-2 text-xs font-bold">
                <div className="flex items-center justify-between text-indigo-300">
                  <span>New Visitors</span>
                  <span>72% (896)</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <span>Returning</span>
                  <span>28% (352)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STORE TRAFFIC & MOVEMENT FLOW */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Store Traffic & Zone Movement Flow</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visitors by Hour */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">Visitors by Hour</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorsOverTime}>
                  <defs>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="visitors" stroke="#10b981" fillOpacity={1} fill="url(#trafficGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Traffic by Zone */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">Traffic Density by Zone</div>
            <div className="h-52 flex items-center justify-between">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={trafficByZone} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {trafficByZone.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-45% space-y-2 text-xs font-bold">
                <div className="flex justify-between text-rose-400">
                  <span>High</span>
                  <span>40%</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Medium</span>
                  <span>35%</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Low</span>
                  <span>25%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Flow (Sankey Flow Diagram SVG matching reference image) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">Movement Flow Pathing</div>
            <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800 h-52 flex flex-col justify-center items-center overflow-hidden">
              <svg className="w-full h-44" viewBox="0 0 400 160">
                {/* Entrance Node */}
                <rect x="10" y="55" width="75" height="50" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                <text x="47.5" y="84" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">Entrance</text>

                {/* Flows to Aisles */}
                <path d="M 85 70 C 135 70, 135 30, 185 30" fill="none" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="12" />
                <path d="M 85 80 C 135 80, 135 80, 185 80" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="16" />
                <path d="M 85 90 C 135 90, 135 130, 185 130" fill="none" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="12" />

                {/* Aisle Nodes */}
                <rect x="185" y="15" width="75" height="30" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="222.5" y="34" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Aisle A</text>

                <rect x="185" y="65" width="75" height="30" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
                <text x="222.5" y="84" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Aisle B</text>

                <rect x="185" y="115" width="75" height="30" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="222.5" y="134" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Aisle C</text>

                {/* Flows to Checkout */}
                <path d="M 260 30 C 300 30, 300 70, 340 70" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="12" />
                <path d="M 260 80 C 300 80, 300 80, 340 80" fill="none" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="16" />
                <path d="M 260 130 C 300 130, 300 90, 340 90" fill="none" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="12" />

                {/* Checkout Node */}
                <rect x="315" y="55" width="75" height="50" rx="8" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
                <text x="352.5" y="84" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">Checkout</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SHELF PERFORMANCE SECTION */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">Shelf Performance & Engagement Heatmap</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Shelf by Engagement */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">Top Shelf by Engagement</div>
            <div className="space-y-2 text-xs font-bold">
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf A</span>
                  <span className="text-emerald-400">92%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[92%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf B</span>
                  <span className="text-indigo-400">74%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full w-[74%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf C</span>
                  <span className="text-amber-400">38%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[38%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Shelf Engagement Heat Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">Shelf Engagement Heat (4x4 Grid)</div>
            <div className="grid grid-cols-4 gap-1.5 h-36">
              <div className="bg-blue-900/60 rounded border border-blue-700"></div>
              <div className="bg-blue-700/60 rounded border border-blue-500"></div>
              <div className="bg-amber-600/80 rounded border border-amber-500"></div>
              <div className="bg-rose-600/90 rounded border border-rose-500"></div>
              <div className="bg-indigo-800/60 rounded border border-indigo-600"></div>
              <div className="bg-emerald-600/80 rounded border border-emerald-500"></div>
              <div className="bg-[#ff4500]/90 rounded border border-orange-500"></div>
              <div className="bg-rose-700/90 rounded border border-rose-600"></div>
            </div>
          </div>

          {/* Least Engaged Shelves */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">Least Engaged Shelves</div>
            <div className="space-y-2 text-xs font-bold">
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf C</span>
                  <span className="text-rose-400">38%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full w-[38%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf D</span>
                  <span className="text-rose-400">26%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full w-[26%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-200 mb-1">
                  <span>Shelf E</span>
                  <span className="text-rose-400">22%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full w-[22%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. PRODUCT INTERACTION SECTION */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm text-white">Product Interaction Breakdown</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          {/* Most Picked Products */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-indigo-400 uppercase text-[11px]">Most Picked Products</div>
            <div className="space-y-1.5 text-slate-200">
              <div className="flex justify-between"><span>1. Coca Cola 500ml</span><span className="text-white">48</span></div>
              <div className="flex justify-between"><span>2. Lays Classic 52g</span><span className="text-white">43</span></div>
              <div className="flex justify-between"><span>3. Parle-G 120g</span><span className="text-white">37</span></div>
            </div>
          </div>

          {/* Most Returned Products */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-amber-400 uppercase text-[11px]">Most Returned Products</div>
            <div className="space-y-1.5 text-slate-200">
              <div className="flex justify-between"><span>1. Lays Classic 52g</span><span className="text-white">12</span></div>
              <div className="flex justify-between"><span>2. Pepsi 500ml</span><span className="text-white">9</span></div>
              <div className="flex justify-between"><span>3. Maggi 2-Minute</span><span className="text-white">8</span></div>
            </div>
          </div>

          {/* Most Compared Products */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-emerald-400 uppercase text-[11px]">Most Compared Products</div>
            <div className="space-y-1.5 text-slate-200">
              <div className="flex justify-between"><span>1. iPhone 14</span><span className="text-white">25</span></div>
              <div className="flex justify-between"><span>2. Samsung S23</span><span className="text-white">18</span></div>
              <div className="flex justify-between"><span>3. OnePlus 11</span><span className="text-white">15</span></div>
            </div>
          </div>

          {/* Least Viewed Products */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-rose-400 uppercase text-[11px]">Least Viewed Products</div>
            <div className="space-y-1.5 text-slate-200">
              <div className="flex justify-between"><span>1. Product A</span><span className="text-white">8</span></div>
              <div className="flex justify-between"><span>2. Product B</span><span className="text-white">5</span></div>
              <div className="flex justify-between"><span>3. Product C</span><span className="text-white">4</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. HEATMAP SECTION */}
      <StoreFloorMapHeatmap storeId="STORE-812" />

      {/* 8. ALERTS & NOTIFICATIONS */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">Alerts & Real-Time Notifications</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
          <div className="bg-rose-950/40 border border-rose-500/60 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-rose-300">
              <span>🔴 High Crowd Detected</span>
              <span className="font-mono text-[10px]">10:24 AM</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">Aisle B is crowded with 14 shoppers</div>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/60 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-amber-300">
              <span>🟡 Shelf C - Low Attention</span>
              <span className="font-mono text-[10px]">10:18 AM</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">Attention time dropped 35% below threshold</div>
          </div>

          <div className="bg-rose-950/40 border border-rose-500/60 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-rose-300">
              <span>🔴 Camera 6 Offline</span>
              <span className="font-mono text-[10px]">10:15 AM</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">Promotion Area camera signal lost</div>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/60 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-amber-300">
              <span>🟡 Long Queue at Checkout</span>
              <span className="font-mono text-[10px]">10:10 AM</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">8 customers waiting in queue</div>
          </div>
        </div>
      </div>

      {/* 9. REPORTS SECTION */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm text-white">Generate Store Operational Reports</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              const csv = 'Store Operational Daily Report - STORE-812\nGenerated Date,2026-08-12\nStore Name,Parvath Retail Main Supermarket\n\nHour,Visitors,Picks,Returns,Avg Dwell Time,Conversion Rate\n09:00 AM,85,24,2,3m 15s,28.2%\n10:00 AM,120,38,3,3m 30s,31.6%\n11:00 AM,145,45,4,3m 40s,31.0%\n12:00 PM,160,52,5,3m 45s,32.5%\n01:00 PM,190,64,6,3m 50s,33.6%\n02:00 PM,240,78,7,4m 10s,32.5%\n03:00 PM,280,92,8,4m 20s,32.8%\n04:00 PM,230,75,6,3m 55s,32.6%\n05:00 PM,210,68,5,3m 42s,32.3%\n06:00 PM,180,55,4,3m 35s,30.5%\n07:00 PM,140,42,3,3m 20s,30.0%\n08:00 PM,110,30,2,3m 10s,27.2%\n\nSUMMARY METRICS\nTotal Daily Visitors,1248\nTotal Products Picked,362\nOverall Conversion Rate,24.6%\nAvg Dwell Time,3m 42s\nCameras Online,8/8';
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'Daily_Store_Report_STORE-812.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-4 bg-[#090d16] hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-extrabold text-indigo-300 group-hover:text-indigo-200">📄 Daily Report</div>
            <div className="text-[11px] text-slate-400 mt-1">Export today's store traffic and footfall data (CSV)</div>
          </button>

          <button 
            onClick={() => {
              const csv = 'Store Operational Weekly Report - STORE-812\nDate Range,2026-08-05 to 2026-08-12\nStore Name,Parvath Retail Main Supermarket\n\nDay,Total Visitors,Products Picked,Conversion Rate,Top Zone\nWednesday,1180,340,23.8%,Aisle B\nThursday,1220,355,24.1%,Aisle A\nFriday,1350,410,25.4%,Promotion Area\nSaturday,1680,520,26.8%,Beverages\nSunday,1590,490,26.1%,Snack Section\nMonday,1190,345,23.9%,Aisle B\nTuesday,1248,362,24.6%,Aisle B\n\nWEEKLY TOTALS\nTotal Weekly Footfall,9458\nTotal Weekly Products Picked,2822\nWeekly Avg Conversion,24.9%';
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'Weekly_Store_Report_STORE-812.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-4 bg-[#090d16] hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-extrabold text-emerald-300 group-hover:text-emerald-200">📅 Weekly Report</div>
            <div className="text-[11px] text-slate-400 mt-1">Export weekly conversion and dwell trends (CSV)</div>
          </button>

          <button 
            onClick={() => {
              const csv = 'Store Executive Monthly Performance Report - STORE-812\nMonth,July 2026\nStore Name,Parvath Retail Main Supermarket\n\nWeek,Total Visitors,Revenue Index,Customer Retention,Shelf Engagement Score\nWeek 1,8450,100%,71%,88%\nWeek 2,8920,105%,73%,90%\nWeek 3,9100,108%,74%,91%\nWeek 4,9458,112%,76%,93%\n\nMONTHLY EXECUTIVE SUMMARY\nTotal Monthly Visitors,35928\nAverage Daily Traffic,1197\nReturning Shopper Rate,28%\nTop Performing Shelf,Shelf A (92% Engagement)';
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'Monthly_Executive_Report_STORE-812.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-4 bg-[#090d16] hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-extrabold text-amber-300 group-hover:text-amber-200">📊 Monthly Report</div>
            <div className="text-[11px] text-slate-400 mt-1">Full 30-day executive performance report (CSV)</div>
          </button>

          <button 
            onClick={() => {
              const csv = 'Custom Operational Audit Report - STORE-812\nFilter Range,2026-08-01 to 2026-08-12\nSelected Zone,All Store Zones\nStore Name,Parvath Retail Main Supermarket\n\nZone,Category,Items Inspected,Attention Index,Conversion Uplift\nAisle A,Beverages,450,92%,+14.2%\nAisle B,Snacks & Confectionery,620,88%,+11.8%\nAisle C,Personal Care,310,74%,+8.5%\nPromotion Area,Seasonal Offers,540,95%,+18.6%\nCheckout,Grab & Go,280,82%,+9.4%\n\nAUDIT CERTIFICATION\nStatus,PASSED AUDIT\nCertified By,Lathashree (Store Manager)\nSystem Encryption,TLS RTSP Encrypted';
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'Custom_Audit_Report_STORE-812.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="p-4 bg-[#090d16] hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group"
          >
            <div className="text-xs font-extrabold text-purple-300 group-hover:text-purple-200">⚙️ Custom Report</div>
            <div className="text-[11px] text-slate-400 mt-1">Filter by date, zone, or custom category (CSV)</div>
          </button>
        </div>
      </div>

      {/* 10. ACTIVITIES TIMELINE */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-sm text-white">Recent Activities & Event Timeline</h3>
          </div>
        </div>
        <div className="bi-card-body space-y-2.5 text-xs font-bold">
          <div className="flex items-center space-x-3 text-slate-200">
            <span className="font-mono text-slate-400 text-[11px]">10:24 AM</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>High crowd detected in Aisle B</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-200">
            <span className="font-mono text-slate-400 text-[11px]">10:18 AM</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Shelf C attention dropped below threshold</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-200">
            <span className="font-mono text-slate-400 text-[11px]">10:15 AM</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Camera 6 (Promotion Area) went offline</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-200">
            <span className="font-mono text-slate-400 text-[11px]">10:10 AM</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Long queue detected at Checkout</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-200">
            <span className="font-mono text-slate-400 text-[11px]">10:08 AM</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Product Rice Bag 5kg is out of stock</span>
          </div>
        </div>
      </div>

      {/* 11. QUICK SETTINGS CARDS */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
            <h3 className="font-extrabold text-sm text-white">Store & System Settings</h3>
          </div>
        </div>
        <div className="bi-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl text-xs font-bold space-y-1">
            <div className="text-indigo-400">🏪 Store Settings</div>
            <div className="text-[11px] text-slate-400 font-normal">Configure store boundaries and map grid</div>
          </div>
          <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl text-xs font-bold space-y-1">
            <div className="text-emerald-400">📹 Camera Settings</div>
            <div className="text-[11px] text-slate-400 font-normal">Manage RTSP URLs and homography matrices</div>
          </div>
          <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl text-xs font-bold space-y-1">
            <div className="text-amber-400">👤 User Management</div>
            <div className="text-[11px] text-slate-400 font-normal">Manage staff roles and access permissions</div>
          </div>
          <div className="p-4 bg-[#090d16] border border-slate-800 rounded-xl text-xs font-bold space-y-1">
            <div className="text-rose-400">🔔 Notification Settings</div>
            <div className="text-[11px] text-slate-400 font-normal">Configure threshold alerts and email notifications</div>
          </div>
        </div>
      </div>

    </div>
  );
};
