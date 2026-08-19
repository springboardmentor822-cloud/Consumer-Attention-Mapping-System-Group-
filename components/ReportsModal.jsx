'use client';

import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

export default function ReportsModal({ isOpen, onClose, reportType = 'Daily Analytics Report' }) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setDownloadComplete(true);
      setTimeout(() => {
        setDownloadComplete(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate & Export Report</h3>
              <p className="text-xs text-slate-400">Consumer Attention Mapping System Analytics PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Report Details Body */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Report Type:</span>
            <span className="font-bold text-white">{reportType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Store:</span>
            <span className="font-bold text-blue-400">Store 01 - City Mall Flagship</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Date Window:</span>
            <span className="font-mono text-slate-300">May 21, 2026 – May 27, 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Included Modules:</span>
            <span className="text-emerald-400 font-semibold">Gaze Heatmaps, SKU Attractiveness, Trajectory Logs</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-500/25"
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                <span>Generating PDF...</span>
              </>
            ) : downloadComplete ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-300" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
