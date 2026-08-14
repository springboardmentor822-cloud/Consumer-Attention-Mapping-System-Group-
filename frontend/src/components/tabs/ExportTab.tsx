"use client";
import React, { useState } from 'react';

type ExportMetric = 'all' | 'products' | 'telemetry' | 'dwell' | 'behavior' | 'shelves' | 'segmentation' | 'visitors';

interface ExportOption {
  metric: ExportMetric;
  label: string;
  description: string;
}

// Every metric this exposes is now actually supported by the backend's
// /dashboard/export endpoint — previously only 'products' and 'telemetry'
// existed there, so buttons for the rest would have been silently rejected.
const CSV_OPTIONS: ExportOption[] = [
  { metric: 'products', label: 'Product Categories', description: 'Units sold, revenue, avg price — from the sales CSV' },
  { metric: 'telemetry', label: 'Live Shopper Telemetry', description: 'Completed camera-tracked sessions' },
  { metric: 'dwell', label: 'Dwell Time by Zone', description: 'Per-zone average dwell + session counts' },
  { metric: 'behavior', label: 'Pause Events Trend', description: 'Hourly pause-event counts (engagement proxy)' },
  { metric: 'shelves', label: 'Shelf Zone Engagement', description: 'Per-zone engagement scores' },
  { metric: 'segmentation', label: 'Customer Segments', description: 'K-Means clusters from transaction data' },
  { metric: 'visitors', label: 'Shopper Demographics', description: 'Gender + membership type breakdown' },
];

export default function ExportTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [pendingMetric, setPendingMetric] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json', metric: ExportMetric) => {
    setIsExporting(true);
    setPendingMetric(metric);
    try {
      const res = await fetch(`http://127.0.0.1:9000/api/v1/dashboard/export?format=${format}&metric=${metric}`);
      if (!res.ok) throw new Error("Network response was not ok");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // .csv opens natively in Excel/Spreadsheets
      a.download = `visionretail_export_${metric}_${new Date().getTime()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Ensure the backend is running.");
    } finally {
      setIsExporting(false);
      setPendingMetric(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-2">Data Export Engine</h3>
        <p className="text-slate-400 text-sm mb-8">Download real telemetry, sales, and camera-tracked engagement data across every domain the dashboard tracks, for external analysis in Excel or BI tools.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CSV / Excel Export Card */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/30 transition-colors group">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h4 className="font-bold text-slate-100">Spreadsheet Data (CSV)</h4>
                <p className="text-xs text-slate-500 mt-1">Compatible with Microsoft Excel & Google Sheets</p>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              {CSV_OPTIONS.map((opt) => (
                <button
                  key={opt.metric}
                  onClick={() => handleExport('csv', opt.metric)}
                  disabled={isExporting}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-600/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-left px-4 flex justify-between items-center disabled:opacity-50"
                >
                  <span>
                    + Export {opt.label}
                    <span className="block text-[9px] font-normal text-slate-500 group-hover:text-slate-400 normal-case mt-0.5">{opt.description}</span>
                  </span>
                  {isExporting && pendingMetric === opt.metric && <span className="text-[9px] text-emerald-400 animate-pulse ml-2 shrink-0">exporting...</span>}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Export Card */}
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl hover:border-cyan-500/30 transition-colors group">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚙️</span>
              <div>
                <h4 className="font-bold text-slate-100">Developer Payload (JSON)</h4>
                <p className="text-xs text-slate-500 mt-1">Raw nested payloads for API & Database testing</p>
              </div>
            </div>
            <div className="space-y-3 mt-6">
              <button 
                onClick={() => handleExport('json', 'all')}
                disabled={isExporting}
                className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-lg hover:bg-cyan-600/20 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-left px-4 disabled:opacity-50"
              >
                + Export Full System Payload (every domain, all sections)
              </button>
              <p className="text-[10px] text-slate-600 px-1">
                Every CSV option on the left is also available as JSON individually — use{' '}
                <code className="text-cyan-400 bg-slate-900 px-1 rounded">?format=json&amp;metric=&lt;name&gt;</code> if you need a single section rather than the full payload.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
