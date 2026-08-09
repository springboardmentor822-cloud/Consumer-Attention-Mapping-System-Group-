import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "rose" | "violet";
  loading?: boolean;
  hint?: string;
}

const ACCENTS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "from-blue-500/20 to-blue-500/0 text-blue-300",
  emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
  amber: "from-amber-500/20 to-amber-500/0 text-amber-300",
  rose: "from-rose-500/20 to-rose-500/0 text-rose-300",
  violet: "from-violet-500/20 to-violet-500/0 text-violet-300",
};

export default function KpiCard({ label, value, icon: Icon, accent = "blue", loading, hint }: KpiCardProps) {
  return (
    <div className="glass-card group relative overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", ACCENTS[accent])} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="kpi-value mt-2">{loading ? <span className="inline-block h-9 w-20 animate-pulse rounded bg-white/10" /> : value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white/10">
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}
