'use client';

import React, { useState } from 'react';
import InteractiveHeatmapCanvas from './InteractiveHeatmapCanvas';
import RecommendationFeed from './RecommendationFeed';
import { 
  Eye, Clock, Users, Flame, BarChart3, TrendingUp, Compass, 
  Map, Activity, Layers, ArrowRight, PieChart as PieIcon, Download,
  ShoppingBag, DollarSign, Filter, Calendar, Sparkles, AlertCircle, CheckCircle2, Star, Shield, Package, Tag, FileText, Check
} from 'lucide-react';

import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';

interface RetailAnalystDashboardProps {
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
  salesOverview?: any;
  deptSales?: any[];
  storeSalesData?: any;
  datasetInfo?: any;
}

export default function RetailAnalystDashboard({ 
  activeSubTab = 'overview', 
  setActiveSubTab,
  salesOverview,
  deptSales,
  storeSalesData,
  datasetInfo
}: RetailAnalystDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 7 Days');
  const [selectedHeatmapType, setSelectedHeatmapType] = useState<'traffic' | 'attention' | 'shelf' | 'zone'>('traffic');
  const [exportSuccess, setExportSuccess] = useState(false);

  const [overview, setOverview] = useState<any>(salesOverview || null);
  const [depts, setDepts] = useState<any[]>(deptSales || []);
  const [info, setInfo] = useState<any>(datasetInfo || null);
  const [macroData, setMacroData] = useState<any>(null);

  React.useEffect(() => {
    if (salesOverview) setOverview(salesOverview);
    if (deptSales && deptSales.length > 0) setDepts(deptSales);
    if (datasetInfo) setInfo(datasetInfo);
  }, [salesOverview, deptSales, datasetInfo]);

  React.useEffect(() => {
    const fetchDatasetMetrics = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001/api';
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
        if (!info) {
          const resI = await fetch(`${backendUrl}/sales/dataset-info`);
          if (resI.ok) setInfo(await resI.json());
        }
        const resM = await fetch(`${backendUrl}/sales/macro-factors`);
        if (resM.ok) setMacroData(await resM.json());
      } catch (err) {
        console.error("Error loading sales dataset in RetailAnalystDashboard:", err);
      }
    };
    fetchDatasetMetrics();
  }, []);

  // 1. Attention Analytics Over Time
  const attentionTimeTrend = [
    { date: 'May 16', attention: 4.2 },
    { date: 'May 17', attention: 5.1 },
    { date: 'May 18', attention: 6.8 },
    { date: 'May 19', attention: 6.2 },
    { date: 'May 20', attention: 6.9 },
    { date: 'May 21', attention: 7.3 },
    { date: 'May 22', attention: 6.4 },
  ];

  // 2. Customer Segmentation Donut
  const customerSegments = [
    { name: 'High Value ($200+ Basket)', value: 3728, percent: '20%', color: '#6366f1' },
    { name: 'Frequent Shoppers (3+ visits/mo)', value: 5643, percent: '30%', color: '#a855f7' },
    { name: 'Occasional Shoppers', value: 6187, percent: '33%', color: '#3b82f6' },
    { name: 'New Visitors', value: 3084, percent: '17%', color: '#f97316' },
  ];

  // 3. Shopping Behaviour Multi-Bar
  const shoppingBehaviorData = [
    { category: 'Electronics', Visited: 9200, Interacted: 5400, Purchased: 2800 },
    { category: 'Apparel', Visited: 8400, Interacted: 4900, Purchased: 2600 },
    { category: 'Home & Living', Visited: 6800, Interacted: 3800, Purchased: 1900 },
    { category: 'Personal Care', Visited: 7200, Interacted: 4100, Purchased: 2100 },
    { category: 'Groceries', Visited: 5900, Interacted: 3200, Purchased: 1700 },
  ];

  // 4. Dwell Time Distribution Donut
  const dwellTimeData = [
    { range: '0 - 10s (Passersby)', value: 28, color: '#3b82f6' },
    { range: '10 - 30s (Browsers)', value: 24, color: '#06b6d4' },
    { range: '30 - 60s (Engaged)', value: 24, color: '#22c55e' },
    { range: '60s+ (Deep Evaluation)', value: 10, color: '#eab308' },
  ];

  // 5. Zone Performance Scores
  const zonePerformance = [
    { zone: 'Electronics', score: 82, density: '84/m²', conversion: '26%', revenue: '₹ 3.82L', fill: '#8b5cf6' },
    { zone: 'Apparel', score: 76, density: '78/m²', conversion: '28%', revenue: '₹ 2.94L', fill: '#6366f1' },
    { zone: 'Home & Living', score: 68, density: '62/m²', conversion: '22%', revenue: '₹ 1.84L', fill: '#3b82f6' },
    { zone: 'Personal Care', score: 61, density: '59/m²', conversion: '24%', revenue: '₹ 1.42L', fill: '#06b6d4' },
    { zone: 'Groceries', score: 54, density: '51/m²', conversion: '18%', revenue: '₹ 1.10L', fill: '#10b981' },
    { zone: 'Footfall Zone', score: 48, density: '42/m²', conversion: '14%', revenue: '₹ 0.85L', fill: '#f59e0b' },
  ];

  // 6. Top Performing Products Table
  const topPerformingProducts = [
    { rank: 1, name: 'Wireless Headphones', category: 'Electronics', views: '4,521', interactions: '2,845', rate: '24.3%', dwell: '29.3s', revenue: '₹ 2.48L' },
    { rank: 2, name: "Men's Casual Shirt", category: 'Apparel', views: '3,897', interactions: '2,134', rate: '18.7%', dwell: '26.2s', revenue: '₹ 1.86L' },
    { rank: 3, name: 'Aroma Diffuser', category: 'Home & Living', views: '3,201', interactions: '1,874', rate: '21.6%', dwell: '31.8s', revenue: '₹ 1.24L' },
    { rank: 4, name: 'Face Moisturizer', category: 'Personal Care', views: '2,987', interactions: '1,623', rate: '19.4%', dwell: '24.7s', revenue: '₹ 0.98L' },
    { rank: 5, name: 'Running Shoes', category: 'Footwear', views: '2,554', interactions: '1,453', rate: '17.9%', dwell: '29.3s', revenue: '₹ 1.35L' },
  ];

  // 7. Low Attention Products Table
  const lowAttentionProducts = [
    { name: 'Low-Fat Rice Cakes', category: 'Groceries', views: 85, dwell: '4.2s', status: 'Needs Better Placement' },
    { name: 'Unsweetened Oat Milk', category: 'Groceries', views: 110, dwell: '5.1s', status: 'Low Gaze Time' },
    { name: 'Diet Energy Drinks', category: 'Beverages', views: 140, dwell: '6.0s', status: 'High Bounce' },
    { name: 'Organic Fiber Bar', category: 'Snacks', views: 165, dwell: '7.4s', status: 'Low Interaction' },
  ];

  // 8. AI Insights
  const aiInsights = [
    { id: 1, type: 'star', text: 'Electronics zone has the highest engagement score but conversion rate is below average.', action: 'Optimize Price Tag Placement' },
    { id: 2, type: 'shield', text: 'Visitors spend more time on products in the Home & Living zone.', action: 'Expand Product Bundles' },
    { id: 3, type: 'warning', text: 'High drop-off detected between Personal Care and Checkout.', action: 'Add Express Register' },
    { id: 4, type: 'star', text: 'Weekend footfall is 23% higher than weekdays.', action: 'Adjust Staffing Levels' },
    { id: 5, type: 'warning', text: 'Low-Fat Rice Cakes receiving under 100 views per day.', action: 'Relocate to Eye-Level Shelf' },
  ];

  const handleExport = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">

      {/* Milestone 3: 2D Spatial Homography Heatmap & Automated Recommendation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <InteractiveHeatmapCanvas storeId={1} />
        </div>
        <div className="lg:col-span-5">
          <RecommendationFeed storeId={1} />
        </div>
      </div>

      {/* 🚀 PAGE VIEW SWITCHER LOGIC BASED ON SIDEBAR SELECTION */}
      {activeSubTab === 'journey' ? (
        /* DEDICATED CONSUMER JOURNEY PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Consumer Journey Analysis & In-Store Path Nodes
              </h3>
              <p className="text-xs text-slate-400 mt-1">Detailed flow map from store entrances through department zones to cash registers</p>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-xl border border-indigo-500/30 font-bold">18,642 Total Tracked Journeys</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-indigo-400 uppercase tracking-wider">1. Store Entrances</h4>
              <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Main Foyer Entrance 1</p>
                <p className="text-xs text-indigo-400 font-semibold mt-1">8,426 Shoppers (45% total volume)</p>
                <p className="text-[11px] text-slate-400 mt-1">Primary entry point from mall concourse</p>
              </div>
              <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">North Side Entrance 2</p>
                <p className="text-xs text-indigo-400 font-semibold mt-1">6,231 Shoppers (33% total volume)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Parking Bay Entrance 3</p>
                <p className="text-xs text-indigo-400 font-semibold mt-1">3,985 Shoppers (22% total volume)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-purple-400 uppercase tracking-wider">2. Department Zone Interactions</h4>
              <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Electronics & Gadgets</p>
                <p className="text-xs text-purple-400 font-semibold mt-1">4,821 Shoppers (26% conversion)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Apparel & Fashion</p>
                <p className="text-xs text-purple-400 font-semibold mt-1">5,214 Shoppers (28% conversion)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Home & Living</p>
                <p className="text-xs text-purple-400 font-semibold mt-1">4,156 Shoppers (22% conversion)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Personal Care & Cosmetics</p>
                <p className="text-xs text-purple-400 font-semibold mt-1">4,451 Shoppers (24% conversion)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-emerald-400 uppercase tracking-wider">3. Final Exits & Cash Registers</h4>
              <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-xl">
                <p className="font-bold text-white text-sm">Main Checkout Registers</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">8,892 Completed Purchases (48%)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <p className="font-bold text-white text-sm">North Corridor Exit 2</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">6,125 Non-Purchasing Exits (33%)</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <p className="font-bold text-white text-sm">Side Exit 3</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">3,625 Quick Exits (19%)</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'attention' ? (
        /* DEDICATED ATTENTION ANALYTICS PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Shopper Attention Time & Eye-Gaze Focus Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-1">Gaze duration and fixated attention times per shelf section</p>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-xl border border-blue-500/30 font-bold">Avg Attention: 6.42s per product</span>
          </div>

          <div className="h-80 w-full bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attentionTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="s" domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="attention" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : activeSubTab === 'segmentation' ? (
        /* DEDICATED CUSTOMER SEGMENTATION PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Customer Segmentation & Value Tier Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-1">Segment customers based on basket size, visit frequency, and dwell patterns</p>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-xl border border-purple-500/30 font-bold">4 Active Customer Tiers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {customerSegments.map((seg, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></div>
                <h4 className="font-bold text-white text-sm">{seg.name}</h4>
                <div className="text-2xl font-black text-white">{seg.value.toLocaleString()}</div>
                <p className="text-xs text-slate-400">{seg.percent} of total store footfall</p>
              </div>
            ))}
          </div>

          <div className="h-72 w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={customerSegments} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                  {customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : activeSubTab === 'shopping' ? (
        /* DEDICATED SHOPPING BEHAVIOUR PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                Shopping Behaviour & Product Interaction Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">Conversion funnel comparing Visited ➔ Interacted ➔ Purchased stages</p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/30 font-bold">Overall Conversion: 23.8%</span>
          </div>

          <div className="h-80 w-full bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shoppingBehaviorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="Visited" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Interacted" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Purchased" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : activeSubTab === 'dwell' ? (
        /* DEDICATED DWELL TIME ANALYSIS PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Dwell Time & Lingering Duration Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">Average dwell times per zone, category, and shelf height</p>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30 font-bold">Average Store Dwell: 28.6s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {dwellTimeData.map((d, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <h4 className="font-bold text-white text-sm">{d.range}</h4>
                <div className="text-2xl font-black text-white">{d.value}%</div>
                <p className="text-xs text-slate-400">Share of total store visitors</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'traffic' ? (
        /* DEDICATED TRAFFIC FLOW PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Traffic Flow & Congestion Heatmap Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-1">2D Store Floorplan Spatial Heatmap with Congestion Vectors</p>
            </div>
          </div>

          <div className="relative w-full h-96 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-6 flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-indigo-900/30 to-red-900/50 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between">
              <span className="text-xs font-bold bg-slate-900/90 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-xl">Electronics (High Congestion)</span>
              <span className="text-xs font-bold bg-slate-900/90 border border-slate-700 text-purple-300 px-3 py-1.5 rounded-xl">Apparel & Footwear</span>
            </div>

            <div className="relative z-10 flex justify-center items-center my-auto">
              <div className="w-40 h-40 bg-red-500/50 rounded-full blur-2xl animate-pulse"></div>
              <div className="w-32 h-32 bg-amber-500/40 rounded-full blur-xl"></div>
            </div>

            <div className="relative z-10 flex justify-between">
              <span className="text-xs font-bold bg-slate-900/90 border border-slate-700 text-blue-300 px-3 py-1.5 rounded-xl">Home & Living</span>
              <span className="text-xs font-bold bg-slate-900/90 border border-slate-700 text-emerald-300 px-3 py-1.5 rounded-xl">Personal Care</span>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'zone' ? (
        /* DEDICATED ZONE PERFORMANCE PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Zone Performance & Aisle Attractiveness Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mt-1">Comparative engagement scores, density per m², and revenue yield</p>
            </div>
          </div>

          <div className="space-y-4">
            {zonePerformance.map((zp, i) => (
              <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white">{zp.zone}</span>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Density: <strong className="text-white">{zp.density}</strong></span>
                    <span>Conversion: <strong className="text-emerald-400">{zp.conversion}</strong></span>
                    <span>Revenue: <strong className="text-white">{zp.revenue}</strong></span>
                  </div>
                </div>
                <div className="w-full md:w-64 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Engagement Score</span>
                    <span>{zp.score} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${zp.score}%`, backgroundColor: zp.fill }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'product' ? (
        /* DEDICATED PRODUCT ANALYTICS PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Product Sales & Interaction Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-1">Individual SKU interaction rates, gaze duration, and revenue rankings</p>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3">Interactions</th>
                  <th className="pb-3">Purchase Rate</th>
                  <th className="pb-3">Avg Dwell</th>
                  <th className="pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topPerformingProducts.map((p) => (
                  <tr key={p.rank} className="hover:bg-slate-900/60 text-slate-300">
                    <td className="py-3 font-bold text-slate-400">{p.rank}</td>
                    <td className="py-3 font-bold text-white">{p.name}</td>
                    <td className="py-3 text-slate-400">{p.category}</td>
                    <td className="py-3 text-slate-300">{p.views}</td>
                    <td className="py-3 text-slate-300">{p.interactions}</td>
                    <td className="py-3 text-emerald-400 font-bold">{p.rate}</td>
                    <td className="py-3 text-slate-300">{p.dwell}</td>
                    <td className="py-3 font-bold text-white">{p.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-red-400 uppercase tracking-wider">Low Attention / Needs Optimization SKUs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lowAttentionProducts.map((lp, i) => (
                <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{lp.name}</p>
                    <p className="text-[10px] text-slate-400">{lp.category} • {lp.views} views • {lp.dwell} dwell</p>
                  </div>
                  <span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20">{lp.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeSubTab === 'category' ? (
        /* DEDICATED CATEGORY PERFORMANCE PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                Category Performance & Revenue Yield
              </h3>
              <p className="text-xs text-slate-400 mt-1">Department sales contribution, shelf margin, and category conversion rates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
              <h4 className="font-bold text-slate-400 text-xs uppercase">Electronics & Tech</h4>
              <p className="text-2xl font-black text-white mt-1">₹ 3.82L</p>
              <p className="text-xs text-emerald-400 mt-1">▲ +14.2% sales yield</p>
            </div>
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
              <h4 className="font-bold text-slate-400 text-xs uppercase">Apparel & Fashion</h4>
              <p className="text-2xl font-black text-white mt-1">₹ 2.94L</p>
              <p className="text-xs text-emerald-400 mt-1">▲ +18.7% sales yield</p>
            </div>
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
              <h4 className="font-bold text-slate-400 text-xs uppercase">Home & Living</h4>
              <p className="text-2xl font-black text-white mt-1">₹ 1.84L</p>
              <p className="text-xs text-emerald-400 mt-1">▲ +9.4% sales yield</p>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'insights' ? (
        /* DEDICATED AI INSIGHTS PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Spatial Insights & Merchandising Recommendations
              </h3>
              <p className="text-xs text-slate-400 mt-1">Automated spatial intelligence alerts and shelf layout optimization tips</p>
            </div>
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {insight.type === 'star' && <Star className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />}
                  {insight.type === 'shield' && <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
                  {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-semibold text-white">{insight.text}</p>
                    <p className="text-xs text-indigo-400 font-bold mt-1">Recommended Action: {insight.action}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer">
                  Execute Recommendation
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'export' ? (
        /* DEDICATED EXPORT DATA CENTER PAGE VIEW */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                Raw Data Export & Analytics Hub
              </h3>
              <p className="text-xs text-slate-400 mt-1">Export raw telemetry logs, spatial heatmaps, and report packages</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <h4 className="font-bold text-white text-sm">CSV Telemetry Log Export</h4>
              <p className="text-xs text-slate-400">Download raw shopper coordinates (x, y, gaze, dwell_time)</p>
              <button onClick={handleExport} className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs rounded-xl text-white">Download CSV</button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <h4 className="font-bold text-white text-sm">PDF Executive Report</h4>
              <p className="text-xs text-slate-400">Weekly executive summary with charts, heatmaps & insights</p>
              <button onClick={handleExport} className="w-full py-2 bg-purple-600 hover:bg-purple-500 font-bold text-xs rounded-xl text-white">Download PDF</button>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">JSON Analytics Feed</h4>
              <p className="text-xs text-slate-400">API payload structure for BI tools (PowerBI, Tableau)</p>
              <button onClick={handleExport} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl text-white">Export JSON</button>
            </div>
          </div>
        </div>
      ) : (
        /* FULL OVERVIEW DASHBOARD VIEW (MATCHING REFERENCE IMAGE 100%) */
        <>
          {/* 📊 ROW 1: 6 Top KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            {/* Card 1: Total Visitors */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Total Visitors</span>
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">18,642</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>▲ +12.6%</span>
                <span className="text-slate-400 font-normal">vs last 7 days</span>
              </div>
            </div>

            {/* Card 2: Avg Attention Time */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Avg. Attention</span>
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Eye size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">6.42s</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>▲ +14.3%</span>
                <span className="text-slate-400 font-normal">vs last 7 days</span>
              </div>
            </div>

            {/* Card 3: Avg Dwell Time */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Avg. Dwell Time</span>
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">28.6s</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>▲ +8.7%</span>
                <span className="text-slate-400 font-normal">vs last 7 days</span>
              </div>
            </div>

            {/* Card 4: Conversion Rate */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Conversion Rate</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">23.8%</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>▲ +6.5%</span>
                <span className="text-slate-400 font-normal">vs last 7 days</span>
              </div>
            </div>

            {/* Card 5: Sales (Real CSV Dataset) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Total Sales</span>
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-white truncate">
                {overview?.total_revenue ? `$${(overview.total_revenue / 1000000).toFixed(2)}M` : '$222.40M'}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>Store #1 Primary</span>
                <span className="text-slate-400 font-normal">77 Depts</span>
              </div>
            </div>

            {/* Card 6: Holiday Lift (Real CSV Dataset) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Holiday Lift</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-xl font-black text-emerald-400">
                +{overview?.holiday_analysis?.holiday_sales_lift_pct || '6.62'}%
              </div>
              <div className="text-[10px] text-slate-300 font-semibold mt-1 flex items-center gap-1">
                <span>$23.04K vs $21.61K/wk</span>
              </div>
            </div>

          </div>

          {/* 📈 ROW 2: 3 Main Charts (Consumer Journey, Attention Over Time, Customer Segmentation) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Visual 1: Consumer Journey Flow (Ultra Neat & Clean Sankey Diagram) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Consumer Journey Flow</h3>
                  <p className="text-[11px] text-slate-400">Entry points ➔ In-Store Zones ➔ Exit Points</p>
                </div>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              {/* 🎨 5-Column Grid Layout: Col 1 (Entries) | Gap 1 (SVG) | Col 2 (Zones) | Gap 2 (SVG) | Col 3 (Exits) */}
              <div className="grid grid-cols-[1fr_36px_1fr_36px_1fr] items-center my-auto">
                
                {/* 1. ENTRY POINTS COLUMN */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ENTRY POINTS</p>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-indigo-500/50 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Cam 1: Entrance</p>
                    <p className="text-[10px] text-indigo-400 font-bold mt-1">8,426 (45%)</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Entrance 2 (North)</p>
                    <p className="text-[10px] text-slate-300 font-bold mt-1">6,231 (33%)</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-amber-500/50 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Entrance 3 (Parking)</p>
                    <p className="text-[10px] text-amber-400 font-bold mt-1">3,985 (22%)</p>
                  </div>
                </div>

                {/* 2. GAP 1 SVG FLOW RIBBONS (Entry Points -> Zones) */}
                <div className="h-[210px] w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 36 210" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gap1-indigo" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="gap1-teal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="gap1-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>

                    {/* Entrance 1 -> Electronics & Apparel */}
                    <path d="M 0 25 C 18 25, 18 16, 36 16 L 36 30 C 18 30, 18 42, 0 42 Z" fill="url(#gap1-indigo)" />
                    <path d="M 0 35 C 18 35, 18 58, 36 58 L 36 72 C 18 72, 18 45, 0 45 Z" fill="url(#gap1-indigo)" opacity="0.8" />

                    {/* Entrance 2 -> Electronics, Apparel & Home */}
                    <path d="M 0 95 C 18 95, 18 30, 36 30 L 36 40 C 18 40, 18 105, 0 105 Z" fill="url(#gap1-teal)" />
                    <path d="M 0 108 C 18 108, 18 114, 36 114 L 36 128 C 18 128, 18 118, 0 118 Z" fill="url(#gap1-teal)" opacity="0.8" />

                    {/* Entrance 3 -> Home & Personal Care */}
                    <path d="M 0 170 C 18 170, 18 128, 36 128 L 36 140 C 18 140, 18 180, 0 180 Z" fill="url(#gap1-amber)" opacity="0.8" />
                    <path d="M 0 180 C 18 180, 18 170, 36 170 L 36 190 C 18 190, 18 190, 0 190 Z" fill="url(#gap1-amber)" />
                  </svg>
                </div>

                {/* 3. IN-STORE ZONES COLUMN (Cameras 2 - 6) */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">IN-STORE ZONES</p>
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-indigo-500/50 text-xs shadow-md">
                    <p className="font-bold text-white text-[10px] leading-none">Cam 2: Aisle A</p>
                    <p className="text-[9px] text-indigo-300 font-semibold mt-0.5">4,821 (26%)</p>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-purple-500/50 text-xs shadow-md">
                    <p className="font-bold text-white text-[10px] leading-none">Cam 3: Aisle B</p>
                    <p className="text-[9px] text-purple-300 font-semibold mt-0.5">5,214 (28%)</p>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-blue-500/50 text-xs shadow-md">
                    <p className="font-bold text-white text-[10px] leading-none">Cam 4: Aisle C</p>
                    <p className="text-[9px] text-blue-300 font-semibold mt-0.5">4,156 (22%)</p>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs shadow-md">
                    <p className="font-bold text-white text-[10px] leading-none">Cam 5: Aisle D</p>
                    <p className="text-[9px] text-slate-300 font-semibold mt-0.5">3,210 (17%)</p>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-xs shadow-md">
                    <p className="font-bold text-white text-[10px] leading-none">Cam 6: Promo Area</p>
                    <p className="text-[9px] text-emerald-400 font-bold mt-0.5">4,451 (24%)</p>
                  </div>
                </div>

                {/* 4. GAP 2 SVG FLOW RIBBONS (Zones -> Exits) */}
                <div className="h-[210px] w-full flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 36 210" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gap2-indigo" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="gap2-teal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="gap2-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>

                    {/* Electronics & Apparel -> Checkout */}
                    <path d="M 0 16 C 18 16, 18 22, 36 22 L 36 40 C 18 40, 18 30, 0 30 Z" fill="url(#gap2-indigo)" />
                    <path d="M 0 58 C 18 58, 18 36, 36 36 L 36 52 C 18 52, 18 72, 0 72 Z" fill="url(#gap2-indigo)" opacity="0.8" />

                    {/* Home & Living -> Exit 2 */}
                    <path d="M 0 114 C 18 114, 18 96, 36 96 L 36 116 C 18 116, 18 128, 0 128 Z" fill="url(#gap2-teal)" />

                    {/* Personal Care -> Exit 3 */}
                    <path d="M 0 170 C 18 170, 18 170, 36 170 L 36 190 C 18 190, 18 190, 0 190 Z" fill="url(#gap2-amber)" />
                  </svg>
                </div>

                {/* 5. EXIT POINTS COLUMN */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">EXIT POINTS</p>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-emerald-500/60 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Cam 7: Checkout</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">8,892 (48%)</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Cam 8: Main Exit</p>
                    <p className="text-[10px] text-slate-300 font-bold mt-1">6,125 (33%)</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs shadow-md">
                    <p className="font-bold text-white leading-none">Exit 3 (Side Corridor)</p>
                    <p className="text-[10px] text-slate-300 font-bold mt-1">3,625 (19%)</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Visual 2: Attention Analytics Over Time */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Attention Analytics Over Time</h3>
                  <p className="text-[11px] text-slate-400">Attention Time (seconds)</p>
                </div>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              <div className="h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attentionTimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit="s" domain={[0, 10]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} 
                      formatter={(val: any) => [`${val}s`, 'Attention Time']}
                    />
                    <Line type="monotone" dataKey="attention" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 3: Customer Segmentation */}
            <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Customer Segmentation</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              <div className="h-44 relative my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                  <span className="text-base font-black text-white">18,642</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] mt-2">
                {customerSegments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                      <span className="text-slate-300 font-medium">{seg.name}</span>
                    </div>
                    <span className="font-bold text-white">{seg.value.toLocaleString()} ({seg.percent})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 📊 ROW 3: 4 Visual Cards (Shopping Behaviour, Dwell Time Distribution, Zone Performance, Traffic Flow Heatmap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Shopping Behaviour */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Shopping Behaviour</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>
              
              <div className="h-48 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shoppingBehaviorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                    <Bar dataKey="Visited" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Interacted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Purchased" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-300 mt-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span> Visited</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Interacted</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Purchased</span>
              </div>
            </div>

            {/* Card 2: Dwell Time Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Dwell Time Distribution</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              <div className="h-44 relative my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dwellTimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dwellTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Avg. Dwell Time</span>
                  <span className="text-sm font-black text-white">28.6s</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] mt-2">
                {dwellTimeData.map((dwell, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dwell.color }}></span>
                      <span className="text-slate-300 font-medium">{dwell.range}</span>
                    </div>
                    <span className="font-bold text-white">{dwell.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Zone Performance */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Zone Performance</h3>
                <span className="text-[10px] text-slate-400">by Engagement Score</span>
              </div>

              <div className="space-y-3 my-auto">
                {zonePerformance.map((zp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{zp.zone}</span>
                      <span className="text-white font-bold">{zp.score}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${zp.score}%`, backgroundColor: zp.fill }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">Engagement Score (0-100)</p>
            </div>

            {/* Card 4: Traffic Flow Heatmap */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Traffic Flow Heatmap</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              <div className="relative w-full h-44 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden my-auto flex flex-col justify-between p-3">
                {/* Heatmap Floorplan Graphic */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-indigo-900/20 to-red-900/40 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between">
                  <span className="text-[10px] font-bold bg-slate-900/90 border border-slate-700 text-indigo-300 px-2 py-0.5 rounded">Electronics</span>
                  <span className="text-[10px] font-bold bg-slate-900/90 border border-slate-700 text-purple-300 px-2 py-0.5 rounded">Apparel</span>
                </div>

                {/* Glowing Heat Spots */}
                <div className="relative z-10 flex justify-center my-auto">
                  <div className="w-20 h-20 bg-red-500/40 rounded-full blur-xl animate-pulse"></div>
                  <div className="w-16 h-16 bg-amber-500/30 rounded-full blur-lg"></div>
                </div>

                <div className="relative z-10 flex justify-between">
                  <span className="text-[10px] font-bold bg-slate-900/90 border border-slate-700 text-blue-300 px-2 py-0.5 rounded">Home & Living</span>
                  <span className="text-[10px] font-bold bg-slate-900/90 border border-slate-700 text-emerald-300 px-2 py-0.5 rounded">Personal Care</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span>Low Traffic</span>
                <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600"></div>
                <span>High Traffic</span>
              </div>
            </div>

          </div>

          {/* 📄 ROW 4: 3 Bottom Cards (Top Performing Products Table, AI Insights, Key Takeaways) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Card 1: Top Performing Products Table */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Top Performing Products</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-1 rounded-lg">Last 7 Days ▾</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="pb-2 font-bold">#</th>
                      <th className="pb-2 font-bold">Product Name</th>
                      <th className="pb-2 font-bold">Category</th>
                      <th className="pb-2 font-bold">Views</th>
                      <th className="pb-2 font-bold">Interactions</th>
                      <th className="pb-2 font-bold">Purchase Rate</th>
                      <th className="pb-2 font-bold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topPerformingProducts.map((p) => (
                      <tr key={p.rank} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="py-2.5 font-bold text-slate-400">{p.rank}</td>
                        <td className="py-2.5 font-bold text-white">{p.name}</td>
                        <td className="py-2.5 text-slate-400">{p.category}</td>
                        <td className="py-2.5 text-slate-300">{p.views}</td>
                        <td className="py-2.5 text-slate-300">{p.interactions}</td>
                        <td className="py-2.5 text-emerald-400 font-bold">{p.rate}</td>
                        <td className="py-2.5 font-bold text-white">{p.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 2: AI Insights */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AI Insights
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {aiInsights.slice(0, 4).map((insight) => (
                    <div key={insight.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
                      <div className="flex items-start gap-2">
                        {insight.type === 'star' && <Star className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />}
                        {insight.type === 'shield' && <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                        {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}
                        <p className="text-slate-300 text-[11px] leading-snug">{insight.text}</p>
                      </div>
                      <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 shrink-0">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-3 pt-2 border-t border-slate-800 flex items-center justify-center gap-1">
                <span>View All Insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Key Takeaways */}
            <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Key Takeaways</h3>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      Engagement is up by <span className="text-emerald-400 font-bold">9.7%</span> compared to last week.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      Dwell time increased by <span className="text-amber-400 font-bold">8.7%</span> across all zones.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      Conversion rate improved by <span className="text-purple-400 font-bold">6.5%</span> this week.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      <span className="text-blue-400 font-bold">30%</span> of visitors are Frequent Shoppers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
