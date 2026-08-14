import React, { useState } from "react";
import { reportHistory, scheduledReports, getCentralScaledData, formatNumber } from "../../services/centralData";
import { useCams } from "../../services/CamsContext";
import CustomDateSelector from "../../components/CustomDateSelector";

export default function AnalystReports() {
  const { globalFilter } = useCams();
  const [localPeriod, setLocalPeriod] = useState(null);

  const activeFilter = localPeriod || globalFilter;
  const centralData = getCentralScaledData(activeFilter);
  const mult = centralData.mult;

  const kpis = [
    { label: "Reports Generated", value: formatNumber(Math.round(142 * (mult > 1 ? mult * 0.2 : mult))), change: "+12 this month", icon: "📄" },
    { label: "Scheduled Reports", value: scheduledReports.length, change: "Active distributions", icon: "⏰" },
    { label: "Downloads This Week", value: formatNumber(Math.round(38 * (mult > 1 ? mult * 0.2 : mult))), change: "↑ 14%", icon: "📥" },
    { label: "Active Subscriptions", value: "8", change: "External stakeholders", icon: "👥" },
  ];

  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState("Executive Summary");
  const [selectedFormat, setSelectedFormat] = useState("PDF");

  const filteredHistory = activeCategory === "All"
    ? reportHistory
    : reportHistory.filter(r => r.type === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Reports & Export</h1>
        </div>
        <CustomDateSelector value={localPeriod || globalFilter?.dateRange} onChange={setLocalPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
            <div className="flex items-center gap-1.5"><span className="text-sm">{k.icon}</span><span className="text-slate-400 text-[10px] font-medium">{k.label}</span></div>
            <h2 className="text-lg font-black text-white font-mono mt-1">{k.value}</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400">{k.change}</span>
          </div>
        ))}
      </div>

      {/* Form + Schedule list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Generate Report Form */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Report Generator</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Report Template</label>
              <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Executive Summary</option>
                <option>Detailed Customer Journey Audit</option>
                <option>Attention Heatmap Analysis</option>
                <option>Product Conversion Analytics</option>
                <option>Category Performance Benchmarks</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Date Range</label>
              <select className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Month to Date</option>
                <option>Year to Date</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Export Format</label>
              <div className="flex gap-2">
                {["PDF", "Excel (XLSX)", "CSV", "JSON"].map((fmt, i) => (
                  <button key={i} onClick={() => setSelectedFormat(fmt)} className={`flex-1 py-2 border rounded-lg font-bold text-center transition ${selectedFormat === fmt ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-[#070C18] border-[#1E293B] text-slate-400 hover:text-white"}`}>
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold rounded-lg transition uppercase tracking-wider">
              Generate & Download Report
            </button>
          </div>
        </div>

        {/* Scheduled Reports List */}
        <div className="lg:col-span-6 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scheduled Distributions</h3>
            <button className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold rounded-lg hover:bg-cyan-500/20 transition">+ Schedule</button>
          </div>
          <div className="space-y-2">
            {scheduledReports.map((sch, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-white font-bold block">{sch.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{sch.frequency} · Format: {sch.format} · {sch.recipients} recipients</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded-lg">ACTIVE</span>
                  <button className="text-slate-500 hover:text-white text-xs">⚙️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Downloadable Report History</h3>
          <div className="flex gap-1.5 text-[10px] font-mono">
            {["All", "Executive", "Analytics", "Operational", "Product"].map((cat, i) => (
              <button key={i} onClick={() => setActiveCategory(cat)} className={`px-2.5 py-1 rounded-lg border transition ${activeCategory === cat ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-[#070C18] border-[#1E293B] text-slate-400 hover:text-white"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead>
              <tr className="border-b border-[#1E293B] text-slate-400">
                <th className="pb-2 pr-3">Report Name</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Format</th><th className="pb-2 pr-3">Generation Date</th><th className="pb-2 pr-3">File Size</th><th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredHistory.map((rep, i) => (
                <tr key={i} className="hover:bg-[#111827]/50 transition">
                  <td className="py-2.5 pr-3 font-bold text-white">{rep.name}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{rep.type}</td>
                  <td className="py-2.5 pr-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rep.format === "PDF" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{rep.format}</span></td>
                  <td className="py-2.5 pr-3 text-slate-300">{rep.date}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{rep.size}</td>
                  <td className="py-2.5"><button className="text-cyan-400 hover:text-cyan-300 font-bold">Download ↓</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
