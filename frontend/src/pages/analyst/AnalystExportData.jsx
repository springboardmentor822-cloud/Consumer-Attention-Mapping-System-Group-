import React, { useState } from "react";

const exportFormDefaults = {
  store: "Store #101 - Downtown Flagship",
  dateRange: "Last 7 Days",
  format: "CSV",
  aggregation: "Hourly",
};

const mockHistory = [
  { id: "EXP-842", name: "Shopper_Attention_Metrics_STR101", format: "CSV", date: "2026-08-04 15:30", status: "Completed" },
  { id: "EXP-841", name: "Dwell_Time_Correlation_Matrix", format: "Excel", date: "2026-08-03 11:20", status: "Completed" },
  { id: "EXP-840", name: "Traffic_Flow_Spatial_Node_Vector", format: "JSON", date: "2026-08-02 09:15", status: "Completed" },
  { id: "EXP-839", name: "Customer_Cohort_RFM_Telemetry", format: "Parquet", date: "2026-08-01 16:45", status: "Completed" },
];

export default function AnalystExportData() {
  const [form, setForm] = useState(exportFormDefaults);
  const [modules, setModules] = useState({
    journey: true,
    attention: true,
    segmentation: false,
    behavior: true,
    dwell: false,
    traffic: false,
  });

  const handleToggleModule = (key) => {
    setModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-white">Export Data</h1>
        </div>
        <button className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl text-slate-300 text-xs font-semibold flex items-center space-x-2">
          <span>💾</span><span>Export Session Active</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Export configuration panel */}
        <div className="lg:col-span-8 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Export Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Select Store</label>
              <select value={form.store} onChange={e => setForm({...form, store: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Store #101 - Downtown Flagship</option>
                <option>Store #102 - Westside Mall</option>
                <option>Store #103 - Metro Center</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Temporal Range</label>
              <select value={form.dateRange} onChange={e => setForm({...form, dateRange: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Month to Date</option>
                <option>Custom Range...</option>
              </select>
            </div>
          </div>

          {/* Module selection */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs block">Analytics Modules to Include</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { key: "journey", label: "Customer Journey Flow" },
                { key: "attention", label: "Gaze Fixation scores" },
                { key: "segmentation", label: "RFM Cohort metrics" },
                { key: "behavior", label: "Pickup / Return ratios" },
                { key: "dwell", label: "Zone Dwell summaries" },
                { key: "traffic", label: "Traffic Path node vectors" },
              ].map((m, i) => (
                <button key={i} onClick={() => handleToggleModule(m.key)} className={`p-2.5 border rounded-lg text-left text-xs font-bold transition flex items-center justify-between ${modules[m.key] ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-[#070C18] border-[#1E293B] text-slate-400 hover:text-white"}`}>
                  <span>{m.label}</span>
                  <span className="text-sm">{modules[m.key] ? "✓" : "+"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="text-slate-400 block mb-1">Aggregation Level</label>
              <select value={form.aggregation} onChange={e => setForm({...form, aggregation: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>Raw Event-Level Telemetry</option>
                <option>Hourly Aggregation</option>
                <option>Daily Summary</option>
                <option>Weekly Aggregation</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Target Format</label>
              <select value={form.format} onChange={e => setForm({...form, format: e.target.value})} className="w-full bg-[#070C18] border border-[#1E293B] text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500">
                <option>CSV (Structured values)</option>
                <option>Excel (Formatted workbook)</option>
                <option>JSON Payload (Nested documents)</option>
                <option>Parquet (Columnar analytics format)</option>
              </select>
            </div>
          </div>

          <button className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-extrabold text-xs rounded-lg transition uppercase tracking-wider pt-2">
            Process & Export Selected Datasets
          </button>
        </div>

        {/* History of exports */}
        <div className="lg:col-span-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Export Log</h3>
          <div className="space-y-2">
            {mockHistory.map((hist, i) => (
              <div key={i} className="p-3 bg-[#070C18] border border-[#1E293B] rounded-xl flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[11px] text-white font-bold block truncate">{hist.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{hist.date} · Format: {hist.format}</span>
                </div>
                <button className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex-shrink-0 ml-2">Download</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
