import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Filter, 
  Video, 
  TrendingUp, 
  Users, 
  Map 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { apiClient } from '../lib/axios';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SegmentItem {
  segment: string;
  percentage: number;
  description: string;
}

interface TrafficItem {
  hour: string;
  visitors: number;
}

interface JourneyPathItem {
  path: string;
  shoppers: number;
  percentage: number;
}

interface ZoneItem {
  id: string;
  name: string;
}

interface DashboardData {
  store_id: string;
  sankey_data: SankeyData;
  segmentation: SegmentItem[];
  traffic_chart: TrafficItem[];
  journey_paths: JourneyPathItem[];
  zones: ZoneItem[];
}

interface StoreItem {
  id: string;
  name: string;
  location?: string;
}

interface CameraItem {
  id: string;
  name: string;
  camera_id: string;
  stream_url?: string;
  is_active?: boolean;
}

interface PageProps {
  storeId: string;
  token: string | null;
}

const SEGMENT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
const ZONE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'
];

const ILLUSTRATIVE_SEGMENTS = [
  { segment: 'Explorers', percentage: 35.0, description: 'Shoppers browsing multiple areas.' },
  { segment: 'Quick Buyers', percentage: 20.0, description: 'Shoppers transitioning directly to checkout.' },
  { segment: 'Comparison Shoppers', percentage: 15.0, description: 'Shoppers lingering at shelf displays.' },
  { segment: 'Impulse Buyers', percentage: 10.0, description: 'Shoppers picking up checkout items.' },
  { segment: 'Brand Loyal', percentage: 20.0, description: 'Shoppers heading to specific aisles.' }
];

const ILLUSTRATIVE_TRAFFIC = [
  { hour: '09:00', visitors: 12 },
  { hour: '10:00', visitors: 28 },
  { hour: '11:00', visitors: 45 },
  { hour: '12:00', visitors: 62 },
  { hour: '13:00', visitors: 50 },
  { hour: '14:00', visitors: 35 },
  { hour: '15:00', visitors: 40 },
  { hour: '16:00', visitors: 58 },
  { hour: '17:00', visitors: 82 },
  { hour: '18:00', visitors: 95 },
  { hour: '19:00', visitors: 55 },
  { hour: '20:00', visitors: 22 }
];

