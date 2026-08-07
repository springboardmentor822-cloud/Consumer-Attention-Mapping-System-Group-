import React from 'react';
import { GitCommit, ArrowRight } from 'lucide-react';

export default function SankeyDiagram({ data }) {
  // Nodes and links fallback if empty
  const nodes = data?.nodes || [
    { id: 0, name: 'Entrance (10,000)' },
    { id: 1, name: 'Grocery (4,500)' },
    { id: 2, name: 'Electronics (3,000)' },
    { id: 3, name: 'Apparel (2,500)' },
    { id: 4, name: 'Checkout A' },
    { id: 5, name: 'Checkout B' },
    { id: 6, name: 'Exit' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-indigo-400" />
          <h4 className="font-semibold text-white">Consumer Journey Flow (Sankey Flow)</h4>
        </div>
        <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-300 border border-indigo-500/20">
          Last 7 Days
        </span>
      </div>

      <div className="relative overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4">
        <svg viewBox="0 0 700 240" className="w-full h-60 text-slate-300">
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="flowGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Flow Paths */}
          {/* Entrance -> Aisle 1 */}
          <path d="M 120 120 C 200 120, 200 50, 280 50" fill="none" stroke="url(#flowGrad1)" strokeWidth="32" />
          {/* Entrance -> Aisle 2 */}
          <path d="M 120 120 C 200 120, 200 120, 280 120" fill="none" stroke="url(#flowGrad2)" strokeWidth="22" />
          {/* Entrance -> Aisle 3 */}
          <path d="M 120 120 C 200 120, 200 190, 280 190" fill="none" stroke="url(#flowGrad3)" strokeWidth="18" />

          {/* Aisles -> Checkout / Exit */}
          <path d="M 420 50 C 500 50, 500 80, 580 80" fill="none" stroke="#10b981" strokeWidth="22" strokeOpacity="0.6" />
          <path d="M 420 50 C 500 50, 500 190, 580 190" fill="none" stroke="#ef4444" strokeWidth="10" strokeOpacity="0.5" />
          <path d="M 420 120 C 500 120, 500 80, 580 80" fill="none" stroke="#3b82f6" strokeWidth="16" strokeOpacity="0.6" />
          <path d="M 420 190 C 500 190, 500 140, 580 140" fill="none" stroke="#f59e0b" strokeWidth="14" strokeOpacity="0.6" />

          {/* Nodes Blocks */}
          {/* Stage 1: Entrance */}
          <rect x="20" y="70" width="100" height="100" rx="6" fill="#4f46e5" />
          <text x="70" y="115" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">ENTRANCE</text>
          <text x="70" y="132" textAnchor="middle" fill="#c7d2fe" fontSize="10">10,000 (100%)</text>

          {/* Stage 2: Aisles */}
          <rect x="280" y="25" width="140" height="50" rx="6" fill="#059669" />
          <text x="350" y="48" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">GROCERY</text>
          <text x="350" y="62" textAnchor="middle" fill="#a7f3d0" fontSize="10">4,500 (45%)</text>

          <rect x="280" y="95" width="140" height="50" rx="6" fill="#2563eb" />
          <text x="350" y="118" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">ELECTRONICS</text>
          <text x="350" y="132" textAnchor="middle" fill="#bfdbfe" fontSize="10">3,000 (30%)</text>

          <rect x="280" y="165" width="140" height="50" rx="6" fill="#d97706" />
          <text x="350" y="188" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">APPAREL</text>
          <text x="350" y="202" textAnchor="middle" fill="#fde68a" fontSize="10">2,500 (25%)</text>

          {/* Stage 3: Checkout & Exits */}
          <rect x="580" y="55" width="100" height="50" rx="6" fill="#10b981" />
          <text x="630" y="78" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">CHECKOUT 1</text>
          <text x="630" y="92" textAnchor="middle" fill="#d1fae5" fontSize="10">5,300 (53%)</text>

          <rect x="580" y="115" width="100" height="50" rx="6" fill="#8b5cf6" />
          <text x="630" y="138" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">CHECKOUT 2</text>
          <text x="630" y="152" textAnchor="middle" fill="#ddd6fe" fontSize="10">2,900 (29%)</text>

          <rect x="580" y="175" width="100" height="35" rx="6" fill="#ef4444" />
          <text x="630" y="196" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">EXIT (18%)</text>
        </svg>
      </div>
    </div>
  );
}
