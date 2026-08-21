import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Clock, ArrowUpRight } from 'lucide-react';

export const TrafficView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.getStoreManagerDashboard('STORE-812')
      .then((res) => { if (mounted) setData(res); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Loading Store Traffic Telemetry...</div>;
  }

  const { hourly_traffic, zone_occupancy } = data;

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Store Traffic & Hourly Footfall Analytics</h2>
          <p className="text-xs text-slate-400">Peak hour analysis, hourly visitor counts, and zone footfall distribution</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500 px-3 py-1.5 rounded-xl">
          <ArrowUpRight className="w-4 h-4" />
          <span>+14.2% Growth vs Yesterday</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Hourly Footfall & Visitor Trend</h3>
            <span className="text-xs text-indigo-400 font-semibold">Peak: 18:00 (295 visitors)</span>
          </div>
          <div className="bi-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly_traffic}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="footfall" stroke="#6366f1" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bi-card">
          <div className="bi-card-header">
            <h3 className="font-bold text-sm text-white">Visitors per Store Zone</h3>
            <span className="text-xs text-slate-400">Total 5 Zones</span>
          </div>
          <div className="bi-card-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zone_occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="visitors" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
