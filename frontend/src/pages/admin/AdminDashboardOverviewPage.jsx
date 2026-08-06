import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar
} from "recharts";
import { useCams } from "../../services/CamsContext";

export default function AdminDashboardOverviewPage() {
  const { dateRange, setDateRange } = useCams();

  // 1. System Performance (Line / Area Chart)
  const systemPerformanceData = [
    { time: "00:00", cpu: 22, gpu: 35, memory: 45 },
    { time: "04:00", cpu: 18, gpu: 28, memory: 42 },
    { time: "08:00", cpu: 45, gpu: 62, memory: 58 },
    { time: "12:00", cpu: 68, gpu: 84, memory: 72 },
    { time: "16:00", cpu: 74, gpu: 89, memory: 78 },
    { time: "20:00", cpu: 52, gpu: 68, memory: 65 },
    { time: "24:00", cpu: 30, gpu: 42, memory: 50 },
  ];

  // 2. Camera Status (Donut Chart)
  const cameraStatusData = [
    { name: "Online", value: 3, color: "#10B981" },
    { name: "Offline", value: 1, color: "#EF4444" },
  ];

  // 3. Infrastructure Health Indicators
  const infraHealth = [
    { component: "Primary AI Edge Server", load: 68, status: "Optimal", color: "bg-emerald-500" },
    { component: "NVIDIA RTX Edge GPU #1", load: 84, status: "High Load", color: "bg-amber-500" },
    { component: "NVMe SSD Storage Array", load: 42, status: "Healthy", color: "bg-emerald-500" },
    { component: "PostgreSQL Analytics DB", load: 55, status: "Healthy", color: "bg-emerald-500" },
  ];

  // 4. Database Overview (Utilization Chart)
  const dbUtilizationData = [
    { metric: "Storage", val: 42, limit: 100 },
    { metric: "IOPS", val: 58, limit: 100 },
    { metric: "Active Queries", val: 34, limit: 100 },
    { metric: "Connection Pool", val: 28, limit: 100 },
  ];

  // 5. API Performance (Response-time Graph)
  const apiPerformanceData = [
    { time: "10 AM", inferenceMs: 18, analyticsMs: 32, streamMs: 12 },
    { time: "12 PM", inferenceMs: 24, analyticsMs: 45, streamMs: 14 },
    { time: "2 PM", inferenceMs: 22, analyticsMs: 38, streamMs: 15 },
    { time: "4 PM", inferenceMs: 28, analyticsMs: 52, streamMs: 18 },
    { time: "6 PM", inferenceMs: 32, analyticsMs: 58, streamMs: 20 },
    { time: "8 PM", inferenceMs: 20, analyticsMs: 35, streamMs: 14 },
  ];

  // 6. User Distribution by Roles (Pie Chart)
  const userRolesData = [
    { name: "Administrator", count: 1, fill: "#8B5CF6" },
    { name: "Store Manager", count: 1, fill: "#10B981" },
    { name: "Retail Analyst", count: 1, fill: "#06B6D4" },
    { name: "Marketing Manager", count: 1, fill: "#F59E0B" },
  ];

  // 7. Recent System Activities
  const recentActivities = [
    { time: "10 mins ago", event: "YOLOv8 Edge Vision Engine updated to v2.4 (FP16 optimized)", type: "AI Engine", color: "text-purple-400" },
    { time: "28 mins ago", event: "CAM-04 connection status check initiated by Store Manager", type: "Camera", color: "text-amber-400" },
    { time: "1 hour ago", event: "Automated PostgreSQL database backup completed (4.2 GB)", type: "Database", color: "text-emerald-400" },
    { time: "3 hours ago", event: "Role permissions re-validated for single-store deployment", type: "Security", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* HEADER WITH TITLE ONLY AND DATE FILTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">Administrator Dashboard</h1>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs font-medium">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#0A1020] border border-[#273449] text-indigo-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="Custom Date Range">Custom Date Range</option>
          </select>
        </div>
      </div>

      {/* 1. SINGLE STORE KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Stores</span>
          <h3 className="text-xl font-black text-white font-mono">1</h3>
          <span className="text-[10px] font-bold text-emerald-400 block">Single Supermarket</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Cameras</span>
          <h3 className="text-xl font-black text-white font-mono">4</h3>
          <span className="text-[10px] font-bold text-emerald-400 block">3 Online / 1 Offline</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Users</span>
          <h3 className="text-xl font-black text-white font-mono">4</h3>
          <span className="text-[10px] font-bold text-purple-400 block">4 Security Roles</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Store Online Status</span>
          <h3 className="text-xl font-black text-emerald-400 font-mono">Online</h3>
          <span className="text-[10px] font-bold text-slate-400 block">Downtown Supermarket</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Uptime</span>
          <h3 className="text-xl font-black text-white font-mono">99.9%</h3>
          <span className="text-[10px] font-bold text-emerald-400 block">Optimal Operation</span>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Alerts</span>
          <h3 className="text-xl font-black text-amber-400 font-mono">2</h3>
          <span className="text-[10px] font-bold text-amber-400 block">Non-Critical Warning</span>
        </div>
      </div>

      {/* 2. ANALYTICAL SECTION - STRICTLY TWO COMPONENTS PER ROW */}

      {/* ROW 1: System Performance | Camera Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Performance Load (CPU / GPU / RAM)</h3>
            <span className="text-[10px] text-indigo-400 font-bold">24-Hour Telemetry</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemPerformanceData}>
                <defs>
                  <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Area type="monotone" dataKey="gpu" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#gpuGrad)" name="GPU Load %" />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} name="CPU Load %" />
                <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="RAM Usage %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Camera Online / Offline Status</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cameraStatusData} innerRadius={45} outerRadius={65} dataKey="value">
                  {cameraStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <strong className="text-base text-white block">4 Total</strong>
              <span className="text-[9px] text-slate-400">75% Online</span>
            </div>
          </div>
          <div className="flex justify-around pt-2 border-t border-[#1E293B] text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 3 Online (CAM 1, 2, 3)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 1 Offline (CAM 4)
            </span>
          </div>
        </div>
      </div>

      {/* ROW 2: Infrastructure Health | Database Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Infrastructure Health Indicators</h3>
          <div className="space-y-4 pt-2">
            {infraHealth.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">{item.component}</span>
                  <div className="space-x-2">
                    <span className="text-white font-bold">{item.load}%</span>
                    <span className="text-slate-400">({item.status})</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-[#070C18] rounded-full overflow-hidden border border-[#1E293B]">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.load}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Database Overview & Resource Utilization</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dbUtilizationData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="val" fill="#6366F1" radius={[3, 3, 0, 0]} name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: API Performance | User Distribution by Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">API Response Time Performance (ms)</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiPerformanceData}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={9} unit="ms" />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Line type="monotone" dataKey="inferenceMs" stroke="#10B981" strokeWidth={2} name="Vision Inference" />
                <Line type="monotone" dataKey="analyticsMs" stroke="#3B82F6" strokeWidth={2} name="Analytics API" />
                <Line type="monotone" dataKey="streamMs" stroke="#F59E0B" strokeWidth={2} name="Video Stream" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Distribution by Security Roles</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userRolesData} innerRadius={40} outerRadius={60} dataKey="count">
                  {userRolesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E293B] text-[10px]">
            {userRolesData.map((u, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-slate-400">{u.name}:</span>
                <strong className="text-white font-bold">{u.count} Account</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4: Recent System Activities | System Operational Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent System Administrative Activities</h3>
          <div className="space-y-3 pt-1">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="p-3 bg-[#0A1020] border border-[#1E293B] rounded-xl space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className={`font-bold ${act.color}`}>{act.type}</span>
                  <span className="text-slate-500">{act.time}</span>
                </div>
                <p className="text-white text-[11px]">{act.event}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supermarket Infrastructure Summary</h3>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Deployed Store Node:</span>
              <span className="text-white font-bold">STR-101 (Downtown Flagship)</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Authorized User Accounts:</span>
              <span className="text-emerald-400 font-bold">4 Accounts (Admin, SM, RA, MM)</span>
            </div>
            <div className="flex justify-between border-b border-[#1E293B] pb-2">
              <span className="text-slate-400">Live Surveillance Streams:</span>
              <span className="text-white font-bold">4 CCTV Cameras (1080p / 4K)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Enterprise AI Engine:</span>
              <span className="text-indigo-400 font-bold">YOLOv8 + ByteTrack TensorRT</span>
            </div>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-xl text-[10px] text-indigo-300">
            Administrator Portal is configured strictly for single-supermarket operational oversight.
          </div>
        </div>
      </div>
    </div>
  );
}
