'use client';

import React from 'react';
import {
  Store, Users, Video, Activity, AlertTriangle, Server, Database,
  Cpu, HardDrive, Globe, ArrowUpRight, ArrowDownRight, ShieldCheck,
  CheckCircle, Settings, FileText, Download, Lock, RefreshCw, Key, ShieldAlert
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { CAMERAS } from '@/lib/cams-data';
import LiveVideoCanvas from './LiveVideoCanvas';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
  scales: {
    x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
  },
};

// ─── Sub-Views for Admin Navigation Tabs ─────────────────────────────────────

function AdminOverviewTab() {
  const perfData = {
    labels: ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      { label: 'CPU Usage (%)', data: [35, 42, 38, 45, 52, 48, 55], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3 },
      { label: 'Memory Usage (%)', data: [60, 62, 58, 65, 70, 68, 72], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3 },
      { label: 'Disk Usage (%)', data: [25, 25, 26, 27, 28, 28, 29], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.3 },
      { label: 'Network (I/O Mbps)', data: [40, 48, 42, 58, 65, 60, 75], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', tension: 0.3 },
    ],
  };

  const cameraStatusData = {
    labels: ['Online (88.46%)', 'Offline (7.69%)', 'Maintenance (2.56%)', 'Error (1.28%)'],
    datasets: [
      {
        data: [138, 12, 4, 2],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#dc2626'],
        borderWidth: 0,
      },
    ],
  };

  const userData = {
    labels: ['Store Manager (39.4%)', 'Retail Analyst (22.5%)', 'Marketing Manager (15.5%)', 'Store Staff (14.1%)', 'Administrator (8.5%)'],
    datasets: [
      {
        data: [56, 32, 22, 20, 12],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
        borderWidth: 0,
      },
    ],
  };

  const apiPerfData = {
    labels: ['May 21', 'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27'],
    datasets: [
      {
        label: 'Average Response Time (ms)',
        data: [420, 390, 480, 520, 410, 380, 350],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            ADMIN DASHBOARD OVERVIEW
            <span className="text-xs bg-purple-500/20 text-purple-400 font-mono px-2 py-0.5 rounded border border-purple-500/30">System Control Center</span>
          </h1>
          <p className="text-xs text-slate-400">Welcome back, Super Administrator. System summary & key metrics.</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Range: <strong className="text-slate-200">May 21 – May 27, 2026</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Stores</span><Store size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">1</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            Flagship Store 01
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Users</span><Users size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">142</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} /> +8.33% vs last week
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Cameras</span><Video size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">6</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            Store 01 Cameras
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Cameras Online</span><Activity size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">6 / 6</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">100% Active</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>System Uptime</span><ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">99.85%</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={12} /> +0.32% vs last week
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Active Alerts</span><AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">12</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
            <ArrowDownRight size={12} /> -14.29% vs last week
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">System Performance (Last 7 Days)</h3>
          <p className="text-xs text-slate-400 mb-4">CPU, Memory, Disk, and Network I/O metrics</p>
          <div className="h-64"><Line data={perfData} options={chartOptions} /></div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Camera Status Overview</h3>
            <p className="text-xs text-slate-400 mb-4">Fleet connectivity breakdown</p>
            <div className="h-44 relative flex items-center justify-center">
              <Doughnut data={cameraStatusData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white block">156</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Cameras</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-800">
            <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Online: <strong>138</strong></span>
            <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Offline: <strong>12</strong></span>
            <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Maint: <strong>4</strong></span>
            <span className="text-slate-300 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>Error: <strong>2</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Top Stores by Activity</h3>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr><th className="pb-2">Store</th><th className="pb-2">Visitors</th><th className="pb-2">Interactions</th><th className="pb-2">Conversion</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr><td className="py-2.5 font-bold text-white">Store 01 - City Mall</td><td>12,845</td><td>8,436</td><td className="text-emerald-400 font-bold">24.6%</td></tr>
              <tr><td className="py-2.5 font-bold text-white">Store 02 - Downtown</td><td>9,234</td><td>6,721</td><td className="text-emerald-400 font-bold">22.8%</td></tr>
              <tr><td className="py-2.5 font-bold text-white">Store 03 - Metro Plaza</td><td>8,921</td><td>6,125</td><td className="text-emerald-400 font-bold">21.4%</td></tr>
              <tr><td className="py-2.5 font-bold text-white">Store 04 - Central Mall</td><td>7,432</td><td>5,213</td><td className="text-emerald-400 font-bold">20.1%</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">API Performance</h3>
          <p className="text-xs text-slate-400 mb-3">Average Response Time (ms)</p>
          <div className="h-48"><Line data={apiPerfData} options={chartOptions} /></div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-3">Infrastructure Health</h3>
          <div className="space-y-3 text-xs">
            {['Database Server', 'API Server', 'Stream Processing', 'AI Inference Engine', 'File Storage'].map((item, i) => (
              <div key={item} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-slate-300">{item}</span>
                <span className={`font-bold flex items-center gap-1 ${i === 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {i === 3 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />} {i === 3 ? 'Warning (97.2%)' : 'Healthy (99.9%)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FleetCamerasTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Video size={20} className="text-purple-400" /> FLEET CAMERAS MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400">6 Active AI Cameras monitoring 3 zones in Store 01 - City Mall Flagship. Live stream status & RTSP/OpenCV health.</p>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-mono px-3 py-1 rounded border border-emerald-500/30">6 Online / 6 Active</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMERAS.map((cam) => (
          <LiveVideoCanvas key={cam.id} camera={cam} height="h-48" />
        ))}
      </div>
    </div>
  );
}

function SystemHealthTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Cpu size={20} className="text-blue-400" /> SYSTEM HEALTH & TELEMETRY
        </h1>
        <p className="text-xs text-slate-400">Microservice clusters, TimescaleDB, Redis stream processing, and GPU inferencing stats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">FastAPI Backend Gateway</h3>
          <div className="text-2xl font-black text-emerald-400">Online</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Uptime: 99.98% | Port 8000</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">Redis Stream Ingestion</h3>
          <div className="text-2xl font-black text-blue-400">Active (30 FPS)</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Queue Latency: 4ms</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">TimescaleDB Cluster</h3>
          <div className="text-2xl font-black text-emerald-400">Healthy</div>
          <p className="text-xs text-slate-400 mt-1 font-mono">2.45 TB / 5.00 TB</p>
        </div>
      </div>
    </div>
  );
}

function AuditReportsTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText size={20} className="text-amber-400" /> AUDIT LOGS & REPORTS
        </h1>
        <p className="text-xs text-slate-400">System audit trails, JWT login events, and role access logs.</p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="pb-2">Timestamp</th>
              <th className="pb-2">User / Role</th>
              <th className="pb-2">Event Action</th>
              <th className="pb-2">Target Resource</th>
              <th className="pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {[
              { time: '10:24:12 AM', user: 'admin@cams.ai (Admin)', action: 'System Config Update', target: 'FastAPI Stream Router', status: 'SUCCESS' },
              { time: '10:18:05 AM', user: 'store.manager@cams.ai (Store Manager)', action: 'Store Select: Store 01', target: 'Multi-Tenant View', status: 'SUCCESS' },
              { time: '10:15:30 AM', user: 'analyst@cams.ai (Analyst)', action: 'Export Heatmap PDF', target: '2D Homography Matrix', status: 'SUCCESS' },
              { time: '10:02:11 AM', user: 'marketing@cams.ai (Marketing)', action: 'Campaign Lift Query', target: 'Promo Endcap #4', status: 'SUCCESS' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/40">
                <td className="py-2.5 font-mono text-slate-400">{row.time}</td>
                <td className="py-2.5 font-bold text-white">{row.user}</td>
                <td className="py-2.5 text-slate-300">{row.action}</td>
                <td className="py-2.5 text-blue-400 font-mono">{row.target}</td>
                <td className="py-2.5 text-right font-bold text-emerald-400">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemSettingsTab() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings size={20} className="text-blue-400" /> SYSTEM SETTINGS & SECURITY
        </h1>
        <p className="text-xs text-slate-400">Configure multi-tenant boundaries, JWT token expiration, API rate limits, and security controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock size={16} className="text-purple-400" /> Security & Authentication
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">JWT Secret Encryption Standard</label>
              <input type="text" value="HS256 (256-bit RSA Signature)" disabled className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-300 font-mono" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Access Token Expiration (Minutes)</label>
              <input type="number" defaultValue={60} className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-white font-mono" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300 font-semibold">Enforce Role-Based Access Isolation</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/30">ENABLED</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw size={16} className="text-emerald-400" /> Stream Processing & AI Inferencing
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">YOLOv8 Detection Confidence Threshold</label>
              <input type="text" value="0.75 (75% Minimum Confidence)" disabled className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-300 font-mono" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">ByteTrack Max Cosine Distance</label>
              <input type="text" value="0.2 (Tight Identity Lock)" disabled className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-300 font-mono" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300 font-semibold">Live OpenCV WebSockets Stream</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/30">30 FPS ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Component ───────────────────────────────────────────────────

export default function AdminDashboardView({ activeTab }) {
  return (
    <div className="p-6 text-slate-200">
      {activeTab === 'overview'  && <AdminOverviewTab />}
      {activeTab === 'cameras'   && <FleetCamerasTab />}
      {activeTab === 'system'    && <SystemHealthTab />}
      {activeTab === 'reports'   && <AuditReportsTab />}
      {activeTab === 'settings'  && <SystemSettingsTab />}
    </div>
  );
}
