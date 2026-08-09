import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const success = toast.type !== "error";
  return (
    <div className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-md border border-line bg-panel p-4 shadow-2xl">
      {success ? <FiCheckCircle className="mt-0.5 text-emerald-400" /> : <FiXCircle className="mt-0.5 text-rose-400" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{success ? "Success" : "Action failed"}</p>
        <p className="mt-1 text-sm text-slate-300">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-white">x</button>
    </div>
  );
}
