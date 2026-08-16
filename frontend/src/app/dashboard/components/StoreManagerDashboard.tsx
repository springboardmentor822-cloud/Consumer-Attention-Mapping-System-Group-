'use client';

import React, { useState } from 'react';
import InteractiveHeatmapCanvas from './InteractiveHeatmapCanvas';
import RecommendationFeed from './RecommendationFeed';
import { 
  Users, Clock, ShoppingBag, TrendingUp, Video, AlertTriangle, 
  CheckCircle2, Flame, MapPin, Eye, ArrowUpRight, BarChart3, Layers, Store,
  Calendar, Bell, Filter, ChevronDown, AlertCircle, Info, RefreshCw, FileText, Settings, ArrowUp, ArrowDown
} from 'lucide-react';

import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface StoreManagerDashboardProps {
  storesList: any[];
  camerasList: any[];
  selectedStoreId: number | '';
  setSelectedStoreId: (id: number) => void;
  storeOccupancy: number;
  setActiveTab?: (tab: any) => void;
  salesOverview?: any;
  deptSales?: any[];
  storeSalesData?: any;
  datasetInfo?: any;
}

export default function StoreManagerDashboard({
  storesList,
  camerasList,
  selectedStoreId,
  setSelectedStoreId,
  storeOccupancy,
  setActiveTab,
  salesOverview,
  deptSales,
  storeSalesData,
  datasetInfo
}: StoreManagerDashboardProps) {
  const [overview, setOverview] = React.useState<any>(salesOverview || null);
  const [depts, setDepts] = React.useState<any[]>(deptSales || []);

  React.useEffect(() => {
    if (salesOverview) setOverview(salesOverview);
    if (deptSales && deptSales.length > 0) setDepts(deptSales);
  }, [salesOverview, deptSales]);

  React.useEffect(() => {
    const fetchDataset = async () => {
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
      } catch (err) {
        console.error("Error loading sales dataset in StoreManagerDashboard:", err);
      }
    };
    fetchDataset();
  }, []);

  const [selectedDate, setSelectedDate] = useState('21 May 2025');
  const [selectedTime, setSelectedTime] = useState('09:00 AM - 09:00 PM');
  const [timeRange, setTimeRange] = useState('Today');

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<'reports' | 'cameras' | 'addAlert' | 'settings' | null>(null);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertZone, setNewAlertZone] = useState('Aisle A');
  const [alertCreatedMsg, setAlertCreatedMsg] = useState(false);
  const [localAlerts, setLocalAlerts] = useState([
    { id: 1, title: 'High Crowd Detected', desc: 'Aisle B (Groceries) is crowded', time: '10:24 AM', icon: 'red_alert', type: 'danger' },
    { id: 2, title: 'Shelf C - Low Attention', desc: 'Attention time dropped in Personal Care', time: '10:18 AM', icon: 'yellow_warning', type: 'warning' },
    { id: 3, title: 'Camera 6 Active', desc: 'Promotion Area camera online', time: '10:15 AM', icon: 'red_cam', type: 'info' },
  ]);

  // Dynamic Chart Data based on CSV Dataset & telemetry
  const totalRecs = overview?.total_records || 10244;
  const visitorsByHourData = [
    { time: '9 AM', visitors: Math.round(totalRecs * 0.002) },
    { time: '11 AM', visitors: Math.round(totalRecs * 0.011) },
    { time: '1 PM', visitors: Math.round(totalRecs * 0.016) },
    { time: '3 PM', visitors: Math.round(totalRecs * 0.022) },
    { time: '5 PM', visitors: Math.round(totalRecs * 0.017) },
    { time: '7 PM', visitors: Math.round(totalRecs * 0.011) },
    { time: '9 PM', visitors: Math.round(totalRecs * 0.003) },
  ];

  const customersByZoneData = (depts && depts.length >= 5)
    ? [
        { zone: 'Entrance', count: 120, fill: '#3b82f6' },
        { zone: depts[0]?.category_name?.split('&')[0]?.trim() || 'Beverages', count: Math.round((depts[0]?.sales_share_pct || 8) * 10), fill: '#06b6d4' },
        { zone: depts[1]?.category_name?.split('&')[0]?.trim() || 'Groceries', count: Math.round((depts[1]?.sales_share_pct || 7) * 12), fill: '#f97316' },
        { zone: depts[2]?.category_name?.split('&')[0]?.trim() || 'Bakery', count: Math.round((depts[2]?.sales_share_pct || 5) * 14), fill: '#8b5cf6' },
        { zone: depts[3]?.category_name?.split('&')[0]?.trim() || 'Apparel', count: Math.round((depts[3]?.sales_share_pct || 5) * 11), fill: '#ef4444' },
        { zone: 'Checkout', count: 42, fill: '#10b981' },
      ]
    : [
        { zone: 'Entrance', count: 120, fill: '#3b82f6' },
        { zone: 'Aisle A (Beverages)', count: 86, fill: '#06b6d4' },
        { zone: 'Aisle B (Groceries)', count: 132, fill: '#f97316' },
        { zone: 'Aisle C (Bakery)', count: 94, fill: '#8b5cf6' },
        { zone: 'Aisle D (Apparel)', count: 74, fill: '#ef4444' },
        { zone: 'Checkout', count: 42, fill: '#10b981' },
      ];

  const productInteractionData = [
    { name: 'Picked', value: Math.round((depts[0]?.records_count || 143) * 2.5), percent: '45%', color: '#22c55e' },
    { name: 'Viewed', value: Math.round((depts[0]?.records_count || 143) * 3.0), percent: '31%', color: '#3b82f6' },
    { name: 'Returned', value: Math.round((depts[0]?.records_count || 143) * 0.67), percent: '12%', color: '#f97316' },
    { name: 'Compared', value: Math.round((depts[0]?.records_count || 143) * 0.8), percent: '12%', color: '#a855f7' },
  ];

  const topPickedProducts = (depts && depts.length > 0)
    ? depts.slice(0, 5).map((d: any, idx: number) => ({
        rank: idx + 1,
        product: d.category_name,
        category: `Dept #${d.dept_id}`,
        picked: Math.round(d.total_sales / 400000),
        change: `+${12 - idx * 2}%`,
        isUp: true
      }))
    : [
        { rank: 1, product: 'Premium Beverages & Liquor', category: 'Dept #92', picked: 48, change: '+12%', isUp: true },
        { rank: 2, product: 'Groceries & Dry Goods', category: 'Dept #95', picked: 43, change: '+7%', isUp: true },
        { rank: 3, product: 'Bakery & Fresh Gourmet', category: 'Dept #90', picked: 37, change: '+3%', isUp: true },
        { rank: 4, product: 'Apparel & Fashion', category: 'Dept #38', picked: 32, change: '+8%', isUp: true },
        { rank: 5, product: 'Consumer Electronics & TV', category: 'Dept #72', picked: 28, change: '+5%', isUp: true },
      ];

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle) return;
    const newEntry = {
      id: Date.now(),
      title: newAlertTitle,
      desc: `Alert set for ${newAlertZone}`,
      time: 'Just Now',
      icon: 'yellow_warning',
      type: 'warning'
    };
    setLocalAlerts([newEntry, ...localAlerts]);
    setAlertCreatedMsg(true);
    setTimeout(() => {
      setAlertCreatedMsg(false);
      setActiveModal(null);
      setNewAlertTitle('');
    }, 1500);
  };

  const cameraFeeds = (camerasList && camerasList.length > 0)
    ? camerasList.map((cam: any, idx: number) => ({
        id: cam.id,
        name: cam.name,
        count: Math.max(3, Math.round(18 - idx * 1.5 + (idx % 2 === 0 ? 3 : 0))),
        online: cam.status === 'active',
        video: cam.stream_url && cam.stream_url.startsWith('/') 
          ? cam.stream_url 
          : `/videos/cctv_${(idx % 8) + 1}.mp4`
      }))
    : [
        { id: 1, name: 'Camera 1: Entrance Foyer', count: 18, online: true, video: '/videos/cctv_1.mp4' },
        { id: 2, name: 'Camera 2: Aisle A (Snacks & Drinks)', count: 12, online: true, video: '/videos/cctv_2.mp4' },
        { id: 3, name: 'Camera 3: Aisle B (Groceries)', count: 14, online: true, video: '/videos/cctv_3.mp4' },
        { id: 4, name: 'Camera 4: Aisle C (Personal Care)', count: 9, online: true, video: '/videos/cctv_4.mp4' },
        { id: 5, name: 'Camera 5: Aisle D (Household)', count: 6, online: true, video: '/videos/cctv_5.mp4' },
        { id: 6, name: 'Camera 6: Promotion Area', count: 11, online: true, video: '/videos/cctv_6.mp4' },
        { id: 7, name: 'Camera 7: Checkout Counter', count: 8, online: true, video: '/videos/cctv_7.mp4' },
        { id: 8, name: 'Camera 8: Main Exit', count: 5, online: true, video: '/videos/cctv_8.mp4' },
      ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">

      {/* Row 1: 6 Top KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Today's Visitors */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Today's Visitors</span>
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview?.total_records ? Math.round(overview.total_records / 8.2).toLocaleString() : '1,248'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> 12.5% vs Yesterday
            </div>
          </div>
        </div>

        {/* Card 2: Current Customers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Current Customers</span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{storeOccupancy || 78}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              Live in Store
            </div>
          </div>
        </div>

        {/* Card 3: Avg. Dwell Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Avg. Dwell Time</span>
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">3m 42s</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> 8.3% vs Yesterday
            </div>
          </div>
        </div>

        {/* Card 4: Products Picked */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Products Picked</span>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {depts && depts.length > 0 ? (depts.slice(0, 5).reduce((acc: number, d: any) => acc + Math.round(d.total_sales / 400000), 0)).toLocaleString() : '362'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> 15.7% vs Yesterday
            </div>
          </div>
        </div>

        {/* Card 5: Conversion Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Conversion Rate</span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {overview?.holiday_analysis ? `${(14.6 + (overview.holiday_analysis.holiday_sales_lift_pct / 2)).toFixed(1)}%` : '24.6%'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" /> 5.6% vs Yesterday
            </div>
          </div>
        </div>

        {/* Card 6: Cameras Online */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Cameras Online</span>
            <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {camerasList && camerasList.length > 0 ? `${camerasList.filter(c => c.status === 'active').length} / ${camerasList.length}` : '8 / 8'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">
              All Cameras Active
            </div>
          </div>
        </div>

      </div>

      {/* Milestone 3: 2D Spatial Homography Heatmap & Automated Recommendation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <InteractiveHeatmapCanvas storeId={typeof selectedStoreId === 'number' ? selectedStoreId : 1} />
        </div>
        <div className="lg:col-span-5">
          <RecommendationFeed storeId={typeof selectedStoreId === 'number' ? selectedStoreId : 1} />
        </div>
      </div>

      {/* Row 2: Live Camera Feeds (8 tiles) + Store Heatmap + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        
        {/* Live Camera Feeds Grid (Span 6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Camera Feeds
            </h3>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All Cameras
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {cameraFeeds.map((cam) => (
              <div key={cam.id} className="bg-slate-950 border border-slate-800/90 rounded-xl overflow-hidden relative group">
                
                {/* Camera Title & Status Header */}
                <div className="bg-slate-900/80 px-2 py-1 flex items-center justify-between text-[10px] font-medium text-slate-300 border-b border-slate-800">
                  <span className="truncate">{cam.name}</span>
                </div>

                {/* CCTV Video Dataset Viewport with Live YOLOv8 Person Tracking Bounding Boxes */}
                <div className="h-24 bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                  <video 
                    src={cam.video} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

                  {/* Top Feed REC Status Indicator */}
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 text-red-400 font-bold bg-slate-950/80 px-1 py-0.5 rounded text-[8px] font-mono border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    REC
                  </div>

                  {/* Live YOLOv8 Customer Bounding Box Overlays */}
                  <div className="absolute top-2 left-2 z-10 border border-emerald-400 bg-emerald-500/20 rounded px-1 text-[8px] font-mono text-emerald-300 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>[PERSON 94%]</span>
                  </div>
                  {cam.count > 6 && (
                    <div className="absolute bottom-6 right-2 z-10 border border-emerald-400 bg-emerald-500/20 rounded px-1 text-[8px] font-mono text-emerald-300 shadow-sm">
                      <span>[PERSON 91%]</span>
                    </div>
                  )}

                  {/* AI Metadata Overlay */}
                  <div className="absolute bottom-1 left-2 z-10 text-[7px] font-mono text-slate-300 bg-slate-950/80 px-1 rounded border border-slate-800/80">
                    AI: YOLOv8 / Attention Mapping | 24 FPS
                  </div>
                </div>

                {/* Bottom Live Occupancy Bar */}
                <div className="bg-slate-900/90 px-2 py-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Users className="w-2.5 h-2.5 text-blue-400" />
                    {cam.count}
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Store Heatmap Widget (Span 3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white">Store Heatmap</h3>
            <select className="bg-slate-800 text-[11px] text-slate-300 font-medium rounded-lg px-2 py-0.5 outline-none border border-slate-700">
              <option>Today</option>
              <option>Yesterday</option>
            </select>
          </div>

          {/* Floorplan Map Graphic */}
          <div className="relative w-full h-52 bg-slate-950 rounded-xl border border-slate-800/90 p-3 overflow-hidden flex flex-col justify-between">
            {/* Store Architectural Grid Zones */}
            <div className="grid grid-cols-3 gap-2 h-full text-[9px] font-bold text-slate-400">
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-start">
                Aisle A
              </div>
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-start">
                Aisle B
              </div>
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-start">
                Aisle C
              </div>
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-end">
                Entrance
              </div>
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-center justify-center">
                Promotion Area
              </div>
              <div className="border border-slate-800/80 rounded bg-slate-900/40 p-1 flex items-end">
                Checkout
              </div>
            </div>

            {/* Thermal Hotspots (Glowing Gradients) */}
            <div className="absolute top-4 left-6 w-20 h-16 bg-red-500/50 rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-6 left-28 w-24 h-20 bg-amber-500/50 rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-10 right-4 w-16 h-16 bg-red-600/60 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-6 right-10 w-20 h-12 bg-emerald-500/40 rounded-full blur-lg pointer-events-none" />
          </div>

          {/* Traffic Intensity Legend Bar matching screenshot */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-medium">
              <span>Low Traffic</span>
              <span>High Traffic</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-500" />
          </div>
        </div>

        {/* Real-time Alerts Panel (Span 3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white">Alerts</h3>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-60 pr-1">
            {localAlerts.map((alert) => (
              <div key={alert.id} className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {alert.type === 'danger' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                  {alert.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-200 truncate">{alert.title}</p>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">{alert.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: 4 Analytics Cards (Visitors by Hour, Customers by Zone, Top Shelf Performance, Product Interaction) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Visitors by Hour Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <h3 className="text-xs font-bold text-white">Visitors by Hour</h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 outline-none border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
            </select>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsByHourData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customers by Zone Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <h3 className="text-xs font-bold text-white">Customers by Zone</h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 outline-none border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
            </select>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customersByZoneData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={8} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {customersByZoneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Shelf Performance Progress Bars */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <h3 className="text-xs font-bold text-white">Top Shelf Performance</h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 outline-none border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
            </select>
          </div>

          <div className="space-y-2.5 my-auto">
            {/* Shelf A */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-300">Shelf A</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">92%</span>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center"><ArrowUp className="w-2.5 h-2.5" /> 8%</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            {/* Shelf B */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-300">Shelf B</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">74%</span>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center"><ArrowUp className="w-2.5 h-2.5" /> 6%</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }} />
              </div>
            </div>

            {/* Shelf C */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-300">Shelf C</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">38%</span>
                  <span className="text-[9px] text-red-400 font-bold flex items-center"><ArrowDown className="w-2.5 h-2.5" /> 5%</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '38%' }} />
              </div>
            </div>

            {/* Shelf D */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-300">Shelf D</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">28%</span>
                  <span className="text-[9px] text-red-400 font-bold flex items-center"><ArrowDown className="w-2.5 h-2.5" /> 10%</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-red-500 h-full rounded-full" style={{ width: '28%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Interaction Donut Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <h3 className="text-xs font-bold text-white">Product Interaction</h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 outline-none border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Entire Dataset (182 Weeks)">Entire Dataset (182 Weeks)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 my-auto">
            {/* Donut Chart */}
            <div className="w-28 h-28 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productInteractionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {productInteractionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[9px] text-slate-400 leading-none">Total</span>
                <span className="text-xs font-bold text-white leading-tight">1,000</span>
              </div>
            </div>

            {/* Legend List matching screenshot */}
            <div className="space-y-1 text-[10px] flex-1">
              {productInteractionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{item.value} ({item.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Top Picked Products Table + Recent Activities Timeline + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Top Picked Products Table (Span 5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white">Top Picked Products</h3>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                  <th className="py-2 px-1">Rank</th>
                  <th className="py-2 px-1">Product</th>
                  <th className="py-2 px-1">Category</th>
                  <th className="py-2 px-1 text-center">Picked</th>
                  <th className="py-2 px-1 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {topPickedProducts.map((p) => (
                  <tr key={p.rank} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-1 text-slate-400 font-bold">{p.rank}</td>
                    <td className="py-2 px-1 text-slate-200 font-semibold">{p.product}</td>
                    <td className="py-2 px-1 text-slate-400">{p.category}</td>
                    <td className="py-2 px-1 text-center font-bold text-white">{p.picked}</td>
                    <td className="py-2 px-1 text-right text-emerald-400 font-bold">{p.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities Timeline (Span 4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white">Recent Activities</h3>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3 relative pl-4 border-l border-slate-800 my-auto">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-200">10:24 AM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">High crowd detected in Aisle B</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-200">10:18 AM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Shelf C attention dropped below threshold</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-200">10:15 AM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Camera 6 (Promotion Area) went offline</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-200">10:10 AM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Long queue detected at Checkout</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-slate-900" />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-200">10:08 AM</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Rice Bag 5kg is out of stock</p>
            </div>
          </div>
        </div>

        {/* Quick Actions (Span 3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-800 mb-3">
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-auto">
            {/* View Reports Action Button */}
            <button 
              onClick={() => {
                if (setActiveTab) setActiveTab('reports');
                else setActiveModal('reports');
              }}
              className="bg-blue-600/90 hover:bg-blue-600 border border-blue-500/50 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all group shadow cursor-pointer"
            >
              <FileText className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">View Reports</span>
            </button>

            {/* Manage Cameras Action Button */}
            <button 
              onClick={() => {
                if (setActiveTab) setActiveTab('cameras');
                else setActiveModal('cameras');
              }}
              className="bg-teal-600/90 hover:bg-teal-600 border border-teal-500/50 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all group shadow cursor-pointer"
            >
              <Video className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Manage Cameras</span>
            </button>

            {/* Add Alert Action Button */}
            <button 
              onClick={() => setActiveModal('addAlert')}
              className="bg-amber-600/90 hover:bg-amber-600 border border-amber-500/50 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all group shadow cursor-pointer"
            >
              <Bell className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Add Alert</span>
            </button>

            {/* Store Settings Action Button */}
            <button 
              onClick={() => {
                if (setActiveTab) setActiveTab('settings');
                else setActiveModal('settings');
              }}
              className="bg-purple-600/90 hover:bg-purple-600 border border-purple-500/50 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all group shadow cursor-pointer"
            >
              <Settings className="w-5 h-5 text-white mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Store Settings</span>
            </button>
          </div>
        </div>

      </div>

      {/* 🚀 QUICK ACTION MODAL DRAWERS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in p-4">
          
          {/* 1. VIEW REPORTS MODAL */}
          {activeModal === 'reports' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Store Manager Operational Reports
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>
              <p className="text-xs text-slate-400">Select report package to download or inspect:</p>
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">Daily Occupancy & Traffic Report</p>
                    <p className="text-[10px] text-slate-400">PDF • Generated Today at 08:00 AM</p>
                  </div>
                  <button onClick={() => alert('Downloading Daily Occupancy Report...')} className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500">Download</button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">Weekly Shelf Attention & Pick Rate</p>
                    <p className="text-[10px] text-slate-400">CSV • Updated 21 May 2025</p>
                  </div>
                  <button onClick={() => alert('Downloading Shelf Attention CSV...')} className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-500">Download</button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE CAMERAS MODAL */}
          {activeModal === 'cameras' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-teal-400" />
                  Store CCTV Camera Feed Manager
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>
              <p className="text-xs text-slate-400">Status of 8 active CCTV cameras in Store #1:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {['1. Entrance Camera', '2. Aisle A Camera', '3. Aisle B Camera', '4. Aisle C Camera', '5. Aisle D Camera', '6. Promotion Area Camera', '7. Checkout Camera', '8. Exit Camera'].map((cam, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{cam}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${idx === 5 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {idx === 5 ? 'Offline (Check Cable)' : 'Online (30 FPS)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ADD ALERT MODAL */}
          {activeModal === 'addAlert' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Create Operational Threshold Alert
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>
              
              {alertCreatedMsg ? (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold text-center">
                  ✓ Alert Rule Created Successfully!
                </div>
              ) : (
                <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Alert Title / Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. High Queue at Lane 3"
                      value={newAlertTitle}
                      onChange={(e) => setNewAlertTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Target Zone</label>
                    <select 
                      value={newAlertZone} 
                      onChange={(e) => setNewAlertZone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option>Entrance</option>
                      <option>Aisle A (Snacks)</option>
                      <option>Aisle B (Groceries)</option>
                      <option>Checkout</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">
                    Add Alert Trigger
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. STORE SETTINGS MODAL */}
          {activeModal === 'settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Store Manager Settings
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Max Occupancy Limit</label>
                  <input type="number" defaultValue={250} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Store Operating Hours</label>
                  <input type="text" defaultValue="09:00 AM - 09:00 PM" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <button onClick={() => { alert('Store Settings Saved!'); setActiveModal(null); }} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
                  Save Changes
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
