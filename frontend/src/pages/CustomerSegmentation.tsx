import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

interface PageProps {
  storeId: string;
  token: string | null;
}

const segmentationData = [
  { name: 'High Value', value: 3728, percentage: 20, color: '#6366f1' },
  { name: 'Frequent Shoppers', value: 5643, percentage: 33, color: '#3b82f6' },
  { name: 'Occasional Shoppers', value: 6187, percentage: 30, color: '#10b981' },
  { name: 'New Visitors', value: 3084, percentage: 17, color: '#f59e0b' }
];

export default function CustomerSegmentation({ storeId, token }: PageProps) {
  return (
    <div className="space-y-6 text-slate-100 max-w-4xl mx-auto">
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-6 shadow-lg flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Customer Segmentation</span>
          <span className="text-slate-500 font-semibold text-xs">Last 7 Days</span>
        </div>

        <div className="relative w-full max-w-[280px] aspect-square flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={segmentationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100}>
                {segmentationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center">
            <p className="text-xs text-slate-500 font-bold uppercase leading-none">Total</p>
            <p className="text-2xl font-black text-slate-105 leading-tight">18,642</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full mt-8 text-xs">
          {segmentationData.map((seg, idx) => (
            <div key={idx} className="bg-[#11111b] border border-slate-850 p-4 rounded-lg flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: seg.color }}></span>
                <span className="font-semibold text-slate-200">{seg.name}</span>
              </span>
              <span className="font-black text-slate-100">{seg.value.toLocaleString()} ({seg.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
