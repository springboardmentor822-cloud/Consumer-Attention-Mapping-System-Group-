import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  const roleColors: Record<string, string> = {
    STORE_MANAGER: 'bg-indigo-950 text-indigo-300 border-indigo-500',
    RETAIL_ANALYST: 'bg-emerald-950 text-emerald-300 border-emerald-500',
    MARKETING_MANAGER: 'bg-amber-950 text-amber-300 border-amber-500',
    ADMINISTRATOR: 'bg-rose-950 text-rose-300 border-rose-500',
  };

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 shadow-md">
      <div className="flex items-center justify-between">
        {/* Main Title Heading */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 p-1 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#090d16] rounded-[12px] flex items-center justify-center">
              <Eye className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight">AI Consumer Attention & Trajectory Platform</h1>
          </div>
        </div>

        {/* Authenticated User Session & Log Out Button */}
        {isAuthenticated && user && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-[#1e293b] px-3.5 py-1.5 rounded-xl border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex flex-col text-left space-y-0.5">
                <span className="text-xs font-extrabold text-white leading-none tracking-tight">{user.full_name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border leading-none uppercase tracking-wider ${roleColors[user.role] || 'bg-slate-800 text-slate-300'}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-rose-900 border border-slate-700 rounded-xl transition-all flex items-center space-x-1.5 shadow"
              title="Log Out & Return to Login Page"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
