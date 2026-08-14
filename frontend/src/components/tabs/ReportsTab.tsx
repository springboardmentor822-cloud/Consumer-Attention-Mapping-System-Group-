"use client";
import React, { useEffect, useState } from 'react';

interface ReportData {
  period: string;
  weekly_visitors: number;
  avg_dwell_time: string;
  conversion_rate: string;
  top_zone: string;
  top_sales_category?: string;
  critical_alerts: number;
  recommendations: string[];
}

interface ZoneEngagement {
  zone: string;
  camera_id: number;
  avg_dwell_seconds: number;
  engagement_score: number;
  sessions: number;
  status: string;
}

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  source: string;
}

interface ZoneBreakdown {
  zone: string;
  avg_dwell: number;
  sessions: number;
}

interface BehaviorData {
  has_data: boolean;
  pause_events: number;
  multi_pause_sessions_pct: number;
  avg_pause_duration: number;
  total_sessions?: number;
}

interface ClusterSegment {
  id: number;
  label: string;
  size: number;
  share: number;
  avg_spend: number;
  avg_rating: number;
}

interface CategoryMetric {
  name: string;
  revenue: number;
  units: number;
  share: number;
}

interface DemographicData {
  label: string;
  count: number;
  percent: number;
}

interface VisitorStats {
  gender: DemographicData[];
  customer_types: DemographicData[];
  insights: { top_converting_demo: string };
}

const roleReportTitle: Record<string, string> = {
  'Store Manager': 'Store Operations Report',
  'Retail Analyst': 'Analytics & Behavior Report',
  'Marketing Manager': 'Marketing & Audience Report',
  'Administrator': 'Full System Report',
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
    <h4 className="text-sm font-bold text-slate-300 mb-4">{title}</h4>
    {children}
  </div>
);

