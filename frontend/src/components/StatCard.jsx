export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value ?? 0}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-600/15 text-blue-300">
          <Icon size={22} />
        </span>
      </div>
    </div>
  );
}
