import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StoreFloorMapHeatmap } from '../heatmaps/StoreFloorMapHeatmap';
import { Navigation, Clock, Activity, ArrowRight } from 'lucide-react';

export const JourneyView: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.getSessions('STORE-812').then((res) => setSessions(res));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Customer Journey & Trajectory Analysis</h2>
          <p className="text-xs text-slate-400">Kalman-smoothed 2D kinematic trajectories, velocity tracking, and zone movement flow</p>
        </div>
      </div>

      <StoreFloorMapHeatmap storeId="STORE-812" />

      {/* Trajectory Sessions Log */}
      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">Ingested Shopper Sessions & Kinematics</h3>
          <span className="text-xs text-indigo-400 font-semibold">{sessions.length} Active Sessions Recorded</span>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Session ID</th>
                <th className="px-4 py-3">Shopper ID</th>
                <th className="px-4 py-3">Assigned Segment</th>
                <th className="px-4 py-3">Path Distance</th>
                <th className="px-4 py-3">Total Dwell</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{s.id}</td>
                  <td className="px-4 py-3 text-white font-mono">{s.shopper_id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500">
                      {s.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.path_distance} meters</td>
                  <td className="px-4 py-3 text-slate-300">{s.total_dwell} seconds</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
