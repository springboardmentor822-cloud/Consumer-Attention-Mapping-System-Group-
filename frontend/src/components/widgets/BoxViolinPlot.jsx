import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

export default function BoxViolinPlot({ title = 'Attention Time Distribution (Box & Violin Plot)', data }) {
  const categories = data || [
    { category: 'Electronics', min: 2.1, q1: 4.5, median: 7.2, q3: 11.4, max: 18.5 },
    { category: 'Apparel', min: 1.8, q1: 3.8, median: 6.4, q3: 9.8, max: 15.2 },
    { category: 'Home Living', min: 1.2, q1: 2.9, median: 5.1, q3: 8.2, max: 12.8 },
    { category: 'Personal Care', min: 0.8, q1: 2.1, median: 4.3, q3: 6.5, max: 9.6 },
    { category: 'Groceries', min: 1.5, q1: 3.2, median: 5.8, q3: 8.9, max: 14.1 },
  ];

  const maxVal = 20;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-4">
        <div className="flex h-52 items-center justify-between gap-4">
          {categories.map((item, idx) => {
            const minPos = (item.min / maxVal) * 100;
            const q1Pos = (item.q1 / maxVal) * 100;
            const medianPos = (item.median / maxVal) * 100;
            const q3Pos = (item.q3 / maxVal) * 100;
            const maxPos = (item.max / maxVal) * 100;

            return (
              <div key={idx} className="flex flex-1 flex-col items-center h-full justify-end">
                {/* Violin SVG Shape & Box Plot overlay */}
                <div className="relative w-full h-40 flex items-center justify-center">
                  {/* Whisker Line (Min to Max) */}
                  <div
                    className="absolute w-0.5 bg-slate-600"
                    style={{ bottom: `${minPos}%`, top: `${100 - maxPos}%` }}
                  />

                  {/* Min / Max Whisker Caps */}
                  <div className="absolute w-4 h-0.5 bg-slate-500" style={{ bottom: `${minPos}%` }} />
                  <div className="absolute w-4 h-0.5 bg-slate-500" style={{ bottom: `${maxPos}%` }} />

                  {/* Interquartile Range (Q1 to Q3 Box) */}
                  <div
                    className="absolute w-10 rounded border border-indigo-400 bg-indigo-600/30 backdrop-blur-sm"
                    style={{
                      bottom: `${q1Pos}%`,
                      height: `${q3Pos - q1Pos}%`,
                    }}
                  />

                  {/* Median Marker */}
                  <div
                    className="absolute w-10 h-1 bg-amber-400 rounded-full shadow"
                    style={{ bottom: `${medianPos}%` }}
                  />
                </div>

                <span className="mt-2 text-[10px] text-slate-300 font-semibold text-center truncate">
                  {item.category}
                </span>
                <span className="text-[9px] text-slate-500">Med: {item.median}s</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
