import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, RefreshCw } from 'lucide-react';

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Loading Visitor Analytics...
    </div>
  );

  const mockNewVsReturning = [
    { name: 'New Visitors', value: 72, color: '#3b82f6' },
    { name: 'Returning Visitors', value: 28, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-400" /> Visitor Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live customer timeline, conversion rates, and demographic distributions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Today's Visitors", val: data?.kpis?.today_visitors || 1248, icon: Users, color: "text-blue-400" },
          { label: "Current Occupancy", val: data?.kpis?.current_occupancy || 78, icon: Users, color: "text-emerald-455" },
          { label: "Avg Visit Duration", val: data?.kpis?.avg_dwell_time_seconds ? `${Math.floor(data.kpis.avg_dwell_time_seconds / 60)}m ${Math.round(data.kpis.avg_dwell_time_seconds % 60)}s` : "3m 42s", icon: Clock, color: "text-amber-450" }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Visitors Over Time</span>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.traffic_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d28" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Visitors by Zone</span>
          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.zone_occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d1d28" />
                <XAxis dataKey="zone" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {data?.zone_occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'} />
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
