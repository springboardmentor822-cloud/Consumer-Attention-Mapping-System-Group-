import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ComponentErrorBoundary from "../../components/ComponentErrorBoundary";


export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState("logs"); // 'logs' | 'dashboards' | 'incidents' | 'compliance'
  const [searchTerm, setSearchTerm] = useState("");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("All");

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Searchable Audit Logs
  const auditLogs = [
    { id: "LOG-8801", timestamp: "Today, 10:32 AM", user: "Arjun Sharma (Marketing)", event: "USER_AUTHENTICATION", action: "Successful OAuth2 Login", ip: "192.168.1.42", category: "Auth", status: "Success" },
    { id: "LOG-8802", timestamp: "Today, 10:15 AM", user: "Kiran Reddy (Admin)", event: "PERMISSION_CHANGE", action: "Updated Retail Analyst Export privileges", ip: "192.168.1.10", category: "Permissions", status: "Success" },
    { id: "LOG-8803", timestamp: "Today, 09:40 AM", user: "Priya Mehta (Store Mgr)", event: "DATA_ACCESS", action: "Accessed Store 1 Live Stream CAM-001", ip: "192.168.1.31", category: "Data Access", status: "Success" },
    { id: "LOG-8804", timestamp: "Yesterday, 11:22 PM", user: "Rohan Verma", event: "AUTH_FAILURE", action: "Failed password attempt (3 tries)", ip: "203.45.12.88", category: "Security", status: "Warning" },
    { id: "LOG-8805", timestamp: "Yesterday, 03:14 AM", user: "System Firewall", event: "SUSPICIOUS_ACTIVITY", action: "Blocked brute force IP attempt", ip: "45.142.120.9", category: "Incident", status: "Blocked" },
  ];

  // Event Distribution Stats
  const eventDistribution = [
    { category: "Authentication", count: 1420 },
    { category: "Data Access", count: 3280 },
    { category: "Permissions", count: 180 },
    { category: "Security Alerts", count: 42 },
    { category: "Config Changes", count: 210 },
  ];

  // Active Security Incidents
  const securityIncidents = [
    { id: "INC-401", title: "Unrecognized IP Authentication Attempt", source: "IP 45.142.120.9", severity: "High", status: "Mitigated (Blocked)", time: "Yesterday, 03:14 AM" },
    { id: "INC-402", title: "Elevated Privilege Usage Flag", source: "Kiran Reddy", severity: "Info", status: "Audit Approved", time: "Today, 10:15 AM" }
  ];

  // Compliance Status
  const complianceItems = [
    { standard: "GDPR Consumer Privacy Masking", status: "100% Compliant", detail: "Real-time facial blur filter active on video stream pipeline." },
    { standard: "TLS 1.3 RTSP Stream Encryption", status: "100% Compliant", detail: "AES-256 encrypted video payloads between edge and backend." },
    { standard: "SOC2 Audit Data Retention", status: "100% Compliant", detail: "Automated 90-day event log archiving policy active." },
  ];

  const filteredLogs = auditLogs.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(searchTerm.toLowerCase()) || l.action.toLowerCase().includes(searchTerm.toLowerCase()) || l.ip.includes(searchTerm);
    const matchCat = eventCategoryFilter === "All" || l.category === eventCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-900 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>🛡️</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-xl font-black text-white tracking-wide">Security & Compliance Audit Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-widest">
              Zero-Trust Audit Log Engine
            </span>
          </div>
        </div>

        <button
          onClick={() => showToast("Exported Security Audit Logs (.CSV)")}
          className="px-4 py-2 bg-[#1E293B] hover:bg-[#273552] text-slate-200 border border-[#334155] rounded-xl text-xs font-bold transition flex items-center gap-2"
        >
          <span>💾</span> Export Audit Logs
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Audit Log Entries</span>
          <h2 className="text-lg font-black text-white font-mono">5,132 Events</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">100% Immutable Record</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Successful vs Failed Logins</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">99.2% Success Ratio</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">0 Active Compromises</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Security Incidents Flagged</span>
          <h2 className="text-lg font-black text-amber-400 font-mono">2 Incidents</h2>
          <span className="text-[10px] text-amber-400 font-bold block">Automated Firewall Blocked</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Regulatory Compliance</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">100% Compliant</h2>
          <span className="text-[10px] text-purple-300 font-bold block">GDPR & SOC2 Verified</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "logs", label: "📜 Searchable Audit Trail Logs", count: filteredLogs.length },
          { id: "dashboards", label: "📊 Event Distribution Statistics", count: "5 Categories" },
          { id: "incidents", label: "⚠️ Security Incidents & Threat Alerts", count: securityIncidents.length },
          { id: "compliance", label: "⚖️ Regulatory & Governance Compliance", count: "3 Standards" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap
              ${activeTab === t.id
                ? "bg-rose-600 text-white shadow-md"
                : "bg-[#0F172A] text-slate-400 border border-[#1E293B] hover:text-white"
              }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-black/30 font-mono">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: AUDIT TRAIL LOGS ──────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Search audit logs by user, IP address, or event action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 flex-1 min-w-[280px]"
            />

            <select
              value={eventCategoryFilter}
              onChange={(e) => setEventCategoryFilter(e.target.value)}
              className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Auth">Auth Events</option>
              <option value="Permissions">Permissions Changes</option>
              <option value="Data Access">Data Access</option>
              <option value="Security">Security Flags</option>
              <option value="Incident">Threat Incidents</option>
            </select>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Log ID & Time</th>
                    <th className="py-3 px-4">User Operator</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Action Detail</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-rose-400 font-mono block">{l.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{l.timestamp}</span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{l.user}</td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">{l.event}</td>
                      <td className="py-3.5 px-4 text-slate-300">{l.action}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{l.ip}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${l.status === "Success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : l.status === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EVENT STATS ───────────────────────────────────────────── */}
      {activeTab === "dashboards" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>📊</span> Security Event Category Distribution
          </h3>
          <div className="h-64 w-full pt-2">
            <ComponentErrorBoundary>
<ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventDistribution}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Bar dataKey="count" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Recorded Events" />
              </BarChart>
            </ResponsiveContainer>
</ComponentErrorBoundary>
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY INCIDENTS ────────────────────────────────────── */}
      {activeTab === "incidents" && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>⚠️</span> Active & Resolved Security Incident Flags
          </h3>
          <div className="space-y-3">
            {securityIncidents.map((inc) => (
              <div key={inc.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{inc.title}</span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">{inc.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">Source: {inc.source} • Time: {inc.time}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400">{inc.status}</span>
                  <button
                    onClick={() => showToast(`Resolved incident flag ${inc.id}`)}
                    className="px-3 py-1 bg-[#1E293B] hover:bg-[#273552] text-xs font-bold text-slate-200 rounded-lg transition"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: COMPLIANCE ────────────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          {complianceItems.map((comp, idx) => (
            <div key={idx} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h4 className="font-extrabold text-white text-sm">{comp.standard}</h4>
                <p className="text-xs text-slate-400 mt-1">{comp.detail}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl">
                ● {comp.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
