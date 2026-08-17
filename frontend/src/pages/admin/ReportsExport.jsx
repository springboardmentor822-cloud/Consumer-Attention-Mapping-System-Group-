import React, { useState } from "react";
import { getSession } from "../../../src/utils/auth";

export default function ReportsExport() {
  const [activeTab, setActiveTab] = useState("center"); // 'center' | 'scheduled' | 'templates' | 'history'
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Available Reports List
  const [reportsList, setReportsList] = useState([
    { id: "REP-901", title: "Weekly Consumer Attention & Footfall Analysis", category: "Consumer Analytics", store: "Store 1 - Koramangala", owner: "Arjun Sharma", format: "PDF", status: "Ready", size: "4.2 MB", created: "Today, 08:00 AM", downloads: 14 },
    { id: "REP-902", title: "Monthly Retail Store Operational Performance", category: "Store Performance", store: "All Stores Scope", owner: "Priya Mehta", format: "Excel (.xlsx)", status: "Ready", size: "12.8 MB", created: "Yesterday, 05:30 PM", downloads: 28 },
    { id: "REP-903", title: "AI Model Detection Precision & FPS Benchmark", category: "AI Insights", store: "System Engine", owner: getSession()?.fullName || "Admin User", format: "JSON", status: "Ready", size: "1.4 MB", created: "Aug 2, 2026", downloads: 8 },
    { id: "REP-904", title: "RTSP Camera & Device Diagnostics Summary", category: "Operational Metrics", store: "Store 3 - Hyderabad", owner: "Sneha Patel", format: "CSV", status: "Processing", size: "Generating...", created: "Just now", downloads: 0 },
    { id: "REP-905", title: "Platform Security & Authentication Audit Log", category: "Security Audits", store: "Enterprise Scope", owner: getSession()?.fullName || "Admin User", format: "PDF", status: "Ready", size: "6.5 MB", created: "Aug 1, 2026", downloads: 42 },
  ]);

  // Scheduled Reports
  const scheduledReports = [
    { id: "SCH-01", title: "Daily Store Traffic Executive Brief", frequency: "Daily at 07:00 AM", category: "Consumer Analytics", recipients: "executives@cams-retail.com", format: "PDF", status: "Active" },
    { id: "SCH-02", title: "Weekly Infrastructure & GPU Load Summary", frequency: "Mondays at 06:00 AM", category: "Infrastructure Monitoring", recipients: "sysadmin@cams-retail.com", format: "Excel", status: "Active" }
  ];

  // Report Templates
  const reportTemplates = [
    { id: "TMP-01", name: "Standard Store Performance Dashboard Template", category: "Store Performance", description: "Includes footfall, heatmaps, dwell times, and shelf conversion rates." },
    { id: "TMP-02", name: "Executive AI Attention Digest", category: "AI Insights", description: "High-level summary of shopper attention index scores and AI recommendations." },
  ];

  const filteredReports = reportsList.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStore = storeFilter === "All" || r.store === storeFilter;
    const matchCat = categoryFilter === "All" || r.category === categoryFilter;
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStore && matchCat && matchStatus;
  });

  const downloadReport = (rep) => {
    showToast(`Downloading ${rep.title} in ${rep.format} format...`);
    setReportsList(reportsList.map(r => r.id === rep.id ? { ...r, downloads: r.downloads + 1 } : r));
  };

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <span>📄</span> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h1 className="text-xl font-black text-white tracking-wide">Reports & Multi-Format Export Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-widest">
              PDF • EXCEL • CSV • JSON
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
        >
          <span>⚡</span> Generate Custom Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Available System Reports</span>
          <h2 className="text-lg font-black text-white font-mono">{reportsList.length} Reports</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">Ready for Instant Download</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Scheduled Auto-Generations</span>
          <h2 className="text-lg font-black text-purple-400 font-mono">{scheduledReports.length} Schedules</h2>
          <span className="text-[10px] text-purple-300 font-bold block">Automated Email Dispatch</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Export Downloads</span>
          <h2 className="text-lg font-black text-cyan-400 font-mono">92 Downloads</h2>
          <span className="text-[10px] text-cyan-400 font-bold block">Download Tracking Active</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase">Supported Export Formats</span>
          <h2 className="text-lg font-black text-emerald-400 font-mono">4 Formats</h2>
          <span className="text-[10px] text-emerald-400 font-bold block">PDF, XLSX, CSV, JSON</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E293B] gap-2 overflow-x-auto pb-1">
        {[
          { id: "center", label: "📄 Centralized Report Directory", count: filteredReports.length },
          { id: "scheduled", label: "⏱️ Scheduled Automated Reports", count: scheduledReports.length },
          { id: "templates", label: "📋 Reusable Report Templates", count: reportTemplates.length },
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

      {/* ── TAB 1: REPORT DIRECTORY ──────────────────────────────────────── */}
      {activeTab === "center" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="🔍 Search reports by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Categories</option>
                <option value="Consumer Analytics">Consumer Analytics</option>
                <option value="Store Performance">Store Performance</option>
                <option value="AI Insights">AI Insights</option>
                <option value="Operational Metrics">Operational Metrics</option>
                <option value="Security Audits">Security Audits</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#070C18] border border-[#1E293B] px-3 py-2 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Ready">Ready</option>
                <option value="Processing">Processing</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{filteredReports.length}</strong> reports
            </span>
          </div>

          {/* Reports Table */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070C18] border-b border-[#1E293B] text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Report Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Store Scope</th>
                    <th className="py-3 px-4">Author / Owner</th>
                    <th className="py-3 px-4">Format & Size</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#1E293B]/40 transition font-medium">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{rep.title}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">{rep.id} • Created {rep.created}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                          {rep.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{rep.store}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-bold">{rep.owner}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{rep.format} ({rep.size})</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${rep.status === "Ready" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}>
                          ● {rep.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {rep.status === "Ready" ? (
                          <button
                            onClick={() => downloadReport(rep)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition shadow-sm flex items-center gap-1.5 ml-auto"
                          >
                            <span>📥</span> Download ({rep.downloads})
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400 animate-pulse">Generating...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SCHEDULED REPORTS ─────────────────────────────────────── */}
      {activeTab === "scheduled" && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>⏱️</span> Automated Recurring Report Schedules
              </h3>
              <button
                onClick={() => showToast("Created new automated report schedule")}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
              >
                + New Schedule
              </button>
            </div>

            <div className="space-y-3">
              {scheduledReports.map((sch) => (
                <div key={sch.id} className="p-4 bg-[#070C18] border border-[#1E293B] rounded-xl flex flex-wrap justify-between items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{sch.title}</span>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {sch.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Frequency: <strong className="text-white">{sch.frequency}</strong> • Format: {sch.format} • Recipients: {sch.recipients}
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ● {sch.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: REPORT TEMPLATES ──────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((tmp) => (
            <div key={tmp.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3 hover:border-slate-600 transition">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-white text-sm">{tmp.name}</span>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                  {tmp.category}
                </span>
              </div>
              <p className="text-xs text-slate-300">{tmp.description}</p>
              <button
                onClick={() => showToast(`Launched report generator from template ${tmp.id}`)}
                className="w-full mt-2 py-2 bg-[#1E293B] hover:bg-[#273552] text-indigo-300 font-bold rounded-xl text-xs transition border border-indigo-500/20"
              >
                Use Template →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: GENERATE CUSTOM REPORT ─────────────────────────────────── */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-extrabold text-white">⚡ Generate Custom Report Document</h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              showToast("Report generation task queued in background!");
              setIsGenerateModalOpen(false);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Report Title</label>
                <input type="text" required placeholder="e.g. Q3 Store Footfall & Attention Analysis" className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Report Module Category</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500">
                  <option>Consumer Analytics & Attention</option>
                  <option>Store Performance Metrics</option>
                  <option>AI Model & Camera Diagnostics</option>
                  <option>Security & Login Audit Logs</option>
                  <option>Infrastructure Utilization</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Export Format</label>
                <select className="w-full bg-[#070C18] border border-[#1E293B] p-2.5 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono">
                  <option>PDF Document (.pdf)</option>
                  <option>Excel Workbook (.xlsx)</option>
                  <option>CSV Raw Dataset (.csv)</option>
                  <option>JSON API Object (.json)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-[#1E293B] text-slate-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition">Generate & Export</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
