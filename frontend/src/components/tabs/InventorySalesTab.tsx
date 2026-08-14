"use client";
import React, { useState } from 'react';
import CategoryTab from './CategoryTab';
import ProductsTab from './ProductsTab';

export default function InventorySalesTab({ timeFilter }: { timeFilter: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'products'>('categories');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'categories' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          High-Level Categories
        </button>
        <button 
          onClick={() => setActiveSubTab('products')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeSubTab === 'products' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
        >
          SKU Inventory
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeSubTab === 'categories' && <CategoryTab timeFilter={timeFilter} />}
        {activeSubTab === 'products' && <ProductsTab timeFilter={timeFilter} />}
      </div>
    </div>
  );
}