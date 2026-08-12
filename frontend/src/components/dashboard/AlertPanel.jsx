import React from "react";
import { AlertTriangle, Info, ShieldAlert, PackageMinus, Users, VideoOff, Brain } from "lucide-react";

export default function AlertPanel({ alerts }) {
  const getIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'critical': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'stock': return <PackageMinus className="w-4 h-4 text-orange-400" />;
      case 'crowd': return <Users className="w-4 h-4 text-purple-400" />;
      case 'camera': return <VideoOff className="w-4 h-4 text-red-500" />;
      case 'ai': return <Brain className="w-4 h-4 text-pink-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBg = (type) => {
    switch(type) {
      case 'critical':
      case 'camera': return 'bg-red-500/10 border-red-500/20';
      case 'warning':
      case 'stock': return 'bg-amber-500/10 border-amber-500/20';
      case 'crowd': return 'bg-purple-500/10 border-purple-500/20';
      case 'ai': return 'bg-pink-500/10 border-pink-500/20';
      default: return 'bg-slate-800/50 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Active Alerts
        </h3>
        <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{alerts.length} New</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`p-3 rounded-xl border ${getBg(alert.type)} flex items-start gap-3 transition-colors hover:bg-slate-800/80 cursor-pointer`}>
            <div className="mt-0.5">
              {getIcon(alert.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-200">{alert.title}</p>
                <span className="text-[9px] text-slate-500 font-mono">{alert.time}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">{alert.desc}</p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-medium">No active alerts</p>
          </div>
        )}
      </div>
      
      <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors border border-slate-700">
        View All Alerts
      </button>
    </div>
  );
}
