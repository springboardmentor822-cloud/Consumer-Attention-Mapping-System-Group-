import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function StoreDeviceManagement() {
  const [activeTab, setActiveTab] = useState("stores"); // 'stores' | 'devices' | 'health' | 'maintenance'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Toast alert
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Modals
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Stores dataset
  const [storesList, setStoresList] = useState([
    { id: 1, name: "Store 1 - Koramangala", region: "South - Bangalore", city: "Bangalore", manager: "Priya Mehta", status: "Online", cameras: 12, totalDevices: 6, uptime: "99.8%" },
  ]);

  // Devices dataset (Cameras, Gateways, Edge Processors, Storage Units)
  const [devicesList, setDevicesList] = useState([
    { id: "CAM-001", name: "4K Entrance Dome Camera", type: "RTSP Camera", store: "Store 1 - Koramangala", ip: "192.168.1.101", firmware: "v3.4.1", status: "Online", uptime: "99.9%", temp: "38°C", cpu: "24%" },
    { id: "CAM-002", name: "Electronics Aisle Camera", type: "RTSP Camera", store: "Store 1 - Koramangala", ip: "192.168.1.102", firmware: "v3.4.1", status: "Online", uptime: "99.8%", temp: "41°C", cpu: "28%" },
    { id: "GW-101", name: "NVIDIA Jetson Edge Gateway", type: "Edge Processor", store: "Store 1 - Koramangala", ip: "192.168.1.50", firmware: "JetPack 5.1", status: "Online", uptime: "99.9%", temp: "52°C", cpu: "64%" },
    { id: "NAS-01", name: "48TB Store Surveillance NAS", type: "Storage Unit", store: "Store 1 - Koramangala", ip: "192.168.1.200", firmware: "v4.1.0", status: "Online", uptime: "100%", temp: "35°C", cpu: "12%" },
    { id: "CAM-004", name: "Entrance Wide Angle Cam", type: "RTSP Camera", store: "Store 1 - Koramangala", ip: "192.168.1.103", firmware: "v3.2.0", status: "Online", uptime: "99.1%", temp: "42°C", cpu: "32%" },
  ]);

  // Network Uptime Trend Data
  const uptimeTrendData = [
    { day: "Mon", uptime: 99.8, activeCams: 142 },
    { day: "Tue", uptime: 99.6, activeCams: 142 },
    { day: "Wed", uptime: 98.9, activeCams: 138 },
    { day: "Thu", uptime: 99.4, activeCams: 140 },
    { day: "Fri", uptime: 99.7, activeCams: 142 },
    { day: "Sat", uptime: 99.9, activeCams: 142 },
    { day: "Sun", uptime: 99.8, activeCams: 142 },
  ];

  // Maintenance Schedules
  const maintenanceLogs = [
    { id: "MNT-101", device: "Store 1 Gateway Processor", store: "Store 1 - Koramangala", schedule: "Tomorrow, 02:00 AM", technician: "Rahul Verma", task: "Firmware upgrade v3.0 & IP Reconfig", priority: "High" },
    { id: "MNT-102", device: "CAM-002 Lens Cleaning", store: "Store 1 - Koramangala", schedule: "Aug 8, 2026", technician: "Kavita Rao", task: "Clean optical sensor & adjust focal zoom", priority: "Medium" }
  ];

  // Filtered lists
  const filteredStores = storesList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredDevices = devicesList.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase()) || d.store.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>⚡</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <h1 className="text-xl font-black text-white tracking-wide">Store & Device Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-widest">
              Infrastructure Control
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddStoreOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <span>🏪</span> Add Store
          </button>
          <button
            onClick={() => setIsAddDeviceOpen(true)}
            className="px-4 py-2 bg-[#1E293B] hover:bg-[#273552] text-slate-200 border border-[#334155] rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>📹</span> Register Device
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Connected Store Nodes</span>
          <h2 className="text-lg font-black text-white font-mono">{storesList.length} Stores</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">100% Regional Coverage</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Active RTSP Cameras</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">142 Active / 148 Total</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">30 FPS Live Stream</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Edge Gateways & Processors</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">25 Nodes</h2>
          <span className="text-[10px] text-purple-300 font-bold block">NVIDIA Jetson Clusters</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Device Alerts & Offline</span>
          <h2 className="text-lg font-black text-amber-400 font-mono">2 Issues Flagged</h2>
          <span className="text-[10px] text-amber-400 font-bold block">Require Maintenance</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "stores", label: "🏪 Store Directory", count: filteredStores.length },
          { id: "devices", label: "📹 Hardware & Cameras", count: filteredDevices.length },
          { id: "health", label: "⚡ Device Diagnostics & Health", count: "Network 99.8%" },
          { id: "maintenance", label: "🛠️ Maintenance Schedules", count: maintenanceLogs.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: STORE DIRECTORY (ENTERPRISE TABLE LAYOUT) ────────────────────────────────────────── */}
      {activeTab === "stores" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="🔍 Search stores by name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Online">Online</option>
                <option value="Warning">Warning</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredStores.length}</strong> stores
            </span>
          </div>

          {/* PROFESSIONAL ENTERPRISE STORE TABLE */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3.5 px-4 font-sans">Store Name</th>
                    <th className="py-3.5 px-4 font-sans">Location (Region & City)</th>
                    <th className="py-3.5 px-4 font-sans">Store Manager</th>
                    <th className="py-3.5 px-4 font-sans">Status</th>
                    <th className="py-3.5 px-4 text-right font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredStores.map((s) => (
                    <tr key={s.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white text-sm block font-sans">{s.name}</span>
                        <span className="text-[10px] text-indigo-400">Node ID: #STORE-00{s.id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-sans">
                        <span className="block font-bold text-white">{s.city}</span>
                        <span className="text-[10px] text-slate-400 block">{s.region}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-sans font-bold">{s.manager}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          s.status === "Online" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : s.status === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          ● {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* ACTION DROPDOWN / MENU BUTTONS */}
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            onClick={() => showToast(`Store Details for ${s.name}: Manager ${s.manager}, Uptime ${s.uptime}, ${s.cameras} Cameras`)}
                            className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#273552] text-slate-200 rounded-lg text-[10px] font-bold border border-[#334155] transition"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => setIsAddStoreOpen(true)}
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/30 transition"
                          >
                            Edit Store
                          </button>
                          <button
                            onClick={() => showToast(`Configuring node settings & cameras for ${s.name}`)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                          >
                            Manage Store
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HARDWARE & CAMERAS DIRECTORY ─────────────────────────── */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Search hardware devices by ID, name, or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 min-w-[280px]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Warning">Warning</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Device ID & Name</th>
                    <th className="py-3 px-4">Category Type</th>
                    <th className="py-3 px-4">Assigned Store</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Firmware Version</th>
                    <th className="py-3 px-4">Temp / CPU</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredDevices.map((d) => (
                    <tr key={d.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{d.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">{d.id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {d.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{d.store}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{d.ip}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{d.firmware}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{d.temp} / {d.cpu}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${d.status === "Online" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : d.status === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                          ● {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedDevice(d)}
                          className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-lg text-[11px] border border-indigo-500/20 transition"
                        >
                          Diagnostics
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

      {/* ── TAB 3: DEVICE DIAGNOSTICS & HEALTH ───────────────────────────── */}
      {activeTab === "health" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📈</span> Network Camera & Hardware Uptime Trends
            </h3>
            <div className="h-64 w-full pt-2">
              <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
                <AreaChart data={uptimeTrendData}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                  <YAxis domain={[95, 100]} stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                  <Area type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.1} name="Uptime %" />
                </AreaChart>
              </ResponsiveContainer>
</ComponentErrorBoundary>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>⚡</span> System Diagnostics Overview
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">RTSP Latency Average</span>
                <span className="text-base font-black text-emerald-400 font-mono">18.4 ms</span>
                <span className="text-[10px] text-slate-500 block">Sub-20ms threshold met</span>
              </div>
              <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">Thermal Average (Edge Compute)</span>
                <span className="text-base font-black text-purple-400 font-mono">44.2 °C</span>
                <span className="text-[10px] text-slate-500 block">Optimal fan speed active</span>
              </div>
              <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">Packet Loss Ratio</span>
                <span className="text-base font-black text-emerald-400 font-mono">0.00%</span>
                <span className="text-[10px] text-slate-500 block">Gigabit Fiber Backhaul</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: MAINTENANCE SCHEDULES ─────────────────────────────────── */}
      {activeTab === "maintenance" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>🛠️</span> Scheduled Hardware Maintenance Operations
            </h3>
            <button
              onClick={() => showToast("Scheduled new hardware maintenance window")}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
            >
              + Schedule Maintenance
            </button>
          </div>

          <div className="space-y-3">
            {maintenanceLogs.map((m) => (
              <div key={m.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{m.device}</span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded">
                      {m.store}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{m.task}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Scheduled Window: <span className="text-white font-bold">{m.schedule}</span> • Assigned Tech: {m.technician}
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${m.priority === "High" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                  {m.priority} Priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: DIAGNOSTICS VIEW ───────────────────────────────────────── */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedDevice.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">{selectedDevice.id}</span>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs bg-[#070C18] p-4 rounded-xl border border-[#1E293B]">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-emerald-400">{selectedDevice.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Store</span>
                <span className="font-bold text-slate-200">{selectedDevice.store}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address</span>
                <span className="font-mono text-slate-200">{selectedDevice.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Firmware</span>
                <span className="font-mono text-slate-200">{selectedDevice.firmware}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temperature / CPU</span>
                <span className="font-mono text-purple-300">{selectedDevice.temp} / {selectedDevice.cpu}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => {
                  showToast(`Reboot signal sent to ${selectedDevice.id}`);
                  setSelectedDevice(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Reboot Device
              </button>
              <button onClick={() => setSelectedDevice(null)} className="px-4 py-2 bg-[#1E293B] text-slate-300 font-bold rounded-xl text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD STORE ──────────────────────────────────────────────── */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">🏪 Register New Retail Store Node</h3>
              <button onClick={() => setIsAddStoreOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("New Store Node provisioned into network!");
              setIsAddStoreOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Store Name</label>
                <input type="text" required placeholder="Store 6 - Whitefield" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Region & City</label>
                <input type="text" required placeholder="South - Bangalore" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Store Manager Assigned</label>
                <input type="text" required placeholder="Deepak Kumar" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsAddStoreOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Add Store Node</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD DEVICE ─────────────────────────────────────────────── */}
      {isAddDeviceOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">📹 Register Hardware Device</h3>
              <button onClick={() => setIsAddDeviceOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("Device registered and paired to RTSP stream!");
              setIsAddDeviceOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Device Name / ID</label>
                <input type="text" required placeholder="CAM-109 High resolution Aisle Cam" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Device Category</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>RTSP Camera</option>
                  <option>Edge Processor (Jetson)</option>
                  <option>Storage Unit (NAS)</option>
                  <option>IoT Sensor Gateway</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target IP Address</label>
                <input type="text" required placeholder="192.168.1.150" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsAddDeviceOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Register Device</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
