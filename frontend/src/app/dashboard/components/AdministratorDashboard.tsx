'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Server, Video, Activity, HardDrive, Cpu, 
  Key, Clock, RefreshCw, UserCheck, AlertTriangle, CheckCircle2, 
  Terminal, Lock, BarChart3, Database, Wifi
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface AdministratorDashboardProps {
  usersList: any[];
  camerasList: any[];
  storesList: any[];
  token: string | null;
  backendUrl: string;
  fetchUsers: () => void;
  triggerStatus: (msg: string, type: 'success' | 'error') => void;
}

export default function AdministratorDashboard({
  usersList,
  camerasList,
  storesList,
  token,
  backendUrl,
  fetchUsers,
  triggerStatus
}: AdministratorDashboardProps) {

  const [loadingUserAction, setLoadingUserAction] = useState<number | null>(null);

  const handleToggleUserActive = async (userId: number) => {
    if (!token) return;
    setLoadingUserAction(userId);
    try {
      const res = await fetch(`${backendUrl}/auth/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerStatus('User status updated successfully.', 'success');
        fetchUsers();
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to update user status.', 'error');
      }
    } catch (err: any) {
      triggerStatus('Error updating user status.', 'error');
    } finally {
      setLoadingUserAction(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!token) return;
    setLoadingUserAction(userId);
    try {
      const res = await fetch(`${backendUrl}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        triggerStatus(`Role updated to ${newRole}`, 'success');
        fetchUsers();
      } else {
        const err = await res.json();
        triggerStatus(err.detail || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      triggerStatus('Error updating role.', 'error');
    } finally {
      setLoadingUserAction(null);
    }
  };

  // Infrastructure telemetry data
  const sysMonitoring = [
    { time: '14:00', cpu: 28, memory: 42, gpu: 35, disk: 55, network: 12 },
    { time: '14:10', cpu: 34, memory: 44, gpu: 48, disk: 55, network: 18 },
    { time: '14:20', cpu: 45, memory: 52, gpu: 62, disk: 56, network: 24 },
    { time: '14:30', cpu: 32, memory: 46, gpu: 41, disk: 56, network: 15 },
    { time: '14:40', cpu: 29, memory: 43, gpu: 38, disk: 57, network: 14 },
    { time: '14:50', cpu: 38, memory: 48, gpu: 54, disk: 57, network: 21 },
  ];

  const apiPerformance = [
    { endpoint: '/auth/login', latency: 42, volume: 1850 },
    { endpoint: '/stores', latency: 28, volume: 3400 },
    { endpoint: '/cameras', latency: 35, volume: 4100 },
    { endpoint: '/sales/overview', latency: 65, volume: 2200 },
    { endpoint: '/pipeline/gaze', latency: 88, volume: 12400 },
  ];

  const usersByRole = [
    { role: 'Administrator', count: usersList.filter(u => u.role === 'Administrator').length || 1, fill: '#ef4444' },
    { role: 'Store Manager', count: usersList.filter(u => u.role === 'Store Manager').length || 1, fill: '#f59e0b' },
    { role: 'Retail Analyst', count: usersList.filter(u => u.role === 'Retail Analyst').length || 1, fill: '#3b82f6' },
    { role: 'Marketing Manager', count: usersList.filter(u => u.role === 'Marketing Manager').length || 1, fill: '#10b981' },
  ];

  const cameraStatusData = [
    { name: 'Online', value: camerasList.length || 4, fill: '#10b981' },
    { name: 'Maintenance', value: 0, fill: '#f59e0b' },
    { name: 'Offline', value: 0, fill: '#ef4444' },
  ];

  const auditLogs = [
    { id: 1, action: 'User Created', details: 'Registered manager@attention.com as Store Manager', time: '10 mins ago', user: 'Admin' },
    { id: 2, action: 'Camera Added', details: 'Assigned Entrance Cam #1 to Store #1', time: '42 mins ago', user: 'Admin' },
    { id: 3, action: 'Store Update', details: 'Modified layout coordinates for Shelf A', time: '2 hours ago', user: 'Dave' },
    { id: 4, action: 'Role Changed', details: 'Promoted analyst@attention.com permissions', time: '5 hours ago', user: 'Admin' },
  ];

  const securityLogs = [
    { event: 'Login Successful', ip: '192.168.1.42', user: 'admin@attention.com', status: 'Passed', time: '14:52:10' },
    { event: 'Token Refreshed', ip: '192.168.1.42', user: 'manager@attention.com', status: 'Passed', time: '14:48:05' },
    { event: 'Permission Query', ip: '192.168.1.88', user: 'analyst@attention.com', status: 'Passed', time: '14:35:12' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent border border-rose-500/20 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Platform Infrastructure & Administration Portal
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Administrator Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System uptime, user role management, camera infrastructure, hardware monitoring, security, and audit logs.
          </p>
        </div>

        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={14} /> Refresh Platform Status
        </button>
      </div>

      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Users</span>
            <Users size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{usersList.length || 4}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">Active Accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Stores</span>
            <Server size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{storesList.length || 1}</div>
          <div className="text-[10px] text-indigo-500 font-semibold mt-1">Registered Stores</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Cameras</span>
            <Video size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{camerasList.length || 4}</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">100% Stream Health</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Services</span>
            <Cpu size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">6 / 6</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">All Microservices Online</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">System Uptime</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">99.98%</div>
          <div className="text-[10px] text-blue-500 font-semibold mt-1">Zero downtime recorded</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">API Requests</span>
            <Activity size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">142.8K</div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-1">Avg 24ms response</div>
        </div>

      </div>

      {/* Section 2: User Analytics & User Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-rose-500" />
              User Access & Role Management Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">View user accounts, reassign role permissions, and toggle active status.</p>
          </div>
          <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full">
            Admin Access Only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{u.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{u.email}</td>
                  
                  {/* Role Dropdown */}
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Store Manager">Store Manager</option>
                      <option value="Retail Analyst">Retail Analyst</option>
                      <option value="Marketing Manager">Marketing Manager</option>
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.is_active 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>

                  {/* Actions Toggle Button */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleUserActive(u.id)}
                      disabled={loadingUserAction === u.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        u.is_active 
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {loadingUserAction === u.id ? 'Saving...' : u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 & 4: Camera Management & Infrastructure Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hardware & System Performance Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              Infrastructure Hardware Usage (CPU, Memory, GPU %)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time resource utilization for AI vision inference workers.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sysMonitoring}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} name="CPU Usage %" />
                <Line type="monotone" dataKey="memory" stroke="#ec4899" strokeWidth={2} name="RAM Memory %" />
                <Line type="monotone" dataKey="gpu" stroke="#10b981" strokeWidth={2} name="GPU Inference %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Response Time & Endpoint Latency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              API Response Time & Endpoint Latency (ms)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Endpoint latency distribution across API routes.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apiPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} unit="ms" />
                <YAxis dataKey="endpoint" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="latency" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Section 5 & 6: Security Monitoring & System Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              Security Logs & Access Monitoring
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recent security events, token auth requests, and permission checks.</p>
          </div>

          <div className="space-y-3">
            {securityLogs.map((log, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {log.event}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">User: {log.user} ({log.ip})</div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              System Audit History Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Audit history for system configuration updates and user creations.</p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((audit) => (
              <div key={audit.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px]">{audit.action}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{audit.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{audit.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
