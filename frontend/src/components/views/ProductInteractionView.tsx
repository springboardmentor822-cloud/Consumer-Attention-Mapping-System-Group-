import React from 'react';
import { Package } from 'lucide-react';

export const ProductInteractionView: React.FC = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Product Interaction Breakdown</h2>
          <p className="text-xs text-slate-400">Track product views, picks, returns, and comparisons</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-bold">
        <div className="bi-card p-5 space-y-3">
          <div className="text-indigo-400 uppercase text-[11px] font-extrabold">Most Picked Products</div>
          <div className="space-y-2 text-slate-200">
            <div className="flex justify-between"><span>1. Coca Cola 500ml</span><span className="text-white font-extrabold">48</span></div>
            <div className="flex justify-between"><span>2. Lays Classic 52g</span><span className="text-white font-extrabold">43</span></div>
            <div className="flex justify-between"><span>3. Parle-G 120g</span><span className="text-white font-extrabold">37</span></div>
          </div>
        </div>

        <div className="bi-card p-5 space-y-3">
          <div className="text-amber-400 uppercase text-[11px] font-extrabold">Most Returned Products</div>
          <div className="space-y-2 text-slate-200">
            <div className="flex justify-between"><span>1. Lays Classic 52g</span><span className="text-white font-extrabold">12</span></div>
            <div className="flex justify-between"><span>2. Pepsi 500ml</span><span className="text-white font-extrabold">9</span></div>
            <div className="flex justify-between"><span>3. Maggi 2-Minute</span><span className="text-white font-extrabold">8</span></div>
          </div>
        </div>

        <div className="bi-card p-5 space-y-3">
          <div className="text-emerald-400 uppercase text-[11px] font-extrabold">Most Compared Products</div>
          <div className="space-y-2 text-slate-200">
            <div className="flex justify-between"><span>1. iPhone 14</span><span className="text-white font-extrabold">25</span></div>
            <div className="flex justify-between"><span>2. Samsung S23</span><span className="text-white font-extrabold">18</span></div>
            <div className="flex justify-between"><span>3. OnePlus 11</span><span className="text-white font-extrabold">15</span></div>
          </div>
        </div>

        <div className="bi-card p-5 space-y-3">
          <div className="text-rose-400 uppercase text-[11px] font-extrabold">Least Viewed Products</div>
          <div className="space-y-2 text-slate-200">
            <div className="flex justify-between"><span>1. Product A</span><span className="text-white font-extrabold">8</span></div>
            <div className="flex justify-between"><span>2. Product B</span><span className="text-white font-extrabold">5</span></div>
            <div className="flex justify-between"><span>3. Product C</span><span className="text-white font-extrabold">4</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
