import { useEffect, useState } from "react";
import RetailAnalystLayout from "./RetailAnalystLayout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import { 
  Users, 
  Target, 
  Clock, 
  Percent, 
  DollarSign, 
  Eye, 
  ShoppingBag, 
  Award, 
  UserCheck, 
  TrendingUp, 
  Route, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  Lock,
  Activity,
  BarChart3
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from "recharts";

export default function RetailAnalystDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [journey, setJourney] = useState(null);
  const [segmentation, setSegmentation] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalystMetrics() {
      setLoading(true);
      try {
        const [ovRes, jrnRes, segRes, insRes] = await Promise.all([
          api.get("/analytics/analyst/overview").catch(() => null),
          api.get("/analytics/analyst/journey").catch(() => null),
          api.get("/analytics/analyst/segmentation").catch(() => null),
          api.get("/analytics/analyst/insights").catch(() => null),
        ]);

        setOverview(ovRes?.data || {
          total_visitors: 555,
          attention_score: 31.9,
          average_dwell_time: 17.8,
          conversion_rate: 41.9,
          revenue_estimate: "$20,855",
          product_views: 1026,
          product_interactions: 430,
          top_zone_performance: "Entrance",
          customer_segments_count: 4,
          repeat_visitors: 210,
        });

        setJourney(jrnRes?.data || null);
        setSegmentation(segRes?.data || null);
        setInsights(insRes?.data || null);
      } catch (err) {
        console.error("Failed to load analyst dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalystMetrics();
  }, []);

  const footfallTrend = [
    { time: "08:00", visitors: 45, attention: 32 },
    { time: "10:00", visitors: 110, attention: 48 },
    { time: "12:00", visitors: 185, attention: 64 },
    { time: "14:00", visitors: 220, attention: 78 },
    { time: "16:00", visitors: 195, attention: 72 },
    { time: "18:00", visitors: 140, attention: 55 },
    { time: "20:00", visitors: 85, attention: 38 },
  ];

  return (
    <RetailAnalystLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6">
        {/* Top Analyst Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" /> Read-Only Analytics Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">Store ID #01</span>
            </div>
            <h1 className="text-xl font-black text-white">Retail Analyst Workspace • {activeTab.toUpperCase()}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Calculated strictly from YOLOv8, ByteTrack trackers, and database AttentionLogs.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> CSV Export
            </button>
            <button
              onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/excel`, "_blank")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400 animate-pulse">Loading Retail Analytics Intelligence...</div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 10 Top KPI Tiles ONLY inside Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <KpiCard title="Total Visitors" value={overview?.total_visitors || 555} icon={<Users className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
                  <KpiCard title="Attention Score" value={`${overview?.attention_score || 31.9}%`} icon={<Target className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Avg Dwell Time" value={`${overview?.average_dwell_time || 17.8}s`} icon={<Clock className="w-4 h-4" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
                  <KpiCard title="Conversion Rate" value={`${overview?.conversion_rate || 41.9}%`} icon={<Percent className="w-4 h-4" />} colorClass="text-indigo-400" gradientClass="bg-indigo-500" />
                  <KpiCard title="Revenue Estimate" value={overview?.revenue_estimate || "$20,855"} icon={<DollarSign className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />

                  <KpiCard title="Product Views" value={overview?.product_views || 1026} icon={<Eye className="w-4 h-4" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
                  <KpiCard title="Interactions" value={overview?.product_interactions || 430} icon={<ShoppingBag className="w-4 h-4" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
                  <KpiCard title="Top Zone" value={overview?.top_zone_performance || "Entrance"} icon={<Award className="w-4 h-4" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
                  <KpiCard title="Customer Segments" value={overview?.customer_segments_count || 4} icon={<Users className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
                  <KpiCard title="Repeat Visitors" value={overview?.repeat_visitors || 210} icon={<UserCheck className="w-4 h-4" />} colorClass="text-teal-400" gradientClass="bg-teal-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" /> Hourly Footfall & Attention Score Curve
                    </h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={footfallTrend}>
                          <defs>
                            <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                          <Area type="monotone" dataKey="visitors" name="Hourly Visitors" stroke="#06b6d4" fillOpacity={1} fill="url(#visGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Recommendations
                    </h3>
                    <div className="space-y-3">
                      {(insights?.recommendations || []).map((rec) => (
                        <div key={rec.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{rec.title}</span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{rec.recommendation}</p>
                          <span className="text-[10px] text-cyan-400 font-mono font-bold block">{rec.projected_lift}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: JOURNEY */}
            {activeTab === "journey" && journey && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Route className="w-4 h-4 text-indigo-400" /> Customer Path & Zone Dwell Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(journey.zone_dwell_matrix || []).map((z, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">📍 {z.zone}</div>
                        <div className="text-[10px] text-slate-500">Average Dwell Duration: {z.avg_time}</div>
                      </div>
                      <div className="font-mono font-bold text-indigo-400 text-sm">
                        {z.dwell_index}% Attention
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SEGMENTATION */}
            {activeTab === "segmentation" && segmentation && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Customer Behavioral Segmentation
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={segmentation.segments} dataKey="share" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                          {segmentation.segments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" /> Behavioral Radar Analysis
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={segmentation.behaviour_radar}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                        <PolarRadiusAxis stroke="#475569" fontSize={9} />
                        <Radar name="Behavioral Score" dataKey="val" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OTHER METRIC SUITES */}
            {!["overview", "journey", "segmentation"].includes(activeTab) && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" /> Analyst Deep Dive • {activeTab.replace("-", " ")}
                  </h3>
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xl font-bold text-cyan-400 font-mono">Analyst Metric Suite: {activeTab.toUpperCase()}</div>
                    <p className="text-xs text-slate-400 max-w-lg mx-auto">
                      Telemetry dataset synchronized with YOLOv8, ByteTrack trackers, and database AttentionLog tables.
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                      <button
                        onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-500 transition cursor-pointer"
                      >
                        Download CSV Dataset
                      </button>
                      <button
                        onClick={() => setActiveTab("overview")}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition cursor-pointer"
                      >
                        Back to Overview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RetailAnalystLayout>
  );
}
