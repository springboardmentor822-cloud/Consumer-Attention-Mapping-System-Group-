import React from 'react';
import { BarChart2 } from 'lucide-react';

export const ShelfPerformanceView: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Shelf Performance & Attention Scores</h2>
          <p className="text-xs text-slate-400">Analyze shelf engagement and attention scores across store sections</p>
        </div>
      </div>

      <div className="bi-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="text-xs font-extrabold text-white">Top Shelf by Engagement</div>
          <div className="space-y-3 text-xs font-bold">
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf A</span>
                <span className="text-emerald-400">92%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf B</span>
                <span className="text-indigo-400">74%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-[74%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf C</span>
                <span className="text-amber-400">38%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[38%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-extrabold text-white">Shelf Engagement Heat (4x4 Grid)</div>
          <div className="grid grid-cols-4 gap-2 h-44">
            <div className="bg-blue-900/60 rounded border border-blue-700"></div>
            <div className="bg-blue-700/60 rounded border border-blue-500"></div>
            <div className="bg-amber-600/80 rounded border border-amber-500"></div>
            <div className="bg-rose-600/90 rounded border border-rose-500"></div>
            <div className="bg-indigo-800/60 rounded border border-indigo-600"></div>
            <div className="bg-emerald-600/80 rounded border border-emerald-500"></div>
            <div className="bg-[#ff4500]/90 rounded border border-orange-500"></div>
            <div className="bg-rose-700/90 rounded border border-rose-600"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-extrabold text-white">Least Engaged Shelves</div>
          <div className="space-y-3 text-xs font-bold">
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf C</span>
                <span className="text-rose-400">38%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[38%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf D</span>
                <span className="text-rose-400">26%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[26%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-200 mb-1">
                <span>Shelf E</span>
                <span className="text-rose-400">22%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[22%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
