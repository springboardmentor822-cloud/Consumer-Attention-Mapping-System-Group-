import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, RefreshCw, AlertCircle } from 'lucide-react';

interface ChartPoint {
  hour: string;
  visitors: number;
}

interface ZoneOccupancyPoint {
  zone: string;
  occupancy: number;
}

interface StoreManagerData {
  traffic_chart: ChartPoint[];
  zone_occupancy: ZoneOccupancyPoint[];
  kpis: {
    today_visitors: number;
    current_occupancy: number;
    avg_dwell_time_seconds: number;
  };
}

interface VisitorsPageProps {
  storeId: string;
  token: string | null;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function VisitorsPage({ storeId, token }: VisitorsPageProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchVisitors = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/dashboards/manager/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  // Compute dynamic domains & summary stats
  const trafficStats = useMemo(() => {
    if (!data?.traffic_chart || data.traffic_chart.length === 0) {
      return { max: 5, hasData: false };
    }
    const maxVal = Math.max(...data.traffic_chart.map(d => d.visitors));
    return {
      max: maxVal === 0 ? 5 : Math.ceil(maxVal * 1.15),
      hasData: maxVal > 0
    };
  }, [data?.traffic_chart]);

  const zoneStats = useMemo(() => {
    if (!data?.zone_occupancy || data.zone_occupancy.length === 0) {
      return { max: 5, hasData: false };
    }
    const maxVal = Math.max(...data.zone_occupancy.map(d => d.occupancy));
    return {
      max: maxVal === 0 ? 5 : Math.ceil(maxVal * 1.15),
      hasData: maxVal > 0
    };
  }, [data?.zone_occupancy]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-indigo-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Synchronizing visitor logs...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-400" /> Visitor Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live customer timeline, conversion rates, and demographic distributions</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Today's Visitors", val: data?.kpis?.today_visitors ?? 0, icon: Users, color: "text-blue-400" },
          { label: "Current Occupancy", val: data?.kpis?.current_occupancy ?? 0, icon: Users, color: "text-emerald-400" },
          { label: "Avg Visit Duration", val: data?.kpis?.avg_dwell_time_seconds ? `${Math.floor(data.kpis.avg_dwell_time_seconds / 60)}m ${Math.round(data.kpis.avg_dwell_time_seconds % 60)}s` : "0m", icon: Clock, color: "text-amber-400" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#121218] border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">{kpi.label}</span>
              <p className="text-xl font-black text-slate-200 mt-1">{kpi.val}</p>
            </div>
            <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-80`} />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visitors Over Time */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Visitors Over Time</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Live shopper presence timeline scoped by hour</p>
          </div>

          <div className="h-60 mt-4 relative flex items-center justify-center">
            {!trafficStats.hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No active traffic recorded</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.traffic_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisPage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#131322" />
                <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, trafficStats.max]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '9px' }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisPage)" strokeWidth={2.0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visitors by Zone */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Visitors by Zone</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparative shopper occupancy totals scoped by region</p>
          </div>

          <div className="h-60 mt-4 relative flex items-center justify-center">
            {!zoneStats.hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No active zone records</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.zone_occupancy} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131322" />
                <XAxis dataKey="zone" stroke="#475569" fontSize={8.5} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, zoneStats.max]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#10b981', fontSize: '9px' }}
                />
                <Bar dataKey="occupancy" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {data?.zone_occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
