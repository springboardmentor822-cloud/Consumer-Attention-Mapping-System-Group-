import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, Lock, Mail, LogIn, KeyRound } from 'lucide-react';

interface LoginProps {
  isOpen: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const LoginModal: React.FC<LoginProps> = ({ isOpen, onClose, isFullPage = false }) => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState<string>('manager@retail.com');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen && !isFullPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      if (onClose) onClose();
    } else {
      setError('Invalid email or password. Please check your credentials below.');
    }
  };

  const formContent = (
    <div className="bg-[#0b1329] border-2 border-indigo-500 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-white relative z-[101]">
      {/* Top Close Button if opened as modal */}
      {!isFullPage && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border border-slate-700"
        >
          ✕ Close
        </button>
      )}

      {/* Branding Logo & Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 p-1 shadow-lg mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-[#030712] rounded-[12px] flex items-center justify-center">
            <Eye className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h2 className="font-extrabold text-xl text-white tracking-tight">AI Consumer Attention Platform</h2>
          <p className="text-xs text-slate-300 font-semibold mt-1">Enterprise Authentication Portal</p>
        </div>

        {/* Backend Database Status Badge */}
        <div className="inline-flex items-center space-x-2 bg-emerald-950 border border-emerald-500 text-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Database Ready & API Connected</span>
        </div>
      </div>

      {/* Password Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5 z-10" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#162032] border-2 border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 placeholder-slate-400"
              placeholder="manager@retail.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5 z-10" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#162032] border-2 border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-indigo-400 placeholder-slate-400"
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-200 bg-rose-950 border-2 border-rose-500 p-3 rounded-xl font-bold text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-indigo-600/40 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
        </button>
      </form>

      {/* Account Roles & Credentials Reference Box */}
      <div className="bg-[#162032] border-2 border-slate-700 rounded-2xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center space-x-2 text-indigo-300 font-extrabold uppercase text-[11px] tracking-wider">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <span>Registered Account Credentials:</span>
        </div>
        <div className="space-y-1.5 text-slate-200 text-[11px] font-mono font-semibold">
          <div className="flex justify-between items-center border-b border-slate-700/80 pb-1">
            <span className="text-white font-bold">Store Manager:</span>
            <span className="text-indigo-300 bg-[#0b1329] px-2 py-0.5 rounded border border-slate-700">manager@retail.com / password123</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/80 pb-1">
            <span className="text-white font-bold">Retail Analyst:</span>
            <span className="text-emerald-300 bg-[#0b1329] px-2 py-0.5 rounded border border-slate-700">analyst@retail.com / password123</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-700/80 pb-1">
            <span className="text-white font-bold">Marketing Manager:</span>
            <span className="text-amber-300 bg-[#0b1329] px-2 py-0.5 rounded border border-slate-700">marketing@retail.com / password123</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white font-bold">Administrator:</span>
            <span className="text-rose-300 bg-[#0b1329] px-2 py-0.5 rounded border border-slate-700">admin@retail.com / password123</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative z-[100]">
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712] bg-opacity-95 p-4">
      {formContent}
    </div>
  );
};
