import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ShieldCheck, Cpu, Activity, Server, FileText, Trash2, UserX, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const fetchUsers = () => {
    setLoadingUsers(true);
    api.getUsers()
      .then((res) => setUsers(res))
      .catch((err) => console.error(err))
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    api.getAdminDashboard('STORE-812').then((res) => setData(res));
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove user ${email}?`)) {
      try {
        await api.deleteUser(userId);
        setActionStatus(`User ${email} permanently deleted from PostgreSQL database.`);
        fetchUsers();
        setTimeout(() => setActionStatus(null), 4000);
      } catch (e) {
        setActionStatus(`Failed to delete user ${email}.`);
      }
    }
  };

  const handlePurgeUnauthorized = async () => {
    try {
      const res = await api.purgeUnauthorizedUsers();
      setActionStatus(res.message);
      fetchUsers();
      setTimeout(() => setActionStatus(null), 4000);
    } catch (e) {
      setActionStatus("Failed to purge unauthorized accounts.");
    }
  };

  if (!data) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Platform Administration...</div>;

  const { system_status, infrastructure, api_performance, audit_logs } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Platform Administration & System Security Control</h2>
          <p className="text-xs text-slate-400">Employee account management, unauthorized user removal, infrastructure telemetry, and audit logs</p>
        </div>
        <div className="text-xs font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-500 px-3 py-1.5 rounded-xl">
          Uptime: {system_status.uptime_percent}% ({system_status.status})
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionStatus && (
        <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-300 font-extrabold text-xs p-4 rounded-xl flex items-center space-x-3 shadow-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionStatus}</span>
        </div>
      )}

      {/* Employee & User Account Management Section */}
      <div className="bi-card">
        <div className="bi-card-header flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserX className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Authorized Employee & Access Control Registry</h3>
              <p className="text-[11px] text-slate-400 font-medium">Remove unauthorized users or delete inactive employee accounts</p>
            </div>
          </div>
          <button
            onClick={handlePurgeUnauthorized}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all border border-rose-400 shadow flex items-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Purge Unauthorized Accounts</span>
          </button>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Store ID</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{u.id}</td>
                  <td className="px-4 py-3 font-bold text-white">{u.full_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{u.store_id}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="px-3 py-1 bg-rose-950 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] rounded-lg transition-all border border-rose-500 flex items-center space-x-1 ml-auto"
                      title="Delete / Remove User Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure KPI Telemetry Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bi-card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">CPU Usage</div>
          <div className="text-2xl font-extrabold text-white">{infrastructure.cpu_percent}%</div>
        </div>
        <div className="bi-card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Memory Usage</div>
          <div className="text-2xl font-extrabold text-white">{infrastructure.memory_percent}%</div>
        </div>
        <div className="bi-card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">GPU Acceleration</div>
          <div className="text-2xl font-extrabold text-white">{infrastructure.gpu_utilization_percent}%</div>
        </div>
        <div className="bi-card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Avg Latency</div>
          <div className="text-2xl font-extrabold text-emerald-400">{system_status.avg_response_time_ms}ms</div>
        </div>
      </div>

      {/* API Latency Chart */}
      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">API Latency Response Times (ms)</h3>
        </div>
        <div className="bi-card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={api_performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="latency_ms" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Audit & Access Logs */}
      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">Real-Time System Login & Security Audit Logs</h3>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {audit_logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="px-4 py-3 font-bold text-white">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500">
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
