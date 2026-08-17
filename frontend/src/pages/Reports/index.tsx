import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { reportsApi, Report } from '../../api/reports';
import { useAuth } from '../../contexts/AuthContext';

export function ReportsPage(): JSX.Element {
  const { user } = useAuth();
  const storeId = user?.store_id || undefined;
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetchReports();
  }, [storeId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getReports(storeId);
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type: string, format: string) => {
    setGenerating(`${type}-${format}`);
    try {
      await reportsApi.generateReport(type, format, storeId);
      await fetchReports(); // Refresh list
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      await reportsApi.downloadReport(reportId);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const reportTypes = [
    { id: 'consumer_attention', name: 'Consumer Attention Summary', desc: 'Weekly metrics on foot traffic and dwell times.' },
    { id: 'shelf_performance', name: 'Shelf Layout Performance', desc: 'Analytics on shelf engagement and interaction rates.' },
    { id: 'marketing_campaign', name: 'Marketing Campaign ROI', desc: 'Detailed breakdown of campaign effectiveness.' }
  ];

  if (loading) {
    return <div className="p-8 text-center"><div className="animate-pulse">Loading reports...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold">Reporting & Data Export</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate and download comprehensive analytics reports.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportTypes.map(rt => (
              <div key={rt.id} className="p-4 border border-border/50 rounded-lg bg-card/30 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">{rt.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{rt.desc}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={generating !== null}
                    onClick={() => handleGenerate(rt.id, 'pdf')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 flex items-center gap-1 text-xs"
                    title="Generate PDF"
                  >
                    {generating === `${rt.id}-pdf` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-rose-400" />}
                    PDF
                  </button>
                  <button 
                    disabled={generating !== null}
                    onClick={() => handleGenerate(rt.id, 'xlsx')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50 flex items-center gap-1 text-xs"
                    title="Generate Excel"
                  >
                    {generating === `${rt.id}-xlsx` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                    XLSX
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/60">
          <CardHeader>
            <CardTitle>Recent Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-card/30">
                  <div className="flex items-center gap-3">
                    {report.format === 'pdf' ? <FileText className="w-8 h-8 text-rose-500/70" /> : <FileSpreadsheet className="w-8 h-8 text-emerald-500/70" />}
                    <div>
                      <p className="text-sm font-semibold">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleString()} • {report.format.toUpperCase()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(report.id)}
                    className="p-2 text-muted-foreground hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No reports generated yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
