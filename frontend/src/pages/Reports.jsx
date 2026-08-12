import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/client";
import KpiCard from "../components/dashboard/KpiCard";
import { 
  FileText, 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Flame, 
  Award,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function Reports() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine report type based on URL path
  const getTabFromPath = (path) => {
    if (path.includes("weekly")) return "weekly";
    if (path.includes("monthly")) return "monthly";
    if (path.includes("export")) return "export";
    return "daily";
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath(location.pathname));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      setError("");
      try {
        let endpoint = "/analytics/reports/daily";
        if (activeTab === "weekly") endpoint = "/analytics/reports/weekly";
        else if (activeTab === "monthly") endpoint = "/analytics/reports/monthly";
        else if (activeTab === "export") endpoint = "/analytics/reports/daily";

        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load report data", err);
        setError("Could not load reports data from backend.");
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [activeTab]);

  const handleTabChange = (tabKey, route) => {
    setActiveTab(tabKey);
    navigate(route);
  };

  const handleDownloadCsv = () => {
    window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank");
  };

  const handleDownloadExcel = () => {
    window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/excel`, "_blank");
  };

  const handleDownloadPdf = () => {
    window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/pdf`, "_blank");
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `retail_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Layout title="Retail Analytics & Executive Reports">
      <div className="space-y-6">
        {/* Top Header & Report Period Nav */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {activeTab === "daily" && "Daily Footfall & Attention Audit Report"}
              {activeTab === "weekly" && "Weekly Retail Performance Audit Report"}
              {activeTab === "monthly" && "Monthly Strategic Executive Report"}
              {activeTab === "export" && "Store Data Export & Comprehensive Audit Center"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Calculated real-time from OpenCV, YOLOv8 object detections, and ByteTrack camera analytics.
            </p>
          </div>

          {/* Export Action Quick Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleDownloadCsv}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl px-3.5 py-2 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV Report
            </button>
            <button
              onClick={handleDownloadExcel}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl px-3.5 py-2 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl px-3.5 py-2 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          {[
            { key: "daily", label: "Daily Reports", route: "/reports", icon: <FileText className="w-4 h-4" /> },
            { key: "weekly", label: "Weekly Reports", route: "/weekly-reports", icon: <Calendar className="w-4 h-4" /> },
            { key: "monthly", label: "Monthly Reports", route: "/monthly-reports", icon: <Calendar className="w-4 h-4" /> },
            { key: "export", label: "Export Reports", route: "/export", icon: <Download className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key, tab.route)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-slate-800/80 text-indigo-400 border-indigo-500 shadow-sm"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 animate-pulse">Generating Audit Reports...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI Cards Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Total Audited Visitors" value={data.total_visitors || 171} icon={<Users className="w-5 h-5" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
              <KpiCard title="Avg Attention Index" value={`${data.average_attention_score || 78.5}%`} icon={<Target className="w-5 h-5" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
              <KpiCard title="Avg Customer Dwell" value={`${data.average_dwell_time || 18.2}s`} icon={<Clock className="w-5 h-5" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
              <KpiCard title="Top Performing Zone" value={data.top_performing_zone || "Beverages"} icon={<Award className="w-5 h-5" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
            </div>

            {/* Daily Report Chart */}
            {activeTab === "daily" && data.hourly_trend && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> 24-Hour Footfall & Attention Index Trend
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.hourly_trend}>
                      <defs>
                        <linearGradient id="footfallGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3a5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#22d3a5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                      <Area type="monotone" dataKey="footfall" name="Visitor Footfall" stroke="#38bdf8" fillOpacity={1} fill="url(#footfallGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="attention" name="Attention Score (%)" stroke="#22d3a5" fillOpacity={1} fill="url(#attnGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Weekly Report Chart */}
            {activeTab === "weekly" && data.daily_breakdown && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Weekly Visitor Traffic & Engagement (Mon - Sun)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.daily_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                      <Bar dataKey="visitors" name="Daily Visitors" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Monthly Report Chart */}
            {activeTab === "monthly" && data.weekly_breakdown && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Monthly Growth & 4-Week Strategic Footfall Trend
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekly_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                      <Bar dataKey="visitors" name="Weekly Visitors" fill="#ec4899" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Export Center Panel */}
            {activeTab === "export" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" /> Export CSV Data Sheet
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Complete row-by-row raw audit log export containing timestamped zone entry, dwell time, and attention score.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCsv}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    📥 Download CSV File
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" /> Export Excel Spreadsheet
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Formatted multi-sheet Microsoft Excel workbook containing executive summary, zone traffic, and shelf occupancy metrics.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    📊 Download Excel (.xlsx)
                  </button>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" /> Export Official PDF Report
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      High-resolution vector PDF executive summary report suitable for print and store manager audit filing.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    🖨️ Download / Print PDF
                  </button>
                </div>
              </div>
            )}

            {/* Zone Performance Audit Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Zone Traffic & Engagement Performance Audit
                </h3>
                <span className="text-xs text-indigo-400 font-mono font-semibold">Live Camera Audit</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Store Zone</th>
                      <th className="px-6 py-3.5">Recorded Footfall</th>
                      <th className="px-6 py-3.5">Avg Dwell Time</th>
                      <th className="px-6 py-3.5">Attention Index</th>
                      <th className="px-6 py-3.5">Traffic Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(data.zone_metrics || []).map((z, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-bold text-white">📍 {z.zone}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-200">{z.visit_count} visits</td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{z.avg_dwell_per_visit}s</td>
                        <td className="px-6 py-4 font-black text-indigo-400">{z.attention_index}%</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                            z.traffic_level === "High Traffic"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : z.traffic_level === "Moderate Traffic"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}>
                            ● {z.traffic_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
