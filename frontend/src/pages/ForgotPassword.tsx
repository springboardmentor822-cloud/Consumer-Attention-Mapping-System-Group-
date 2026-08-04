import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen bg-[#050508] flex items-center justify-center overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0d0d12]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-black/50 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-2 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Credentials</h2>
          <p className="text-sm text-slate-400">We will send a credential restoration request link to your corporate inbox</p>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-xs space-y-2 text-center">
            <p className="font-semibold">Verification Request Dispatched</p>
            <p className="text-slate-400">Check your inbox for password recovery links.</p>
            <Link to="/login" className="inline-flex items-center space-x-1 text-indigo-400 hover:underline pt-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/20"
            >
              Send Recovery Request
            </button>
            
            <Link to="/login" className="flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login portal</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
