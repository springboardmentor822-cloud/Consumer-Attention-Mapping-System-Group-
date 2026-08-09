import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useLiveDashboard } from "../hooks/useLiveDashboard";

const ZONE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6", "#a855f7", "#06b6d4"];

function colorForZone(zoneId) {
  if (zoneId == null) return "#94a3b8";
  return ZONE_COLORS[zoneId % ZONE_COLORS.length];
}

function formatAgo(isoTimestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveTracking() {
  const { data, isLoading, isError, dataUpdatedAt } = useLiveDashboard(60);
  const canvasRef = useRef(null);
  // Memoized so the fallback `[]` doesn't produce a fresh array identity on
  // every render - without this the canvas-drawing effect below re-ran on
  // every single render instead of only when the tracking data actually
  // changed.
  const points = useMemo(() => data?.points ?? [], [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 520;

    ctx.fillStyle = "#0a0f1c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle technical-grid backdrop - a nod to a real store floor plan's
    // graph-paper look, kept faint so it reads as structure, not decoration.
    const gridSpacing = 40;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
    ctx.lineWidth = 1;
    for (let x = gridSpacing; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = gridSpacing; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    if (!points.length) return;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const pad = 60;

    const toCanvas = (x, y) => [
      pad + ((x - minX) / spanX) * (canvas.width - pad * 2),
      pad + ((y - minY) / spanY) * (canvas.height - pad * 2),
    ];

    // Group by customer_id to draw each customer's recent points as a faint trail.
    const byCustomer = new Map();
    for (const p of points) {
      if (!byCustomer.has(p.customer_id)) byCustomer.set(p.customer_id, []);
      byCustomer.get(p.customer_id).push(p);
    }

    for (const [customerId, pts] of byCustomer) {
      const sorted = [...pts].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const color = colorForZone(sorted[0]?.zone_id);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      sorted.forEach((p, i) => {
        const [cx, cy] = toCanvas(p.x, p.y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      const last = sorted[sorted.length - 1];
      const [cx, cy] = toCanvas(last.x, last.y);
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Arial";
      ctx.fillText(`#${customerId}`, cx - 10, cy + 4);
    }
  }, [points]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white">Live Store Tracking</h1>
            {data?.is_live ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            ) : data?.as_of ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">
                Recent - as of {formatAgo(data.as_of)}
              </span>
            ) : null}
          </div>
          <p className="text-slate-400 mt-1">
            Real customer positions - live while a camera is actively streaming, or the most recent processed
            activity otherwise
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-6xl font-bold text-emerald-400">{data?.active_customers ?? 0}</p>
            <p className="text-sm text-slate-400 -mt-1">Customers In Range</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/camera-grid" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
              Camera Grid →
            </Link>
            <Link to="/video" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
              Process Video →
            </Link>
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">
          Couldn&apos;t load live tracking data.
        </div>
      )}

      <div className="rounded-3xl bg-slate-950 border border-slate-700 p-6 shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full rounded-2xl" />
        {!isLoading && !points.length && (
          <div className="text-center py-6">
            <p className="text-slate-400">No tracking data yet - nothing has been processed for this camera.</p>
            <Link to="/video" className="text-sm text-blue-400 hover:text-blue-300">
              Process a video to generate tracking data →
            </Link>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 flex flex-wrap gap-x-8 gap-y-2">
        <div>Dot color = customer&apos;s zone at first sighting in this window</div>
        <div>Lines = actual recorded movement path, not simulated</div>
        <div>Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "-"}</div>
      </div>
    </div>
  );
}
