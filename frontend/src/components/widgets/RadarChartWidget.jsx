import React from 'react';
import { Target, PieChart } from 'lucide-react';

export default function RadarChartWidget({ title = 'Product Attractiveness Radar', data }) {
  const axes = data || [
    { metric: 'Visual Appeal', ProductA: 90, ProductB: 70 },
    { metric: 'Placement', ProductA: 85, ProductB: 78 },
    { metric: 'Purchase Impact', ProductA: 80, ProductB: 82 },
    { metric: 'Pick Rate', ProductA: 92, ProductB: 65 },
    { metric: 'Engagement', ProductA: 88, ProductB: 72 },
  ];

  const totalAxes = axes.length;
  const radius = 90;
  const centerX = 150;
  const centerY = 120;

  // Calculate polygon points for each product
  const getPoints = (key) => {
    return axes
      .map((item, index) => {
        const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
        const val = (item[key] || item.score || 50) / 100;
        const x = centerX + radius * val * Math.cos(angle);
        const y = centerY + radius * val * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
      </div>

      <div className="relative flex justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2">
        <svg viewBox="0 0 300 240" className="w-72 h-60">
          {/* Radar background grid webs */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, idx) => (
            <polygon
              key={idx}
              points={axes
                .map((_, index) => {
                  const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
                  const x = centerX + radius * level * Math.cos(angle);
                  const y = centerY + radius * level * Math.sin(angle);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray={level === 1 ? 'none' : '2,2'}
            />
          ))}

          {/* Axes Spoke Lines */}
          {axes.map((item, index) => {
            const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const labelX = centerX + (radius + 20) * Math.cos(angle);
            const labelY = centerY + (radius + 15) * Math.sin(angle);

            return (
              <g key={index}>
                <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#334155" strokeWidth="1" />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {item.metric}
                </text>
              </g>
            );
          })}

          {/* Polygon Overlay for Product A */}
          <polygon
            points={getPoints('ProductA')}
            fill="rgba(99, 102, 241, 0.35)"
            stroke="#6366f1"
            strokeWidth="2"
          />

          {/* Polygon Overlay for Product B */}
          <polygon
            points={getPoints('ProductB')}
            fill="rgba(16, 185, 129, 0.35)"
            stroke="#10b981"
            strokeWidth="2"
          />
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 left-3 flex gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-indigo-300">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> Product A (Luxe ANC)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Product B (Smart TV)
          </span>
        </div>
      </div>
    </div>
  );
}
