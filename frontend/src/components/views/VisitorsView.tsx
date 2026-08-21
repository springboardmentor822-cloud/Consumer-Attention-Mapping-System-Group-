import React from 'react';
import { Users, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const VisitorsView: React.FC = () => {
  const visitorsOverTime = [
    { time: '9 AM', visitors: 85 },
    { time: '12 PM', visitors: 160 },
    { time: '3 PM', visitors: 280 },
    { time: '6 PM', visitors: 210 },
    { time: '9 PM', visitors: 110 }
  ];

  const visitorsByZone = [
    { zone: 'Entrance', count: 120 },
    { zone: 'Aisle A', count: 86 },
    { zone: 'Aisle B', count: 132 },
    { zone: 'Aisle C', count: 94 },
    { zone: 'Checkout', count: 42 }
  ];

  const newVsReturning = [
    { name: 'New Visitors', value: 896, percentage: 72, color: '#6366f1' },
    { name: 'Returning Visitors', value: 352, percentage: 28, color: '#10b981' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Visitors Count & Demographics Analytics</h2>
          <p className="text-xs text-slate-400">See visitor count, trends, and customer behavior</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-500 px-3 py-1.5 rounded-xl">
          <ArrowUpRight className="w-4 h-4" />
          <span>+12.5% Growth vs Yesterday</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bi-card p-4">
          <div className="text-xs font-bold text-slate-300 mb-3">Visitors Over Time</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="text-xs font-bold text-slate-300 mb-3">Visitors by Zone</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bi-card p-4">
          <div className="text-xs font-bold text-slate-300 mb-3">New vs Returning Visitors</div>
          <div className="h-64 flex items-center justify-between">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={newVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                  {newVsReturning.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-45% space-y-3 text-xs font-bold">
              <div className="flex justify-between text-indigo-300">
                <span>New Visitors</span>
                <span>72% (896)</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>Returning</span>
                <span>28% (352)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
