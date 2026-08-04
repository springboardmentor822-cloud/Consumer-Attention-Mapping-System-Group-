import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ComposedChart, Line, Cell
} from 'recharts';
import { Megaphone, RefreshCw, AlertTriangle, Eye, Award, ArrowRight, ShieldAlert, Sparkles, Filter, Calendar, Bell } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

interface Kpis {
  campaign_reach: number;
  promotion_engagement_percentage: number;
  avg_visibility_score: number;
  conversion_rate_percentage: number;
  avg_attractiveness_score: number;
  campaign_roi_percentage: number;
}

interface CampaignItem {
  name: string;
  engagement_rate: number;
  sales_lift_pct: number;
  attention_generated_hours: number;
}

interface VisibilityItem {
  product_name: string;
  visibility_score: number;
  attention_score: number;
  pickup_rate: number;
  purchase_rate: number;
}

interface ShelfComparisonItem {
  shelf_name: string;
  attention_index: number;
  conversion_rate_percentage: number;
  engagement_percentage: number;
}

interface AiRecommendation {
  id: string;
  recommendation_text: string;
  created_at: string;
  shelf_name: string;
  product_name: string;
}

interface MarketingManagerData {
  kpis: Kpis;
  campaign_performance: CampaignItem[];
  product_visibility: VisibilityItem[];
  shelf_comparison: ShelfComparisonItem[];
  ai_recommendations: AiRecommendation[];
}

interface MarketingManagerDashboardProps {
  storeId: string;
  token: string | null;
  section?: string;
}

