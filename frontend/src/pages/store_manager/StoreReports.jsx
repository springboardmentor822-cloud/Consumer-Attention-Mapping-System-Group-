import React, { useState } from "react";
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts";
import CustomDateSelector from "../../components/CustomDateSelector";

export default function StoreReports() {
  const [selectedReport, setSelectedReport] = useState("Daily Store Summary");
  const [exportFormat, setExportFormat] = useState("PDF");
  const [reportPeriod, setReportPeriod] = useState("Last 7 Days");

  const reportTrends = [
    { date: "May 15", generated: 15, downloads: 8 },
    { date: "May 16", generated: 18, downloads: 10 },
    { date: "May 17", generated: 22, downloads: 12 },
    { date: "May 18", generated: 28, downloads: 16 },
    { date: "May 19", generated: 35, downloads: 20 },
    { date: "May 20", generated: 25, downloads: 15 },
    { date: "May 21", generated: 31, downloads: 18 }
  ];

  const reportsByCategory = [
    { name: "Visitors", val: 8, percent: "33.3%", color: "#2563EB" },
    { name: "Store Traffic", val: 6, percent: "25.0%", color: "#10B981" },
    { name: "Shelf Performance", val: 4, percent: "16.7%", color: "#8B5CF6" },
    { name: "Product Interaction", val: 4, percent: "16.7%", color: "#F59E0B" }
  ];

  const [recentReports, setRecentReports] = useState([
    { id: 1, name: "Daily Store Summary", category: "Summary", dateRange: "Today", generatedOn: "Just Now", format: "PDF", icon: "📄" },
    { id: 2, name: "Visitor Analytics Report", category: "Visitors", dateRange: "Last 7 Days", generatedOn: "1 hour ago", format: "Excel", icon: "👥" },
    { id: 3, name: "Store Traffic Analysis", category: "Store Traffic", dateRange: "Last 7 Days", generatedOn: "2 hours ago", format: "CSV", icon: "📊" },
    { id: 4, name: "Shelf Performance Report", category: "Shelf", dateRange: "Last 30 Days", generatedOn: "Yesterday", format: "PDF", icon: "🛒" }
  ]);

  // Direct File Download Generator (REQUIREMENT 7)
  const handleDownload = (reportName, format) => {
    const ext = format.toLowerCase() === "pdf" ? "pdf" : format.toLowerCase() === "excel" ? "xlsx" : "csv";
    const filename = `${reportName.replace(/\s+/g, "_")}_Export.${ext}`;
    const dummyContent = `CAMS Retail Analytics Report: ${reportName}\nFormat: ${format}\nDate Generated: ${new Date().toLocaleString()}\nStatus: Verified Complete`;
    
    const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportNew = () => {
    handleDownload(selectedReport, exportFormat);
    setRecentReports(prev => [
      { id: Date.now(), name: selectedReport, category: "Operational", dateRange: reportPeriod, generatedOn: "Just Now", format: exportFormat, icon: "📄" },
      ...prev.slice(0, 7)
    ]);
  };

  return (
    <div className="space-y-6 font-sans text-xs pb-6">
      {/* 1. TOP METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Reports Generated</span>
            <h2 className="text-xl font-black text-white">{recentReports.length + 20}</h2>
            <span className="text-[10px] text-emerald-400 font-bold">↑ 14% vs last period</span>
          </div>
          <div className="w-10 h-10 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center text-lg">📄</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Downloads</span>
            <h2 className="text-xl font-black text-white">18</h2>
            <span className="text-[10px] text-emerald-400 font-bold">↑ 12% vs last period</span>
          </div>
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center text-lg">📥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">Data Points Analyzed</span>
            <h2 className="text-xl font-black text-white">2.4M</h2>
            <span className="text-[10px] text-emerald-400 font-bold">Real-time sync</span>
          </div>
          <div className="w-10 h-10 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">👥</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1 font-mono">
            <span className="text-slate-400 text-[11px] block">AI Accuracy</span>
            <h2 className="text-xl font-black text-white">99.8%</h2>
            <span className="text-[10px] text-emerald-400 font-bold">Optimal</span>
          </div>
          <div className="w-10 h-10 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center text-lg">📈</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* REPORT TRENDS LINE CHART */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Report Generation Trends</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportTrends}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={9} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#070C18", borderColor: "#1E293B" }} />
                <Line type="monotone" dataKey="generated" stroke="#2563EB" strokeWidth={2.5} name="Generated" />
                <Line type="monotone" dataKey="downloads" stroke="#10B981" strokeWidth={2.5} name="Downloads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* REPORTS BY CATEGORY DONUT */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-3 font-mono flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reports by Category Share</h3>
          <div className="h-40 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportsByCategory} innerRadius={42} outerRadius={62} dataKey="val">
                  {reportsByCategory.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <strong className="text-sm text-white block">24</strong>
              <span className="text-[9px] text-slate-400 block">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-2 border-t border-[#1E293B]">
            {reportsByCategory.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300">{cat.name}</span>
                </span>
                <span className="text-white font-bold">{cat.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* EXPORT PANEL */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Store Report Exporter</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Operational Report</label>
              <select value={selectedReport} onChange={e => setSelectedReport(e.target.value)} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 outline-none focus:border-cyan-500">
                <option>Daily Store Summary</option>
                <option>Visitor Analytics Report</option>
                <option>Store Traffic Analysis</option>
                <option>Shelf Performance Report</option>
                <option>Product Interaction Report</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Date Range</label>
              <CustomDateSelector value={reportPeriod} onChange={setReportPeriod} />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Export Format</label>
              <div className="flex gap-2">
                {["PDF", "Excel", "CSV"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`flex-1 py-2 border rounded-lg font-bold text-center transition ${
                      exportFormat === fmt ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-[#070C18] border-[#1E293B] text-slate-400"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleExportNew} className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold rounded-lg transition uppercase tracking-wider">
              Generate & Download Report
            </button>
          </div>
        </div>

        {/* RECENT REPORTS HISTORY WITH DIRECT DOWNLOAD (REQUIREMENT 7) */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Export History</h3>
          <div className="space-y-2.5">
            {recentReports.map((r) => (
              <div key={r.id} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 bg-blue-600/20 text-blue-400 rounded">{r.icon}</span>
                  <div>
                    <span className="font-bold text-white block">{r.name}</span>
                    <span className="text-[9px] text-slate-400 block">{r.generatedOn} · Format: {r.format}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(r.name, r.format)}
                  className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                >
                  <span>📥</span> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
