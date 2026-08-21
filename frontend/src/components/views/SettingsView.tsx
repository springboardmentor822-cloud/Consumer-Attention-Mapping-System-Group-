import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Video, Users, Bell, Store, Save, 
  CheckCircle, Shield, RefreshCw, Plus, Trash2, Key, Sliders, Monitor
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'camera' | 'users' | 'notifications'>('store');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Store Settings State
  const [storeName, setStoreName] = useState('Parvath Retail Main Supermarket');
  const [storeId, setStoreId] = useState('STORE-812');
  const [storeWidth, setStoreWidth] = useState('25.0');
  const [storeLength, setStoreLength] = useState('40.0');
  const [gridSize, setGridSize] = useState('0.5');

  // Camera Settings State
  const [cameras, setCameras] = useState([
    { id: 'CAM-01', name: '1. Entrance Main Overview', ip: '192.168.1.101', res: '1920x1080', fps: '30', status: 'ONLINE' },
    { id: 'CAM-02', name: '2. Aisle A Eye-Level', ip: '192.168.1.102', res: '1920x1080', fps: '30', status: 'ONLINE' },
    { id: 'CAM-03', name: '3. Aisle B Shelf Section', ip: '192.168.1.103', res: '1920x1080', fps: '30', status: 'ONLINE' },
    { id: 'CAM-04', name: '4. Promotion Area Endcap', ip: '192.168.1.104', res: '1920x1080', fps: '30', status: 'ONLINE' },
    { id: 'CAM-05', name: '5. Checkout Counter Lane 1-4', ip: '192.168.1.105', res: '1920x1080', fps: '30', status: 'ONLINE' },
    { id: 'CAM-06', name: '6. Store Exit Gate Area', ip: '192.168.1.106', res: '1920x1080', fps: '30', status: 'ONLINE' },
  ]);

  // User Accounts State (Official Authorized Accounts)
  const [users, setUsers] = useState([
    { id: 'USR-001', name: 'Parvathraj', email: 'admin@retail.com', role: 'Administrator', status: 'ACTIVE' },
    { id: 'USR-002', name: 'Lathashree', email: 'manager@retail.com', role: 'Store Manager', status: 'ACTIVE' },
    { id: 'USR-003', name: 'Monika', email: 'marketing@retail.com', role: 'Marketing Manager', status: 'ACTIVE' },
    { id: 'USR-004', name: 'Vivek Prasad', email: 'analyst@retail.com', role: 'Retail Analyst', status: 'ACTIVE' },
  ]);

  // Notification Thresholds
  const [crowdThreshold, setCrowdThreshold] = useState('12');
  const [shelfAttentionMin, setShelfAttentionMin] = useState('5');
  const [checkoutQueueMax, setCheckoutQueueMax] = useState('6');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [wsAlerts, setWsAlerts] = useState(true);

  const handleSave = (sectionName: string) => {
    setSavedSuccess(`${sectionName} configurations saved and applied to system!`);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const handleToggleUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-950 border border-indigo-500/50 rounded-xl">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Store & System Settings</h1>
            <p className="text-xs text-slate-400">Manage store floor parameters, camera RTSP links, authorized users, and alert thresholds</p>
          </div>
        </div>

        {/* Quick Save Feedback Banner */}
        {savedSuccess && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 animate-bounce">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('store')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 border ${
            activeSubTab === 'store'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg'
              : 'bg-[#0f172a] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>🏪 Store Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('camera')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 border ${
            activeSubTab === 'camera'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
              : 'bg-[#0f172a] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>📹 Camera Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 border ${
            activeSubTab === 'users'
              ? 'bg-amber-600 text-white border-amber-400 shadow-lg'
              : 'bg-[#0f172a] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👤 User Management</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 border ${
            activeSubTab === 'notifications'
              ? 'bg-rose-600 text-white border-rose-400 shadow-lg'
              : 'bg-[#0f172a] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>🔔 Notification Settings</span>
        </button>
      </div>

      {/* SUB-TAB 1: STORE SETTINGS */}
      {activeSubTab === 'store' && (
        <div className="bi-card">
          <div className="bi-card-header">
            <div className="flex items-center space-x-2">
              <Store className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm text-white">Store Parameters & Map Dimensions</h3>
            </div>
            <button
              onClick={() => handleSave('Store Settings')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Configuration</span>
            </button>
          </div>

          <div className="bi-card-body grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
            <div className="space-y-4 bg-[#090d16] p-5 rounded-xl border border-slate-800">
              <h4 className="text-indigo-300 uppercase tracking-wider text-[11px]">Basic Information</h4>
              
              <div className="space-y-1">
                <label className="text-slate-300">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Store ID</label>
                <input
                  type="text"
                  value={storeId}
                  disabled
                  className="w-full bg-[#0f172a]/50 border border-slate-800 px-3.5 py-2 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4 bg-[#090d16] p-5 rounded-xl border border-slate-800">
              <h4 className="text-emerald-300 uppercase tracking-wider text-[11px]">Store Grid & Dimensions (Meters)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300">Store Width (Meters)</label>
                  <input
                    type="text"
                    value={storeWidth}
                    onChange={(e) => setStoreWidth(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300">Store Length (Meters)</label>
                  <input
                    type="text"
                    value={storeLength}
                    onChange={(e) => setStoreLength(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Heatmap Grid Resolution (Meters/Cell)</label>
                <input
                  type="text"
                  value={gridSize}
                  onChange={(e) => setGridSize(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CAMERA SETTINGS */}
      {activeSubTab === 'camera' && (
        <div className="bi-card">
          <div className="bi-card-header">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Camera RTSP Connections & Stream Quality</h3>
            </div>
            <button
              onClick={() => handleSave('Camera Settings')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Camera Feeds</span>
            </button>
          </div>

          <div className="bi-card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map((cam, idx) => (
                <div key={cam.id} className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-bold">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-white font-extrabold">{cam.name}</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-600/70 px-2 py-0.5 rounded text-[9px]">
                      {cam.status}
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="space-y-1">
                      <label className="text-slate-400">RTSP Stream IP</label>
                      <input
                        type="text"
                        value={cam.ip}
                        onChange={(e) => {
                          const updated = [...cameras];
                          updated[idx].ip = e.target.value;
                          setCameras(updated);
                        }}
                        className="w-full bg-[#0f172a] border border-slate-700 px-3 py-1.5 rounded-lg text-indigo-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Resolution:</span>
                      <span className="text-white">{cam.res}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Framerate:</span>
                      <span className="text-white">{cam.fps} FPS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bi-card">
          <div className="bi-card-header">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Authorized Role Accounts & RBAC Permissions</h3>
            </div>
            <button
              onClick={() => handleSave('User Management')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Update User Roles</span>
            </button>
          </div>

          <div className="bi-card-body space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-300">
                <thead>
                  <tr className="bg-[#162032] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="p-3">User ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Authorized Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition-all">
                      <td className="p-3 font-mono text-indigo-300">{u.id}</td>
                      <td className="p-3 font-extrabold text-white">{u.name}</td>
                      <td className="p-3 font-mono text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-600/60 px-2.5 py-1 rounded-lg">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] transition-all"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg transition-all"
                          title="Purge Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: NOTIFICATION SETTINGS */}
      {activeSubTab === 'notifications' && (
        <div className="bi-card">
          <div className="bi-card-header">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-rose-400" />
              <h3 className="font-extrabold text-sm text-white">Real-Time Operational Threshold Alerts</h3>
            </div>
            <button
              onClick={() => handleSave('Notification Settings')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Alert Thresholds</span>
            </button>
          </div>

          <div className="bi-card-body grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
            <div className="space-y-4 bg-[#090d16] p-5 rounded-xl border border-slate-800">
              <h4 className="text-rose-300 uppercase tracking-wider text-[11px]">Threshold Limits</h4>
              
              <div className="space-y-1">
                <label className="text-slate-300">High Crowd Threshold (Shopper Count)</label>
                <input
                  type="number"
                  value={crowdThreshold}
                  onChange={(e) => setCrowdThreshold(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Minimum Shelf Dwell Time Alert (Seconds)</label>
                <input
                  type="number"
                  value={shelfAttentionMin}
                  onChange={(e) => setShelfAttentionMin(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300">Max Checkout Queue Alert (Customers in Line)</label>
                <input
                  type="number"
                  value={checkoutQueueMax}
                  onChange={(e) => setCheckoutQueueMax(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-700 px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-4 bg-[#090d16] p-5 rounded-xl border border-slate-800">
              <h4 className="text-amber-300 uppercase tracking-wider text-[11px]">Notification Channels</h4>
              
              <div className="flex items-center justify-between p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                <div>
                  <div className="text-white font-extrabold">Real-Time WebSockets Alerts</div>
                  <div className="text-[11px] text-slate-400 font-normal">Push pop-up notifications to dashboard</div>
                </div>
                <input
                  type="checkbox"
                  checked={wsAlerts}
                  onChange={(e) => setWsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0f172a] rounded-xl border border-slate-800">
                <div>
                  <div className="text-white font-extrabold">Email Notifications</div>
                  <div className="text-[11px] text-slate-400 font-normal">Send critical alert emails to Store Manager</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
