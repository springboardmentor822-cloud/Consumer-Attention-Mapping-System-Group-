type KpiCardProps = {
  value: string | number;
  label: string;
  accent?: "red" | "amber" | "green" | "blue" | "neutral";
};

// No trend arrows / "vs yesterday" deltas here on purpose — this system
// has no historical snapshot to compute a real change against. Showing
// a fabricated percentage would be worse than showing none.
const ACCENT_CLASSES: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  red: "border-l-red-500",
  amber: "border-l-amber-500",
  green: "border-l-green-500",
  blue: "border-l-blue-500",
  neutral: "border-l-border",
};

export default function KpiCard({ value, label, accent = "neutral" }: KpiCardProps) {
  return (
    <div className={`rounded-md border border-border bg-background border-l-4 ${ACCENT_CLASSES[accent]} p-4`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
