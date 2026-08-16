import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Reticle({ className = "" }: { className?: string }) {
  // Signature mark: a coordinate crosshair, echoing the shelf/camera
  // physical-position data model that runs through the whole product.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md bg-panel-raised border border-hairline px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-signal focus:outline-none transition-colors " +
        (props.className || "")
      }
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-md bg-panel-raised border border-hairline px-3 py-2.5 text-sm text-text-primary focus:border-signal focus:outline-none transition-colors " +
        (props.className || "")
      }
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-signal text-base hover:bg-signal-dim"
      : "bg-transparent border border-hairline text-text-primary hover:border-signal/60";
  return <button {...props} className={`${base} ${styles} ${className}`} />;
}

export function StatusPill({ status }: { status: "online" | "offline" | "error" | "configuring" }) {
  const map: Record<string, { color: string; label: string }> = {
    online: { color: "bg-ok", label: "Online" },
    offline: { color: "bg-text-muted", label: "Offline" },
    error: { color: "bg-critical", label: "Error" },
    configuring: { color: "bg-signal", label: "Configuring" },
  };
  const s = map[status] ?? map.offline;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
      {s.label}
    </span>
  );
}

export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} />;
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-panel border border-hairline rounded-lg p-5">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-text-muted font-mono uppercase tracking-wide mt-1">{label}</p>
      {hint && <p className="text-xs text-text-muted mt-2">{hint}</p>}
    </div>
  );
}

export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-hairline px-8 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
            active === t.key
              ? "border-signal text-text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = "muted", children }: { tone?: "muted" | "ok" | "warn" | "critical" | "signal"; children: ReactNode }) {
  const toneMap: Record<string, string> = {
    muted: "text-text-muted border-hairline",
    ok: "text-ok border-ok/30 bg-ok/10",
    warn: "text-warn border-warn/30 bg-warn/10",
    critical: "text-critical border-critical/30 bg-critical/10",
    signal: "text-signal border-signal/30 bg-signal/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}
