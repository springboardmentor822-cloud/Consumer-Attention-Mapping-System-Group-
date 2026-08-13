import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface PageProps {
  storeId: string;
  token: string | null;
}

interface SegmentItem {
  segment: string;
  percentage: number;
  description: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  "Explorers": '#6366f1',
  "Quick Buyers": '#3b82f6',
  "Comparison Shoppers": '#10b981',
  "Impulse Buyers": '#f59e0b',
  "Brand Loyal": '#ec4899'
};

const DEFAULT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function CustomerSegmentation({ storeId, token }: PageProps) {
  const [segmentation, setSegmentation] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegmentation = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/dashboards/analyst/${storeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load segmentation analytics");
        const json = await res.json();
        setSegmentation(json.segmentation || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchSegmentation();
  }, [storeId, token]);

  const chartData = useMemo(() => {
    return segmentation.map((item, idx) => ({
      name: item.segment,
      value: item.percentage,
      color: SEGMENT_COLORS[item.segment] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      description: item.description
    }));
  }, [segmentation]);

  const hasData = chartData.some(d => d.value > 0);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[40vh] text-slate-400">
      <RefreshCw className="animate-spin mr-2 w-5 h-5 text-indigo-500" />
      <span className="text-xs font-semibold uppercase tracking-wider">Compiling segmentation telemetry...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400 p-4">
      <AlertCircle className="text-rose-500 w-10 h-10 mb-2" />
      <span className="text-xs font-semibold">{error}</span>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100 max-w-4xl mx-auto">
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-6 shadow-lg flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Customer Segmentation Distribution</span>
          <span className="text-slate-500 font-semibold text-xs">Live Telemetry</span>
        </div>

        <div className="relative w-full max-w-[280px] aspect-square flex justify-center items-center">
          {!hasData && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-slate-650 mb-1" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">No active segmentation data</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={chartData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={70} 
                outerRadius={100}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090f', borderColor: '#1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '9px', color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center pointer-events-none">
            <p className="text-xs text-slate-500 font-bold uppercase leading-none">Shoppers</p>
            <p className="text-2xl font-black text-slate-105 leading-tight">100%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8 text-xs">
          {chartData.map((seg, idx) => (
            <div key={idx} className="bg-[#11111b] border border-slate-850 p-4 rounded-lg flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-2.5" style={{ backgroundColor: seg.color }}></span>
                  <span className="font-bold text-slate-200">{seg.name}</span>
                </span>
                <span className="font-black text-indigo-400">{seg.value}%</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">{seg.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
