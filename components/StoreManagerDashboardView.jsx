'use client';

import React from 'react';
import {
  Users, Clock, ShoppingBag, TrendingUp, Video, AlertTriangle,
  FileText, Download, ArrowUpRight, Navigation, Grid, BarChart2,
  Package, Bell, CheckCircle2, Eye, Flame, Activity, MapPin
} from 'lucide-react';
import LiveVideoCanvas from './LiveVideoCanvas';
import { CAMERAS, PRODUCTS_CATALOG, MOCK_ALERTS } from '@/lib/cams-data';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(51,65,85,0.2)' }, ticks: { color: '#64748b', font: { size: 10 } } },
  },
};

// ─── Tab Sub-Views ─────────────────────────────────────────────────────────────

function OverviewTab({ selectedStore, onExportReport }) {
  const visitorTimeData = {
    labels: ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '9 PM'],
    datasets: [{
      label: 'Visitors', data: [80, 190, 290, 180, 240, 200, 120],
      borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)', fill: true, tension: 0.4,
    }],
  };
  const zoneData = {
    labels: ['Entrance', 'Aisle A', 'Aisle B', 'Promo', 'Checkout'],
    datasets: [{ label: 'Visitors', data: [120, 86, 132, 94, 42], backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'], borderRadius: 6 }],
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white">STORE DASHBOARD OVERVIEW</h1>
          <p className="text-xs text-slate-400">Real-time KPIs for {selectedStore.name}</p>
        </div>
        <button onClick={() => onExportReport('Daily Summary')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-blue-500/20">
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Visitors", value: '1,248', sub: '↑ 12.5%', icon: Users, color: 'text-blue-400' },
          { label: 'Current Customers', value: '78', sub: 'Live in store', icon: Activity, color: 'text-emerald-400' },
          { label: 'Avg. Dwell Time', value: '3m 42s', sub: '↑ 8.3%', icon: Clock, color: 'text-amber-400' },
          { label: 'Products Picked', value: '362', sub: '↑ 15.7%', icon: ShoppingBag, color: 'text-purple-400' },
          { label: 'Conversion Rate', value: '24.6%', sub: '↑ 5.6%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Cameras Online', value: '6 / 6', sub: 'All Active', icon: Video, color: 'text-blue-400' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>{kpi.label}</span><Icon size={15} className={kpi.color} />
              </div>
              <div className={`text-2xl font-black ${kpi.color === 'text-emerald-400' ? 'text-emerald-400' : 'text-white'}`}>{kpi.value}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Visitors Over Time (Today)</h3>
          <div className="h-52"><Line data={visitorTimeData} options={chartOptions} /></div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Visitors by Zone</h3>
          <div className="h-52"><Bar data={zoneData} options={chartOptions} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { type: 'danger', title: 'High Crowd Detected', sub: 'Aisle B is crowded (18 shoppers)', time: '10:24 AM' },
          { type: 'warning', title: 'Shelf C – Low Attention', sub: 'Attention time dropped below threshold', time: '10:18 AM' },
          { type: 'info', title: 'Camera 6 Offline', sub: 'Promotion Area camera reconnected', time: '10:15 AM' },
          { type: 'danger', title: 'Long Queue at Checkout', sub: '8 customers in queue at Checkout 2', time: '10:10 AM' },
        ].map((a, i) => (
          <div key={i} className={`bg-slate-900 border p-4 rounded-xl flex items-start space-x-3 shadow-lg ${a.type === 'danger' ? 'border-red-500/40' : a.type === 'warning' ? 'border-amber-500/40' : 'border-blue-500/40'}`}>
            <AlertTriangle size={18} className={a.type === 'danger' ? 'text-red-400 shrink-0 mt-0.5' : a.type === 'warning' ? 'text-amber-400 shrink-0 mt-0.5' : 'text-blue-400 shrink-0 mt-0.5'} />
            <div>
              <h4 className={`text-xs font-bold ${a.type === 'danger' ? 'text-red-400' : a.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>{a.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5">{a.sub}</p>
              <span className="text-[10px] text-slate-500 font-mono">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CamerasTab() {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Video size={20} className="text-blue-400" /> LIVE CAMERA FEEDS
        </h1>
        <p className="text-xs text-slate-400">6 active streams with real-time YOLOv8 + ByteTrack AI overlay. Toggle bounding boxes, gaze rays & heatmap per feed.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMERAS.map((camera) => (
          <LiveVideoCanvas key={camera.id} camera={camera} height="h-52" />
        ))}
      </div>
    </div>
  );
}

function ShopperTrackingTab() {
  const dwellData = {
    labels: ['< 1 min', '1–2 min', '2–4 min', '4–6 min', '6–10 min', '> 10 min'],
    datasets: [{ label: 'Shoppers', data: [45, 180, 320, 210, 130, 60], backgroundColor: '#3b82f6', borderRadius: 6 }],
  };
  const segColors = ['#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6'];
  const segments = [
    { name: 'Explorers', pct: 32, dwell: '8m 45s', pickup: '15%' },
    { name: 'Quick Buyers', pct: 28, dwell: '2m 10s', pickup: '85%' },
    { name: 'Comparison Shoppers', pct: 18, dwell: '6m 20s', pickup: '60%' },
    { name: 'Impulse Buyers', pct: 14, dwell: '3m 50s', pickup: '70%' },
    { name: 'Brand Loyal', pct: 8, dwell: '4m 15s', pickup: '92%' },
  ];
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Users size={20} className="text-blue-400" /> SHOPPER TRACKING
        </h1>
        <p className="text-xs text-slate-400">Customer dwell time distribution, persona segmentation, and live trajectory data.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracked Today', value: '1,248', icon: Users, color: 'text-blue-400' },
          { label: 'Avg. Session Duration', value: '4m 18s', icon: Clock, color: 'text-amber-400' },
          { label: 'Engagement Rate', value: '68.4%', icon: Eye, color: 'text-emerald-400' },
          { label: 'Unique Shopper IDs', value: '896', icon: Navigation, color: 'text-purple-400' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>{k.label}</span><Icon size={15} className={k.color} />
              </div>
              <div className="text-2xl font-black text-white">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Dwell Time Distribution</h3>
          <div className="h-52"><Bar data={dwellData} options={chartOptions} /></div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Shopper Persona Segments</h3>
          <div className="space-y-2 mt-2">
            {segments.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: segColors[i] }}></div>
                <span className="text-xs font-bold text-white flex-1">{s.name}</span>
                <span className="text-xs text-slate-400 font-mono">{s.pct}%</span>
                <span className="text-[11px] text-amber-400 font-mono">{s.dwell}</span>
                <span className="text-[11px] text-emerald-400 font-mono">{s.pickup}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficTab() {
  const hourlyFlow = {
    labels: ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM'],
    datasets: [
      { label: 'Entries', data: [30,85,140,175,210,190,160,180,200,220,195,140,80], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 },
      { label: 'Exits', data: [15,60,120,155,190,170,145,160,185,205,180,130,75], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 },
    ],
  };
  const opts = { ...chartOptions, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } };
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-400" /> STORE TRAFFIC & VELOCITY
        </h1>
        <p className="text-xs text-slate-400">Hourly entries vs. exits, peak hours, and zone velocity heatmap data.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries Today', value: '1,248', color: 'text-emerald-400' },
          { label: 'Total Exits Today', value: '1,170', color: 'text-amber-400' },
          { label: 'Peak Hour', value: '12 PM – 1 PM', color: 'text-white' },
          { label: 'Avg. Flow Rate', value: '96/hr', color: 'text-blue-400' },
        ].map((k) => (
          <div key={k.label} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 font-medium mb-1">{k.label}</div>
            <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Hourly Entry vs. Exit Flow</h3>
        <div className="h-64"><Line data={hourlyFlow} options={opts} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { zone: 'Zone 1 – Entrance / Exit', flow: '420 visitors/hr', vel: 'High', color: 'text-emerald-400' },
          { zone: 'Zone 2 – Main Aisles', flow: '280 visitors/hr', vel: 'Medium', color: 'text-amber-400' },
          { zone: 'Zone 3 – Checkout', flow: '185 visitors/hr', vel: 'High', color: 'text-red-400' },
        ].map((z) => (
          <div key={z.zone} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={15} className="text-blue-400" />
              <span className="text-xs font-bold text-white">{z.zone}</span>
            </div>
            <div className="text-sm font-bold text-slate-300">{z.flow}</div>
            <div className={`text-xs font-semibold mt-1 ${z.color}`}>Velocity: {z.vel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShelfPerformanceTab() {
  const shelfData = {
    labels: ['Shelf 1 (Eye Level)', 'Shelf 2 (Mid)', 'Shelf 3 (Top)', 'Shelf 4 (Bottom)', 'Promo Endcap'],
    datasets: [
      { label: 'Avg Dwell Time (s)', data: [85, 65, 40, 30, 92], backgroundColor: '#3b82f6', borderRadius: 5 },
      { label: 'Interaction Count', data: [78, 58, 30, 20, 88], backgroundColor: '#10b981', borderRadius: 5 },
    ],
  };
  const opts = { ...chartOptions, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } };
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Grid size={20} className="text-purple-400" /> SHELF PERFORMANCE
        </h1>
        <p className="text-xs text-slate-400">Dwell time, engagement and gaze metrics per shelf location and height.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Top Shelf Zone', value: 'Eye Level – Shelf 1', color: 'text-emerald-400' },
          { label: 'Avg Dwell (Eye Level)', value: '85 seconds', color: 'text-amber-400' },
          { label: 'Least Engaged', value: 'Bottom Shelf 4', color: 'text-red-400' },
          { label: 'Promo Endcap Lift', value: '+92% vs baseline', color: 'text-blue-400' },
        ].map((k) => (
          <div key={k.label} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 font-medium mb-1">{k.label}</div>
            <div className={`text-sm font-black ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Shelf Dwell Time vs. Interaction Count by Location</h3>
        <div className="h-64"><Bar data={shelfData} options={opts} /></div>
      </div>

      <div className="overflow-x-auto bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Shelf-by-Shelf Breakdown</h3>
        <table className="w-full text-xs text-left">
          <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="pb-2">Shelf Location</th>
              <th className="pb-2 text-center">Height</th>
              <th className="pb-2 text-center">Avg Dwell (s)</th>
              <th className="pb-2 text-center">Interactions</th>
              <th className="pb-2 text-center">Gaze %</th>
              <th className="pb-2 text-right">Engagement Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {[
              { name: 'Shelf 1 – Eye Level', height: 'Eye Level', dwell: 85, inter: 78, gaze: '92%', score: 88 },
              { name: 'Shelf 2 – Middle', height: 'Mid-Level', dwell: 65, inter: 58, gaze: '75%', score: 70 },
              { name: 'Shelf 3 – Top', height: 'Top Slot', dwell: 40, inter: 30, gaze: '48%', score: 42 },
              { name: 'Shelf 4 – Bottom', height: 'Bottom Slot', dwell: 30, inter: 20, gaze: '32%', score: 28 },
              { name: 'Promo Endcap', height: 'Eye Level', dwell: 92, inter: 88, gaze: '96%', score: 94 },
            ].map((row) => (
              <tr key={row.name} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 font-bold text-white">{row.name}</td>
                <td className="py-2.5 text-center text-slate-400">{row.height}</td>
                <td className="py-2.5 text-center font-mono text-amber-400">{row.dwell}s</td>
                <td className="py-2.5 text-center font-mono text-purple-400">{row.inter}</td>
                <td className="py-2.5 text-center font-mono text-blue-400">{row.gaze}</td>
                <td className="py-2.5 text-right font-black text-emerald-400">
                  <span className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">{row.score}/100</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductInteractionTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ShoppingBag size={20} className="text-purple-400" /> PRODUCT INTERACTION
        </h1>
        <p className="text-xs text-slate-400">Most picked, most returned, most compared products and individual SKU metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Most Picked Products', color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5',
            items: [
              { name: 'Coca-Cola 500ml', val: '369 pickups', views: 450 },
              { name: 'Lays Classic 50g', val: '427 pickups', views: 610 },
              { name: 'Parle-G 120g', val: '442 pickups', views: 520 },
            ]
          },
          {
            title: 'Most Returned Products', color: 'text-amber-400', border: 'border-amber-500/30 bg-amber-500/5',
            items: [
              { name: 'Organic Almond Milk', val: '12 returns', views: 380 },
              { name: 'Nutella 350g', val: '9 returns', views: 290 },
              { name: 'Lays Classic 50g', val: '8 returns', views: 610 },
            ]
          },
          {
            title: 'Most Compared Products', color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/5',
            items: [
              { name: 'Coca-Cola vs Pepsi', val: '25 compares', views: 0 },
              { name: 'Lays vs Bingo Chips', val: '18 compares', views: 0 },
              { name: 'Maggi vs Yippee', val: '15 compares', views: 0 },
            ]
          },
        ].map((col) => (
          <div key={col.title} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <h3 className={`text-sm font-bold mb-3 ${col.color}`}>{col.title}</h3>
            <div className="space-y-2">
              {col.items.map((item, i) => (
                <div key={item.name} className={`flex items-center justify-between p-2.5 rounded-lg border ${col.border}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{i + 1}. {item.name}</div>
                    {item.views > 0 && <div className="text-[10px] text-slate-500 font-mono">{item.views} views</div>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${col.color} bg-slate-900 border border-slate-700`}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-3">Product SKU Interaction Table</h3>
        <table className="w-full text-xs text-left">
          <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="pb-2">Product</th>
              <th className="pb-2 text-center">Views</th>
              <th className="pb-2 text-center">Pickups</th>
              <th className="pb-2 text-center">Purchases</th>
              <th className="pb-2 text-right">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {PRODUCTS_CATALOG.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 font-bold text-white">{p.name}</td>
                <td className="py-2.5 text-center font-mono text-slate-400">{p.views}</td>
                <td className="py-2.5 text-center font-mono text-blue-400">{p.pickups}</td>
                <td className="py-2.5 text-center font-mono text-emerald-400">{p.purchases}</td>
                <td className="py-2.5 text-right font-black text-emerald-400">
                  {Math.round((p.purchases / p.views) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsTab() {
  const allAlerts = [
    { id: 1, priority: 'Critical', title: 'High Crowd Detected in Aisle B', desc: '18 shoppers clustered – risk of congestion and cart abandonment.', time: '10:24 AM', color: 'border-red-500/40 bg-red-500/5', badge: 'text-red-400 bg-red-500/15 border-red-500/30' },
    { id: 2, priority: 'Warning', title: 'Shelf C – Low Attention Zone', desc: 'Shopper attention time on Shelf C dropped below 20s threshold.', time: '10:18 AM', color: 'border-amber-500/40 bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { id: 3, priority: 'Info', title: 'Camera 6 Reconnected', desc: 'Promotional Area camera was briefly offline but has reconnected.', time: '10:15 AM', color: 'border-blue-500/40 bg-blue-500/5', badge: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    { id: 4, priority: 'Critical', title: 'Long Queue at Checkout Lane 2', desc: '8 customers waiting – average queue depth exceeds 4m 30s wait.', time: '10:10 AM', color: 'border-red-500/40 bg-red-500/5', badge: 'text-red-400 bg-red-500/15 border-red-500/30' },
    { id: 5, priority: 'Warning', title: 'Organic Almond Milk – Stockout Risk', desc: 'High gaze attention but inventory critically low. Only 3 units remain.', time: '09:55 AM', color: 'border-amber-500/40 bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { id: 6, priority: 'Info', title: 'Dead Zone Detected in Aisle 3', desc: 'Aisle 3 rear section has 65% lower traffic than baseline. Anchor product relocation recommended.', time: '09:42 AM', color: 'border-blue-500/40 bg-blue-500/5', badge: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  ];
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bell size={20} className="text-red-400" /> REAL-TIME ALERTS
          </h1>
          <p className="text-xs text-slate-400">System-generated alerts from AI stream analysis and rule engine.</p>
        </div>
        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{allAlerts.length} Active</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAlerts.map((a) => (
          <div key={a.id} className={`p-4 rounded-xl border ${a.color} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${a.badge}`}>{a.priority}</span>
              <span className="text-[10px] text-slate-500 font-mono">{a.time}</span>
            </div>
            <h4 className="text-xs font-bold text-white">{a.title}</h4>
            <p className="text-[11px] text-slate-300">{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ onExportReport }) {
  const reports = [
    { title: 'Daily Executive Summary', desc: 'KPIs, visitor counts, top products, and alerts for today.', type: 'Daily Summary' },
    { title: 'Weekly Merchandising Report', desc: 'Shelf performance, SKU attractiveness scores, and planogram recommendations.', type: 'Weekly Merchandising' },
    { title: 'Monthly Analytics Report', desc: 'Full behavioral analytics with heatmaps and journey flows.', type: 'Monthly Analytics' },
    { title: 'Custom Date Range Export', desc: 'Select any date range for a tailored analytics PDF export.', type: 'Custom Date Range' },
  ];
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText size={20} className="text-blue-400" /> ANALYTICS REPORTS & EXPORT
        </h1>
        <p className="text-xs text-slate-400">Generate and download PDF or Excel reports for any time window.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.type} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">{r.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{r.desc}</p>
            </div>
            <button
              onClick={() => onExportReport(r.type)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-blue-500/20"
            >
              <Download size={13} /> Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard Wrapper ───────────────────────────────────────────────────

export default function StoreManagerDashboardView({ selectedStore, onExportReport, activeTab }) {
  return (
    <div className="p-6 text-slate-200">
      {activeTab === 'overview'  && <OverviewTab selectedStore={selectedStore} onExportReport={onExportReport} />}
      {activeTab === 'cameras'   && <CamerasTab />}
      {activeTab === 'visitors'  && <ShopperTrackingTab />}
      {activeTab === 'traffic'   && <TrafficTab />}
      {activeTab === 'shelf'     && <ShelfPerformanceTab />}
      {activeTab === 'products'  && <ProductInteractionTab />}
      {activeTab === 'alerts'    && <AlertsTab />}
      {activeTab === 'reports'   && <ReportsTab onExportReport={onExportReport} />}
    </div>
  );
}
