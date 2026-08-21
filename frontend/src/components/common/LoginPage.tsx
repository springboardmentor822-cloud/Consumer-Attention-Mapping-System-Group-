import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, Lock, Mail, LogIn, ShieldCheck, Activity, Flame, Sparkles, ShieldAlert, Cpu, Server } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState<string>('manager@retail.com');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Invalid email address or password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] flex items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full bg-[#0f172a] border-2 border-indigo-500/60 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Column: Platform Overview & System Capability Highlights */}
        <div className="lg:col-span-6 bg-[#090d16] p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Logo & Platform Name */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 p-1 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-[#090d16] rounded-[12px] flex items-center justify-center">
                  <Eye className="w-7 h-7 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="font-extrabold text-xl text-white tracking-tight">AI Consumer Attention Platform</h1>
                <p className="text-xs text-indigo-400 font-extrabold tracking-wide uppercase">PARVATH RETAIL INTELLIGENCE PLATFORM</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Enterprise spatial intelligence and automated merchandising platform powered by OpenCV Homography, Kalman 2D kinematics, and Gaussian KDE density matrices.
            </p>

            {/* Core Capability Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3 bg-[#111827] p-3.5 rounded-2xl border border-slate-800">
                <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">Spatial Heatmaps & KDE Engine</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Traffic, Zone Density, Gaze Focus, and Shelf Hotspot matrices</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-[#111827] p-3.5 rounded-2xl border border-slate-800">
                <Activity className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">2D Shopper Trajectories & Kinematics</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Smoothed path distance, dwell time distributions, and velocity tracking</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-[#111827] p-3.5 rounded-2xl border border-slate-800">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">Multi-Factor Attractiveness Scoring</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Formula: 0.35A + 0.25I + 0.20P + 0.15C + 0.05R category normalization</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Telemetry Indicator */}
          <div className="bg-[#111827] p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-extrabold">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>PostgreSQL & FastAPI Online</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Port: 8000</span>
          </div>
        </div>

        {/* Right Column: Authentication Form & Enterprise Security Infrastructure Panel */}
        <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-extrabold text-white">Enterprise Sign In</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">Please enter your authorized account email and password</p>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3.5 z-10 font-bold" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-[#0f172a] font-extrabold focus:outline-none focus:border-indigo-600 placeholder-slate-500 shadow-sm"
                    style={{ color: '#0f172a' }}
                    placeholder="Enter official email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3.5 z-10 font-bold" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-[#0f172a] font-extrabold focus:outline-none focus:border-indigo-600 placeholder-slate-500 shadow-sm"
                    style={{ color: '#0f172a' }}
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
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </form>
          </div>

          {/* Enterprise Security & Infrastructure Specifications Panel */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Security & Specifications</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500 font-mono">
                SECURE SSL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <div className="bg-[#090d16] p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Authentication</div>
                <div className="font-bold text-white mt-0.5">JWT + Bcrypt Hashing</div>
              </div>
              <div className="bg-[#090d16] p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Database Layer</div>
                <div className="font-bold text-emerald-400 mt-0.5">PostgreSQL 15 (Docker)</div>
              </div>
              <div className="bg-[#090d16] p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">RTSP Video Feeds</div>
                <div className="font-bold text-indigo-300 mt-0.5">1080P TLS Encrypted</div>
              </div>
              <div className="bg-[#090d16] p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Access Control</div>
                <div className="font-bold text-amber-300 mt-0.5">RBAC Enforced</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
