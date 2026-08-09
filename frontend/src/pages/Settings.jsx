export default function Settings() {
  const settings = [
    ["Theme", "Dark enterprise theme enabled"],
    ["API Base URL", import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"],
    ["Milestone Scope", "Core setup, authentication, dashboard, and CRUD modules"],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">Application configuration summary for the current milestone.</p>
      </div>
      <section className="rounded-md border border-line bg-panel">
        {settings.map(([label, value]) => (
          <div key={label} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm font-medium text-white">{value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
