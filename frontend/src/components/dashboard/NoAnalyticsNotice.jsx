import React from "react";
import { Video, Activity } from "lucide-react";

export default function NoAnalyticsNotice({ title = "No Analytics Available Yet" }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center my-6 shadow-xl backdrop-blur-xl">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
        <Activity className="w-8 h-8 animate-pulse" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
        No analytics available yet. Start a camera stream to generate live analytics.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
        <Video className="w-4 h-4 text-indigo-400" />
        <span>Waiting for active camera feed...</span>
      </div>
    </div>
  );
}
