"use client";
import React, { useState } from 'react';
import ProductsTab from './ProductsTab';
import ProductAnalyticsTab from './ProductAnalyticsTab';
import ZoneTab from './ZoneTab';

export default function MerchandisingAnalyticsTab({ timeFilter }: { timeFilter: string }) {
  const [subTab, setSubTab] = useState<'products' | 'analytics' | 'zones'>('products');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('products')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'products' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Products</button>
        <button onClick={() => setSubTab('analytics')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'analytics' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:bg-slate-900'}`}>Product Analytics</button>
        <button onClick={() => setSubTab('zones')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${subTab === 'zones' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:bg-slate-900'}`}>Zone Performance</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'products' && <ProductsTab timeFilter={timeFilter} />}
        
        {/* Updated: Now passing timeFilter into ProductAnalyticsTab */}
        {subTab === 'analytics' && <ProductAnalyticsTab timeFilter={timeFilter} />}
        
        {subTab === 'zones' && <ZoneTab timeFilter={timeFilter} />}
      </div>
    </div>
  );
}