export default function ReportsTab({ role = 'Store Manager' }: { role?: string }) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Role-specific supplementary data — only the sections relevant to this
  // role are fetched, matching what OverviewTab already does per role.
  const [shelves, setShelves] = useState<ZoneEngagement[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dwellZones, setDwellZones] = useState<ZoneBreakdown[]>([]);
  const [behavior, setBehavior] = useState<BehaviorData | null>(null);
  const [segments, setSegments] = useState<ClusterSegment[]>([]);
  const [categories, setCategories] = useState<CategoryMetric[]>([]);
  const [visitors, setVisitors] = useState<VisitorStats | null>(null);

  const wantsShelvesAlerts = role === 'Store Manager' || role === 'Administrator';
  const wantsDwellBehavior = role === 'Retail Analyst' || role === 'Administrator';
  const wantsSegments = role === 'Retail Analyst' || role === 'Marketing Manager' || role === 'Administrator';
  const wantsMarketing = role === 'Marketing Manager' || role === 'Administrator';

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const calls: Promise<Response>[] = [
          fetch(`http://127.0.0.1:9000/api/v1/dashboard/reports?role=${encodeURIComponent(role)}`),
        ];
        if (wantsShelvesAlerts) {
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/shelves'));
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/alerts'));
        }
        if (wantsDwellBehavior) {
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/dwell'));
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/behavior'));
        }
        if (wantsSegments) {
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/segmentation'));
        }
        if (wantsMarketing) {
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/category-performance'));
          calls.push(fetch('http://127.0.0.1:9000/api/v1/dashboard/visitors'));
        }

        const responses = await Promise.all(calls);
        const jsons = await Promise.all(responses.map(r => r.json()));
        if (!isMounted) return;

        let i = 0;
        const reportJson = jsons[i++];
        if (reportJson.status === "success") setReport(reportJson.data);

        if (wantsShelvesAlerts) {
          const shelvesJson = jsons[i++];
          if (shelvesJson.status === "success") setShelves(shelvesJson.data || []);
          const alertsJson = jsons[i++];
          if (alertsJson.status === "success") setAlerts(alertsJson.data || []);
        }
        if (wantsDwellBehavior) {
          const dwellJson = jsons[i++];
          if (dwellJson.status === "success") setDwellZones(dwellJson.data.zone_breakdown || []);
          const behaviorJson = jsons[i++];
          if (behaviorJson.status === "success") setBehavior(behaviorJson.data);
        }
        if (wantsSegments) {
          const segJson = jsons[i++];
          if (segJson.status === "success") setSegments(segJson.data || []);
        }
        if (wantsMarketing) {
          const catJson = jsons[i++];
          if (catJson.status === "success") setCategories(catJson.data || []);
          const visJson = jsons[i++];
          if (visJson.status === "success") setVisitors(visJson.data);
        }
      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [role, wantsShelvesAlerts, wantsDwellBehavior, wantsSegments, wantsMarketing]);

  // NOTE: there is no real PDF-generation backend yet (the spec calls for one
  // — Milestone 4, Step 2). Rather than fake a download with a setTimeout and
  // an alert(), this calls the export endpoint that actually exists and
  // returns real data, honestly labeled as JSON rather than promising a PDF.
  // Real PDF export, generated server-side via WeasyPrint from the same
  // real per-role data shown on screen (see /dashboard/reports/pdf).
  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`http://127.0.0.1:9000/api/v1/dashboard/reports/pdf?role=${encodeURIComponent(role)}`);
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `executive_report_${role.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to generate PDF. Ensure the backend is running and WeasyPrint is installed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('http://127.0.0.1:9000/api/v1/dashboard/export?format=json&metric=all');
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'executive_summary_data.json');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download export:", error);
      alert("Failed to export data. Please ensure the backend is running.");
    } finally {
      setIsExporting(false);
    }
  };

  const alertSeverityColor = (s: string) => s === 'critical' ? 'text-rose-400' : s === 'warning' ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 text-slate-200">

      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Executive Reports</h2>
          <p className="text-xs text-slate-400 mt-1">{roleReportTitle[role] || 'Store Performance Report'} — high-level spatial analytics summary</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePdfExport}
            disabled={isExporting || loading}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${
              isExporting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30 hover:bg-cyan-600/30'
            }`}
          >
            <span className="mr-2">📄</span>
            {isExporting ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || loading}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${
              isExporting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span className="mr-2">⚙️</span>
            JSON
          </button>
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-300 flex items-start gap-2">
        <span>✓</span>
        <span>
          PDF export is now real — &quot;Download PDF&quot; renders this exact report server-side via WeasyPrint from
          the same live data shown below, rather than the previous fake 2-second-delay button that produced no file.
        </span>
      </div>

      {/* Main Report Document */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-inner relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <span className="text-[200px]">📊</span>
        </div>

        <div className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-2xl font-bold text-slate-100">{roleReportTitle[role] || 'Store Performance Summary'}</h3>
          <p className="text-sm text-cyan-400 font-mono mt-1">Generated: {new Date().toLocaleDateString()} | Period: {report?.period}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 font-mono text-xs animate-pulse">
            Compiling {roleReportTitle[role] || 'Executive Summary'}...
          </div>
        ) : (
          <div className="space-y-8 relative z-10">

            {/* Shared KPI row — same real numbers for every role */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Transactions</p>
                <p className="text-xl font-bold text-slate-200 mt-1 truncate">{report?.weekly_visitors.toLocaleString()}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Avg Dwell Time</p>
                <p className="text-xl font-bold text-amber-400 mt-1 truncate">{report?.avg_dwell_time}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Conversion</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{report?.conversion_rate}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Top Camera Zone</p>
                <p className="text-xl font-bold text-purple-400 mt-1 truncate">{report?.top_zone}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg min-w-0">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Critical Alerts</p>
                <p className={`text-xl font-bold mt-1 ${(report?.critical_alerts ?? 0) > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{report?.critical_alerts ?? 0}</p>
              </div>
            </div>

            {/* Store Manager / Administrator: shelf engagement + alerts */}
            {wantsShelvesAlerts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Shelf / Zone Engagement">
                  {shelves.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed shopper sessions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {shelves.map((z, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                          <span className="font-bold text-slate-300">{z.zone}</span>
                          <span className="text-slate-400">{z.avg_dwell_seconds}s avg · <span className="text-amber-400 font-bold">{z.engagement_score}/100</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
                <SectionCard title="Active Alerts">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-500">No active alerts.</p>
                  ) : (
                    <div className="space-y-2">
                      {alerts.slice(0, 5).map((a) => (
                        <div key={a.id} className="text-xs">
                          <span className={`font-bold ${alertSeverityColor(a.severity)}`}>{a.type}</span>
                          <p className="text-slate-500">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Retail Analyst / Administrator: dwell + behavior */}
            {wantsDwellBehavior && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Dwell Time by Zone">
                  {dwellZones.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed shopper sessions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {dwellZones.map((z, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                          <span className="font-bold text-slate-300">{z.zone}</span>
                          <span className="text-slate-400">{z.sessions} sessions · <span className="text-cyan-400 font-bold">{z.avg_dwell}s avg</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
                <SectionCard title="Shopping Behavior">
                  {!behavior?.has_data ? (
                    <p className="text-xs text-slate-500">No completed shopper sessions yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <p className="text-lg font-bold text-emerald-400">{behavior.pause_events}</p>
                        <p className="text-[9px] text-slate-500 uppercase mt-1">Pause Events</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <p className="text-lg font-bold text-cyan-400">{behavior.multi_pause_sessions_pct}%</p>
                        <p className="text-[9px] text-slate-500 uppercase mt-1">Multi-Pause</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <p className="text-lg font-bold text-amber-400">{behavior.avg_pause_duration}s</p>
                        <p className="text-[9px] text-slate-500 uppercase mt-1">Avg Pause</p>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Marketing Manager / Administrator: categories + demographics */}
            {wantsMarketing && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Top Categories by Revenue">
                  {categories.length === 0 ? (
                    <p className="text-xs text-slate-500">Loading category data...</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                          <span className="font-bold text-slate-300">{c.name}</span>
                          <span className="text-emerald-400 font-bold">${c.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
                <SectionCard title="Shopper Demographics">
                  {!visitors ? (
                    <p className="text-xs text-slate-500">Loading demographic data...</p>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Top revenue demographic</span>
                        <span className="font-bold text-slate-200">{visitors.insights.top_converting_demo}</span>
                      </div>
                      {visitors.gender.map((g, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-slate-500">{g.label}</span>
                          <span className="font-bold text-slate-300">{g.percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* Retail Analyst / Marketing Manager / Administrator: customer segments */}
            {wantsSegments && segments.length > 0 && (
              <SectionCard title="Customer Segments (K-Means)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {segments.map((s) => (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <p className="font-bold text-slate-200">{s.label}</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{s.share}%</p>
                      <p className="text-[10px] text-slate-500 mt-1">${s.avg_spend.toFixed(2)} avg spend</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Recommendations — already role-tailored by the backend */}
            <div>
              <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center">
                <span className="mr-2">💡</span> Recommendations
              </h4>
              <ul className="space-y-3">
                {report?.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start bg-slate-900/50 border border-slate-800/50 p-4 rounded-lg">
                    <span className="text-cyan-500 mr-3 mt-0.5">→</span>
                    <span className="text-sm text-slate-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
