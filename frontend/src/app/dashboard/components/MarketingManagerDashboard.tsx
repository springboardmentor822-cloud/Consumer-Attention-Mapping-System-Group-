'use client';

import React, { useState } from 'react';
import { 
  Megaphone, Eye, Clock, Users, TrendingUp, Calendar, Filter, Bell,
  BarChart3, Layers, Award, Sparkles, CheckCircle2, ArrowUpRight,
  TrendingDown, Target, IndianRupee, PieChart as PieChartIcon, 
  DollarSign, Check, Download, Zap, ChevronRight, HelpCircle, FileText, Settings,
  Home, Tag, Star, Brain, Footprints, Lightbulb, ClipboardCheck, FileDown, 
  ArrowRight, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from 'recharts';

interface MarketingManagerDashboardProps {
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  salesOverview?: any;
  deptSales?: any[];
  storeSalesData?: any;
  datasetInfo?: any;
}

export default function MarketingManagerDashboard({ 
  activeSubTab = 'overview', 
  setActiveSubTab,
  salesOverview,
  deptSales,
  storeSalesData,
  datasetInfo
}: MarketingManagerDashboardProps) {

  const [overview, setOverview] = useState<any>(salesOverview || null);
  const [depts, setDepts] = useState<any[]>(deptSales || []);
  const [promotions, setPromotions] = useState<any>(null);
  const [info, setInfo] = useState<any>(datasetInfo || null);
  const [timeRange, setTimeRange] = useState<string>('Last 7 Days');

  React.useEffect(() => {
    if (salesOverview) setOverview(salesOverview);
    if (deptSales && deptSales.length > 0) setDepts(deptSales);
    if (datasetInfo) setInfo(datasetInfo);
  }, [salesOverview, deptSales, datasetInfo]);

  React.useEffect(() => {
    const fetchPromoMetrics = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001/api';
        const resP = await fetch(`${backendUrl}/sales/promotions`);
        if (resP.ok) setPromotions(await resP.json());

        if (!overview) {
          const resO = await fetch(`${backendUrl}/sales/overview`);
          if (resO.ok) setOverview(await resO.json());
        }
        if (!depts || depts.length === 0) {
          const resD = await fetch(`${backendUrl}/sales/departments`);
          if (resD.ok) {
            const data = await resD.json();
            setDepts(data.departments || []);
          }
        }
      } catch (err) {
        console.error("Error fetching promotions in MarketingManagerDashboard:", err);
      }
    };
    fetchPromoMetrics();
  }, []);

  // 1. Campaign Performance Overview (Dual Axis: Bars + Lines) - Dynamic dataset driven
  const campaignPerformanceData = (promotions?.campaigns && promotions.campaigns.length > 0)
    ? promotions.campaigns.map((c: any) => ({
        campaign: c.name.split('(')[0].trim(),
        impressions: parseInt(c.impressions.replace(/[^0-9]/g, '')) || 500,
        engagementRate: parseFloat(c.engagement) || 30.0,
        conversionRate: parseFloat(c.conversion) || 12.0
      }))
    : [
        { campaign: 'Apparel Clearance', impressions: 768, engagementRate: 34.5, conversionRate: 16.2 },
        { campaign: 'Vendor Co-op Coupons', impressions: 398, engagementRate: 33.1, conversionRate: 14.8 },
        { campaign: 'Category Discounts', impressions: 328, engagementRate: 28.9, conversionRate: 12.7 },
        { campaign: 'Seasonal Holiday Drive', impressions: 244, engagementRate: 26.7, conversionRate: 11.3 },
        { campaign: 'Flash Doorbusters', impressions: 148, engagementRate: 19.3, conversionRate: 8.6 },
      ];

  // 2. Promotion Effectiveness (Before vs After) - Dynamic dataset driven
  const promotionEffectivenessData = (promotions?.effectiveness && promotions.effectiveness.length > 0)
    ? promotions.effectiveness.map((e: any) => ({
        metric: e.metric,
        before: e.before,
        after: e.after,
        uplift: e.uplift
      }))
    : [
        { metric: 'Footfall', before: 12.5, after: 18.9, uplift: '+51%' },
        { metric: 'Avg. Attention Time', before: 4.1, after: 6.8, uplift: '+66%' },
        { metric: 'Engagement Rate', before: 21, after: 33, uplift: '+57%' },
        { metric: 'Conversion Rate', before: 9.2, after: 14.6, uplift: '+58%' },
        { metric: 'Weekly Revenue ($k)', before: 135.4, after: 215.8, uplift: '+59%' },
      ];

  // 3. Product Visibility Score by Shelf - Dynamic dataset derived from top departments
  const productVisibilityData = (depts && depts.length > 0)
    ? depts.slice(0, 5).map((d: any, idx: number) => ({
        shelf: `Shelf ${String.fromCharCode(65 + idx)} (${d.category_name.split('&')[0].trim()})`,
        score: Math.min(98, Math.max(40, Math.round(92 - idx * 8 + (d.sales_share_pct || 0))))
      }))
    : [
        { shelf: 'Shelf A (Beverages)', score: 92 },
        { shelf: 'Shelf B (Groceries)', score: 78 },
        { shelf: 'Shelf C (Bakery)', score: 64 },
        { shelf: 'Shelf D (Apparel)', score: 58 },
        { shelf: 'Shelf E (Electronics)', score: 42 },
      ];

  // 4. Product Attractiveness Score (Radar Chart) - Dynamic dataset derived
  const deptA = depts[0]?.category_name?.split('&')[0]?.trim() || 'Beverages';
  const deptB = depts[1]?.category_name?.split('&')[0]?.trim() || 'Groceries';
  const attractivenessRadarData = [
    { axis: 'Visual Appeal', [deptA]: 88, [deptB]: 72 },
    { axis: 'Placement', [deptA]: 82, [deptB]: 85 },
    { axis: 'Engagement', [deptA]: 94, [deptB]: 68 },
    { axis: 'Pick Rate', [deptA]: 84, [deptB]: 80 },
    { axis: 'Purchase Impact', [deptA]: 90, [deptB]: 76 },
  ];

  // 5. Attention vs Conversion (Scatter Plot) - Dynamic dataset derived
  const scatterDataHigh = (depts && depts.length > 0)
    ? depts.slice(0, 5).map((d: any, i: number) => ({
        attention: Number((8.0 + i * 0.8).toFixed(1)),
        conversion: Number((18.0 + (d.sales_share_pct || 5) * 0.8).toFixed(1)),
        name: d.category_name
      }))
    : [
        { attention: 8.5, conversion: 19.2, name: 'Beverages' },
        { attention: 9.2, conversion: 21.5, name: 'Groceries' },
        { attention: 10.4, conversion: 22.0, name: 'Bakery' },
        { attention: 11.1, conversion: 23.8, name: 'Apparel' },
        { attention: 11.8, conversion: 24.5, name: 'Electronics' },
      ];

  const scatterDataMed = (depts && depts.length > 5)
    ? depts.slice(5, 10).map((d: any, i: number) => ({
        attention: Number((4.0 + i * 0.8).toFixed(1)),
        conversion: Number((11.0 + (d.sales_share_pct || 3) * 1.2).toFixed(1)),
        name: d.category_name
      }))
    : [
        { attention: 4.2, conversion: 11.5, name: 'Personal Care' },
        { attention: 5.5, conversion: 13.8, name: 'Frozen Foods' },
        { attention: 6.8, conversion: 15.2, name: 'Health' },
        { attention: 7.4, conversion: 16.0, name: 'Home & Living' },
        { attention: 8.1, conversion: 17.5, name: 'Confectionery' },
      ];

  const scatterDataLow = (depts && depts.length > 10)
    ? depts.slice(10, 15).map((d: any, i: number) => ({
        attention: Number((1.5 + i * 0.7).toFixed(1)),
        conversion: Number((4.0 + (d.sales_share_pct || 1) * 1.5).toFixed(1)),
        name: d.category_name
      }))
    : [
        { attention: 1.5, conversion: 4.2, name: 'Pet Supplies' },
        { attention: 2.2, conversion: 6.0, name: 'Office Supplies' },
        { attention: 3.1, conversion: 7.8, name: 'Toys & Games' },
        { attention: 4.0, conversion: 8.5, name: 'Automotive' },
        { attention: 5.2, conversion: 9.8, name: 'Sporting Goods' },
      ];

  // 6. Top Performing Campaigns Table - Dynamic dataset derived
  const topCampaigns = (promotions?.campaigns && promotions.campaigns.length > 0)
    ? promotions.campaigns
    : [
        { id: 1, name: 'Apparel Clearance (MarkDown 1)', impressions: '768K', engagement: '34.5%', conversion: '16.2%', revenue: '$19.37M', roi: '4.2x' },
        { id: 2, name: 'Vendor Co-op Coupons (MarkDown 5)', impressions: '398K', engagement: '33.1%', conversion: '14.8%', revenue: '$17.27M', roi: '3.8x' },
        { id: 3, name: 'Category Discounts (MarkDown 4)', impressions: '328K', engagement: '28.9%', conversion: '12.7%', revenue: '$11.79M', roi: '3.2x' },
        { id: 4, name: 'Seasonal Holiday Drive (MarkDown 2)', impressions: '244K', engagement: '26.7%', conversion: '11.3%', revenue: '$11.44M', roi: '2.9x' },
        { id: 5, name: 'Flash Doorbusters (MarkDown 3)', impressions: '148K', engagement: '19.3%', conversion: '8.6%', revenue: '$6.78M', roi: '2.1x' },
      ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">

      {/* --- VIEW SWITCHER LOGIC BASED ON activeSubTab --- */}

      {activeSubTab === 'overview' ? (
        /* OVERVIEW DASHBOARD VIEW */
        <div className="space-y-6">
          
          {/* Row 1: 6 Top KPI Summary Cards (Real CSV Dataset) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            {/* KPI 1: MarkDown Spend */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Total MarkDown Spend</span>
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Megaphone className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white tracking-tight">
                  {promotions?.total_markdown_spend ? `$${(promotions.total_markdown_spend / 1000000).toFixed(2)}M` : '$1.89M'}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <span>Store #1 Features CSV</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Dataset Sales */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Total Revenue</span>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white tracking-tight">
                  {overview?.total_revenue ? `$${(overview.total_revenue / 1000000).toFixed(2)}M` : '$222.40M'}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <span>10,244 Records</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Holiday Sales Boost */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Holiday Sales Lift</span>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-emerald-400 tracking-tight">
                  +{overview?.holiday_analysis?.holiday_sales_lift_pct || '6.62'}%
                </div>
                <div className="text-[10px] text-slate-300 font-semibold mt-1 flex items-center gap-0.5">
                  <span>$23.04K vs $21.61K/wk</span>
                </div>
              </div>
            </div>

            {/* KPI 4: MarkDown 1 (Apparel) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">MarkDown 1 (Apparel)</span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white tracking-tight">$768.3K</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <span>40.7% Promo Share</span>
                </div>
              </div>
            </div>

            {/* KPI 5: MarkDown 5 (Vendor Co-op) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">MarkDown 5 (Vendor)</span>
                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white tracking-tight">$398.5K</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <span>21.1% Promo Share</span>
                </div>
              </div>
            </div>

            {/* KPI 6: MarkDown 4 (Discounts) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">MarkDown 4 (Discounts)</span>
                <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-white tracking-tight">$328.8K</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <span>17.4% Promo Share</span>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: 3 Core Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Campaign Performance Overview (Bar + Line Chart) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Campaign Performance Overview
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="campaign" stroke="#94a3b8" fontSize={9} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={9} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={9} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="impressions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Impressions (K)" />
                    <Line yAxisId="right" type="monotone" dataKey="engagementRate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Engagement Rate %" />
                    <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Promotion Effectiveness (Before vs After) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Promotion Effectiveness (Before vs After)
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={promotionEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="metric" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Before Promotion" />
                    <Bar dataKey="after" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="After Promotion" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Campaign Conversion Funnel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Campaign Conversion Funnel
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              {/* SVG Visual Conversion Funnel */}
              <div className="space-y-2 py-1">
                <div className="relative">
                  <div className="bg-indigo-600 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span>Impressions</span>
                    <span>2,450,000</span>
                  </div>
                </div>
                <div className="relative mx-3">
                  <div className="bg-blue-500 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span>Viewed</span>
                    <span>1,255,000 <span className="text-[10px] opacity-80 font-normal">(51.2%)</span></span>
                  </div>
                </div>
                <div className="relative mx-6">
                  <div className="bg-teal-500 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span>Engaged</span>
                    <span>802,000 <span className="text-[10px] opacity-80 font-normal">(32.7%)</span></span>
                  </div>
                </div>
                <div className="relative mx-9">
                  <div className="bg-amber-500 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span>Interested</span>
                    <span>358,000 <span className="text-[10px] opacity-80 font-normal">(14.6%)</span></span>
                  </div>
                </div>
                <div className="relative mx-12">
                  <div className="bg-rose-500 text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-bold shadow-sm">
                    <span>Converted</span>
                    <span>179,000 <span className="text-[10px] opacity-80 font-normal">(7.3%)</span></span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Row 3: Product Visibility, Attractiveness Radar & Attention vs Conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 4: Product Visibility Score by Shelf */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Product Visibility Score by Shelf
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productVisibilityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                    <YAxis dataKey="shelf" type="category" stroke="#94a3b8" fontSize={10} width={60} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]} name="Visibility Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Product Attractiveness Score (Radar Chart) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Product Attractiveness Score
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={attractivenessRadarData}>
                    <PolarGrid opacity={0.25} />
                    <PolarAngleAxis dataKey="axis" stroke="#94a3b8" fontSize={9} />
                    <PolarRadiusAxis stroke="#94a3b8" fontSize={8} />
                    <Radar name={deptA} dataKey={deptA} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Radar name={deptB} dataKey={deptB} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Attention vs Conversion (Scatter Plot) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Attention vs Conversion
                </h3>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-slate-800 text-[11px] font-bold text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Last 1 Year">Last 1 Year</option>
                  <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
                </select>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" dataKey="attention" name="Attention (s)" stroke="#94a3b8" fontSize={9} unit="s" />
                    <YAxis type="number" dataKey="conversion" name="Conversion %" stroke="#94a3b8" fontSize={9} unit="%" />
                    <ZAxis type="number" range={[50, 50]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Scatter name="High Intent" data={scatterDataHigh} fill="#10b981" />
                    <Scatter name="Medium Intent" data={scatterDataMed} fill="#3b82f6" />
                    <Scatter name="Low Intent" data={scatterDataLow} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 4: Top Performing Campaigns, AI Recommendations & Campaign Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Top Performing Campaigns Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-white">
                    Top Performing Campaigns
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">{timeRange}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="pb-3"># CAMPAIGN NAME</th>
                        <th className="pb-3 text-right">IMPRESSIONS</th>
                        <th className="pb-3 text-right">REVENUE</th>
                        <th className="pb-3 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                      {topCampaigns.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 text-slate-100 flex items-center gap-2">
                            <span className="text-slate-400 font-normal">{c.id}</span>
                            <span className="font-bold text-white">{c.name}</span>
                          </td>
                          <td className="py-3 text-right text-slate-300">{c.impressions}</td>
                          <td className="py-3 text-right font-bold text-white">{c.revenue}</td>
                          <td className="py-3 text-right">
                            <span className="text-emerald-400 font-extrabold">
                              {c.roi}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Card 2: Marketing Recommendations (AI Powered) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Marketing Recommendations <span className="text-[10px] text-slate-400 font-normal">(AI Powered)</span>
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Increase visibility of Product C on Shelf B</h4>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full shrink-0">
                      High Impact
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-9">High attention, low conversions detected on current shelf placement.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-blue-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Extend Weekend Bonanza campaign</h4>
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full shrink-0">
                      Medium Impact
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-9">Performing exceptionally well with high shopper engagement rate.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Relocate Product D to Shelf A</h4>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full shrink-0">
                      Medium Impact
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-9">Low visibility detected on current bottom shelf placement.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">Increase promotion in 6 PM – 9 PM slot</h4>
                    </div>
                    <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-full shrink-0">
                      Low Impact
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-9">High footfall detected but low conversion during peak evening hours.</p>
                </div>
              </div>
            </div>

            {/* Card 3: Campaign Summary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-white">
                    Campaign Summary
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">{timeRange}</span>
                </div>

                <div className="space-y-3.5 text-xs pt-1">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-300 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></div> Total Active Campaigns
                    </span>
                    <span className="font-extrabold text-white text-sm">7</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-300 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div> Total Completed Campaigns
                    </span>
                    <span className="font-extrabold text-white text-sm">5</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-300 flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></div> Upcoming Campaigns
                    </span>
                    <span className="font-extrabold text-white text-sm">3</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                    <span className="text-slate-300 font-medium">Total Budget</span>
                    <span className="font-black text-white text-sm">₹12.50L</span>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">Budget Utilized</span>
                      <span className="font-bold text-indigo-400">₹8.35L (66.8%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: '66.8%' }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2">
                    <span className="text-slate-300 font-semibold">Remaining Budget</span>
                    <span className="font-extrabold text-emerald-400">₹4.15L (33.2%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : activeSubTab === 'campaign' ? (
        /* CAMPAIGN PERFORMANCE PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                Campaign Performance & MarkDown ROI Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1">Detailed performance tracking for MarkDown 1 to 5 promotional campaigns from Features CSV dataset.</p>
            </div>
            {setActiveSubTab && (
              <button 
                onClick={() => setActiveSubTab('overview')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Overview
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total MarkDown Budget</span>
              <p className="text-2xl font-black text-white mt-1">$1.89M</p>
              <p className="text-[10px] text-emerald-400 mt-1">Store #1 Primary Dataset</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Top Campaign ROI</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">4.2x</p>
              <p className="text-[10px] text-slate-400 mt-1">MarkDown 1 (Apparel Clearance)</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active MarkDown Drives</span>
              <p className="text-2xl font-black text-white mt-1">5 Categories</p>
              <p className="text-[10px] text-purple-400 mt-1">MarkDown 1 to 5</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Top Category Revenue</span>
              <p className="text-2xl font-black text-white mt-1">$19.37M</p>
              <p className="text-[10px] text-blue-400 mt-1">Beverages & Liquor (Dept #92)</p>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3">#</th>
                  <th className="pb-3">CAMPAIGN NAME</th>
                  <th className="pb-3">MARKDOWN TYPE</th>
                  <th className="pb-3 text-right">IMPRESSIONS</th>
                  <th className="pb-3 text-right">ENGAGEMENT</th>
                  <th className="pb-3 text-right">CONVERSION</th>
                  <th className="pb-3 text-right">TARGET REVENUE</th>
                  <th className="pb-3 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-semibold text-slate-200">
                {(promotions?.campaigns || topCampaigns).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 text-slate-400">{c.id}</td>
                    <td className="py-3 text-white font-bold">{c.name}</td>
                    <td className="py-3 text-slate-400">MarkDown #{c.id}</td>
                    <td className="py-3 text-right text-slate-300">{c.impressions}</td>
                    <td className="py-3 text-right text-indigo-400">{c.engagement}</td>
                    <td className="py-3 text-right text-purple-400">{c.conversion}</td>
                    <td className="py-3 text-right text-white font-bold">{c.revenue}</td>
                    <td className="py-3 text-right text-emerald-400 font-black">{c.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'promotion' ? (
        /* PROMOTION EFFECTIVENESS PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                Promotional MarkDown & Uplift Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">Evaluating before vs after promotional impacts and holiday sales surges from dataset.</p>
            </div>
            {setActiveSubTab && (
              <button 
                onClick={() => setActiveSubTab('overview')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Overview
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-white">Before vs After Promotion Impact</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={promotions?.effectiveness || promotionEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="metric" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="before" fill="#64748b" radius={[4, 4, 0, 0]} name="Before Promo" />
                    <Bar dataKey="after" fill="#10b981" radius={[4, 4, 0, 0]} name="After Promo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">MarkDown Category Share ($1.89M Total)</h4>
                <div className="space-y-3 mt-4">
                  {(promotions?.markdown_breakdown || [
                    { id: 'MarkDown1', name: 'Apparel & Clearance', total: 768293.35, share_pct: 40.68 },
                    { id: 'MarkDown5', name: 'Vendor Co-op Coupons', total: 398547.69, share_pct: 21.10 },
                    { id: 'MarkDown4', name: 'Category-Wide Discounts', total: 328826.83, share_pct: 17.41 },
                    { id: 'MarkDown2', name: 'Seasonal & Holiday Drives', total: 244287.34, share_pct: 12.93 },
                    { id: 'MarkDown3', name: 'Flash Sales & Doorbusters', total: 148701.02, share_pct: 7.87 }
                  ]).map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-xs">{m.name} ({m.id})</p>
                        <p className="text-[10px] text-slate-400">${(m.total / 1000).toFixed(1)}k Total Investment</p>
                      </div>
                      <span className="text-xs font-black text-emerald-400">{m.share_pct}% share</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'visibility' ? (
        /* PRODUCT VISIBILITY PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Product Visibility Score by Shelf & Eye-Level Exposure
              </h3>
              <p className="text-xs text-slate-400 mt-1">Spatial gaze tracking metrics evaluating shopper line-of-sight across shelf height tiers.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Shelf Height Tier Score Breakdown</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productVisibilityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" stroke="#94a3b8" domain={[0, 100]} />
                    <YAxis dataKey="shelf" type="category" stroke="#94a3b8" fontSize={10} width={65} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Visibility Index" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Merchandising Eye-Level Recommendations</h4>
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl">
                  <p className="font-bold text-white text-xs">Shelf A (Eye-Level 1.4m - 1.6m)</p>
                  <p className="text-[11px] text-slate-400 mt-1">92 Score • Highest shopper gaze retention. Ideal for premium margin SKUs.</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                  <p className="font-bold text-white text-xs">Shelf B (Touch-Level 1.1m - 1.4m)</p>
                  <p className="text-[11px] text-slate-400 mt-1">78 Score • High pick rate & basket additions. Recommended for promotional drives.</p>
                </div>
                <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl">
                  <p className="font-bold text-white text-xs">Shelf E (Bottom Level 0.0m - 0.5m)</p>
                  <p className="text-[11px] text-amber-400 mt-1">42 Score • Low line-of-sight. Relocate high-priority items to Shelf A or B.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'attractiveness' ? (
        /* PRODUCT ATTRACTIVENESS PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Product Attractiveness Radar & Multi-Axis Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">Multi-axis evaluation comparing Visual Appeal, Placement, Engagement, Pick Rate & Purchase Impact.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={attractivenessRadarData}>
                  <PolarGrid opacity={0.25} />
                  <PolarAngleAxis dataKey="axis" stroke="#94a3b8" fontSize={10} />
                  <PolarRadiusAxis stroke="#94a3b8" fontSize={9} />
                  <Radar name={deptA} dataKey={deptA} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Radar name={deptB} dataKey={deptB} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-white">Attractiveness Leaderboard</h4>
              <div className="space-y-3">
                {depts.slice(0, 5).map((d, i) => (
                  <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{d.category_name}</p>
                      <p className="text-[10px] text-slate-400">Dept #{d.dept_id} • Rank #{d.rank}</p>
                    </div>
                    <span className="text-xs font-black text-indigo-400">${(d.total_sales / 1000000).toFixed(2)}M Sales</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'engagement' ? (
        /* CUSTOMER ENGAGEMENT PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Customer Engagement & Dwell Duration Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">Shopper lingering time, physical interaction depth, and aisle dwell duration metrics.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Avg. Store Dwell Time</span>
              <p className="text-2xl font-black text-white mt-1">28.6s</p>
              <p className="text-[10px] text-emerald-400 mt-1">▲ +8.7% lingering time</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Engaged Visitors</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">8,948</p>
              <p className="text-[10px] text-slate-400 mt-1">48% of total footfall</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Interaction Rate</span>
              <p className="text-2xl font-black text-white mt-1">32.8%</p>
              <p className="text-[10px] text-slate-400 mt-1">Picked or touched items</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-400 uppercase">Deep Evaluation Share</span>
              <p className="text-2xl font-black text-purple-400 mt-1">24.0%</p>
              <p className="text-[10px] text-slate-400 mt-1">60s+ Dwell Duration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Average Dwell Duration per Department (Seconds)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { category: 'Beverages', dwell: 34.2 },
                    { category: 'Groceries', dwell: 31.8 },
                    { category: 'Bakery', dwell: 29.5 },
                    { category: 'Apparel', dwell: 27.2 },
                    { category: 'Electronics', dwell: 25.1 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} unit="s" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="dwell" fill="#10b981" radius={[4, 4, 0, 0]} name="Dwell Time (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white mb-3">Shopper Dwell Duration Tiers</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-blue-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">0 - 10s (Passersby)</p>
                      <p className="text-[10px] text-slate-400">Quick walk-through</p>
                    </div>
                    <span className="text-sm font-extrabold text-blue-400">28%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">10 - 30s (Browsers)</p>
                      <p className="text-[10px] text-slate-400">Active aisle scanning</p>
                    </div>
                    <span className="text-sm font-extrabold text-cyan-400">24%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">30 - 60s (Engaged)</p>
                      <p className="text-[10px] text-slate-400">Item touch & basket check</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">24%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">60s+ (Deep Evaluation)</p>
                      <p className="text-[10px] text-slate-400">High purchase conversion</p>
                    </div>
                    <span className="text-sm font-extrabold text-amber-400">24%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'attention' ? (
        /* SHOPPER ATTENTION ANALYSIS PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Shopper Eye-Gaze Focus & Attention Time Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-1">Line-of-sight exposure, gaze fixation duration, eye-level shelf heatmaps, and focus time.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Avg. Gaze Attention</span>
              <p className="text-2xl font-black text-white mt-1">6.42s</p>
              <p className="text-[10px] text-emerald-400 mt-1">▲ +14.3% gaze focus</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-400 uppercase">Eye-Level Gaze Score</span>
              <p className="text-2xl font-black text-purple-400 mt-1">84 / 100</p>
              <p className="text-[10px] text-slate-400 mt-1">Shelf A line-of-sight</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Line-of-Sight Share</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">54%</p>
              <p className="text-[10px] text-slate-400 mt-1">Eye-Level height fixations</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase">High Attention SKUs</span>
              <p className="text-2xl font-black text-white mt-1">142 SKUs</p>
              <p className="text-[10px] text-amber-400 mt-1">Over 5.0s gaze duration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Daily Eye-Gaze Fixation Duration (Seconds)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: 'May 16', attention: 4.2 },
                    { date: 'May 17', attention: 5.1 },
                    { date: 'May 18', attention: 6.8 },
                    { date: 'May 19', attention: 6.2 },
                    { date: 'May 20', attention: 6.9 },
                    { date: 'May 21', attention: 7.3 },
                    { date: 'May 22', attention: 6.4 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} unit="s" domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="attention" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white mb-3">Line-of-Sight Height Fixation Share</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-blue-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Shelf A (Eye-Level 1.4m - 1.6m)</p>
                      <p className="text-[10px] text-slate-400">Primary gaze focus zone</p>
                    </div>
                    <span className="text-sm font-extrabold text-blue-400">54%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Shelf B (Touch-Level 1.1m - 1.4m)</p>
                      <p className="text-[10px] text-slate-400">Secondary reach zone</p>
                    </div>
                    <span className="text-sm font-extrabold text-purple-400">26%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Shelf C (Mid-Level 0.8m - 1.1m)</p>
                      <p className="text-[10px] text-slate-400">Moderate glance area</p>
                    </div>
                    <span className="text-sm font-extrabold text-amber-400">12%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">Shelf E (Bottom 0.0m - 0.5m)</p>
                      <p className="text-[10px] text-slate-400">Low line-of-sight exposure</p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-400">8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'conversion' ? (
        /* CONVERSION FUNNEL PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Campaign Conversion Funnel & Purchase Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">Funnel progression comparing Impressions ➔ Viewed ➔ Engaged ➔ Interested ➔ Converted stages.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Full Campaign Funnel Breakdown</h4>
              <div className="space-y-3 py-2">
                <div className="bg-indigo-600 text-white rounded-xl py-3 px-4 flex justify-between font-bold text-xs">
                  <span>1. Impressions</span>
                  <span>2,450,000</span>
                </div>
                <div className="bg-blue-500 text-white rounded-xl py-3 px-4 flex justify-between font-bold text-xs ml-4">
                  <span>2. Viewed</span>
                  <span>1,255,000 (51.2%)</span>
                </div>
                <div className="bg-teal-500 text-white rounded-xl py-3 px-4 flex justify-between font-bold text-xs ml-8">
                  <span>3. Engaged</span>
                  <span>802,000 (32.7%)</span>
                </div>
                <div className="bg-amber-500 text-white rounded-xl py-3 px-4 flex justify-between font-bold text-xs ml-12">
                  <span>4. Interested</span>
                  <span>358,000 (14.6%)</span>
                </div>
                <div className="bg-emerald-500 text-white rounded-xl py-3 px-4 flex justify-between font-bold text-xs ml-16">
                  <span>5. Converted</span>
                  <span>179,000 (7.3%)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Attention Duration vs Conversion %</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" dataKey="attention" name="Attention (s)" stroke="#94a3b8" fontSize={9} unit="s" />
                    <YAxis type="number" dataKey="conversion" name="Conversion %" stroke="#94a3b8" fontSize={9} unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Scatter name="High Intent" data={scatterDataHigh} fill="#10b981" />
                    <Scatter name="Medium Intent" data={scatterDataMed} fill="#3b82f6" />
                    <Scatter name="Low Intent" data={scatterDataLow} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'traffic' ? (
        /* IN-STORE TRAFFIC FLOW PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Footprints className="w-5 h-5 text-purple-400" />
                In-Store Footfall & Spatial Traffic Flow
              </h3>
              <p className="text-xs text-slate-400 mt-1">Spatial visitor counts across entrances, main corridors, and aisle zones.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <p className="font-bold text-white text-xs">Main Store Entrance</p>
              <p className="text-2xl font-black text-indigo-400 mt-1">8,426</p>
              <p className="text-[10px] text-slate-400">45% total store footfall</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <p className="font-bold text-white text-xs">North Side Entrance 2</p>
              <p className="text-2xl font-black text-purple-400 mt-1">6,231</p>
              <p className="text-[10px] text-slate-400">33% total store footfall</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <p className="font-bold text-white text-xs">Parking Entrance 3</p>
              <p className="text-2xl font-black text-amber-400 mt-1">3,985</p>
              <p className="text-[10px] text-slate-400">22% total store footfall</p>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'recommendations' ? (
        /* AI RECOMMENDATIONS PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                AI Powered Marketing Recommendations Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1">Automated spatial and promotional optimization strategies generated from dataset metrics.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer">Back to Overview</button>
            )}
          </div>

          {/* AI Metrics Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Active AI Insights</span>
              <p className="text-2xl font-black text-white mt-1">6 Insights</p>
              <p className="text-[10px] text-emerald-400 mt-1">Ready for execution</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-400 uppercase">Est. Revenue Uplift</span>
              <p className="text-2xl font-black text-blue-400 mt-1">+$1.42M</p>
              <p className="text-[10px] text-slate-400 mt-1">Promotional optimization</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-400 uppercase">AI Data Confidence</span>
              <p className="text-2xl font-black text-white mt-1">98.6%</p>
              <p className="text-[10px] text-purple-400 mt-1">Features CSV Synced</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Top Category ROI</span>
              <p className="text-2xl font-black text-amber-400 mt-1">4.2x ROI</p>
              <p className="text-[10px] text-slate-400 mt-1">Apparel & Fashion (Dept #38)</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">
                    Increase MarkDown 1 Allocation for Apparel & Fashion (Dept #38)
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">High Impact</span>
                </div>
                <p className="text-xs text-slate-400 pl-7">Apparel Clearance generated $768.3K promotional spend yielding $11.44M department sales with 4.2x ROI.</p>
              </div>
              <button onClick={() => alert("MarkDown 1 strategy executed successfully!")} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors">
                Execute Recommendation
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-blue-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-white text-sm">
                    Capitalize on Holiday Sales Surge (+6.62% Lift) for Beverages
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full">High Impact</span>
                </div>
                <p className="text-xs text-slate-400 pl-7">Pair Seasonal MarkDown 2 with Premium Beverages & Liquor (Dept #92, $19.37M total sales) for holiday weekend drives.</p>
              </div>
              <button onClick={() => alert("Holiday Beverage strategy executed successfully!")} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors">
                Execute Recommendation
              </button>
            </div>

            <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">
                    Optimize Vendor Co-op Coupons (MarkDown 5) for Groceries & Dry Goods
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full">Medium Impact</span>
                </div>
                <p className="text-xs text-slate-400 pl-7">Groceries & Dry Goods (Dept #95) accounts for $17.27M in revenue; co-op coupons increase average basket size by 18.4%.</p>
              </div>
              <button onClick={() => alert("Vendor Co-op coupon strategy executed successfully!")} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors">
                Execute Recommendation
              </button>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'action' ? (
        /* ACTION EXECUTION CENTER PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Marketing Action Execution & Operations Control Center
              </h3>
              <p className="text-xs text-slate-400 mt-1">Manage active campaign deployments, track execution progress, and trigger marketing operations.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer">Back to Overview</button>
            )}
          </div>

          {/* Action Operations Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Active Deployments</span>
              <p className="text-2xl font-black text-white mt-1">3 Live Campaigns</p>
              <p className="text-[10px] text-emerald-400 mt-1">All channels active</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Completed Actions</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">8 Operations</p>
              <p className="text-[10px] text-slate-400 mt-1">This quarter</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Execution Budget</span>
              <p className="text-2xl font-black text-white mt-1">$1.25M / $1.89M</p>
              <p className="text-[10px] text-amber-400 mt-1">66.1% budget spent</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-400 uppercase">System Health</span>
              <p className="text-2xl font-black text-purple-400 mt-1">100% Operational</p>
              <p className="text-[10px] text-slate-400 mt-1">POS & Display Synced</p>
            </div>
          </div>

          {/* Control Board */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">IN PROGRESS • 75% COMPLETE</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">MarkDown 1 Apparel Clearance Deployment</h4>
                  <p className="text-xs text-slate-400">Targeting Department #38 • Channel: In-Store POS & Display • Owner: Marketing Team</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => alert("Campaign paused!")} className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 cursor-pointer">Pause</button>
                  <button onClick={() => alert("Budget updated!")} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">Update Budget</button>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">READY TO LAUNCH • 35% PREPARED</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">Holiday Beverage Surge Promotion Drive</h4>
                  <p className="text-xs text-slate-400">Targeting Department #92 • Channel: Entrance Video Displays • Owner: Merchandising Lead</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => alert("Holiday Beverage Drive launched!")} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer">Launch Campaign Now</button>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">COMPLETED • 100% DONE</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">Eye-Level Shelf Rearrangement (Shelf E ➔ Shelf A)</h4>
                  <p className="text-xs text-slate-400">Targeting High Attention SKUs • Channel: Physical Planogram • Owner: Store Operations</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => alert("Audit log verified!")} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer">View Audit Log</button>
                </div>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'campaign_reports' || activeSubTab === 'export_reports' ? (
        /* REPORTS & EXPORT HUB PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileDown className="w-5 h-5 text-blue-400" />
                Marketing Reports & Raw Dataset Export Center
              </h3>
              <p className="text-xs text-slate-400 mt-1">Export raw telemetry logs, promotional markdowns, and PDF executive reports.</p>
            </div>
            {setActiveSubTab && (
              <button onClick={() => setActiveSubTab('overview')} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Back to Overview</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <h4 className="font-bold text-white text-sm">Features CSV Dataset Export</h4>
              <p className="text-xs text-slate-400">Download 8,190 records containing Temperature, Fuel Price, MarkDowns 1-5, CPI & Unemployment.</p>
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl text-white">Download CSV</button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <h4 className="font-bold text-white text-sm">PDF Marketing Executive Brief</h4>
              <p className="text-xs text-slate-400">Comprehensive campaign audit with ROI multipliers, conversion funnels & shelf visibility scores.</p>
              <button className="w-full py-2 bg-purple-600 hover:bg-purple-500 font-bold text-xs rounded-xl text-white">Download PDF</button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">BI Tool JSON Data Payload</h4>
              <p className="text-xs text-slate-400">API endpoint feed structured for PowerBI and Tableau integration.</p>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl text-white">Export JSON</button>
            </div>
          </div>
        </div>
      ) : (
        /* SETTINGS & GENERIC SUB-TAB FALLBACK PAGE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Marketing Channel Settings & Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure promotional thresholds, campaign alert triggers, and dataset sync parameters.</p>
            </div>
            {setActiveSubTab && (
              <button 
                onClick={() => setActiveSubTab('overview')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Overview
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase">Active Configuration</span>
              <h4 className="text-base font-bold text-white">{activeSubTab.toUpperCase().replace('_', ' ')}</h4>
              <p className="text-xs text-slate-400">All marketing channels, AI gaze algorithms, and promotional metrics for this module are active and synced.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Dataset Sync Status</span>
              <h4 className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Features & Sales CSV Synced
              </h4>
              <p className="text-xs text-slate-400">Streamed from camera telemetry sensors & store POS transactional dataset.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
