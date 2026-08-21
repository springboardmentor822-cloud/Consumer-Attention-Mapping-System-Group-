import React from 'react';
import { Clock } from 'lucide-react';

export const ActivitiesView: React.FC = () => {
  const activities = [
    { time: '10:24 AM', color: 'bg-rose-500', text: 'High crowd detected in Aisle B (14 shoppers)' },
    { time: '10:18 AM', color: 'bg-amber-500', text: 'Shelf C attention dropped below 35% threshold' },
    { time: '10:15 AM', color: 'bg-blue-500', text: 'Camera 6 (Promotion Area) went offline - signal restored' },
    { time: '10:10 AM', color: 'bg-emerald-500', text: 'Long queue detected at Checkout Lane 2' },
    { time: '10:08 AM', color: 'bg-indigo-500', text: 'Product Rice Bag 5kg restock alert triggered' },
    { time: '09:45 AM', color: 'bg-emerald-500', text: 'Store Manager Lathashree logged in to portal' },
    { time: '09:30 AM', color: 'bg-indigo-500', text: 'Homography Matrix calibration completed for CAM-001' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Store Activities & Event Timeline</h2>
          <p className="text-xs text-slate-400">See recent operational activities and events in the store</p>
        </div>
      </div>

      <div className="bi-card p-6 space-y-4">
        {activities.map((act, idx) => (
          <div key={idx} className="flex items-center space-x-4 p-3 bg-[#090d16] rounded-xl border border-slate-800 text-xs font-bold">
            <span className="font-mono text-slate-400 text-[11px] w-20">{act.time}</span>
            <span className={`w-3 h-3 rounded-full ${act.color} shrink-0`}></span>
            <span className="text-slate-200">{act.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
