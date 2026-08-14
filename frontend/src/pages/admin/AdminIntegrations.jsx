import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function AdminIntegrations() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [toastMessage, setToastMessage] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [integrationsList, setIntegrationsList] = useState([
    { id: "INT-01", name: "YOLOv8 Edge Inference API", category: "AI APIs", endpoint: "https://ai-edge.cams.internal/v2/detect", status: "Connected", syncStatus: "Real-time (12ms)", requestsPerMin: "4,260 req/m", errorRate: "0.00%", icon: "🤖", desc: "Real-time object detection stream processor integration." },
    { id: "INT-02", name: "PostgreSQL Analytics Cluster", category: "Databases", endpoint: "postgresql://cluster.db.internal:5432/cams", status: "Connected", syncStatus: "Active Pool (14% load)", requestsPerMin: "1,420 queries/s", errorRate: "0.00%", icon: "🗄️", desc: "Main analytical time-series database cluster." },
    { id: "INT-03", name: "AWS S3 Video Storage Bucket", category: "Cloud Storage", endpoint: "s3://cams-surveillance-recordings-ap-south", status: "Connected", syncStatus: "Synced 2m ago", requestsPerMin: "120 ops/m", errorRate: "0.01%", icon: "☁️", desc: "Cloud archive storage bucket for raw video retention." },
    { id: "INT-04", name: "Shopify POS & Inventory API", category: "Enterprise ERP/POS", endpoint: "https://store.myshopify.com/api/2024-04", status: "Connected", syncStatus: "Synced 5m ago", requestsPerMin: "45 req/m", errorRate: "0.00%", icon: "🛍️", desc: "Synchronizes product pricing, inventory data, and conversion tags." },
    { id: "INT-05", name: "Twilio SMS & Alert Gateway", category: "Communication Services", endpoint: "https://api.twilio.com/2010-04-01", status: "Connected", syncStatus: "Ready", requestsPerMin: "8 msgs/m", errorRate: "0.00%", icon: "💬", desc: "Sends immediate notifications to store managers for stock and heat alerts." },
    { id: "INT-06", name: "Salesforce CRM Pipeline Sync", category: "Analytics Platforms", endpoint: "https://cams.my.salesforce.com/services/data", status: "Disconnected", syncStatus: "Offline", requestsPerMin: "0 req/m", errorRate: "100%", icon: "📊", desc: "Export attention metrics and buyer behavior profiles to sales pipelines." },
  ]);

  // API Usage Statistics
  const apiUsageHistory = [
    { time: "00:00", requests: 1800, latency: 14 },
    { time: "04:00", requests: 1400, latency: 12 },
    { time: "08:00", requests: 3800, latency: 18 },
    { time: "12:00", requests: 5900, latency: 22 },
    { time: "16:00", requests: 4800, latency: 16 },
    { time: "20:00", requests: 2900, latency: 15 },
  ];

  const testConnection = (item) => {
    showToast(`Testing connection for ${item.name}... Status: OK (14ms response time)`);
  };

  const filteredList = categoryFilter === "All" ? integrationsList : integrationsList.filter(i => i.category === categoryFilter);

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>🔌</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔌</span>
            <h1 className="text-xl font-black text-white tracking-wide">Enterprise Integrations & Third-Party APIs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">
              API Gateway & Webhooks
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>+</span> Add Integration
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Connected Integrations</span>
          <h2 className="text-lg font-black text-white font-mono">5 / 6 Connected</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">83.3% Network Sync</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total API Throughput</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">5,853 req/min</h2>
          <span className="text-[10px] text-purple-300 font-bold block">Sub-20ms Latency</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Active Data Pipelines</span>
          <h2 className="text-lg font-black text-blue-400 font-mono">12 Webhooks Active</h2>
          <span className="text-[10px] text-blue-300 font-bold block">Real-time Stream Sync</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Disconnected / Disrupted</span>
          <h2 className="text-lg font-black text-rose-400 font-mono">1 Endpoint Offline</h2>
          <span className="text-[10px] text-rose-400 font-bold block">Salesforce CRM Disconnected</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {["All", "AI APIs", "Databases", "Cloud Storage", "Enterprise ERP/POS", "Communication Services", "Analytics Platforms"].map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap
              ${categoryFilter === c
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => (
          <div key={item.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 hover:border-slate-600 transition flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h3 className="font-extrabold text-white text-xs">{item.name}</h3>
                    <span className="text-[10px] text-indigo-400 font-mono">{item.id} • {item.category}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.status === "Connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                  ● {item.status}
                </span>
              </div>

              <p className="text-slate-300 text-xs mt-3 leading-relaxed">{item.desc}</p>

              <div className="mt-3 bg-[#070C18] p-3 rounded-xl border border-[#1E293B] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Endpoint</span>
                  <span className="font-mono text-[10px] text-slate-300 truncate max-w-[160px]">{item.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Request Rate</span>
                  <span className="font-mono text-purple-300 font-bold">{item.requestsPerMin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Sync Latency</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.syncStatus}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E293B] flex justify-between items-center text-xs">
              <button
                onClick={() => testConnection(item)}
                className="px-3 py-1 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-lg text-[11px] border border-indigo-500/20 transition"
              >
                Test Connection
              </button>
              <button
                onClick={() => setSelectedIntegration(item)}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                Configure Settings →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* API Usage Statistics Chart */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <span>📊</span> Aggregate Integration API Request Volume & Latency
        </h3>
        <div className="h-56 w-full pt-2">
          <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
            <AreaChart data={apiUsageHistory}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
              <Area type="monotone" dataKey="requests" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} name="API Requests / min" />
            </AreaChart>
          </ResponsiveContainer>
</ComponentErrorBoundary>
        </div>
      </div>

      {/* ── MODAL: CONFIGURE INTEGRATION ─────────────────────────────────── */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedIntegration.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">{selectedIntegration.id}</span>
              </div>
              <button onClick={() => setSelectedIntegration(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast(`Settings updated for ${selectedIntegration.name}`);
              setSelectedIntegration(null);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Endpoint URL</label>
                <input type="text" defaultValue={selectedIntegration.endpoint} className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Authentication Bearer Key</label>
                <input type="password" defaultValue="cams_live_secret_key_849204928" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Sync Interval</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>Real-Time Stream Sync</option>
                  <option>Every 5 Minutes</option>
                  <option>Every 15 Minutes</option>
                  <option>Hourly Batch</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setSelectedIntegration(null)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD INTEGRATION ───────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">🔌 Add Third-Party Integration</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("New Enterprise Integration endpoint connected!");
              setIsAddModalOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Integration Name</label>
                <input type="text" required placeholder="e.g. Google Analytics 4 Stream" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Category</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>AI APIs</option>
                  <option>Databases</option>
                  <option>Cloud Storage</option>
                  <option>Enterprise ERP/POS</option>
                  <option>Communication Services</option>
                  <option>Analytics Platforms</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Endpoint URL / Webhook</label>
                <input type="text" required placeholder="https://api.custom-service.com/v1" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Add Endpoint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
