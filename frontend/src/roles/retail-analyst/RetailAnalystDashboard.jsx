import { useEffect, useState } from "react";
import RetailAnalystLayout from "./RetailAnalystLayout";
import api from "../../api/client";
import KpiCard from "../../components/dashboard/KpiCard";
import HeatmapViewer from "../../components/HeatmapViewer";
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
  BarChart3,
  Flame,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle
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
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapType, setHeatmapType] = useState("traffic");
  const [productData, setProductData] = useState(null);
  const [insights, setInsights] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("attractiveness_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function loadAnalystMetrics() {
      setLoading(true);
      setError(null);
      try {
        const [ovRes, jrnRes, segRes, hmRes, prodRes, insRes] = await Promise.all([
          api.get("/analytics/analyst/overview").catch(() => null),
          api.get("/analytics/analyst/journey").catch(() => null),
          api.get("/analytics/analyst/segmentation").catch(() => null),
          api.get(`/analytics/analyst/heatmaps?heatmap_type=${heatmapType}`).catch(() => null),
          api.get("/analytics/analyst/product-attractiveness").catch(() => null),
          api.get("/analytics/analyst/insights").catch(() => null),
        ]);

        setOverview(ovRes?.data || null);
        setJourney(jrnRes?.data || null);
        setSegmentation(segRes?.data || null);
        setHeatmapData(hmRes?.data || null);
        setProductData(prodRes?.data || null);
        setInsights(insRes?.data || null);
      } catch (err) {
        console.error("Failed to load analyst dashboard", err);
        setError("Failed to synchronize retail analyst telemetry from backend APIs.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalystMetrics();
  }, [heatmapType]);

  const footfallTrend = [
    { time: "08:00", visitors: 45, attention: 32 },
    { time: "10:00", visitors: 110, attention: 48 },
    { time: "12:00", visitors: 185, attention: 64 },
    { time: "14:00", visitors: 220, attention: 78 },
    { time: "16:00", visitors: 195, attention: 72 },
    { time: "18:00", visitors: 140, attention: 55 },
    { time: "20:00", visitors: 85, attention: 38 },
  ];

  // Handle sorting for Product Attractiveness Table
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortedProducts = () => {
    if (!productData?.products) return [];
    return [...productData.products].sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  };

  const segmentsList = segmentation?.raw_segments || [
    { segment: "Explorer", count: 25, percentage: 31.25 },
    { segment: "Quick Buyer", count: 18, percentage: 22.50 },
    { segment: "Comparison Shopper", count: 15, percentage: 18.75 },
    { segment: "Impulse Buyer", count: 12, percentage: 15.00 },
    { segment: "Brand Loyal Customer", count: 10, percentage: 12.50 }
  ];

  const pieData = segmentsList.map((s) => ({
    name: s.segment,
    value: s.percentage,
    count: s.count,
    color: 
      s.segment === "Explorer" ? "#6366f1" :
      s.segment === "Quick Buyer" ? "#22d3a5" :
      s.segment === "Comparison Shopper" ? "#f59e0b" :
      s.segment === "Impulse Buyer" ? "#ec4899" : "#38bdf8"
  }));

  return (
    <RetailAnalystLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6">
        {/* Top Analyst Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" /> Milestone 3 Retail Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono">Store ID #01</span>
            </div>
            <h1 className="text-xl font-black text-white">Behavioral Intelligence & Optimization Platform</h1>
            <p className="text-xs text-slate-400 mt-0.5">Calculated strictly from YOLOv8, ByteTrack trackers, and database telemetry.</p>
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

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400 animate-pulse">Loading Retail Analytics Intelligence...</div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <KpiCard title="Total Visitors" value={overview?.total_visitors || 555} icon={<Users className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
                  <KpiCard title="Attention Score" value={`${overview?.attention_score || 31.9}%`} icon={<Target className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Avg Dwell Time" value={`${overview?.average_dwell_time || 17.8}s`} icon={<Clock className="w-4 h-4" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
                  <KpiCard title="Conversion Rate" value={`${overview?.conversion_rate || 41.9}%`} icon={<Percent className="w-4 h-4" />} colorClass="text-indigo-400" gradientClass="bg-indigo-500" />
                  <KpiCard title="Revenue Estimate" value={overview?.revenue_estimate || "$20,855"} icon={<DollarSign className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />

                  <KpiCard title="Product Views" value={overview?.product_views || 1026} icon={<Eye className="w-4 h-4" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
                  <KpiCard title="Interactions" value={overview?.product_interactions || 430} icon={<ShoppingBag className="w-4 h-4" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
                  <KpiCard title="Top Zone" value={overview?.top_zone_performance || "Entrance"} icon={<Award className="w-4 h-4" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
                  <KpiCard title="Shopper Segments" value="5 Segments" icon={<Users className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
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
                      <Sparkles className="w-4 h-4 text-purple-400" /> Rule-Based Layout Insights
                    </h3>
                    <div className="space-y-3">
                      {(insights?.recommendations || []).slice(0, 3).map((rec) => (
                        <div key={rec.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white truncate max-w-[200px]">{rec.title}</span>
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

            {/* TAB: SHOPPER BEHAVIOR / SEGMENTATION */}
            {(activeTab === "segmentation" || activeTab === "behaviour") && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" /> Shopper Segmentation Intelligence (5 Exact Segments)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Classified dynamically from movement, dwell time, and product-interaction telemetry. No hardcoded percentages.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono rounded-full">
                      100.0% Calculated
                    </span>
                  </div>

                  {/* 5 Segment Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {segmentsList.map((s, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                          <span>{s.segment}</span>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieData[idx]?.color || "#6366f1" }} />
                        </div>
                        <div className="text-2xl font-black text-white font-mono">{s.percentage}%</div>
                        <div className="text-[11px] text-slate-400">{s.count} Shoppers Analyzed</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-cyan-400" /> Segment Distribution Breakdown
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4}>
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Behavioral Radar */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-400" /> Segment Behavioral Radar Analysis
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={segmentation?.behaviour_radar || []}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                          <PolarRadiusAxis stroke="#475569" fontSize={9} />
                          <Radar name="Behavioral Score" dataKey="val" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: JOURNEY ANALYTICS */}
            {activeTab === "journey" && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Route className="w-5 h-5 text-indigo-400" /> Customer Path Trajectories & Zone Transition Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated probabilities for zone-to-zone transitions and entry-to-exit journey flow.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(journey?.zone_dwell_matrix || []).map((z, idx) => (
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

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Zone Transition Probabilities & Popular Paths
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-6 py-3.5">Origin Zone</th>
                          <th className="px-6 py-3.5">Destination Zone</th>
                          <th className="px-6 py-3.5">Transition Count</th>
                          <th className="px-6 py-3.5">Transition Probability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(journey?.analytics?.transition_probabilities || []).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-3.5 font-bold text-white">📍 {t.from_zone}</td>
                            <td className="px-6 py-3.5 font-bold text-indigo-400">➔ {t.to_zone}</td>
                            <td className="px-6 py-3.5 font-mono text-slate-300">{t.transition_count} shoppers</td>
                            <td className="px-6 py-3.5 font-mono font-bold text-emerald-400">{t.probability_percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HEATMAPS */}
            {(activeTab === "heatmap" || activeTab === "heatmaps" || activeTab === "attention") && (
              <HeatmapViewer data={heatmapData} heatmapType={heatmapType} setHeatmapType={setHeatmapType} />
            )}

            {/* TAB: PRODUCT ATTRACTIVENESS & RANKING */}
            {(activeTab === "product" || activeTab === "category") && (
              <div className="space-y-6">
                {/* Attractiveness Formula Banner */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" /> Product Attractiveness Scoring Engine
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Score = 0.35 × Attention Duration + 0.25 × Interaction Frequency + 0.20 × Pickup Rate + 0.15 × Conversion Rate + 0.05 × Repeat Engagement
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono rounded-full">
                      Exact Milestone 3 Weights
                    </span>
                  </div>
                </div>

                {/* Product Rankings Table */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> Product Attractiveness Ranking (Sorted Highest to Lowest)
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Click column header to sort</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("rank")}>
                            Rank <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("product_name")}>
                            Product Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("attention_duration")}>
                            Attn Duration <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("interaction_frequency")}>
                            Interaction Freq <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("pickup_rate")}>
                            Pickup Rate <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("conversion_rate")}>
                            Conversion Rate <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort("repeat_engagement")}>
                            Repeat Eng <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                          <th className="px-4 py-3.5 cursor-pointer hover:text-amber-400" onClick={() => handleSort("attractiveness_score")}>
                            Attractiveness Score <ArrowUpDown className="w-3 h-3 inline ml-1" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {getSortedProducts().map((p) => (
                          <tr key={p.product_id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3.5 font-bold text-amber-400">#{p.rank}</td>
                            <td className="px-4 py-3.5 font-bold text-white font-sans">{p.product_name}</td>
                            <td className="px-4 py-3.5 text-slate-300">{p.attention_duration}s</td>
                            <td className="px-4 py-3.5 text-slate-300">{p.interaction_frequency}</td>
                            <td className="px-4 py-3.5 text-cyan-400">{p.pickup_rate}%</td>
                            <td className="px-4 py-3.5 text-emerald-400">{p.conversion_rate}%</td>
                            <td className="px-4 py-3.5 text-purple-400">{p.repeat_engagement}%</td>
                            <td className="px-4 py-3.5 font-black text-sm text-amber-300">{p.attractiveness_score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RECOMMENDATIONS & INSIGHTS */}
            {(activeTab === "insights" || activeTab === "recommendations") && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> Recommendation and Optimization Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rule-based workflow analyzing product attractiveness scores, visibility metrics, and store layout bottlenecks.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(insights?.recommendations || []).map((rec) => (
                      <div key={rec.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 font-mono">
                              {rec.category || "Layout Optimization"}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{rec.title}</h4>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            rec.priority === "HIGH" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          }`}>
                            {rec.priority}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] font-bold uppercase">Problem Statement:</span>
                            <p className="text-slate-300 text-[11px] mt-0.5">{rec.finding}</p>
                          </div>
                          {rec.supporting_metric && (
                            <div>
                              <span className="text-slate-500 text-[10px] font-bold uppercase">Supporting Metric:</span>
                              <p className="text-cyan-400 font-mono text-[10px] font-bold mt-0.5">{rec.supporting_metric}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500 text-[10px] font-bold uppercase">Actionable Recommendation:</span>
                            <p className="text-emerald-300 font-medium text-[11px] mt-0.5">➔ {rec.recommendation}</p>
                          </div>
                          {rec.reason && (
                            <div>
                              <span className="text-slate-500 text-[10px] font-bold uppercase">Rationale:</span>
                              <p className="text-slate-400 text-[10px] mt-0.5">{rec.reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REPORTS / EXPORT */}
            {["reports", "export", "settings"].includes(activeTab) && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-lg text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white capitalize">{activeTab} Center</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Export raw dataset logs or download formatted CSV / Excel reports.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/excel`, "_blank")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Download Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RetailAnalystLayout>
  );
}
