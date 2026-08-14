import React from 'react';

export default function PermissionMgmtTab() {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Permission Matrix</h3>
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-center text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs">
            <tr><th className="p-4 text-left">Module</th><th className="p-4">Store Mgr</th><th className="p-4">Analyst</th><th className="p-4">Admin</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr><td className="p-4 text-left font-bold">Store Heatmap</td><td className="p-4 text-emerald-400">✔</td><td className="p-4 text-emerald-400">✔</td><td className="p-4 text-slate-600">✖</td></tr>
            <tr><td className="p-4 text-left font-bold">Camera Config</td><td className="p-4 text-emerald-400">✔</td><td className="p-4 text-slate-600">✖</td><td className="p-4 text-emerald-400">✔</td></tr>
            <tr><td className="p-4 text-left font-bold">System Settings</td><td className="p-4 text-slate-600">✖</td><td className="p-4 text-slate-600">✖</td><td className="p-4 text-emerald-400">✔</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}