import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

export default function DwellTimeAnalysis({ storeId, token }: PageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-100">
      {/* Violin Plot */}
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4 flex flex-col items-center justify-between">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block w-full text-left">Violin Plot - Dwell Time Distribution</span>
        <div className="h-56 flex justify-center items-center w-full">
          <svg className="w-64 h-44" viewBox="0 0 200 100">
            <path
              d="M 100 10 C 130 30, 140 50, 100 90 C 60 50, 70 30, 100 10 Z"
              fill="#6366f1"
              fillOpacity={0.25}
              stroke="#6366f1"
              strokeWidth={2}
            />
            <line x1="100" y1="20" x2="100" y2="80" stroke="#ef4444" strokeWidth={2} />
            <circle cx="100" cy="50" r={4} fill="#10b981" />
            <text x="115" y="54" fill="#94a3b8" fontSize={8} fontWeight="bold">Dwell Median: 28.6s</text>
          </svg>
        </div>
      </div>

      {/* Hourly Line Chart */}
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Line Chart - Average Dwell Time by Hour</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHourlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Line type="monotone" dataKey="dwell" stroke="#ec4899" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
