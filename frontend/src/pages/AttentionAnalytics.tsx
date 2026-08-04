import React from 'react';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

interface PageProps {
  storeId: string;
  token: string | null;
}

const mockHourlyTrend = [
  { hour: '09:00', duration: 4.8, count: 22, dwell: 18 },
  { hour: '11:00', duration: 7.2, count: 58, dwell: 28 },
  { hour: '13:00', duration: 5.6, count: 48, dwell: 22 },
  { hour: '15:00', duration: 7.8, count: 72, dwell: 32 },
  { hour: '17:00', duration: 8.5, count: 88, dwell: 36 },
  { hour: '19:00', duration: 6.7, count: 64, dwell: 26 }
];

export default function AttentionAnalytics({ storeId, token }: PageProps) {
  return (
    <div className="space-y-6 text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attention Analytics Over Time */}
        <div className="lg:col-span-8 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-200">Attention Analytics Over Time</span>
            <span className="text-slate-500 font-semibold">Last 7 Days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} label={{ value: 'Attention Time (s)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip />
                <Area type="monotone" dataKey="duration" stroke="#818cf8" fill="rgba(129, 140, 248, 0.15)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box Plot Distribution */}
        <div className="lg:col-span-4 bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Attention Distribution (Box Plot)</span>
          <div className="h-56 flex justify-center items-center">
            <svg className="w-48 h-40" viewBox="0 0 100 100">
              <line x1="50" y1="10" x2="50" y2="90" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
              <rect x="30" y="30" width="40" height="40" fill="#6366f1" fillOpacity="0.25" stroke="#6366f1" strokeWidth="1.5" />
              <line x1="30" y1="50" x2="70" y2="50" stroke="#10b981" strokeWidth="2.5" />
              <text x="50" y="25" textAnchor="middle" fill="#94a3b8" fontSize={8}>Q3: 7.2s</text>
              <text x="50" y="55" textAnchor="middle" fill="#10b981" fontSize={8} fontWeight="bold">Median: 6.42s</text>
              <text x="50" y="80" textAnchor="middle" fill="#94a3b8" fontSize={8}>Q1: 4.2s</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
