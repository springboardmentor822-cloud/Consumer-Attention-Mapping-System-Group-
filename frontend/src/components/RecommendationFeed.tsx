import { AlertCircle, Info, Lightbulb, TrendingUp } from "lucide-react";
import { useRecommendations } from "../hooks/useAnalyticsDashboard";
import SectionEmptyState from "./ui/SectionEmptyState";

interface RecommendationFeedProps {
  storeId?: number;
}

const SEVERITY_STYLE: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  notable: { icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
  critical: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
};

/**
 * Rule-based optimization feed - traffic/dwell/stock signals compared across
 * a store's own shelves, not a machine-learned recommender. Shared between
 * the Marketing and Store Manager dashboards, the two roles the underlying
 * spec calls out for this.
 */
export default function RecommendationFeed({ storeId }: RecommendationFeedProps) {
  const { data, isLoading } = useRecommendations(storeId);

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />)}</div>;
  }

  if (!data || data.shelves_considered < 3) {
    return (
      <SectionEmptyState
        icon={Lightbulb}
        title="Not enough tracking data yet"
        description={`Recommendations compare a shelf against the others in the store, which needs at least 3 shelves with camera activity to be meaningful. ${
          data ? `${data.shelves_considered} currently have data.` : ""
        }`}
      />
    );
  }

  if (!data.recommendations.length) {
    return (
      <SectionEmptyState
        icon={Lightbulb}
        title="No flags right now"
        description="Traffic, dwell time, and stock levels across this store's shelves don't show a strong outlier in either direction."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {data.recommendations.map((rec, i) => {
        const style = SEVERITY_STYLE[rec.severity] ?? SEVERITY_STYLE.info;
        const Icon = style.icon;
        return (
          <div key={`${rec.shelf_id}-${i}`} className={`rounded-xl border border-white/5 ${style.bg} p-3`}>
            <div className="flex items-start gap-2.5">
              <Icon size={16} className={`mt-0.5 flex-shrink-0 ${style.color}`} />
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-slate-200">{rec.issue}</p>
                <p className="text-xs font-medium text-slate-400">→ {rec.action}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
