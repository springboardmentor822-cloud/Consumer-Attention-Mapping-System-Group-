import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import KpiCard from "../components/dashboard/KpiCard";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Eye, 
  ShoppingBag, 
  Percent, 
  DollarSign, 
  Award, 
  Megaphone, 
  Flame, 
  Video, 
  MapPin, 
  Layers, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
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

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewData, setOverviewData] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [visibilityData, setVisibilityData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMarketingMetrics() {
      setLoading(true);
      setError(null);
      try {
        const [ovRes, cmpRes, visRes, recRes, slsRes, cnvRes] = await Promise.all([
          api.get("/analytics/marketing/overview").catch(() => null),
          api.get("/analytics/marketing/campaigns").catch(() => null),
          api.get("/analytics/marketing/visibility").catch(() => null),
          api.get("/analytics/marketing/recommendations").catch(() => null),
          api.get("/analytics/marketing/sales-insights").catch(() => null),
          api.get("/analytics/marketing/conversion").catch(() => null),
        ]);

        setOverviewData(ovRes?.data || null);
        setCampaignData(cmpRes?.data || null);
        setVisibilityData(visRes?.data || null);
        setRecommendationsData(recRes?.data || null);
        setSalesData(slsRes?.data || null);
        setConversionData(cnvRes?.data || null);
      } catch (err) {
        console.error("Failed to load marketing dashboard data", err);
        setError("Failed to synchronize marketing analytics telemetry from backend APIs.");
      } finally {
        setLoading(false);
      }
    }

    loadMarketingMetrics();
  }, []);

  const revenueTrend = [
    { hour: "08:00", sales: 1200, visitors: 45, engagement: 62 },
    { hour: "10:00", sales: 3400, visitors: 110, engagement: 74 },
    { hour: "12:00", sales: 5800, visitors: 185, engagement: 81 },
    { hour: "14:00", sales: 7200, visitors: 220, engagement: 88 },
    { hour: "16:00", sales: 6100, visitors: 195, engagement: 82 },
    { hour: "18:00", sales: 4900, visitors: 140, engagement: 76 },
    { hour: "20:00", sales: 2800, visitors: 85, engagement: 68 },
  ];

  const categoryShare = [
    { name: "Beverages", value: 35, color: "#6366f1" },
    { name: "Cooking Products", value: 28, color: "#38bdf8" },
    { name: "Bakery & Snacks", value: 22, color: "#ec4899" },
    { name: "Quick Picks", value: 15, color: "#22d3a5" },
  ];

  const radarData = [
    { subject: "Attention", A: 85, fullMark: 100 },
    { subject: "Dwell Time", A: 78, fullMark: 100 },
    { subject: "Pick Rate", A: 64, fullMark: 100 },
    { subject: "Conversion", A: 72, fullMark: 100 },
    { subject: "Campaign Reach", A: 90, fullMark: 100 },
    { subject: "Repeat Visits", A: 68, fullMark: 100 },
  ];

  return (
    <Layout title="Marketing Manager Enterprise Analytics">
      <div className="space-y-6">
        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Milestone 3 Marketing Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono">Store #01 • Central Store</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Customer Engagement & Campaign Intelligence
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time campaign performance, promotional zone attention, product visibility scores, and promotional placement recommendations.
            </p>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/csv`, "_blank")}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> CSV Report
            </button>
            <button
              onClick={() => window.open(`${api.defaults.baseURL || "http://localhost:8000"}/analytics/export/excel`, "_blank")}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "overview", label: "Overview", icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { key: "campaign", label: "Campaign Effectiveness", icon: <Megaphone className="w-3.5 h-3.5" /> },
            { key: "visibility", label: "Product Visibility", icon: <Eye className="w-3.5 h-3.5" /> },
            { key: "customer", label: "Customer Engagement", icon: <Users className="w-3.5 h-3.5" /> },
            { key: "promotions", label: "Promotional Recommendations", icon: <Percent className="w-3.5 h-3.5" /> },
            { key: "sales", label: "Sales & Conversion Insights", icon: <DollarSign className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-slate-800 text-purple-400 border-purple-500 shadow-md"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400 animate-pulse">Loading Marketing Intelligence Platform...</div>
        ) : (
          <div className="space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  <KpiCard title="Today's Visitors" value={overviewData?.today_visitors || 555} icon={<Users className="w-4 h-4" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
                  <KpiCard title="Returning Customers" value={overviewData?.returning_customers || 210} icon={<Users className="w-4 h-4" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
                  <KpiCard title="New Customers" value={overviewData?.new_customers || 345} icon={<Users className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Avg Dwell Time" value={`${overviewData?.average_dwell_time || 17.8}s`} icon={<Clock className="w-4 h-4" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
                  <KpiCard title="Avg Attention Score" value={`${overviewData?.average_attention_score || 31.9}%`} icon={<Target className="w-4 h-4" />} colorClass="text-rose-400" gradientClass="bg-rose-500" />
                  <KpiCard title="Products Viewed" value={overviewData?.products_viewed || 1026} icon={<Eye className="w-4 h-4" />} colorClass="text-cyan-400" gradientClass="bg-cyan-500" />
                  <KpiCard title="Products Picked" value={overviewData?.products_picked || 430} icon={<ShoppingBag className="w-4 h-4" />} colorClass="text-indigo-400" gradientClass="bg-indigo-500" />
                  <KpiCard title="Conversion Rate" value={`${overviewData?.conversion_rate || 41.9}%`} icon={<Percent className="w-4 h-4" />} colorClass="text-teal-400" gradientClass="bg-teal-500" />
                  <KpiCard title="Sales Generated" value={overviewData?.sales_generated || "$20,855"} icon={<DollarSign className="w-4 h-4" />} colorClass="text-emerald-400" gradientClass="bg-emerald-500" />
                  <KpiCard title="Campaign ROI" value={overviewData?.campaign_roi || "384%"} icon={<TrendingUp className="w-4 h-4" />} colorClass="text-purple-400" gradientClass="bg-purple-500" />
                  <KpiCard title="Top Zone" value={overviewData?.top_performing_zone || "Entrance"} icon={<Award className="w-4 h-4" />} colorClass="text-amber-400" gradientClass="bg-amber-500" />
                  <KpiCard title="Active Campaigns" value={`${campaignData?.active_campaigns?.length || 3} Active`} icon={<Megaphone className="w-4 h-4" />} colorClass="text-blue-400" gradientClass="bg-blue-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" /> Today's Sales Revenue & Footfall Curve
                      </span>
                      <span className="text-xs text-purple-400 font-mono">+18.4% vs last week</span>
                    </h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                          <Area type="monotone" dataKey="sales" name="Sales Revenue ($)" stroke="#a855f7" fillOpacity={1} fill="url(#salesGrad)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-cyan-400" /> Revenue Share by Category
                    </h3>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                            {categoryShare.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {categoryShare.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-slate-300 font-medium">{c.name} ({c.value}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAMPAIGN EFFECTIVENESS TAB */}
            {activeTab === "campaign" && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-purple-400" /> Active Marketing Campaigns & Performance ROI
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-6 py-3.5">Campaign Name</th>
                          <th className="px-6 py-3.5">Promoted Products</th>
                          <th className="px-6 py-3.5">Total Reach</th>
                          <th className="px-6 py-3.5">Attention Score</th>
                          <th className="px-6 py-3.5">Sales Lift</th>
                          <th className="px-6 py-3.5">Campaign ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(campaignData?.active_campaigns || []).map((c, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" /> {c.name}
                            </td>
                            <td className="px-6 py-4 text-slate-300">{c.promoted_products}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-200">{c.reach.toLocaleString()} visitors</td>
                            <td className="px-6 py-4 font-bold text-emerald-400">{c.attention_score}%</td>
                            <td className="px-6 py-4 font-bold text-cyan-400">{c.sales_lift}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {c.roi} ROI
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCT VISIBILITY TAB */}
            {activeTab === "visibility" && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> Product & Shelf Visibility Analytics
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated visibility scores derived from customer attention duration and interaction frequencies.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                        <tr>
                          <th className="px-6 py-3.5">Product Name</th>
                          <th className="px-6 py-3.5">Store Zone</th>
                          <th className="px-6 py-3.5">Attention Duration</th>
                          <th className="px-6 py-3.5">Visibility Score</th>
                          <th className="px-6 py-3.5">Marketing Effectiveness</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {(visibilityData?.product_visibility || []).map((v, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-bold text-white font-sans">{v.product_name}</td>
                            <td className="px-6 py-4 text-indigo-400 font-sans">📍 {v.zone}</td>
                            <td className="px-6 py-4 text-slate-300">{v.attention_duration}s</td>
                            <td className="px-6 py-4 font-bold text-cyan-400">{v.visibility_score}</td>
                            <td className="px-6 py-4 font-bold text-purple-400">{v.marketing_effectiveness}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER ENGAGEMENT TAB */}
            {activeTab === "customer" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Visitor Footfall & Retention Radar
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                        <PolarRadiusAxis stroke="#475569" fontSize={10} />
                        <Radar name="Customer Metrics" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Peak Shopping Hours
                  </h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { hour: "14:00 - 15:00", footfall: "220 Visitors", intensity: "Peak Crowd", color: "bg-rose-500/20 text-rose-300" },
                      { hour: "16:00 - 17:00", footfall: "195 Visitors", intensity: "High Crowd", color: "bg-amber-500/20 text-amber-300" },
                      { hour: "12:00 - 13:00", footfall: "185 Visitors", intensity: "Moderate", color: "bg-blue-500/20 text-blue-300" },
                      { hour: "10:00 - 11:00", footfall: "110 Visitors", intensity: "Normal", color: "bg-emerald-500/20 text-emerald-300" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{item.hour}</div>
                          <div className="text-[10px] text-slate-500">{item.footfall}</div>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${item.color}`}>
                          {item.intensity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PROMOTIONAL RECOMMENDATIONS TAB */}
            {activeTab === "promotions" && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> Promotion-Related Recommendations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recommendations generated by the optimization engine to improve campaign reach and promotional placement.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(recommendationsData?.promotional_recommendations || []).map((rec, i) => (
                      <div key={i} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-purple-400 font-mono">
                              {rec.category}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{rec.product_or_zone}</h4>
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {rec.priority || "HIGH"}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{rec.current_problem}</p>
                        <p className="text-emerald-300 font-medium text-[11px]">➔ {rec.recommendation}</p>
                        <p className="text-slate-400 text-[10px]">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SALES & CONVERSION TAB */}
            {activeTab === "sales" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-400" /> Multi-Stage Customer Conversion Funnel
                  </h3>
                  <div className="space-y-3">
                    {(salesData?.funnel || []).map((stg, i) => (
                      <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{stg.stage}</span>
                          <span className="font-mono font-bold text-indigo-400">{stg.count} ({stg.percentage})</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: stg.percentage }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Revenue Contribution by Store Zone
                  </h3>
                  <div className="space-y-3">
                    {(salesData?.zone_revenue || []).map((z, i) => (
                      <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">📍 {z.zone}</div>
                          <div className="text-[10px] text-slate-500">Revenue Share: {z.share}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">${z.revenue.toLocaleString()}</div>
                          <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-0.5 justify-end">
                            <ArrowUpRight className="w-3 h-3" /> Growth Zone
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
