"use client";
import React, { useState } from 'react';
import AlertsTab from './AlertsTab';
import LogsTab from './LogsTab';
import SecurityTab from './SecurityTab';
import BackupTab from './BackupTab';

export default function SecurityAuditTab() {
  const [subTab, setSubTab] = useState<'alerts' | 'logs' | 'security' | 'backup'>('alerts');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('alerts')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'alerts' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:bg-slate-900'}`}>Alerts</button>
        <button onClick={() => setSubTab('logs')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'logs' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>System Logs</button>
        <button onClick={() => setSubTab('security')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'security' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Firewall</button>
        <button onClick={() => setSubTab('backup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'backup' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:bg-slate-900'}`}>Backup</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'alerts' && <AlertsTab />}
        {subTab === 'logs' && <LogsTab />}
        {subTab === 'security' && <SecurityTab />}
        {subTab === 'backup' && <BackupTab />}
      </div>
    </div>
  );
}
