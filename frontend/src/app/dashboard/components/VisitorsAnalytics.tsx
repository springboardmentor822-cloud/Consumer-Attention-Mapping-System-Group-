'use client';

import React, { useState } from 'react';
import { 
  Users, Clock, TrendingUp, ArrowUpRight, Flame, MapPin, 
  Calendar, Filter, BarChart3, PieChart as PieIcon, ArrowDown
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function VisitorsAnalytics() {
  const [selectedRange, setSelectedRange] = useState('Today');

  const hourlyFootfall = [
    { hour: '08:00 AM', visitors: 45, newVisitors: 30, returning: 15 },
    { hour: '10:00 AM', visitors: 120, newVisitors: 85, returning: 35 },
    { hour: '12:00 PM', visitors: 280, newVisitors: 190, returning: 90 },
    { hour: '02:00 PM', visitors: 190, newVisitors: 130, returning: 60 },
    { hour: '04:00 PM', visitors: 340, newVisitors: 240, returning: 100 },
    { hour: '06:00 PM', visitors: 420, newVisitors: 290, returning: 130 },
    { hour: '08:00 PM', visitors: 210, newVisitors: 140, returning: 70 },
  ];

  const dwellTimeDistribution = [
    { range: '< 2 mins', count: 180, percentage: '14%', fill: '#38bdf8' },
    { range: '2 - 5 mins', count: 420, percentage: '34%', fill: '#6366f1' },
    { range: '5 - 10 mins', count: 390, percentage: '31%', fill: '#a855f7' },
    { range: '10+ mins', count: 258, percentage: '21%', fill: '#10b981' },
  ];

  const zoneFootfall = [
    { zone: 'Main Entrance Foyer', footfall: 1248, avgDwell: '45s', peakTime: '06:00 PM' },
    { zone: 'Aisle A (Beverages)', footfall: 860, avgDwell: '3m 10s', peakTime: '06:00 PM' },
    { zone: 'Aisle B (Snacks)', footfall: 940, avgDwell: '4m 25s', peakTime: '04:00 PM' },
    { zone: 'Aisle C (Confectionery)', footfall: 420, avgDwell: '2m 15s', peakTime: '01:00 PM' },
    { zone: 'Aisle D (Dairy)', footfall: 680, avgDwell: '3m 45s', peakTime: '05:00 PM' },
    { zone: 'Checkout Lanes', footfall: 510, avgDwell: '5m 12s', peakTime: '06:30 PM' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-blue-500/20 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Visitor Traffic & Footfall Intelligence
          </div>
          <h2 className="text-2xl font-black text-white">Visitor Analytics & Customer Flow</h2>
          <p className="text-xs text-slate-300 mt-1">
            Detailed footfall breakdowns, hourly traffic peaks, dwell time distributions, and zone navigation patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedRange} 
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-slate-900 text-xs font-bold text-white border border-slate-700 px-4 py-2 rounded-xl outline-none cursor-pointer"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Store Visitors</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">1,248</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +12.5% vs yesterday
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peak Hour Traffic</span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">420 / hr</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">Peak occurred at 06:00 PM</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Dwell Time</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">3m 42s</div>
          <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +22s increase in Aisle B
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">New vs Returning</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">72% / 28%</div>
          <div className="text-xs text-slate-400 font-semibold mt-1">High new shopper attraction</div>
        </div>

      </div>

      {/* Hourly Visitor Footfall Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Hourly Footfall Breakdown (New vs Returning Visitors)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Monitors visitor flow pattern throughout store operational hours.</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyFootfall}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="newVisitors" fill="#3b82f6" name="New Visitors" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returning" fill="#8b5cf6" name="Returning Visitors" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dwell Time & Zone Footfall Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dwell Time Distribution Donut */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Dwell Time Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Percentage of visitors grouped by time spent inside the store.</p>
          </div>

          <div className="flex items-center gap-4 my-auto">
            <div className="w-36 h-36 relative flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dwellTimeDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="count">
                    {dwellTimeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">1,248</span>
              </div>
            </div>

            <div className="space-y-2.5 flex-1">
              {dwellTimeDistribution.map((item) => (
                <div key={item.range} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-slate-300 font-medium">{item.range}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{item.count} ({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Footfall Table */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Zone-Wise Footfall & Dwell Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">Footfall density and dwell metrics per store zone.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-2">Zone Name</th>
                  <th className="py-2.5 px-2 text-center">Visitors</th>
                  <th className="py-2.5 px-2 text-center">Avg Dwell</th>
                  <th className="py-2.5 px-2 text-right">Peak Hour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {zoneFootfall.map((z, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-2 text-slate-200 font-bold">{z.zone}</td>
                    <td className="py-3 px-2 text-center text-blue-400 font-bold">{z.footfall}</td>
                    <td className="py-3 px-2 text-center text-purple-400 font-bold">{z.avgDwell}</td>
                    <td className="py-3 px-2 text-right text-slate-400">{z.peakTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
