import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  PackageCheck,
  Percent,
  Camera,
  AlertTriangle,
  TrendingUp,
  Store,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  Video,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import KpiCard from '../components/widgets/KpiCard';
import CameraFeedCard from '../components/widgets/CameraFeedCard';
import HeatmapCanvas from '../components/widgets/HeatmapCanvas';
import { mockDashboardData } from '../services/mockDashboardData';
import { apiClient } from '../services/apiClient';

export default function StoreManagerDashboard() {
  const data = mockDashboardData.storeManager;
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    apiClient.getRecommendations(1).then((res) => setRecommendations(res || []));
  }, []);


  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Status Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-400" /> Store Operations Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time daily operations, live camera diagnostic streams, shelf activity, and immediate store alerts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Store Connection
          </span>
          <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
            Store ID: <strong>ST-104 (City Mall)</strong>
          </span>
        </div>
      </div>

      {/* 1. Section: KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Today's Visitors"
          value={data.kpis.todayVisitors.value}
          change={data.kpis.todayVisitors.change}
          isPositive={true}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          title="Current Customers"
          value={data.kpis.currentCustomers.value}
          change={data.kpis.currentCustomers.change}
          isPositive={true}
          icon={Activity}
          color="emerald"
        />
        <KpiCard
          title="Avg Dwell Time"
          value={data.kpis.avgDwellTime.value}
          change={data.kpis.avgDwellTime.change}
          isPositive={true}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Products Picked"
          value={data.kpis.productsPicked.value}
          change={data.kpis.productsPicked.change}
          isPositive={true}
          icon={PackageCheck}
          color="blue"
        />
        <KpiCard
          title="Conversion Rate"
          value={data.kpis.conversionRate.value}
          change={data.kpis.conversionRate.change}
          isPositive={true}
          icon={Percent}
          color="violet"
        />
        <KpiCard
          title="Online Cameras"
          value={data.kpis.onlineCameras.value}
          change={data.kpis.onlineCameras.change}
          isPositive={true}
          icon={Camera}
          color="emerald"
        />
      </div>

      {/* 2. Section: Live Store Cameras Grid */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-indigo-400" /> Live Store Cameras (Diagnostic Stream)
          </h3>
          <span className="text-xs text-slate-400">Showing 6 Active Feeds</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.liveCameras.map((cam) => (
            <CameraFeedCard key={cam.id} camera={cam} />
          ))}
        </div>
      </div>

      {/* 3. Section: Store Traffic Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Hourly Visitor Trend (Line Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trafficHourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Daily Store Footfall Trend (Area Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyFootfall}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="footfall" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.25)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Section: Zone Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Visitors per Zone (Bar Chart)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zoneOccupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Zone Occupancy Distribution</h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.zoneOccupancy}
                  dataKey="count"
                  nameKey="zone"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {data.zoneOccupancy.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Section: Shelf Performance & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md space-y-4">
          <h4 className="font-semibold text-white">Shelf Engagement Scores & Funnel</h4>
          <div className="space-y-3">
            {data.shelfPerformance.scores.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span>{s.shelf}</span>
                  <span className="text-indigo-400">{s.score}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <HeatmapCanvas title="Store Attention Heatmap" type="traffic" />
      </div>

      {/* 6. Section: Store Conversion & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Store Conversion Funnel</h4>
          <div className="space-y-3">
            {data.conversion.funnel.map((step, idx) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400">{step.stage}</span>
                  <p className="text-base font-bold text-white">{step.count} Visitors</p>
                </div>
                <span className="rounded bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                  {step.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Store Alerts Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between pb-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Recent Store Operational Alerts
            </h4>
            <span className="text-xs text-slate-400">Real-time alerts timeline</span>
          </div>

          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-100">{alert.title}</h5>
                    <p className="text-xs text-slate-400">{alert.zone} • {alert.time}</p>
                  </div>
                </div>
                <button className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
