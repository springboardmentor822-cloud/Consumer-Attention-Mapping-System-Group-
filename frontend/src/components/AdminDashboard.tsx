import React, { useState, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, RefreshCw, AlertTriangle, UserPlus, Server, Monitor, Play, ShieldAlert } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

interface UserItem {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface SecurityLogItem {
  action: string;
  timestamp: string;
  user_email: string;
  details: string;
}

interface AuditLogItem {
  action: string;
  timestamp: string;
  details: string;
}

interface CameraHealth {
  online_count: number;
  offline_count: number;
  recording_status: string;
}

interface Kpis {
  total_users: number;
  total_stores: number;
  total_cameras: number;
  api_requests_count: number;
}

interface AdminDashboardData {
  kpis: Kpis;
  camera_health: CameraHealth;
  users: UserItem[];
  security_logs: SecurityLogItem[];
  audit_logs: AuditLogItem[];
}

interface CpuHistoryPoint {
  time: string;
  CPU: number;
  GPU: number;
  RAM: number;
  Database: number;
}

interface AdminDashboardProps {
  storeId?: string;
  token: string | null;
  section?: string;
}

export default function AdminDashboard({ token, section = 'overview' }: AdminDashboardProps) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cpuHistory, setCpuHistory] = useState<CpuHistoryPoint[]>([]);
  
  // Camera form state
  const [camName, setCamName] = useState<string>("");
  const [camUrl, setCamUrl] = useState<string>("");
  const [camZone, setCamZone] = useState<string | number>(1);
  const [camStore, setCamStore] = useState<string>("flagship-store-001");
  const [submittingCam, setSubmittingCam] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load admin controls");
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
    const interval = setInterval(fetchDashboardData, 15000);

    const history: CpuHistoryPoint[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5000);
      history.push({
        time: t.toLocaleTimeString(),
        CPU: Math.floor(15 + Math.random() * 25),
        GPU: Math.floor(25 + Math.random() * 15),
        RAM: 48,
        Database: Math.floor(5 + Math.random() * 5)
      });
    }
    setCpuHistory(history);

    const monitorTick = setInterval(() => {
      setCpuHistory(prev => {
        const next = [...prev];
        next.shift();
        next.push({
          time: new Date().toLocaleTimeString(),
          CPU: Math.floor(15 + Math.random() * 25),
          GPU: Math.floor(25 + Math.random() * 15),
          RAM: 48,
          Database: Math.floor(5 + Math.random() * 5)
        });
        return next;
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(monitorTick);
    };
  }, []);

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      fetchDashboardData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName || !camUrl) return;
    setSubmittingCam(true);
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/admin/cameras`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: camName,
          store_id: camStore,
          rtsp_url: camUrl,
          zone_id: Number(camZone)
        })
      });
      if (!res.ok) throw new Error("Failed to register hardware");
      setCamName("");
      setCamUrl("");
      fetchDashboardData();
      alert("Camera registered successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingCam(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-100 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500 w-10 h-10" />
      <p className="text-slate-400 text-xs font-semibold">Synchronizing System Controls...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-100 p-4">
      <AlertTriangle className="text-rose-500 w-12 h-12 mb-3" />
      <h2 className="text-sm font-bold uppercase tracking-wider">Terminal Offline</h2>
      <p className="text-slate-500 text-xs mt-1">{error || "Connection failure"}</p>
    </div>
  );

  const kpis = data.kpis;
  const health = data.camera_health;
  
  const cameraPieData = [
    { name: 'Online', value: health.online_count },
    { name: 'Offline', value: health.offline_count }
  ];

  const userDistributionData = [
    { name: 'Store Manager', value: 56 },
    { name: 'Retail Analyst', value: 32 },
    { name: 'Marketing Manager', value: 22 },
    { name: 'Administrator', value: 12 }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Monolithic page */}
      {section === 'overview' && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Stores", val: kpis.total_stores, change: "+7.69%", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { label: "Total Users", val: kpis.total_users, change: "+8.33%", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { label: "Total Cameras", val: kpis.total_cameras, change: "+5.41%", color: "text-emerald-450", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Cameras Online", val: health.online_count, change: "88.46%", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { label: "System Uptime", val: "99.85%", change: "+0.32%", color: "text-rose-450", bg: "bg-rose-500/10", border: "border-rose-500/20" },
              { label: "Active Alerts", val: "12", change: "-14.29%", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" }
            ].map((kpi, idx) => (
              <div key={idx} className={`bg-[#0d0d15] border ${kpi.border} p-4 rounded-xl flex flex-col justify-between shadow-md`}>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{kpi.label}</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-200">{kpi.val}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${kpi.bg} ${kpi.color}`}>{kpi.change}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* System Performance */}
            <div className="lg:col-span-8 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">System Performance (Last 7 Days)</span>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cpuHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Line type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="GPU" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Camera Status Overview */}
            <div className="lg:col-span-4 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Camera Status Overview</span>
              <div className="h-64 mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cameraPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} label>
                      {cameraPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* API Performance */}
            <div className="lg:col-span-6 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">API Performance (Average Response Time)</span>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cpuHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Database" stroke="#8b5cf6" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Distribution by Role */}
            <div className="lg:col-span-6 bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">User Distribution by Role</span>
              <div className="h-52 mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} label>
                      {userDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone sections */}
      {section === 'users' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Registered User Management</span>
          <div className="overflow-x-auto text-xs font-semibold text-slate-350">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 uppercase tracking-wider text-[9px] text-slate-500">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">System Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 font-mono text-[10px] text-slate-500">{u.id.substring(0, 16)}...</td>
                    <td className="py-3 text-slate-200">{u.email}</td>
                    <td className="py-3">{u.role}</td>
                    <td className="py-3">{u.is_active ? 'Active' : 'Disabled'}</td>
                    <td className="py-3">
                      <button onClick={() => handleToggleUser(u.id, u.is_active)} className="text-indigo-400 hover:text-indigo-300">Toggle Status</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'cameras' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-indigo-400" /> Link Camera Hardware Stream
          </h2>
          <form onSubmit={handleAddCamera} className="space-y-4 text-xs max-w-md">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">Device/Camera Name</label>
              <input type="text" value={camName} onChange={(e) => setCamName(e.target.value)} placeholder="e.g. Aisle 3 Rear Cam" className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200" required />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">RTSP / File Stream URL</label>
              <input type="text" value={camUrl} onChange={(e) => setCamUrl(e.target.value)} placeholder="rtsp://admin:pwd@192.168.1.50/live" className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200" required />
            </div>
            <button type="submit" disabled={submittingCam} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded transition-colors w-full">Register Stream Device</button>
          </form>
        </div>
      )}

      {section === 'monitoring' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">System Load Monitor</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Line type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={2.5} />
                <Line type="monotone" dataKey="GPU" stroke="#ef4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {section === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Security logs</span>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.security_logs.map((log, idx) => (
                <div key={idx} className="bg-[#16161f] border border-slate-800 p-2.5 rounded text-[11px] leading-relaxed">
                  <div className="flex justify-between text-indigo-400 font-semibold mb-1">
                    <span>{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-305">{log.user_email} ➔ {log.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Audit logs</span>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.audit_logs.map((log, idx) => (
                <div key={idx} className="bg-[#16161f] border border-slate-800 p-2.5 rounded text-[11px] leading-relaxed">
                  <div className="flex justify-between text-emerald-450 font-semibold mb-1">
                    <span>{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-305">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
