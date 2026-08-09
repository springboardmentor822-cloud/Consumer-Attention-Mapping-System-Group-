export default function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-md border border-line bg-panel p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-md border border-line px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
