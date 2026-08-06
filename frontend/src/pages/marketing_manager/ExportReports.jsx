import React, { useState } from "react";

export default function ExportReports() {
  const [format, setFormat] = useState("PDF");
  const [selected, setSelected] = useState([1, 2]);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const reports = [
    { id: 1, name: "Campaign Performance Report", desc: "Full breakdown of all campaigns including impressions, engagement, and ROI.", size: "2.4 MB", date: "Aug 04, 2026", type: "Campaign" },
    { id: 2, name: "Consumer Attention Analysis", desc: "AI-generated report on consumer attention patterns across all supermarket zones.", size: "3.1 MB", date: "Aug 04, 2026", type: "Attention" },
    { id: 3, name: "Product Visibility Summary", desc: "Shelf-by-shelf product visibility scores and operational recommendations.", size: "1.8 MB", date: "Aug 03, 2026", type: "Visibility" },
    { id: 4, name: "Promotion Effectiveness Report", desc: "Before vs after analysis for all active and completed store promotions.", size: "2.2 MB", date: "Aug 03, 2026", type: "Promotion" },
  ];

  const handleExport = (reportObj) => {
    const reportName = reportObj ? reportObj.name : "CAMS_Retail_Analytics_Report";
    const ext = format === "PDF" ? "pdf" : format === "XLSX" ? "xlsx" : "csv";

    if (format === "PDF") {
      const element = document.createElement("a");
      const file = new Blob([
        `CONSUMER ATTENTION MAPPING SYSTEM (CAMS) - REPORT EXPORT\nReport Name: ${reportName}\nFormat: PDF\nStore: Downtown Supermarket Flagship\nGenerated Date: ${new Date().toLocaleString()}\n\nSUMMARY DATA:\nTotal Visitors: 14,270\nConversion Rate: 18.2%\nAvg Dwell Time: 18.4 min\nSales Revenue: $108,400`
      ], { type: "application/pdf" });
      element.href = URL.createObjectURL(file);
      element.download = `${reportName.replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === "CSV") {
      const csvContent = "data:text/csv;charset=utf-8,Report,Store,Metric,Value\n" +
        `"${reportName}","Downtown Supermarket","Visitors","14270"\n` +
        `"${reportName}","Downtown Supermarket","ConversionRate","18.2%"\n` +
        `"${reportName}","Downtown Supermarket","SalesRevenue","$108400"`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reportName.replace(/\s+/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const file = new Blob([
        `Report: ${reportName}\nStore: Downtown Supermarket\nVisitors: 14270\nConversion: 18.2%\nRevenue: $108400`
      ], { type: "application/vnd.ms-excel" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(file);
      element.download = `${reportName.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* TITLE ONLY HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-wide">Export Reports</h1>
        
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-slate-400 text-xs">Export Format:</span>
          {["PDF", "XLSX", "CSV"].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                format === f ? "bg-amber-600 text-slate-950 border-amber-500" : "bg-[#0A1020] text-slate-400 border-[#1E293B] hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Available Reports</span>
          <h2 className="text-xl font-black text-white">4 Enterprise Reports</h2>
          <span className="text-[10px] text-emerald-400 font-bold">Single Supermarket</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Exports Generated Today</span>
          <h2 className="text-xl font-black text-amber-400">6</h2>
          <span className="text-[10px] text-slate-400 font-bold">Active Engine</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Selected Format</span>
          <h2 className="text-xl font-black text-indigo-400">{format}</h2>
          <span className="text-[10px] text-indigo-400 font-bold">Direct File Download</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium">Selected for Batch Export</span>
          <h2 className="text-xl font-black text-emerald-400">{selected.length}</h2>
          <span className="text-[10px] text-slate-400 font-bold">of {reports.length} reports</span>
        </div>
      </div>

      {/* TWO-COLUMN REPORT MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REPORT SELECTION LIST */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supermarket Reports Directory</h3>
            <button
              onClick={() => handleExport(reports[0])}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              ⬇ Export Selected ({format})
            </button>
          </div>

          <div className="space-y-3">
            {reports.map((r) => {
              const isChecked = selected.includes(r.id);
              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isChecked ? "bg-[#0A1020] border-amber-500/50" : "bg-[#0A1020]/60 border-[#1E293B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(r.id)}
                      className="w-4 h-4 rounded bg-[#070C18] border-[#273449] text-amber-600"
                    />
                    <div>
                      <h4 className="text-white font-bold text-xs">{r.name}</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(r)}
                    className="px-3 py-1 bg-[#1E293B] hover:bg-[#273449] text-slate-200 rounded-lg text-[10px] font-bold border border-[#334155] whitespace-nowrap"
                  >
                    ⬇ {format}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT DOWNLOADS & ENGINE STATUS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Recent File Downloads</h3>
            <div className="space-y-3 pt-3">
              <div className="p-3 bg-[#0A1020] border border-[#1E293B] rounded-xl flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-white font-bold block">Campaign_Performance_Aug04.pdf</span>
                  <span className="text-slate-500 text-[10px]">Just now • 2.4 MB</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">Downloaded</span>
              </div>
              <div className="p-3 bg-[#0A1020] border border-[#1E293B] rounded-xl flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-white font-bold block">Attention_Analysis_Aug04.csv</span>
                  <span className="text-slate-500 text-[10px]">15 mins ago • 1.8 MB</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">Downloaded</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300">
            Export engine compiles live video analytics, dwell time tracking, product interactions, and conversion funnel data into downloadable PDF, Excel, and CSV files.
          </div>
        </div>
      </div>
    </div>
  );
}