export default function ConsumerJourney({ storeId: initialStoreId, token }: PageProps) {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId);
  const [dateRange, setDateRange] = useState<string>('today');
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [failedStreams, setFailedStreams] = useState<Record<string, boolean>>({});

  // Fetch stores list once
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiClient.get<StoreItem[]>('/api/stores/');
        setStores(res.data);
      } catch (err) {
        console.error('Failed to load stores', err);
      }
    };
    fetchStores();
  }, []);

  // Fetch dashboard data and cameras
  const loadDashboardData = async (storeIdToFetch: string, range: string, silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      // Calculate date filters
      let start_date = '';
      let end_date = '';
      const now = new Date();
      
      if (range === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start_date = yesterday.toISOString();
        end_date = today.toISOString();
      } else if (range === 'last7') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        start_date = sevenDaysAgo.toISOString();
      } else if (range === 'last30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        start_date = thirtyDaysAgo.toISOString();
      } else {
        // Default today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start_date = today.toISOString();
      }

      // 1. Fetch dashboard analytics
      const dashRes = await apiClient.get<DashboardData>(`/api/dashboards/analyst/${storeIdToFetch}`, {
        params: { start_date, end_date }
      });
      setData(dashRes.data);

      // 2. Fetch cameras for the live feed
      const camsRes = await apiClient.get<CameraItem[]>(`/api/cameras/store/${storeIdToFetch}`);
      setCameras(camsRes.data);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unable to load journey analytics');
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedStoreId(initialStoreId);
    loadDashboardData(initialStoreId, dateRange);

    // Dynamic background polling every 30 seconds
    const pollInterval = setInterval(() => {
      loadDashboardData(initialStoreId, dateRange, true);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [initialStoreId, dateRange]);

  const handleFilterClick = () => {
    loadDashboardData(selectedStoreId, dateRange);
  };

  const handleRefreshClick = () => {
    loadDashboardData(selectedStoreId, dateRange);
  };

  // Map zone names to consistent colors
  const zoneColorMap = useMemo(() => {
    if (!data || !data.zones) return {};
    const map: Record<string, string> = {};
    data.zones.forEach((z, idx) => {
      map[z.name] = ZONE_COLORS[idx % ZONE_COLORS.length];
    });
    // Add default fallbacks
    map["Entrance Foyer"] = ZONE_COLORS[0];
    map["Main Product Aisle"] = ZONE_COLORS[3];
    map["Checkout Lanes"] = ZONE_COLORS[5];
    return map;
  }, [data]);

  // Determine if real telemetry is insufficient to show a full Sankey flow
  const isIllustrative = useMemo(() => {
    if (!data || !data.sankey_data) return true;
    const { nodes, links } = data.sankey_data;
    // Require at least 4 unique zones and 3 transitions to show a live flow
    return nodes.length < 4 || links.length < 3;
  }, [data]);

  // Computes either real telemetry or the dynamic illustrative fallback
  const sankeyData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    if (!isIllustrative) return data.sankey_data;

    const zones = data.zones || [];
    const entranceZones: ZoneItem[] = [];
    const exitZones: ZoneItem[] = [];
    const intermediateZones: ZoneItem[] = [];

    zones.forEach(z => {
      const nameLower = z.name.toLowerCase();
      if (nameLower.includes('entrance') || nameLower.includes('foyer') || nameLower.includes('lobby')) {
        entranceZones.push(z);
      } else if (nameLower.includes('checkout') || nameLower.includes('exit') || nameLower.includes('lane') || nameLower.includes('cashier')) {
        exitZones.push(z);
      } else {
        intermediateZones.push(z);
      }
    });

    if (entranceZones.length === 0 && zones.length > 0) {
      entranceZones.push(zones[0]);
    }
    const exitThresholdIdx = zones.length > 1 ? zones.length - 1 : 0;
    if (exitZones.length === 0 && zones.length > 0) {
      exitZones.push(zones[exitThresholdIdx]);
    }

    const finalIntermediates = intermediateZones.filter(
      z => !entranceZones.some(ez => ez.id === z.id) && !exitZones.some(ex => ex.id === z.id)
    );

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const nodeMap: Record<string, number> = {};

    entranceZones.forEach(z => {
      nodeMap[z.id] = nodes.length;
      nodes.push({ name: z.name });
    });

    finalIntermediates.forEach(z => {
      nodeMap[z.id] = nodes.length;
      nodes.push({ name: z.name });
    });

    exitZones.forEach(z => {
      nodeMap[z.id] = nodes.length;
      nodes.push({ name: z.name });
    });

    finalIntermediates.forEach((z, i) => {
      const value = Math.max(100, 450 - i * 80);
      
      entranceZones.forEach(ez => {
        links.push({
          source: nodeMap[ez.id],
          target: nodeMap[z.id],
          value
        });
      });

      if (exitZones.length > 0) {
        if (exitZones.length > 1) {
          links.push({
            source: nodeMap[z.id],
            target: nodeMap[exitZones[0].id],
            value: Math.round(value * 0.7)
          });
          links.push({
            source: nodeMap[z.id],
            target: nodeMap[exitZones[1].id],
            value: Math.round(value * 0.3)
          });
        } else {
          links.push({
            source: nodeMap[z.id],
            target: nodeMap[exitZones[0].id],
            value
          });
        }
      }
    });

    if (finalIntermediates.length === 0) {
      entranceZones.forEach(ez => {
        exitZones.forEach(ex => {
          links.push({
            source: nodeMap[ez.id],
            target: nodeMap[ex.id],
            value: 250
          });
        });
      });
    }

    return { nodes, links };
  }, [data, isIllustrative]);

  // Compute dynamic coordinates for nodes in a three-column layout
  const layout = useMemo(() => {
    if (sankeyData.nodes.length === 0) {
      return { coords: [], paths: [], nodeTotals: [], leftNodes: [], rightNodes: [], centerNodes: [] };
    }

    const { nodes, links } = sankeyData;
    const nodesCount = nodes.length;
    const leftNodes: number[] = [];
    const rightNodes: number[] = [];
    const centerNodes: number[] = [];

    const incomingCount = new Array(nodesCount).fill(0);
    const outgoingCount = new Array(nodesCount).fill(0);

    links.forEach(l => {
      if (l.source < nodesCount) outgoingCount[l.source] += l.value;
      if (l.target < nodesCount) incomingCount[l.target] += l.value;
    });

    nodes.forEach((n, idx) => {
      const name = n.name.toLowerCase();
      if (name.includes('entrance') || name.includes('foyer') || name.includes('lobby') || (incomingCount[idx] === 0 && outgoingCount[idx] > 0)) {
        leftNodes.push(idx);
      } else if (name.includes('exit') || name.includes('checkout') || name.includes('lane') || name.includes('cashier') || (outgoingCount[idx] === 0 && incomingCount[idx] > 0)) {
        rightNodes.push(idx);
      } else {
        centerNodes.push(idx);
      }
    });

    if (leftNodes.length === 0 && nodesCount > 0) leftNodes.push(0);
    nodes.forEach((_, idx) => {
      if (!leftNodes.includes(idx) && !rightNodes.includes(idx) && !centerNodes.includes(idx)) {
        centerNodes.push(idx);
      }
    });

    const coords: { x: number; y: number }[] = new Array(nodesCount).fill(null).map(() => ({ x: 0, y: 0 }));

    const assignY = (indices: number[], x: number) => {
      const count = indices.length;
      indices.forEach((nodeIdx, i) => {
        const y = count === 1 ? 160 : 35 + (i * 250) / (count - 1);
        coords[nodeIdx] = { x, y };
      });
    };

    assignY(leftNodes, 80);
    assignY(centerNodes, 300);
    assignY(rightNodes, 520);

    const maxLinkValue = Math.max(...links.map(l => l.value), 1);

    const paths = links.map(l => {
      const src = coords[l.source] || { x: 80, y: 160 };
      const tgt = coords[l.target] || { x: 520, y: 160 };
      const thickness = Math.max(2.5, Math.min(35, (l.value / maxLinkValue) * 24));
      return {
        d: `M ${src.x} ${src.y} C ${(src.x + tgt.x)/2} ${src.y}, ${(src.x + tgt.x)/2} ${tgt.y}, ${tgt.x} ${tgt.y}`,
        thickness,
        value: l.value,
        sourceName: nodes[l.source]?.name || 'Unknown',
        targetName: nodes[l.target]?.name || 'Unknown'
      };
    });

    const nodeTotals = new Array(nodesCount).fill(0);
    links.forEach(l => {
      nodeTotals[l.source] = Math.max(nodeTotals[l.source], l.value);
      nodeTotals[l.target] += l.value;
    });

    leftNodes.forEach(lnIdx => {
      let sum = 0;
      links.forEach(l => {
        if (l.source === lnIdx) sum += l.value;
      });
      nodeTotals[lnIdx] = sum;
    });

    return { coords, paths, nodeTotals, leftNodes, rightNodes, centerNodes };
  }, [sankeyData]);

  // Real tracked database transitions indicator
  const hasRealTransitions = data && data.sankey_data && data.sankey_data.links.length > 0;
  const hasSankeyTransitions = sankeyData.links.length > 0;
  const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8000';

  const totalTraffic = useMemo(() => {
    if (!data || !data.traffic_chart) return 0;
    return data.traffic_chart.reduce((sum, t) => sum + t.visitors, 0);
  }, [data]);

  const peakTraffic = useMemo(() => {
    if (!data || !data.traffic_chart || data.traffic_chart.length === 0) return { hour: 'N/A', visitors: 0 };
    return data.traffic_chart.reduce((max, item) => item.visitors > max.visitors ? item : max, data.traffic_chart[0]);
  }, [data]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-4">
      <RefreshCw className="animate-spin text-cyan-500 w-9 h-9" />
      <span className="text-sm font-semibold">Loading journey analytics...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 p-4">
      <AlertTriangle className="text-rose-500 w-12 h-12 mb-3" />
      <span className="text-sm font-semibold">{error || "Unable to load journey analytics."}</span>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100 pb-8">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b0b14]/90 backdrop-blur-md p-4 rounded-xl border border-slate-900 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Consumer Journey</h1>
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-cyan-450 rounded-full mr-1.5 animate-pulse"></span>LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Understand how shoppers move through your store</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Store Selector */}
          <div className="flex items-center space-x-2 bg-[#12121e] border border-slate-800 rounded-lg px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <select 
              value={selectedStoreId} 
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none border-none cursor-pointer text-white"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id} className="bg-[#12121e] text-white">{st.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-[#12121e] border border-slate-800 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none border-none cursor-pointer text-white"
            >
              <option value="today" className="bg-[#12121e] text-white">Today</option>
              <option value="yesterday" className="bg-[#12121e] text-white">Yesterday</option>
              <option value="last7" className="bg-[#12121e] text-white">Last 7 Days</option>
              <option value="last30" className="bg-[#12121e] text-white">Last 30 Days</option>
            </select>
          </div>

          {/* Filter Action */}
          <button 
            onClick={handleFilterClick}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-md"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* Refresh Action */}
          <button 
            onClick={handleRefreshClick}
            className="flex items-center justify-center p-2 bg-[#12121e] hover:bg-[#1a1a2e] border border-slate-800 rounded-lg text-slate-350 transition-colors shadow-inner"
            title="Refresh statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area - Flow Diagram (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* store flow card */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl flex flex-col space-y-4 h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <Map className="w-4 h-4 mr-1.5 text-cyan-400" /> {isIllustrative ? "STORE FLOW VISUALIZATION" : "CONSUMER JOURNEY: STORE FLOW"}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isIllustrative 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {isIllustrative ? "Illustrative — insufficient verified transition telemetry" : "Live Store Flow"}
              </span>
            </div>

            <div className="relative bg-[#07070f] p-4 rounded-xl border border-slate-950 overflow-x-auto flex-grow flex items-center justify-center">
              {!hasSankeyTransitions ? (
                <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-500">
                  <AlertTriangle className="w-8 h-8 text-slate-700 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">No active store topology mapped</span>
                </div>
              ) : (
                <svg className="w-full min-w-[580px] min-h-[380px] max-h-[440px]" viewBox="0 0 600 320">
                  <defs>
                    {layout.paths.map((p, idx) => {
                      const gradId = `grad-${idx}`;
                      const startColor = zoneColorMap[p.sourceName] || '#06b6d4';
                      const endColor = zoneColorMap[p.targetName] || '#10b981';
                      return (
                        <linearGradient id={gradId} key={idx} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={startColor} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={endColor} stopOpacity={0.15} />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  {/* SVG Links */}
                  {layout.paths.map((p, idx) => (
                    <path 
                      key={idx} 
                      d={p.d} 
                      fill="none" 
                      stroke={`url(#grad-${idx})`}
                      strokeWidth={p.thickness} 
                      className="hover:opacity-100 opacity-80 transition-all duration-200 cursor-pointer"
                    >
                      <title>{`${p.sourceName} ➔ ${p.targetName} (${p.value.toLocaleString()} transitions)`}</title>
                    </path>
                  ))}

                  {/* Node Rects and Labels */}
                  <g>
                    {sankeyData.nodes.map((n, idx) => {
                      const coord = layout.coords[idx];
                      if (!coord) return null;
                      const count = layout.nodeTotals[idx] || 0;
                      const col = zoneColorMap[n.name] || '#475569';
                      const isLeft = layout.leftNodes.includes(idx);
                      const isRight = layout.rightNodes.includes(idx);
                      const textAnchor = isRight ? "end" : "start";
                      const textX = isRight ? -10 : 14;

                      return (
                        <g key={idx} transform={`translate(${coord.x}, ${coord.y - 20})`}>
                          <rect 
                            x={-3} 
                            y={0} 
                            width={6} 
                            height={40} 
                            rx={2}
                            fill={col} 
                            className="shadow-md"
                          />
                          <text 
                            x={textX} 
                            y={16} 
                            fill="#f8fafc" 
                            fontSize={10} 
                            fontWeight="bold"
                            textAnchor={textAnchor}
                            className="font-sans tracking-wide"
                          >
                            {n.name.toUpperCase()}
                          </text>
                          <text 
                            x={textX} 
                            y={28} 
                            fill="#64748b" 
                            fontSize={9} 
                            textAnchor={textAnchor}
                            className="font-mono font-medium"
                          >
                            {`(${count.toLocaleString()} Views)`}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
              {hasSankeyTransitions && (
                <div className="absolute bottom-1.5 left-3 right-3 text-center text-[8px] text-slate-500 font-semibold bg-[#07070f]/90 py-1 px-2 border border-slate-900/40 rounded backdrop-blur-sm select-none">
                  Illustrative store flow based on configured zones; verified cross-camera journey telemetry is currently limited.
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Right Area - Side Cards (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Shopper Distribution Card */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-cyan-400" /> SEGMENTATION / SHOPPER DISTRIBUTION
              </span>
              {!(totalTraffic > 0 && data.segmentation && data.segmentation.length > 0 && data.segmentation.some(s => s.percentage > 0)) && (
                <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-900">
                  NO TELEMETRY
                </span>
              )}
            </div>
            <div className="h-[180px] flex items-center justify-between relative">
              {totalTraffic > 0 && data.segmentation && data.segmentation.length > 0 && data.segmentation.some(s => s.percentage > 0) ? (
                <>
                  <div className="w-[45%] h-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.segmentation}
                          cx="50%"
                          cy="50%"
                          innerRadius={36}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="percentage"
                        >
                          {data.segmentation.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-slate-500 text-[8px] uppercase font-extrabold tracking-wider">Total</span>
                      <span className="text-white text-base font-extrabold font-mono">{totalTraffic}</span>
                    </div>
                  </div>
                  <div className="w-[52%] flex flex-col space-y-2 overflow-y-auto max-h-[160px] pr-1">
                    {data.segmentation.map((item, idx) => {
                      const count = Math.round((item.percentage / 100) * totalTraffic);
                      return (
                        <div key={idx} className="flex flex-col text-[9px] bg-[#12121c]/40 border border-slate-955 p-1.5 rounded space-y-0.5">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span 
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }}
                            />
                            <span className="text-slate-300 font-semibold truncate">{item.segment}</span>
                          </div>
                          <div className="flex justify-between items-center font-mono">
                            <span className="text-slate-550 text-[8px]">{count} Shoppers</span>
                            <span className="font-bold text-cyan-400">{item.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-slate-500 bg-[#07070f] rounded-lg p-4 text-center border border-slate-950">
                  <Users className="w-7 h-7 text-slate-800 mb-1.5" />
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">SEGMENTATION UNAVAILABLE</span>
                  <span className="text-[8px] text-slate-655 mt-1 leading-normal max-w-[90%] mx-auto">No verified shopper segmentation for the selected period.</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Traffic Trend Card */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <TrendingUp className="w-4 h-4 mr-1.5 text-cyan-400" /> DAILY TRAFFIC TREND
              </span>
              {totalTraffic > 0 && peakTraffic && peakTraffic.visitors > 0 ? (
                <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-400 bg-slate-950/45 px-2 py-0.5 rounded border border-slate-900 shadow">
                  <span>Peak: <strong className="text-cyan-400">{peakTraffic.visitors}</strong> at <strong className="text-slate-200">{peakTraffic.hour}</strong></span>
                </div>
              ) : (
                <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-slate-955 text-slate-550 border border-slate-900">
                  NO TELEMETRY
                </span>
              )}
            </div>
            <div className="h-[180px] w-full">
              {totalTraffic > 0 && data.traffic_chart && data.traffic_chart.length > 0 && data.traffic_chart.some(t => t.visitors > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.traffic_chart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#161625" />
                    <XAxis dataKey="hour" stroke="#475569" fontSize={8} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#090910', border: '1px solid #1e293b', borderRadius: '6px' }}
                      labelStyle={{ fontSize: 9, color: '#f8fafc', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: 8, color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorTraffic)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="relative w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.traffic_chart || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#161625" />
                      <XAxis dataKey="hour" stroke="#475569" fontSize={8} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={8} tickLine={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 p-2 text-center select-none backdrop-blur-[0.5px]">
                    <TrendingUp className="w-5 h-5 text-slate-700 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NO VERIFIED TRAFFIC RECORDS</span>
                    <span className="text-[8px] text-slate-655 mt-1 max-w-[85%] mx-auto">The selected period contains no measured traffic telemetry.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone Legend */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Zone Legend</span>
            <div className="grid grid-cols-2 gap-2">
              {data.zones && data.zones.length > 0 ? (
                data.zones.map((z, idx) => {
                  const color = zoneColorMap[z.name] || '#334155';
                  // Map camera name dynamically
                  const getAssociatedCamera = (zoneName: string) => {
                    const name = zoneName.toLowerCase();
                    if (name.includes('entrance')) return 'Entrance Camera';
                    if (name.includes('exit')) return 'Exit Camera';
                    if (name.includes('checkout')) return 'Checkout Camera';
                    if (name.includes('promotion')) return 'Promotion Camera';
                    if (name.includes('aisle 1')) return 'Aisle Camera 1';
                    if (name.includes('aisle 2')) return 'Aisle Camera 2';
                    if (name.includes('aisle 3')) return 'Aisle Camera 3';
                    if (name.includes('aisle 4')) return 'Aisle Camera 4';
                    if (name.includes('aisle 5')) return 'Aisle Camera 5';
                    return 'General Store View';
                  };
                  const camName = getAssociatedCamera(z.name);
                  // Dynamic telemetry display
                  const viewsCount = layout.nodeTotals[idx];
                  const hasViews = totalTraffic > 0 && viewsCount !== undefined;

                  return (
                    <div key={idx} className="flex flex-col space-y-1.5 bg-[#0e0e18] border border-slate-955 p-2 rounded-lg text-[9px] shadow-inner">
                      <div className="flex items-center space-x-1.5">
                        <span 
                          className="w-1.5 h-1.5 rounded flex-shrink-0" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-slate-250 font-bold truncate">{z.name}</span>
                      </div>
                      <div className="text-slate-500 font-mono text-[7px] leading-normal">
                        <div>Camera: {camName}</div>
                        <div className={hasViews ? 'text-cyan-500 font-semibold' : 'text-slate-600'}>
                          Activity: {hasViews ? `${viewsCount} Views` : 'No verified telemetry'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-slate-500 italic text-center py-8 col-span-2">No zones mapped for this store.</p>
              )}
            </div>
          </div>

          {/* Kalman Filter Status Card */}
          <div className="bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                <TrendingUp className="w-4 h-4 mr-1.5 text-cyan-400" /> KALMAN SMOOTHING STATUS
              </span>
              <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE IN PIPELINE
              </span>
            </div>
            <div className="bg-[#0e0e18] border border-slate-955 p-3 rounded-lg text-[9px] text-slate-400 leading-relaxed font-mono space-y-1.5">
              <div><strong className="text-slate-350">Input:</strong> Raw Yolo/ByteTrack (x,y) coordinates</div>
              <div><strong className="text-slate-350">Processing:</strong> Continuous state vector updates</div>
              <div><strong className="text-slate-350">Output:</strong> Jitter-smoothed trajectory mapping logs</div>
              <div className="text-[7px] text-slate-600 border-t border-slate-900/60 pt-1.5 mt-1.5 leading-normal">
                Coordinate smoothing runs in the live ingestion worker. Direct raw-vs-smoothed trajectory visualization is not exposed to the dashboard.
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Area - Detailed Tables */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Table 1: Transitions Log (col-span-6) */}
        <div className="md:col-span-6 bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">Transitions Log</span>
            <div className="max-h-[260px] overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 w-[55%]">Route</th>
                    <th className="py-2.5 text-center">Transitions</th>
                    <th className="py-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {sankeyData && sankeyData.links && sankeyData.links.length > 0 ? (
                    (() => {
                      const totalTransitions = sankeyData.links.reduce((sum, link) => sum + link.value, 0) || 1;
                      return sankeyData.links.map((p, idx) => {
                        const fromName = sankeyData.nodes[p.source]?.name || 'Unknown';
                        const toName = sankeyData.nodes[p.target]?.name || 'Unknown';
                        const shareVal = ((p.value / totalTransitions) * 100).toFixed(1) + '%';
                        return (
                          <tr key={idx} className="border-b border-slate-955/40 hover:bg-[#12121e]/50 transition-colors">
                            <td className="py-2.5 pr-2">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span 
                                  className="px-1.5 py-0.5 rounded text-[8px] font-extrabold border"
                                  style={{ 
                                    backgroundColor: `${zoneColorMap[fromName] || '#475569'}15`, 
                                    borderColor: `${zoneColorMap[fromName] || '#475569'}35`, 
                                    color: zoneColorMap[fromName] || '#94a3b8' 
                                  }}
                                >
                                  {fromName}
                                </span>
                                <span className="text-slate-650 font-bold text-[9px]">➔</span>
                                <span 
                                  className="px-1.5 py-0.5 rounded text-[8px] font-extrabold border"
                                  style={{ 
                                    backgroundColor: `${zoneColorMap[toName] || '#475569'}15`, 
                                    borderColor: `${zoneColorMap[toName] || '#475569'}35`, 
                                    color: zoneColorMap[toName] || '#94a3b8' 
                                  }}
                                >
                                  {toName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-cyan-400">
                              {p.value}
                            </td>
                            <td className="py-2.5 text-right font-mono">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="text-slate-400">{shareVal}</span>
                                <div className="w-12 h-1 bg-slate-955/65 rounded-full overflow-hidden flex-shrink-0">
                                  <div className="h-full bg-cyan-500" style={{ width: shareVal }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-550 font-medium">
                        <div className="flex flex-col items-center justify-center space-y-1.5 py-6">
                          <span className="text-[10px] font-bold text-slate-400">No verified transition events recorded for the selected period.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-bold hover:text-cyan-400 cursor-pointer pt-3 flex items-center">
            <span>View all transitions</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>

        {/* Table 2: Journey Path Analytics (col-span-6) */}
        <div className="md:col-span-6 bg-[#0b0b14] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Journey Path Analytics</span>
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-900">
              MILESTONE 3 CONSTRAINT
            </span>
          </div>
          <div className="flex flex-col space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {data.journey_paths && data.journey_paths.length > 0 ? (
              data.journey_paths.map((jp, idx) => {
                const pathSteps = jp.path.split(' ➔ ');
                return (
                  <div key={idx} className="bg-[#0e0e18] border border-slate-950 p-3 rounded-lg flex flex-col space-y-2 text-[10px] shadow-sm">
                    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                      <span className="text-[8px] font-mono font-bold text-slate-600 mr-1">{String(idx + 1).padStart(2, '0')}</span>
                      {pathSteps.map((step, sIdx) => {
                        const badgeColor = zoneColorMap[step] || '#64748b';
                        return (
                          <React.Fragment key={sIdx}>
                            {sIdx > 0 && <span className="text-slate-650 font-bold text-[10px]">➔</span>}
                            <span 
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm border"
                              style={{ 
                                backgroundColor: `${badgeColor}15`, 
                                borderColor: `${badgeColor}35`, 
                                color: badgeColor 
                              }}
                            >
                              {step}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold tracking-wider pt-1 border-t border-slate-900/30">
                      <span>Length: {pathSteps.length} | {jp.shoppers.toLocaleString()} Shoppers</span>
                      <span className="text-cyan-400">{jp.percentage}% of paths</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-[200px] text-slate-500 bg-[#07070f] rounded-lg p-5 text-center border border-slate-950/60">
                <AlertTriangle className="w-8 h-8 text-slate-700 mb-2" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NO VERIFIED JOURNEY PATHS</span>
                <span className="text-[8px] text-slate-655 mt-1 max-w-[85%] mx-auto leading-normal">
                  Cross-camera shopper identity association is not available under the current Milestone 3 constraints.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
