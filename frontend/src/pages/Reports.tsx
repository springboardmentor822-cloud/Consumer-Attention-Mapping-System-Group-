import React, { useState, useEffect } from 'react';
import { FileText, Download, Table, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/axios';

interface StoreItem {
  id: string;
  name: string;
  location: string;
}

export default function Reports() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [reportType, setReportType] = useState<string>('daily');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    apiClient.get<StoreItem[]>('/api/stores/')
      .then(res => {
        setStores(res.data);
        if (res.data.length > 0) {
          setSelectedStore(res.data[0].id);
        }
      })
      .catch(err => console.error("Error loading stores for reports", err));
  }, []);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const url = `/api/reports/export/${format}?store_id=${selectedStore}`;
      const response = await apiClient.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `attention_intelligence_report_${reportType}_${selectedStore}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setStatusMsg({ type: 'success', text: `${format.toUpperCase()} report generated and downloaded successfully!` });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: "Failed to generate report from live database. Please check connection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-8 shadow-lg max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 bg-indigo-600/10 rounded-lg text-indigo-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Live Executive Reports Compiler</h2>
          <p className="text-xs text-slate-400">Select parameters to extract real attention tracking logs and compile downloadable formats.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Store footprint Selector */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Store Footprint</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location})
              </option>
            ))}
          </select>
        </div>

        {/* Report Duration Range */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregation Interval</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'daily', label: 'Daily Analytics' },
              { id: 'weekly', label: 'Weekly Summary' },
              { id: 'monthly', label: 'Monthly Executive' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setReportType(t.id)}
                className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition ${
                  reportType === t.id
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-850 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={loading || !selectedStore}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-lg transition shadow-md cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
              <span>Compile & Download PDF Report</span>
            </button>

            <button
              onClick={() => handleDownload('excel')}
              disabled={loading || !selectedStore}
              className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-lg transition shadow-md cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>Compile & Download Excel Sheet</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-lg flex items-start space-x-3 text-xs border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
