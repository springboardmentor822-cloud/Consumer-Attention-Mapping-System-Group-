export function LoadingState({ label = 'Loading...' }: { label?: string }): JSX.Element {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
