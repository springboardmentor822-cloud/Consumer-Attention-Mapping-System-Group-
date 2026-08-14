"use client";
import React, { useState } from 'react';
import UsersTab from './UsersTab';
import SessionsTab from './SessionsTab';
import RoleMgmtTab from './RoleMgmtTab';
import PermissionMgmtTab from './PermissionMgmtTab';
import NotificationsTab from './NotificationsTab';

export default function IAMTab() {
  const [subTab, setSubTab] = useState<'users' | 'sessions' | 'roles' | 'perms' | 'notifs'>('users');

  return (
    <div className="w-full flex flex-col h-full space-y-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex space-x-2 shrink-0">
        <button onClick={() => setSubTab('users')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'users' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-900'}`}>Users</button>
        <button onClick={() => setSubTab('sessions')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'sessions' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:bg-slate-900'}`}>Sessions</button>
        <button onClick={() => setSubTab('roles')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'roles' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:bg-slate-900'}`}>Roles</button>
        <button onClick={() => setSubTab('perms')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'perms' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:bg-slate-900'}`}>Permissions</button>
        <button onClick={() => setSubTab('notifs')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'notifs' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-slate-900'}`}>Notifications</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTab === 'users' && <UsersTab />}
        {subTab === 'sessions' && <SessionsTab />}
        {subTab === 'roles' && <RoleMgmtTab />}
        {subTab === 'perms' && <PermissionMgmtTab />}
        {subTab === 'notifs' && <NotificationsTab />}
      </div>
    </div>
  );
}