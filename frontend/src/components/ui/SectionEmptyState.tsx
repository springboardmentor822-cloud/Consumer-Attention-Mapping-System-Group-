import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface SectionEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

/**
 * Honest "not built yet" state for a real, finished section whose data
 * isn't wired up in this phase - distinct from a placeholder pretending
 * to be a working feature. Says so plainly instead of showing fake numbers.
 */
export default function SectionEmptyState({ title, description, icon: Icon = Construction }: SectionEmptyStateProps) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
      <Icon className="mb-3 h-8 w-8 text-slate-600" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-600">{description}</p>
    </div>
  );
}
