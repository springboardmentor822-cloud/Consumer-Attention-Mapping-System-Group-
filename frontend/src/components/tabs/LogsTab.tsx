import React from 'react';

export default function LogsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">System Activity Logs</h3>
            <p className="text-slate-400 text-sm mt-1">Audit trail for user actions, authentication events, and system changes.</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">🔍</span>
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 w-full md:w-64"
              />
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition">
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-4">
          <button className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs font-semibold hover:bg-slate-700 transition">All Events</button>
          <button className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-xs font-semibold hover:bg-rose-500/20 transition">Errors Only</button>
          <button className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md text-xs font-semibold hover:bg-cyan-500/20 transition">Auth Events</button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300 font-mono">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Level</th>
                <th className="p-4 font-semibold">Source / User</th>
                <th className="p-4 font-semibold">Event Description</th>
                <th className="p-4 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/50 text-xs">
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-4 text-slate-400">2026-08-04 11:32:45</td>
                <td className="p-4"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">INFO</span></td>
                <td className="p-4 text-cyan-400">admin@visionretail.ai</td>
                <td className="p-4 text-slate-300">Successfully logged into Administrator workspace.</td>
                <td className="p-4 text-slate-500 text-right">192.168.1.104</td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-4 text-slate-400">2026-08-04 11:15:22</td>
                <td className="p-4"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">INFO</span></td>
                <td className="p-4 text-purple-400">System Scheduler</td>
                <td className="p-4 text-slate-300">Executed hourly K-Means clustering update (Processed 4,200 trajectories).</td>
                <td className="p-4 text-slate-500 text-right">localhost</td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-4 text-slate-400">2026-08-04 10:42:11</td>
                <td className="p-4"><span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">WARN</span></td>
                <td className="p-4 text-cyan-400">manager@visionretail.ai</td>
                <td className="p-4 text-slate-300">Failed login attempt (Invalid Password).</td>
                <td className="p-4 text-slate-500 text-right">192.168.1.142</td>
              </tr>
              <tr className="hover:bg-slate-800/40 transition">
                <td className="p-4 text-slate-400">2026-08-04 09:05:03</td>
                <td className="p-4"><span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">ERROR</span></td>
                <td className="p-4 text-rose-400">API Gateway</td>
                <td className="p-4 text-slate-300">Connection timeout to Camera Node 03. Attempting reconnection...</td>
                <td className="p-4 text-slate-500 text-right">10.0.0.5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}