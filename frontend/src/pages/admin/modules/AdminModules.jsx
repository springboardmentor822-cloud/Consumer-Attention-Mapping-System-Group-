import React, { useState } from "react";
import AiVisionCamera from "../../../components/vision/AiVisionCamera";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";

// Shared Header
const ModuleHeader = ({ icon, title, subtitle, statusText }) => (
  <div className="bg-[#111827] border border-[#273449] rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 font-sans">
    <div>
      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
    </div>
    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-xl">
      ● {statusText || "Infrastructure Healthy"}
    </span>
  </div>
);

// 1. DASHBOARD (Contains all 10 Administrator Dashboard Components)
export function AdminDashboardOverviewPage() {
  const analyticsTrend = [
    { day: "Mon", visitors: 4200, pickups: 1400 },
    { day: "Tue", visitors: 5100, pickups: 1850 },
    { day: "Wed", visitors: 4900, pickups: 1620 },
    { day: "Thu", visitors: 6200, pickups: 2100 },
    { day: "Fri", visitors: 7800, pickups: 2900 },
    { day: "Sat", visitors: 9500, pickups: 3800 },
    { day: "Sun", visitors: 8900, pickups: 3400 }
  ];

  return (
    <div className="space-y-6 font-sans">
      <ModuleHeader icon="⚙️" title="System Administrator Control Center" subtitle="Centralized command hub supervising network-wide stores, hardware infrastructure, & AI engines" />

      {/* COMPONENT 1: KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Stores", val: "18 Stores", sub: "100% Operational", col: "text-emerald-400" },
          { label: "Total Cameras", val: "142 Active", sub: "32/32 Stream", col: "text-emerald-400" },
          { label: "Total Users", val: "64 Users", sub: "4 Roles", col: "text-purple-400" },
          { label: "Active Sessions", val: "28 Live", sub: "0 Bottlenecks", col: "text-blue-400" },
          { label: "AI Status", val: "YOLOv8", sub: "30 FPS", col: "text-emerald-400" },
          { label: "Platform Health", val: "99.98%", sub: "Optimal", col: "text-emerald-400" },
          { label: "Active Alerts", val: "3 Warnings", sub: "Prioritized", col: "text-amber-400" },
          { label: "Consumers Detected", val: "128.4K", sub: "Network Total", col: "text-blue-400" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#111827] border border-[#273449] rounded-xl p-3.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase block truncate">{kpi.label}</span>
            <h4 className="text-sm font-extrabold text-white mt-1">{kpi.val}</h4>
            <span className={`text-[9px] font-bold ${kpi.col} block mt-0.5`}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* COMPONENT 2 & 3: PLATFORM HEALTH MONITORING & STORE OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Platform Infrastructure Monitoring</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449]">
              <span className="text-[10px] text-slate-400 block font-bold">API Gateway</span>
              <span className="text-sm font-extrabold text-white mt-1 block">24ms</span>
              <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Healthy</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449]">
              <span className="text-[10px] text-slate-400 block font-bold">Database Pool</span>
              <span className="text-sm font-extrabold text-white mt-1 block">14%</span>
              <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Optimal Load</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449]">
              <span className="text-[10px] text-slate-400 block font-bold">GPU Memory</span>
              <span className="text-sm font-extrabold text-white mt-1 block">4.2 / 16 GB</span>
              <span className="text-[9px] text-purple-400 font-bold block mt-0.5">ByteTrack Active</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449]">
              <span className="text-[10px] text-slate-400 block font-bold">Stream Engine</span>
              <span className="text-sm font-extrabold text-white mt-1 block">30 FPS</span>
              <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">0 Frame Loss</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Overview Network Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449] text-center">
              <span className="text-lg font-extrabold text-emerald-400 block">18</span>
              <span className="text-[10px] font-bold text-slate-300">Active Stores</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449] text-center">
              <span className="text-lg font-extrabold text-slate-400 block">0</span>
              <span className="text-[10px] font-bold text-slate-300">Inactive Stores</span>
            </div>
            <div className="bg-[#172033] p-3 rounded-xl border border-[#273449] text-center">
              <span className="text-lg font-extrabold text-blue-400 block">+2</span>
              <span className="text-[10px] font-bold text-slate-300">Newly Provisioned</span>
            </div>
          </div>
        </div>
      </div>

      {/* COMPONENT 4, 5, 6: CAMERA OVERVIEW, USER OVERVIEW, & CONSUMER ANALYTICS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Camera Overview Status</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Online RTSP Streams</span><span className="text-emerald-400 font-bold font-mono">142 Units (100%)</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Offline / Maintenance</span><span className="text-slate-400 font-bold font-mono">0 Units</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">AI Detection Active</span><span className="text-purple-400 font-bold font-mono">142 Processing</span></div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Overview Distribution</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Administrators</span><span className="text-blue-400 font-bold font-mono">4 Accounts</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Store Managers</span><span className="text-emerald-400 font-bold font-mono">18 Accounts</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Marketing & Analysts</span><span className="text-amber-400 font-bold font-mono">42 Accounts</span></div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Performance Engine Overview</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Processed Video Frames</span><span className="text-emerald-400 font-bold font-mono">12.4M / Hr</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">Object Detection Accuracy</span><span className="text-blue-400 font-bold font-mono">99.4% (YOLOv8)</span></div>
            <div className="p-2.5 bg-[#172033] rounded-xl flex justify-between"><span className="text-white font-bold">ByteTrack Tracking Accuracy</span><span className="text-purple-400 font-bold font-mono">98.8% MOTA</span></div>
          </div>
        </div>
      </div>

      {/* COMPONENT 7: NETWORK CONSUMER ANALYTICS OVERVIEW CHART */}
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Network Consumer Analytics Overview (Last 7 Days)</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsTrend}>
              <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#273449" }} />
              <Bar dataKey="visitors" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Total Visitors" />
              <Bar dataKey="pickups" fill="#10B981" radius={[4, 4, 0, 0]} name="Product Pickups" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 5: COMPONENT 8, 9, 10 - PLATFORM ALERTS, RECENT ACTIVITIES, & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Platform Operational Alerts</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
              <div><span className="font-bold text-white block">API Gateway Latency Spike</span><span className="text-[10px] text-slate-400">5 mins ago</span></div>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold rounded">Warning</span>
            </div>
            <div className="p-2.5 bg-[#172033] rounded-xl border border-[#273449] flex justify-between items-center">
              <div><span className="font-bold text-white block">Scheduled DB Snapshot Verified</span><span className="text-[10px] text-slate-400">1 hour ago</span></div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold rounded">Success</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Administrative Activities</h3>
          <div className="space-y-1.5 text-xs text-slate-300">
            <p>• Registered 4 new cameras for Store 18</p>
            <p>• Updated role scope for Store Manager portal</p>
            <p>• Provisioned user account: retail@gmail.com</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Administrative Actions</h3>
          <div className="space-y-2 text-xs">
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition">Provision New Store Location →</button>
            <button className="w-full py-2 bg-[#172033] border border-[#273449] text-slate-200 hover:text-white font-bold rounded-xl transition">Register AI Camera Unit →</button>
            <button className="w-full py-2 bg-[#172033] border border-[#273449] text-slate-200 hover:text-white font-bold rounded-xl transition">Manage User Access Permissions →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. STORE MANAGEMENT
export function AdminStoreManagementPage() {
  const [stores, setStores] = useState([
    { id: "ST-001", name: "MG Road Central", location: "Kochi, IN", manager: "Store Manager", cameras: 8, shelves: 24, status: "Active", region: "South India" },
    { id: "ST-002", name: "Indiranagar Hub", location: "Bangalore, IN", manager: "Rajesh Kumar", cameras: 12, shelves: 36, status: "Active", region: "South India" },
    { id: "ST-003", name: "Koramangala Outlet", location: "Bangalore, IN", manager: "Anita Singh", cameras: 6, shelves: 18, status: "Active", region: "South India" }
  ]);

  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🏪" title="Store Management Directory" subtitle="Manage registered retail stores, assigned managers, camera counts, & regional status" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#273449] text-slate-400 font-bold">
              <th className="pb-3">Store ID / Name</th><th className="pb-3">Location & Region</th><th className="pb-3">Assigned Manager</th><th className="pb-3">Cameras / Shelves</th><th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#273449]">
            {stores.map((s) => (
              <tr key={s.id}>
                <td className="py-3 font-bold text-white">{s.name} <span className="text-[10px] text-blue-400 block font-mono">{s.id}</span></td>
                <td className="py-3 text-slate-300">{s.location} <span className="text-[10px] text-slate-500 block">{s.region}</span></td>
                <td className="py-3 text-purple-400 font-bold">{s.manager}</td>
                <td className="py-3 text-slate-300 font-mono">{s.cameras} Cams | {s.shelves} Shelves</td>
                <td className="py-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. CAMERA MANAGEMENT
export function AdminCameraManagementPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📹" title="Camera Management Console" subtitle="Surveillance registration, RTSP stream URLs, camera health, & AI detection status" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AiVisionCamera cameraName="CAM-01 (MAIN ENTRANCE - ST-001)" showHeatmap={false} />
        <AiVisionCamera cameraName="CAM-04 (BAKERY ENDCAP - ST-001)" showHeatmap={true} />
      </div>
    </div>
  );
}

// 4. SHELF MANAGEMENT
export function AdminShelfManagementPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🧺" title="Shelf Management & Coordinates" subtitle="Store shelf configurations, product category bindings, and AI zone coordinates" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#273449] text-slate-400 font-bold">
              <th className="pb-3">Shelf ID</th><th className="pb-3">Store</th><th className="pb-3">Category</th><th className="pb-3">Zone Coordinates</th><th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#273449]">
            {["Shelf A1 (Bakery)", "Shelf B2 (Drinks)", "Shelf C1 (Snacks)"].map((sh, i) => (
              <tr key={i}>
                <td className="py-3 font-bold text-white">{sh}</td>
                <td className="py-3 text-slate-300">MG Road Central</td>
                <td className="py-3 text-purple-400 font-bold">Category {i+1}</td>
                <td className="py-3 text-slate-400 font-mono">[x: 120, y: 450, w: 200, h: 300]</td>
                <td className="py-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 5. PLATFORM MONITORING
export function AdminPlatformMonitoringPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🖥️" title="Platform Infrastructure Monitoring" subtitle="Technical supervision of servers, DB connectivity, API latency, & AI engines" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">API Gateway Throughput</span>
          <h4 className="text-lg font-extrabold text-white mt-1">2,450 Requests / sec</h4>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1">24ms avg response time</span>
        </div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">AI Processing Pipeline</span>
          <h4 className="text-lg font-extrabold text-blue-400 mt-1">YOLOv8 + ByteTrack</h4>
          <span className="text-[10px] text-slate-400 font-bold block mt-1">30 FPS synchronized</span>
        </div>
        <div className="bg-[#111827] border border-[#273449] rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">PostgreSQL Pool Load</span>
          <h4 className="text-lg font-extrabold text-purple-400 mt-1">14% Active Load</h4>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1">Optimal execution</span>
        </div>
      </div>
    </div>
  );
}

// 6. USER & ROLE MANAGEMENT
export function AdminUserRoleManagementPage() {
  const [users, setUsers] = useState([
    { id: 1, name: "Muhsina Admin", email: "muhsina@gmail.com", role: "Administrator", store: "All Stores", status: "Active" },
    { id: 2, name: "Store Manager", email: "store@gmail.com", role: "Store Manager", store: "MG Road Central", status: "Active" },
    { id: 3, name: "Retail Analyst", email: "retail@gmail.com", role: "Retail Analyst", store: "All Stores", status: "Active" },
    { id: 4, name: "Marketing Lead", email: "marketing@gmail.com", role: "Marketing Manager", store: "All Stores", status: "Active" }
  ]);

  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="👥" title="User & Role Access Management" subtitle="Provision user accounts, assign system roles, associate store permissions, & manage access" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#273449] text-slate-400 font-bold">
              <th className="pb-3">Name</th><th className="pb-3">Email Address</th><th className="pb-3">Assigned Role</th><th className="pb-3">Store Scope</th><th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#273449]">
            {users.map(u => (
              <tr key={u.id}>
                <td className="py-3 font-bold text-white">{u.name}</td>
                <td className="py-3 text-slate-300 font-mono">{u.email}</td>
                <td className="py-3 text-purple-400 font-bold">{u.role}</td>
                <td className="py-3 text-slate-400">{u.store}</td>
                <td className="py-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">{u.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 7. REPORTS
export function AdminReportsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="📄" title="Platform Reports & Exports" subtitle="Generate platform performance, consumer analytics, & operational summary reports" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition">
          📥 Export Network Operations Summary (PDF)
        </button>
      </div>
    </div>
  );
}

// 8. SETTINGS
export function AdminSettingsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="⚙️" title="Global System Preferences" subtitle="Platform customization, notification defaults, date/time formatting, & security parameters" />
      <div className="bg-[#111827] border border-[#273449] rounded-2xl p-5 space-y-3 text-xs">
        <div className="flex justify-between items-center border-b border-[#273449] pb-2">
          <span className="font-bold text-white">Default Network Time Zone</span>
          <span className="text-slate-300 font-mono">Asia/Kolkata (IST)</span>
        </div>
      </div>
    </div>
  );
}

// 9. NOTIFICATIONS
export function AdminNotificationsPage() {
  return (
    <div className="space-y-5 font-sans">
      <ModuleHeader icon="🔔" title="System Alerts & Notifications" subtitle="Centralized event logs for camera alerts, AI pipeline events, & server warnings" />
      <div className="space-y-3">
        {[
          { msg: "API Gateway latency warning: 24ms average", sev: "Warning", time: "06:30 PM" },
          { msg: "Automated DB Snapshot completed successfully", sev: "Info", time: "05:00 PM" }
        ].map((n, i) => (
          <div key={i} className="p-3 bg-[#111827] border border-[#273449] rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-white block">{n.msg}</span>
              <span className="text-[10px] text-slate-400">{n.time}</span>
            </div>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold rounded">{n.sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
