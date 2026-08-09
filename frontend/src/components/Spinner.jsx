export default function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
      <span>{label}</span>
    </div>
  );
}
