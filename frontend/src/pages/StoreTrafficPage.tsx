import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

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
}

interface StoreTrafficPageProps {
  storeId: string;
  token: string | null;
}

// Design colors matching CAMS portal
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export default function StoreTrafficPage({ storeId, token }: StoreTrafficPageProps) {
  const [data, setData] = useState<StoreManagerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTraffic = async () => {
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
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 8000);
    return () => clearInterval(interval);
  }, [storeId]);

  // Compute dynamic domains & summary stats
  const trafficStats = useMemo(() => {
    if (!data?.traffic_chart || data.traffic_chart.length === 0) {
      return { max: 5, hasData: false, total: 0 };
    }
    const maxVal = Math.max(...data.traffic_chart.map(d => d.visitors));
    const totalVal = data.traffic_chart.reduce((acc, curr) => acc + curr.visitors, 0);
    return {
      max: maxVal === 0 ? 5 : Math.ceil(maxVal * 1.15),
      hasData: maxVal > 0,
      total: totalVal
    };
  }, [data?.traffic_chart]);

  const zoneStats = useMemo(() => {
    if (!data?.zone_occupancy || data.zone_occupancy.length === 0) {
      return { max: 5, hasData: false, total: 0 };
    }
    const maxVal = Math.max(...data.zone_occupancy.map(d => d.occupancy));
    const totalVal = data.zone_occupancy.reduce((acc, curr) => acc + curr.occupancy, 0);
    return {
      max: maxVal === 0 ? 5 : Math.ceil(maxVal * 1.15),
      hasData: maxVal > 0,
      total: totalVal
    };
  }, [data?.zone_occupancy]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-indigo-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Synchronizing traffic logs...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-850">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" /> Traffic Flow Trends
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live customer timeline trends and zone occupancy distributions</p>
        </div>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Line Chart: Hourly visitor traffic */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Hourly Visitor Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Live shopper presence timeline scoped by hour</p>
          </div>
          
          <div className="h-56 relative flex items-center justify-center">
            {!trafficStats.hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No active traffic recorded</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.traffic_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131322" />
                <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, trafficStats.max]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '9px' }}
                />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 1 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Area Chart: Daily cumulative footfall */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Store Footfall Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Cumulative visitor count pattern projection</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {!trafficStats.hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No footfall data registered</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.traffic_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#131322" />
                <XAxis dataKey="hour" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, trafficStats.max]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ec4899', fontSize: '9px' }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#ec4899" fillOpacity={1} fill="url(#colorVis)" strokeWidth={2.0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Bar Chart: Zone visitors counts */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Visitors per Zone</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparative shopper occupancy totals scoped by region</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
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

        {/* 4. Donut Chart: Zone occupancy distribution */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Zone Occupancy Distribution</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Regional layout distribution percentages</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {!zoneStats.hasData && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No distribution data</span>
              </div>
            )}
            
            {/* Center Total Count Overlay */}
            {zoneStats.hasData && (
              <div className="absolute flex flex-col items-center justify-center z-0 pointer-events-none">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total</span>
                <span className="text-lg font-black text-slate-200">{zoneStats.total}</span>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data?.zone_occupancy} 
                  dataKey="occupancy" 
                  nameKey="zone" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={70} 
                  paddingAngle={4}
                  stroke="none"
                >
                  {data?.zone_occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '9px' }}
                />
                <Legend 
                  iconSize={6}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', color: '#94a3b8' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
