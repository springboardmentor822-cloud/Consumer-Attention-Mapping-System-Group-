import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Camera,
  Server,
  Activity,
  AlertTriangle,
  Lock,
  Clock,
  Terminal,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Key,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { mockDashboardData } from '../services/mockDashboardData';

export default function AdminDashboard() {
  const data = mockDashboardData.administrator;
  const storeData = mockDashboardData.storeManager;
  const [activeTab, setActiveTab] = useState('overview');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" /> Platform Administrator Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete platform management: User permissions, camera hardware diagnostics, system infrastructure performance, and security audit logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
          </span>
          <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
            Uptime: <strong>99.85%</strong>
          </span>
        </div>
      </div>

      {/* 1. Section: KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Total Users"
          value={data.kpis.totalUsers.value}
          change={data.kpis.totalUsers.change}
          isPositive={true}
          icon={Users}
          color="indigo"
        />
        <KpiCard
          title="Total Stores"
          value={data.kpis.totalStores.value}
          change={data.kpis.totalStores.change}
          isPositive={true}
          icon={Store}
          color="emerald"
        />
        <KpiCard
          title="Total Cameras"
          value={data.kpis.totalCameras.value}
          change={data.kpis.totalCameras.change}
          isPositive={true}
          icon={Camera}
          color="blue"
        />
        <KpiCard
          title="Cameras Online"
          value={data.kpis.camerasOnline.value}
          subtext={data.kpis.camerasOnline.detail}
          isPositive={true}
          icon={Activity}
          color="emerald"
        />
        <KpiCard
          title="System Uptime"
          value={data.kpis.systemUptime.value}
          change={data.kpis.systemUptime.change}
          isPositive={true}
          icon={Server}
          color="violet"
        />
        <KpiCard
          title="Active Alerts"
          value={data.kpis.activeAlerts.value}
          change={data.kpis.activeAlerts.change}
          isPositive={false}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* 2. Section: Infrastructure Hardware Performance & Camera Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">System Infrastructure Load (CPU, Memory, Disk, Network)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.infrastructure.systemPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="cpu" name="CPU Usage %" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="memory" name="Memory %" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="disk" name="Disk %" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="network" name="Network I/O" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Camera Status Overview</h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.cameraMonitoring.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {data.cameraMonitoring.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Section: User Management Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <div>
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" /> User Management & Store Assignments
            </h4>
            <p className="text-xs text-slate-400">Manage account access, roles, and status.</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all">
            <Plus className="h-4 w-4" /> Add New User
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Store</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data.userAnalytics.userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/50">
                  <td className="p-3">
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-[11px] text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-indigo-300 border border-indigo-500/20 font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">{user.store}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{user.lastLogin}</td>
                  <td className="p-3 text-right space-x-2">
                    <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
                      <Key className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Section: Security Logs & System Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4">Security Analytics (Login Attempts vs Failed)</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.security.logins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="successful" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Failed Logins" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" /> System Audit History Feed
          </h4>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {data.security.auditLogs.map((log) => (
              <div key={log.id} className="rounded border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-semibold">
                    {log.category}
                  </span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">@{log.user}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
