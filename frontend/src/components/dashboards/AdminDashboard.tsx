import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ShieldCheck, Cpu, HardDrive, Server, Activity, Users, Camera, Key, FileText, CheckCircle2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.getAdminDashboard('STORE-812')
      .then((res) => { if (mounted) setData(res); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading Administrator System Telemetry & Audit Logs...
      </div>
    );
  }

  const { system_status, users_by_role, camera_status, infrastructure, api_performance, security_metrics, audit_logs } = data;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Infrastructure Health Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Platform Uptime</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{system_status.uptime_percent}%</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">Status: {system_status.status}</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">CPU Utilization</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{infrastructure.cpu_percent}%</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Memory: {infrastructure.memory_percent}%</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">GPU Acceleration</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{infrastructure.gpu_utilization_percent}%</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">OpenCV / PyTorch Core</div>
        </div>

        <div className="bi-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Avg API Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{system_status.avg_response_time_ms}ms</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">24h Requests: {system_status.total_api_requests_24h.toLocaleString()}</div>
        </div>
      </div>

      {/* API Request Volume & Latency Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Latency Line */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">API Latency Response Time (ms)</h3>
            <span className="text-xs text-slate-400">Target: &lt; 25ms</span>
          </div>
          <div className="bi-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={api_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="latency_ms" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Users by Role Pie */}
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Platform RBAC Users by Role</h3>
            <span className="text-xs text-slate-400">Total: 44 Active Users</span>
          </div>
          <div className="bi-card-body h-64 flex items-center">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={users_by_role} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={40} outerRadius={75}>
                  {users_by_role.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-45% space-y-2 text-xs">
              {users_by_role.map((u: any, idx: number) => (
                <div key={u.role} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-slate-300 font-medium">{u.role}</span>
                  </div>
                  <span className="text-white font-semibold">{u.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Metrics & System Event Audit Logs */}
      <div className="bi-card">
        <div className="bi-card-header">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">System Audit & Access Logs</h3>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {security_metrics.successful_logins_24h} Logins Verified
          </span>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Endpoint / Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {audit_logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-all">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="px-4 py-3 font-semibold text-white">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{log.endpoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
