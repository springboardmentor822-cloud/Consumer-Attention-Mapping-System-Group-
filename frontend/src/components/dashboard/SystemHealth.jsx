import React from "react";
import { Server, Database, Cpu, HardDrive, Activity, Video, BrainCircuit } from "lucide-react";

const HealthBar = ({ label, value, icon, colorClass, bgClass, warningThreshold = 85, criticalThreshold = 95 }) => {
  let statusColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  if (value >= criticalThreshold) {
    statusColor = "bg-red-500";
    textColor = "text-red-400";
  } else if (value >= warningThreshold) {
    statusColor = "bg-amber-500";
    textColor = "text-amber-400";
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <span className={`${bgClass} p-1 rounded`}>{icon}</span>
          {label}
        </div>
        <span className={`text-xs font-mono font-bold ${textColor}`}>{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${statusColor} rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
};

export default function SystemHealth({ healthData }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          System Health
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Operational
        </span>
      </div>
      
      <div className="space-y-1">
        <HealthBar label="CPU Usage" value={healthData.cpu || 42} icon={<Cpu className="w-3 h-3 text-blue-400" />} bgClass="bg-blue-500/10" />
        <HealthBar label="Memory Usage" value={healthData.memory || 68} icon={<Server className="w-3 h-3 text-indigo-400" />} bgClass="bg-indigo-500/10" />
        <HealthBar label="GPU Usage" value={healthData.gpu || 88} icon={<Activity className="w-3 h-3 text-purple-400" />} bgClass="bg-purple-500/10" />
        <HealthBar label="Database Health" value={healthData.db || 12} icon={<Database className="w-3 h-3 text-emerald-400" />} bgClass="bg-emerald-500/10" />
        <HealthBar label="Storage Usage" value={healthData.storage || 75} icon={<HardDrive className="w-3 h-3 text-amber-400" />} bgClass="bg-amber-500/10" />
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-pink-400" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">YOLOv8 Status</p>
            <p className="text-xs text-emerald-400 font-bold">Active</p>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
          <Video className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">ByteTrack Status</p>
            <p className="text-xs text-emerald-400 font-bold">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
