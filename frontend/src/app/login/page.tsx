'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { ShieldCheck, Eye, EyeOff, LayoutDashboard, Key, Mail, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden px-4">
      {/* Decorative Glowing Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Theme Toggle Switch */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-150 cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Product Branding */}
        <div className="md:col-span-5 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full">
            <ShieldCheck size={14} />
            Milestone 2 Spatial Intelligence Active
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Consumer <br/>
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Attention Mapping
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Analyze customer paths, dwell times, and shelf gaze distributions. Map physical store engagements into real-time digital intelligence datasets.
          </p>
          
          {/* Quick Demo Login Grid */}
          <div className="bg-white/60 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 rounded-2xl p-5 space-y-3 backdrop-blur-md shadow-sm">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Access Test Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button 
                onClick={() => fillCredentials('admin@attention.com')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-500/10 border border-slate-200 hover:border-indigo-500/20 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:border-slate-800 dark:hover:border-indigo-500/30 text-left rounded-xl transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-bold">Administrator</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">admin@attention.com</div>
              </button>
              <button 
                onClick={() => fillCredentials('manager@attention.com')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-500/10 border border-slate-200 hover:border-indigo-500/20 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:border-slate-800 dark:hover:border-indigo-500/30 text-left rounded-xl transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-bold">Store Manager</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">manager@attention.com</div>
              </button>
              <button 
                onClick={() => fillCredentials('analyst@attention.com')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-500/10 border border-slate-200 hover:border-indigo-500/20 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:border-slate-800 dark:hover:border-indigo-500/30 text-left rounded-xl transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-bold">Retail Analyst</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">analyst@attention.com</div>
              </button>
              <button 
                onClick={() => fillCredentials('marketing@attention.com')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-500/10 border border-slate-200 hover:border-indigo-500/20 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:border-slate-800 dark:hover:border-indigo-500/30 text-left rounded-xl transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-bold">Marketing Manager</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">marketing@attention.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Sign-in Card */}
        <div className="md:col-span-7 bg-white/70 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors duration-200">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your credentials to enter the workspace portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} className="text-indigo-600 dark:text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. manager@attention.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-xs font-semibold"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Key size={12} className="text-indigo-600 dark:text-indigo-400" />
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LayoutDashboard size={18} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
              Need a new test account?{' '}
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors duration-150">
                Register Workspace Account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
