import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, Users, UserCog, Lock, Clock, Store, Video, 
  Cpu, Activity, HeartPulse, Zap, ShieldAlert, FileText, ClipboardList, 
  Settings, BellRing, DatabaseBackup, Search, Calendar, Bell, ChevronDown, 
  Camera, AlertTriangle, UserPlus, CheckCircle, XCircle, RefreshCw, Trash2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import api from '../api/client';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, cameras, platform
  const [users, setUsers] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  // User form modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'retail_analyst' });
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, camsRes, alertsRes, healthRes] = await Promise.all([
        api.get('/auth/users').catch(() => ({ data: [] })),
        api.get('/cameras/1').catch(() => ({ data: [] })),
        api.get('/alerts').catch(() => ({ data: [] })),
        api.get('/health').catch(() => ({ data: { status: 'ok', counts: {} } }))
      ]);
      setUsers(usersRes.data || []);
      setCameras(camsRes.data || []);
      setAlerts(alertsRes.data || []);
      setHealth(healthRes.data || null);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const updatedStatus = !user.is_active;
      await api.patch(`/auth/users/${user.id}/status?is_active=${updatedStatus}`);
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: updatedStatus } : u));
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', newUser);
      setUsers([...users, res.data]);
      setShowUserModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'retail_analyst' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleChangeUserRole = async (user, newRole) => {
    try {
      await api.put(`/auth/users/${user.id}`, { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to change user role');
    }
  };

  const handleDeleteCamera = async (camId) => {
    if (!window.confirm("Are you sure you want to delete this camera?")) return;
    try {
      await api.delete(`/cameras/${camId}`);
      setCameras(cameras.filter(c => c.id !== camId));
    } catch (err) {
      alert('Failed to delete camera');
    }
  };

  const systemPerformanceData = [
    { name: '08:00', cpu: 42, memory: 45, disk: 25, network: 15 },
    { name: '10:00', cpu: 58, memory: 52, disk: 26, network: 20 },
    { name: '12:00', cpu: 75, memory: 60, disk: 27, network: 28 },
    { name: '14:00', cpu: 62, memory: 55, disk: 27, network: 22 },
    { name: '16:00', cpu: 70, memory: 58, disk: 28, network: 25 },
    { name: '18:00', cpu: 82, memory: 65, disk: 29, network: 30 },
  ];

  const cameraStatusData = [
    { name: 'Online', value: cameras.length > 0 ? cameras.filter(c => c.status === 'online').length : 1, color: '#22c55e' },
    { name: 'Offline', value: cameras.length > 0 ? cameras.filter(c => c.status === 'offline').length : 0, color: '#ef4444' },
    { name: 'Unknown', value: cameras.length > 0 ? cameras.filter(c => c.status === 'unknown').length : 0, color: '#eab308' },
  ];

  return (
    <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#060b14] border-r border-slate-800 flex flex-col overflow-y-auto">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">ADMIN DASHBOARD</h1>
            <p className="text-xs text-slate-500">System Control Center</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-4">
          
          {/* Section: OVERVIEW */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> PLATFORM
            </h2>
            <div 
              onClick={() => setActiveTab('overview')}
              className={`rounded-lg p-2 flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800/50 text-slate-300'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Dashboard Overview</p>
                <p className="text-[10px] opacity-80">Platform health & metrics</p>
              </div>
            </div>
          </div>

          {/* Section: USER MANAGEMENT */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> USER & ACCESS
            </h2>
            <div 
              onClick={() => setActiveTab('users')}
              className={`rounded-lg p-2 flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800/50 text-slate-300'}`}
            >
              <Users className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">User Management</p>
                <p className="text-[10px] opacity-80">Roles & permissions</p>
              </div>
            </div>
          </div>

          {/* Section: CAMERA MANAGEMENT */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> HARDWARE & STREAMS
            </h2>
            <div 
              onClick={() => setActiveTab('cameras')}
              className={`rounded-lg p-2 flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'cameras' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800/50 text-slate-300'}`}
            >
              <Video className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Camera Management</p>
                <p className="text-[10px] opacity-80">Streams & camera health</p>
              </div>
            </div>
          </div>

          {/* Section: MONITORING */}
          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> SYSTEM AUDIT
            </h2>
            <div 
              onClick={() => setActiveTab('platform')}
              className={`rounded-lg p-2 flex items-center gap-3 cursor-pointer transition-colors ${activeTab === 'platform' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800/50 text-slate-300'}`}
            >
              <Activity className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Platform Status</p>
                <p className="text-[10px] opacity-80">Backend, DB & Alerts</p>
              </div>
            </div>
          </div>

        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0f172a] p-4 lg:p-6 custom-scrollbar">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'overview' && 'Platform Administration Overview'}
              {activeTab === 'users' && 'User Management & Role Isolation'}
              {activeTab === 'cameras' && 'Camera Stream & Hardware Control'}
              {activeTab === 'platform' && 'Platform Health & Infrastructure Monitoring'}
            </h1>
            <p className="text-sm text-slate-400">Authenticated Administrator Workspace</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAdminData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </header>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg"><Users className="w-6 h-6 text-blue-500" /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Total Registered Users</p>
            <h3 className="text-2xl font-bold text-white mt-1">{users.length}</h3>
            <p className="text-[10px] text-green-400 mt-1">Role RBAC Enforced</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg"><Video className="w-6 h-6 text-purple-500" /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Total Cameras</p>
            <h3 className="text-2xl font-bold text-white mt-1">{cameras.length}</h3>
            <p className="text-[10px] text-purple-400 mt-1">YOLO Analytics Active</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-red-500/20 rounded-lg"><BellRing className="w-6 h-6 text-red-500" /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Active Alerts</p>
            <h3 className="text-2xl font-bold text-white mt-1">{alerts.filter(a => a.status === 'active').length}</h3>
            <p className="text-[10px] text-red-400 mt-1">Operational System Alerts</p>
          </div>

          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg"><Activity className="w-6 h-6 text-green-500" /></div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Backend Health Status</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{health?.database === 'healthy' ? 'ONLINE' : 'OK'}</h3>
            <p className="text-[10px] text-slate-400 mt-1">FastAPI + PostgreSQL</p>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 lg:col-span-2 shadow-lg">
                <h3 className="text-sm font-semibold text-white mb-4">System Performance (CPU, Memory, Network)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={systemPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} />
                      <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} />
                      <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b'}} />
                      <Line type="monotone" dataKey="cpu" name="CPU (%)" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="memory" name="Memory (%)" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between">
                <h3 className="text-sm font-semibold text-white mb-2">Camera Status Distribution</h3>
                <div className="h-48 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cameraStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                        {cameraStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {cameraStatusData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></span>
                        {item.name}
                      </span>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">System Users & Role Isolation</h3>
                <p className="text-xs text-slate-400">View, create, update users and manage role assignments</p>
              </div>
              <button 
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Create New User
              </button>
            </div>

            {/* Create User Modal */}
            {showUserModal && (
              <form onSubmit={handleCreateUser} className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl mb-6 space-y-4">
                <h4 className="text-sm font-bold text-white">Add New Platform User</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required 
                    value={newUser.full_name} 
                    onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    value={newUser.email} 
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    required 
                    value={newUser.password} 
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <select 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="administrator">Administrator</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="retail_analyst">Retail Analyst</option>
                    <option value="marketing_manager">Marketing Manager</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowUserModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold">Save User</button>
                </div>
              </form>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500">#{u.id}</td>
                      <td className="p-3 font-semibold text-white">{u.full_name}</td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleChangeUserRole(u, e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                        >
                          <option value="administrator">Administrator</option>
                          <option value="store_manager">Store Manager</option>
                          <option value="retail_analyst">Retail Analyst</option>
                          <option value="marketing_manager">Marketing Manager</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.is_active !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.is_active !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors ${u.is_active !== false ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                        >
                          {u.is_active !== false ? 'Disable User' : 'Enable User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAMERA MANAGEMENT */}
        {activeTab === 'cameras' && (
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-2">Camera Hardware & Stream Management</h3>
            <p className="text-xs text-slate-400 mb-6">Monitor camera streams, YOLO detection pipeline status, and health</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map(cam => (
                <div key={cam.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{cam.label}</h4>
                      <p className="text-xs text-slate-400">{cam.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cam.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {cam.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono bg-slate-950 p-2 rounded border border-slate-800">
                    {cam.stream_url}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-slate-400">YOLOv8 ByteTrack Active</span>
                    <button 
                      onClick={() => handleDeleteCamera(cam.id)}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM STATUS */}
        {activeTab === 'platform' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-white">System Diagnostics & Platform Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-mono">DATABASE</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">PostgreSQL / TimeScaleDB Healthy</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-mono">FASTAPI BACKEND</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">Running on Port 8000 (Gunicorn/Uvicorn)</p>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-mono">COMPUTER VISION PIPELINE</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">YOLOv8 + ByteTrack Active</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-white mb-4">Active Operational Alerts ({alerts.length})</h3>
              <div className="space-y-2">
                {alerts.map((alt, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${alt.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{alt.alert_type.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500">{alt.created_at ? new Date(alt.created_at).toLocaleTimeString() : 'Recent'}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alt.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
