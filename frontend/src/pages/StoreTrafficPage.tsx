import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';

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

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2" /> Loading Traffic Analysis...
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" /> Store Traffic & Zone Occupancy
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live customer traffic timeline trends and zone occupancy distributions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1 - Store Traffic */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Line Chart (Hourly Visitor Trend)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.traffic_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Area Chart (Daily Store Footfall Trend)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.traffic_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="#ec4899" fill="rgba(236, 72, 153, 0.1)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 2 - Zone Occupancy */}
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Vertical Bar Chart (Visitors per Zone)</span>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.zone_occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
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

        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Donut Chart (Zone Occupancy Distribution)</span>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.zone_occupancy} dataKey="occupancy" nameKey="zone" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} label>
                  {data?.zone_occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