export default function MarketingManagerDashboard({ storeId, token, section = 'overview' }: MarketingManagerDashboardProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketingManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('May 16 - May 22, 2025');
  const [filterQuery, setFilterQuery] = useState<string>('All Campaigns');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/marketing/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load marketing dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [storeId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-100 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500 w-10 h-10" />
      <p className="text-slate-400 text-xs font-semibold">Synchronizing Campaign Insights...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-100 p-4">
      <AlertTriangle className="text-rose-500 w-12 h-12 mb-3" />
      <h2 className="text-sm font-bold uppercase tracking-wider">Terminal Offline</h2>
      <p className="text-slate-500 text-xs mt-1">{error || "Connection failure"}</p>
    </div>
  );

  // Mentor-aligned KPI Cards Row
  const kpiList = [
    { label: "Total Campaigns", val: "12", change: "↑ 20%", sub: "vs last 7 days", isPositive: true },
    { label: "Total Impressions", val: "2.45M", change: "↑ 18.6%", sub: "vs last 7 days", isPositive: true },
    { label: "Avg. Attention Time", val: "6.42s", change: "↑ 14.3%", sub: "vs last 7 days", isPositive: true },
    { label: "Engagement Rate", val: "32.8%", change: "↑ 9.7%", sub: "vs last 7 days", isPositive: true },
    { label: "Conversion Rate", val: "14.6%", change: "↑ 7.5%", sub: "vs last 7 days", isPositive: true },
    { label: "Revenue Generated", val: "₹ 8.92L", change: "↑ 22.1%", sub: "vs last 7 days", isPositive: true }
  ];

  // Combined Bar + Line Data (Impressions as bars, Engagement as green line, Conversion as orange line)
  const combinedCampaignData = [
    { period: 'Summer Sale', Impressions: 1.45, Engagement: 34.5, Conversion: 16.2 },
    { period: 'Weekend Bonanza', Impressions: 1.62, Engagement: 28.9, Conversion: 12.7 },
    { period: 'New Arrival', Impressions: 1.10, Engagement: 33.1, Conversion: 14.8 },
    { period: 'Festive Offer', Impressions: 1.50, Engagement: 26.7, Conversion: 11.3 },
    { period: 'Clearance Sale', Impressions: 0.90, Engagement: 19.3, Conversion: 8.6 }
  ];

  // Promotion Effectiveness (Before, After, Increase %)
  const beforeAfterData = [
    { metric: 'Footfall', Before: 12.5, After: 18.9, Increase: 51 },
    { metric: 'Avg. Attn', Before: 4.1, After: 6.8, Increase: 66 },
    { metric: 'Engagement', Before: 21, After: 33, Increase: 57 },
    { metric: 'Conversion', Before: 9.2, After: 14.6, Increase: 59 },
    { metric: 'Revenue', Before: 5.6, After: 8.5, Increase: 51 }
  ];

  // Funnel steps
  const funnelSteps = [
    { step: 'Impressions', val: '2,450,000', percent: '100%', bg: '#6366f1' },
    { step: 'Viewed', val: '1,255,000', percent: '51.2%', bg: '#3b82f6' },
    { step: 'Engaged', val: '802,000', percent: '32.7%', bg: '#10b981' },
    { step: 'Interested', val: '358,000', percent: '14.6%', bg: '#f59e0b' },
    { step: 'Converted', val: '179,000', percent: '7.3%', bg: '#ef4444' }
  ];

  // Shelf visibility scores
  const shelfRankingData = [
    { shelf: 'Shelf A', val: 92 },
    { shelf: 'Shelf B', val: 78 },
    { shelf: 'Shelf C', val: 64 },
    { shelf: 'Shelf D', val: 58 },
    { shelf: 'Shelf E', val: 42 }
  ];

  // Product Attractiveness (Multiple products mapped)
  const radarData = [
    { subject: 'Visual Appeal', 'Product A': 90, 'Product B': 60, 'Product C': 70, 'Product D': 40 },
    { subject: 'Placement', 'Product A': 80, 'Product B': 70, 'Product C': 50, 'Product D': 80 },
    { subject: 'Engagement', 'Product A': 70, 'Product B': 80, 'Product C': 90, 'Product D': 60 },
    { subject: 'Pick Rate', 'Product A': 85, 'Product B': 65, 'Product C': 80, 'Product D': 50 },
    { subject: 'Purchase Impact', 'Product A': 95, 'Product B': 75, 'Product C': 65, 'Product D': 70 }
  ];

  // Scatter plot points
  const scatterPoints = [
    { attention: 2.2, conversion: 6, level: 'Low' },
    { attention: 3.5, conversion: 9, level: 'Low' },
    { attention: 4.8, conversion: 11, level: 'Medium' },
    { attention: 6.2, conversion: 14, level: 'Medium' },
    { attention: 8.5, conversion: 18, level: 'High' },
    { attention: 9.8, conversion: 21, level: 'High' },
    { attention: 11.2, conversion: 23, level: 'High' }
  ];

  // Table rows
  const topCampaignsList = [
    { id: 1, name: 'Summer Sale', impressions: '820K', engagement: '34.5%', conversion: '16.2%', revenue: '₹ 3.25L', roi: '4.2x' },
    { id: 2, name: 'New Arrival Launch', impressions: '610K', engagement: '33.1%', conversion: '14.8%', revenue: '₹ 2.18L', roi: '3.6x' },
    { id: 3, name: 'Weekend Bonanza', impressions: '540K', engagement: '28.9%', conversion: '12.7%', revenue: '₹ 1.72L', roi: '3.2x' },
    { id: 4, name: 'Festive Offer', impressions: '310K', engagement: '26.7%', conversion: '11.3%', revenue: '₹ 1.12L', roi: '2.8x' },
    { id: 5, name: 'Clearance Sale', impressions: '170K', engagement: '19.3%', conversion: '8.6%', revenue: '₹ 0.65L', roi: '2.1x' }
  ];

  const recommendations = [
    { title: 'Increase visibility of Product C on Shelf B', desc: 'High attention rate but conversions remain below average due to placement.', badge: 'High Impact', color: 'text-emerald-400 bg-emerald-500/10' },
    { title: 'Extend Weekend Bonanza campaign', desc: 'Promotions during peak hours generated significant sales uplift.', badge: 'Medium Impact', color: 'text-indigo-400 bg-indigo-500/10' },
    { title: 'Relocate Product D to Shelf A', desc: 'Low visibility detected. Adjust shelf assignment to improve impressions.', badge: 'Medium Impact', color: 'text-indigo-400 bg-indigo-500/10' },
    { title: 'Increase promotion in 6 PM - 9 PM slot', desc: 'High footfall detected but lower engagement conversion in this slot.', badge: 'Low Impact', color: 'text-slate-400 bg-slate-500/10' }
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Date and Custom Filters */}
      <div className="bg-[#0c0c14] border border-slate-850 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#121218] border border-slate-800 text-xs rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200"
          >
            <option value="May 16 - May 22, 2025">May 16 - May 22, 2025</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <select
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-[#121218] border border-slate-800 text-xs rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-200"
          >
            <option value="All Campaigns">All Campaigns</option>
            <option value="Active Only">Active Only</option>
            <option value="High ROI">High ROI</option>
          </select>
        </div>
      </div>

      {section === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {kpiList.map((kpi, idx) => (
              <div key={idx} className="bg-[#0c0c14] border border-slate-850 p-4 rounded-xl shadow-md">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{kpi.label}</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-100">{kpi.val}</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{kpi.change}</span>
                </div>
                <p className="text-[9px] text-slate-550 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Row 2: Campaign Performance, Promotion Effectiveness, Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Campaign Performance Overview Combined */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Campaign Performance Overview</span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedCampaignData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={8} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={8} label={{ value: 'Impressions (M)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 8 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={8} label={{ value: 'Rates (%)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 8 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 8 }} />
                    <Bar yAxisId="left" dataKey="Impressions" fill="#6366f1" radius={[3, 3, 0, 0]} name="Impressions" />
                    <Line yAxisId="right" type="monotone" dataKey="Engagement" stroke="#10b981" strokeWidth={2} name="Engagement Rate" />
                    <Line yAxisId="right" type="monotone" dataKey="Conversion" stroke="#f59e0b" strokeWidth={2} name="Conversion Rate" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Promotion Effectiveness Grouped Bar */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Promotion Effectiveness (Before vs After)</span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfterData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                    <XAxis dataKey="metric" stroke="#94a3b8" fontSize={8} />
                    <YAxis stroke="#94a3b8" fontSize={8} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 8 }} />
                    <Bar dataKey="Before" fill="#3b82f6" name="Before Promotion" />
                    <Bar dataKey="After" fill="#10b981" name="After Promotion" />
                    <Bar dataKey="Increase" fill="#f59e0b" name="Increase %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign Conversion Funnel (Beautiful stacked blocks) */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Campaign Conversion Funnel</span>
              <div className="space-y-2 mt-2 flex flex-col justify-center flex-1">
                {funnelSteps.map((step, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded border border-slate-850 font-semibold bg-[#0f0f18]" style={{ borderLeft: `4px solid ${step.bg}` }}>
                    <span className="text-slate-200">{step.step}</span>
                    <span className="text-slate-400">{step.val} ({step.percent})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Product Visibility, Radar Attractiveness, Scatter attention vs conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Product Visibility by Shelf Horizontal Bars */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Product Visibility Score by Shelf</span>
              <div className="space-y-3.5 mt-2">
                {shelfRankingData.map((shelf, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>{shelf.shelf}</span>
                      <span>{shelf.val}%</span>
                    </div>
                    <div className="w-full bg-[#161625] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${shelf.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar Attractiveness breakdown */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Product Attractiveness Score</span>
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#22222f" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={8} />
                    <Radar name="Product A" dataKey="Product A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                    <Radar name="Product B" dataKey="Product B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Radar name="Product C" dataKey="Product C" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scatter attention vs conversion */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Attention vs Conversion Scatter</span>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                    <XAxis type="number" dataKey="attention" name="Avg. Attention (s)" stroke="#94a3b8" fontSize={8} />
                    <YAxis type="number" dataKey="conversion" name="Conversion Rate (%)" stroke="#94a3b8" fontSize={8} />
                    <Tooltip />
                    <Scatter name="Category" data={scatterPoints} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 4: Top Performing Campaigns Table, AI recommendations, Budget utilization summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top performing campaigns table */}
            <div className="lg:col-span-5 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Top Performing Campaigns</span>
              <div className="overflow-x-auto text-[9.5px] font-semibold text-slate-355">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider pb-2">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Campaign Name</th>
                      <th className="pb-2 text-center">Impressions</th>
                      <th className="pb-2 text-center">Engagement</th>
                      <th className="pb-2 text-center">Conversion</th>
                      <th className="pb-2 text-center">Revenue</th>
                      <th className="pb-2 text-center">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {topCampaignsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/30">
                        <td className="py-2.5 text-slate-500">{c.id}</td>
                        <td className="py-2.5 text-slate-200">{c.name}</td>
                        <td className="py-2.5 text-center">{c.impressions}</td>
                        <td className="py-2.5 text-center text-indigo-400">{c.engagement}</td>
                        <td className="py-2.5 text-center text-emerald-450">{c.conversion}</td>
                        <td className="py-2.5 text-center text-slate-100 font-bold">{c.revenue}</td>
                        <td className="py-2.5 text-center text-emerald-400 font-bold">{c.roi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI recommendations panel */}
            <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Marketing Recommendations (AI Powered)</span>
              <div className="space-y-2.5 text-[9.5px] font-semibold">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-[#08080f] p-2.5 rounded border border-slate-900 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-400 font-bold">{rec.title}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${rec.color}`}>{rec.badge}</span>
                    </div>
                    <p className="text-slate-400 leading-normal">{rec.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget utilization panel */}
            <div className="lg:col-span-3 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block border-b border-slate-850 pb-2">Campaign Summary</span>
              <div className="space-y-3.5 mt-2 flex-1 flex flex-col justify-center text-xs">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-[#08080f] p-2 rounded border border-slate-900">
                    <span className="text-slate-500 uppercase block font-bold">Active</span>
                    <span className="text-sm font-black text-slate-100">7</span>
                  </div>
                  <div className="bg-[#08080f] p-2 rounded border border-slate-900">
                    <span className="text-slate-500 uppercase block font-bold">Completed</span>
                    <span className="text-sm font-black text-slate-100">5</span>
                  </div>
                  <div className="bg-[#08080f] p-2 rounded border border-slate-900">
                    <span className="text-slate-500 uppercase block font-bold">Upcoming</span>
                    <span className="text-sm font-black text-slate-100">3</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-850 pt-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-450">
                    <span>Budget Utilized: ₹8.35L (66.8%)</span>
                    <span>Total: ₹12.50L</span>
                  </div>
                  <div className="w-full bg-[#161625] h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '66.8%' }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>66.8% Utilized</span>
                    <span>Remaining: ₹4.15L (33.2%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone route renders */}
      {section === 'campaign-performance' && (
        <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-6 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Grouped Campaign Performance</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={combinedCampaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="Engagement" fill="#6366f1" name="Engagement (%)" />
                <Bar dataKey="Conversion" fill="#10b981" name="Conversion (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {section === 'promotion-effectiveness' && (
        <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-6 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Promotion Effectiveness (Before vs After)</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beforeAfterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Before" fill="#3b82f6" name="Before Promotion" />
                <Bar dataKey="After" fill="#10b981" name="After Promotion" />
                <Bar dataKey="Increase" fill="#f59e0b" name="Increase %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
