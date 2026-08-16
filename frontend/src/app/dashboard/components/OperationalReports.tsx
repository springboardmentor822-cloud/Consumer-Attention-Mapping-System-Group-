'use client';

import React, { useState } from 'react';
import { 
  FileText, Download, Calendar, Filter, CheckCircle2, 
  BarChart3, TrendingUp, ShoppingBag, Eye, ArrowUpRight, Award, ShieldCheck
} from 'lucide-react';

export default function OperationalReports() {
  const [reportType, setReportType] = useState('Daily Operational Audit');
  const [downloading, setDownloading] = useState(false);

  const reportsList = [
    { title: 'Daily Store Operations & Footfall Audit', date: '21 May 2025', size: '2.4 MB', type: 'PDF', status: 'Ready' },
    { title: 'Weekly Shelf Attention & Conversion Funnel Report', date: '14 - 20 May 2025', size: '4.8 MB', type: 'PDF', status: 'Ready' },
    { title: 'Monthly Product Pickups vs Purchase Velocity', date: '01 - 30 Apr 2025', size: '8.1 MB', type: 'CSV', status: 'Ready' },
    { title: 'Queue Bottleneck & Cashier Performance Log', date: '20 May 2025', size: '1.2 MB', type: 'PDF', status: 'Ready' },
    { title: 'Endcap Promotion Campaign Conversion Report', date: '15 May 2025', size: '3.6 MB', type: 'CSV', status: 'Ready' },
  ];

  const handleDownload = (title: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`Report "${title}" downloaded successfully!`);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/20 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Executive Operational Reports & Audit Exports
          </div>
          <h2 className="text-2xl font-black text-white">Retail Performance Reports</h2>
          <p className="text-xs text-slate-300 mt-1">
            Download comprehensive operational reports, conversion audits, shelf performance evaluations, and PDF/CSV data exports.
          </p>
        </div>

        <button 
          onClick={() => handleDownload('Master Executive Audit Report')}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Exporting PDF...' : 'Download Master PDF Report'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reports Generated</span>
          <div className="text-3xl font-black text-white mt-1">148</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Audits Verified
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Store Efficiency</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">94.8%</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">+3.2% vs last month</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversion Velocity</span>
          <div className="text-3xl font-black text-indigo-400 mt-1">24.6%</div>
          <div className="text-xs text-indigo-400 font-semibold mt-1">Industry target: 20%</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Grade</span>
          <div className="text-3xl font-black text-amber-400 mt-1">Grade A+</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">CAMS Standard Certified</div>
        </div>

      </div>

      {/* Downloadable Reports Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Available Retail Operations Reports
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Select a report to download formatted audit files (PDF/CSV).</p>
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-slate-950 text-xs font-bold text-white border border-slate-700 px-3 py-1.5 rounded-xl outline-none"
            >
              <option>Daily Operational Audit</option>
              <option>Weekly Conversion Funnel</option>
              <option>Monthly Merchandising</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {reportsList.map((r, idx) => (
            <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {r.type}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{r.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-medium">
                    <span>Date: {r.date}</span>
                    <span>•</span>
                    <span>File Size: {r.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  {r.status}
                </span>
                <button 
                  onClick={() => handleDownload(r.title)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
