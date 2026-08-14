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

  const triggerDownload = (reportObj, overrideFormat = null) => {
    const reportName = reportObj ? reportObj.name : "CAMS_Retail_Analytics_Report";
    const targetFormat = overrideFormat || format;
    const cleanName = reportName.replace(/\s+/g, "_");

    if (targetFormat === "PDF") {
      const content = `=================================================================\n` +
        `CONSUMER ATTENTION MAPPING SYSTEM (CAMS) - RETAIL REPORT\n` +
        `=================================================================\n` +
        `Report Title   : ${reportName}\n` +
        `Format         : PDF Document\n` +
        `Store Location : Flagship Store\n` +
        `Export Date    : ${new Date().toLocaleString()}\n` +
        `-----------------------------------------------------------------\n` +
        `EXECUTIVE SUMMARY METRICS:\n` +
        `• Total Supermarket Visitors : 16,820\n` +
        `• Footfall Conversion Rate   : 18.4%\n` +
        `• Avg Store Dwell Time       : 18.4 mins\n` +
        `• Total Campaign Revenue     : ₹8,92,000\n` +
        `-----------------------------------------------------------------\n` +
        `End of Report.\n`;
      const blob = new Blob([content], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (targetFormat === "CSV") {
      const csvData =
        `Report Title,Store Location,Metric,Value,Date\n` +
        `"${reportName}","Flagship Store","Total Visitors","16820","${new Date().toLocaleDateString()}"\n` +
        `"${reportName}","Flagship Store","Conversion Rate","18.4%","${new Date().toLocaleDateString()}"\n` +
        `"${reportName}","Flagship Store","Avg Dwell Time","18.4 min","${new Date().toLocaleDateString()}"\n` +
        `"${reportName}","Flagship Store","Revenue","₹892000","${new Date().toLocaleDateString()}"\n`;
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const excelContent =
        `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">\n` +
        `<head><meta charset="utf-8"/></head>\n` +
        `<body>\n` +
        `<h2>${reportName}</h2>\n` +
        `<table border="1">\n` +
        `<tr><th>Metric</th><th>Value</th></tr>\n` +
        `<tr><td>Store</td><td>Flagship Supermarket</td></tr>\n` +
        `<tr><td>Visitors</td><td>16820</td></tr>\n` +
        `<tr><td>Conversion</td><td>18.4%</td></tr>\n` +
        `<tr><td>Revenue</td><td>₹892,000</td></tr>\n` +
        `</table>\n` +
        `</body></html>`;
      const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanName}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs text-slate-200 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl shadow-lg">
        <h1 className="text-xl font-black text-white tracking-wide">Export Reports</h1>
        
        <div className="flex items-center space-x-2 font-mono self-end sm:self-auto">
          <span className="text-slate-400 text-xs">Export Format:</span>
          {["PDF", "CSV", "Excel"].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                format === f ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-[#070C18] text-slate-400 border-[#1E293B] hover:text-white"
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
          <span className="text-slate-400 text-[10px] block font-medium font-sans">Available Reports</span>
          <h2 className="text-xl font-black text-white">4 Enterprise Reports</h2>
          <span className="text-[10px] text-emerald-400 font-bold">Live Data Engine</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium font-sans">Exports Generated</span>
          <h2 className="text-xl font-black text-amber-400">12</h2>
          <span className="text-[10px] text-slate-400 font-bold font-sans">Direct File Downloads</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium font-sans">Selected Format</span>
          <h2 className="text-xl font-black text-indigo-400">{format}</h2>
          <span className="text-[10px] text-indigo-400 font-bold font-sans">Auto File Generation</span>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-2xl space-y-1">
          <span className="text-slate-400 text-[10px] block font-medium font-sans">Batch Export Count</span>
          <h2 className="text-xl font-black text-emerald-400">{selected.length}</h2>
          <span className="text-[10px] text-slate-400 font-bold font-sans">of {reports.length} reports</span>
        </div>
      </div>

      {/* REPORT MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REPORT SELECTION LIST */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Supermarket Reports Directory</h3>
            <button
              onClick={() => {
                const selectedReports = reports.filter(r => selected.includes(r.id));
                if (selectedReports.length > 0) {
                  selectedReports.forEach(r => triggerDownload(r));
                } else {
                  triggerDownload(reports[0]);
                }
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
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
                    isChecked ? "bg-[#070C18] border-amber-500/50" : "bg-[#070C18]/60 border-[#1E293B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(r.id)}
                      className="w-4 h-4 rounded bg-[#070C18] border-[#273449] text-amber-600 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-white font-bold text-xs">{r.name}</h4>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {["PDF", "CSV", "Excel"].map(f => (
                      <button
                        key={f}
                        onClick={() => triggerDownload(r, f)}
                        className="px-2 py-1 bg-[#1E293B] hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg text-[9px] font-bold border border-[#334155] transition"
                      >
                        ⬇ {f}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT DOWNLOADS & ENGINE STATUS */}
        <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4 font-mono flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1E293B] pb-3">Recent Direct Downloads</h3>
            <div className="space-y-3 pt-3">
              <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-white font-bold block">Campaign_Performance_Report.pdf</span>
                  <span className="text-slate-500 text-[10px]">Just now • Generated PDF</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">Downloaded</span>
              </div>
              <div className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-white font-bold block">Consumer_Attention_Analysis.csv</span>
                  <span className="text-slate-500 text-[10px]">10 mins ago • Generated CSV</span>
                </div>
                <span className="text-emerald-400 font-bold text-[10px]">Downloaded</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300 font-sans">
            Direct Blob File Engine compiles live video analytics, dwell time tracking, product interactions, and conversion funnel data into downloadable PDF, Excel, and CSV files directly through browser file save.
          </div>
        </div>
      </div>
    </div>
  );
}
