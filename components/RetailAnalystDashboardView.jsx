'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Flame,
  Layers,
  Award,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Clock,
  Navigation,
  Percent,
  Footprints,
  Grid,
  Users
} from 'lucide-react';
import SankeyDiagram from './SankeyDiagram';
import { PRODUCTS_CATALOG, SHOPPER_SEGMENTS, calculateAttractivenessScore, generateRecommendations } from '@/lib/cams-data';

export default function RetailAnalystDashboardView({ activeTab = 'overview' }) {
  const canvasRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState('gaze'); // 'gaze' | 'traffic' | 'shelf'
  const [kdeRadius, setKdeRadius] = useState(40);
  const [searchSKU, setSearchSKU] = useState('');

  const recommendations = generateRecommendations(PRODUCTS_CATALOG);

  const segmentData = {
    labels: SHOPPER_SEGMENTS.map(s => s.name),
    datasets: [{
      data: SHOPPER_SEGMENTS.map(s => s.percentage),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      borderColor: ['#1e293b'],
      borderWidth: 2,
    }],
  };

  // Smooth scroll to section on sidebar tab click
  useEffect(() => {
    if (activeTab && activeTab !== 'overview') {
      const el = document.getElementById(activeTab);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Render 2D Homography Store Floorplan Blueprint & Gaussian KDE Heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = '/images/floorplan.jpg';

    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const densityPoints = [];

      if (activeLayer === 'gaze') {
        densityPoints.push(
          { x: canvas.width * 0.72, y: canvas.height * 0.28, intensity: 0.95 },
          { x: canvas.width * 0.65, y: canvas.height * 0.52, intensity: 0.88 },
          { x: canvas.width * 0.78, y: canvas.height * 0.52, intensity: 0.92 },
          { x: canvas.width * 0.45, y: canvas.height * 0.62, intensity: 0.70 },
          { x: canvas.width * 0.15, y: canvas.height * 0.45, intensity: 0.65 },
        );
      } else if (activeLayer === 'traffic') {
        for (let t = 0; t <= 1; t += 0.05) {
          const x = canvas.width * (0.2 + t * 0.6);
          const y = canvas.height * (0.35 + Math.sin(t * Math.PI * 2) * 0.15);
          densityPoints.push({ x, y, intensity: 0.8 });
        }
        densityPoints.push(
          { x: canvas.width * 0.5, y: canvas.height * 0.3, intensity: 0.85 },
          { x: canvas.width * 0.5, y: canvas.height * 0.7, intensity: 0.9 }
        );
      } else {
        densityPoints.push(
          { x: canvas.width * 0.65, y: canvas.height * 0.52, intensity: 0.98 },
          { x: canvas.width * 0.78, y: canvas.height * 0.52, intensity: 0.95 },
          { x: canvas.width * 0.72, y: canvas.height * 0.28, intensity: 0.92 }
        );
      }

      densityPoints.forEach((point) => {
        const grad = ctx.createRadialGradient(point.x, point.y, 4, point.x, point.y, kdeRadius);
        const alpha = point.intensity * 0.75;

        grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
        grad.addColorStop(0.35, `rgba(245, 158, 11, ${alpha * 0.85})`);
        grad.addColorStop(0.65, `rgba(16, 185, 129, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(point.x, point.y, kdeRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.15, canvas.height * 0.8);
      ctx.lineTo(canvas.width * 0.45, canvas.height * 0.62);
      ctx.lineTo(canvas.width * 0.65, canvas.height * 0.52);
      ctx.lineTo(canvas.width * 0.72, canvas.height * 0.28);
      ctx.stroke();
      ctx.setLineDash([]);

      [
        { x: canvas.width * 0.15, y: canvas.height * 0.8, label: 'Entrance Foyer (ID #104)' },
        { x: canvas.width * 0.45, y: canvas.height * 0.62, label: 'Aisle Pause (Dwell: 18s)' },
        { x: canvas.width * 0.65, y: canvas.height * 0.52, label: 'Shelf ROI 2 (Interaction > 5s)' },
        { x: canvas.width * 0.72, y: canvas.height * 0.28, label: 'Checkout Lane' },
      ].forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(node.label, node.x + 10, node.y - 4);
      });
    };

    img.onload = drawMap;
    drawMap();
  }, [activeLayer, kdeRadius]);

  const filteredCatalog = PRODUCTS_CATALOG.filter(p =>
    p.name.toLowerCase().includes(searchSKU.toLowerCase()) ||
    p.category.toLowerCase().includes(searchSKU.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 text-slate-200">
      {/* Title */}
      <div id="overview" className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          RETAIL ANALYST DASHBOARD
          <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
            Milestones 1 & 3 Fully Integrated
          </span>
        </h1>
        <p className="text-xs text-slate-400">
          Analyze customer behavior, shopping patterns, 2D homography heatmaps, Sankey journey flows, and product attractiveness scores.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Foot Traffic</span>
            <Navigation size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">1,248 Shoppers</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">Centroid path tracked</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Average Dwell Time</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">4m 18s</div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">Zone (X_min, Y_min, X_max, Y_max)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Avg Engagement Rate</span>
            <Percent size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">68.4%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Interaction &gt; 5 seconds</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Top Attractiveness Product</span>
            <Award size={16} className="text-purple-400" />
          </div>
          <div className="text-lg font-black text-white truncate">Lays Classic 50g</div>
          <div className="text-[11px] text-purple-400 font-bold mt-1">Attractiveness Score: 90.7/100</div>
        </div>
      </div>

      {/* Customer Journey Sankey Diagram Section */}
      <div id="visitors" className={`scroll-mt-20 rounded-xl transition-all ${
        activeTab === 'visitors' ? 'ring-2 ring-blue-500/50' : ''
      }`}>
        <SankeyDiagram />
      </div>

      {/* 2D Homography Floorplan Blueprint Heatmap */}
      <div id="heatmap" className={`scroll-mt-20 p-5 rounded-xl bg-slate-900/90 border transition-all ${
        activeTab === 'heatmap' ? 'border-amber-500/80 ring-2 ring-amber-500/40' : 'border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              2D HOMOGRAPHY STORE BLUEPRINT HEATMAP (GAUSSIAN KDE)
            </h3>
            <p className="text-xs text-slate-400">2D Bounding box centroids mapped onto actual store blueprint floor plan layout</p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLayer('gaze')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeLayer === 'gaze' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Attention Hotspots
            </button>
            <button
              onClick={() => setActiveLayer('traffic')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeLayer === 'traffic' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Foot Traffic Pathing
            </button>
            <button
              onClick={() => setActiveLayer('shelf')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeLayer === 'shelf' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shelf ROI Grid
            </button>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center">
          <canvas ref={canvasRef} width={760} height={420} className="w-full max-w-4xl object-contain block" />
        </div>
      </div>

      {/* Product Attractiveness Table */}
      <div id="shelf" className={`scroll-mt-20 p-5 rounded-xl bg-slate-900/90 border transition-all ${
        activeTab === 'shelf' ? 'border-emerald-500/80 ring-2 ring-emerald-500/40' : 'border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-emerald-400" />
              PRODUCT ATTRACTIVENESS SCORING TABLE
            </h3>
            <p className="text-xs text-slate-400">
              Formula: <span className="font-mono text-slate-200">Score = w1*(Passing Traffic) + w2*(Dwell Time) + w3*(Interaction Count) - w4*(Stockout Rate)</span>
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU or Category..."
              value={searchSKU}
              onChange={(e) => setSearchSKU(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="pb-2 font-semibold">SKU & Product Name</th>
                <th className="pb-2 font-semibold">Camera ROI Location</th>
                <th className="pb-2 font-semibold text-center">Passing Traffic (w1=0.25)</th>
                <th className="pb-2 font-semibold text-center">Dwell Time (w2=0.35)</th>
                <th className="pb-2 font-semibold text-center">Interaction (w3=0.30)</th>
                <th className="pb-2 font-semibold text-center">Stockout Penalty (w4=0.10)</th>
                <th className="pb-2 font-bold text-emerald-400 text-right">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCatalog.map((product) => {
                const score = calculateAttractivenessScore(product);
                return (
                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-white">
                      <div>{product.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{product.id} • {product.category}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        {product.shelfLocation}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-blue-400">{product.passingTraffic}%</td>
                    <td className="py-3 text-center font-mono text-amber-400">{product.dwellTime}s</td>
                    <td className="py-3 text-center font-mono text-purple-400">{product.interactionCount}</td>
                    <td className="py-3 text-center font-mono text-red-400">-{product.stockoutRate}%</td>
                    <td className="py-3 text-right font-black text-sm text-emerald-400">
                      <span className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        {score} / 100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
