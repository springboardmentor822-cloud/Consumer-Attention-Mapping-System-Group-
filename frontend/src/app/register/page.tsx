'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Key, User, Briefcase, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Retail Analyst');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, fullName, role, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden px-4">
      {/* Decorative Glowing Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Theme Toggle Switch */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 transition-all duration-150 cursor-pointer shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <div className="w-full max-w-lg z-10">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm mb-6 transition-colors duration-150 cursor-pointer font-semibold"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>

        <div className="bg-white/70 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-colors duration-200">
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-slate-550 dark:text-slate-400 text-sm">Register a new profile for the workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {success ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-sm font-semibold rounded-xl">
                Account created successfully! Redirecting to login...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
                {error}
              </div>
            ) : null}

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <User size={12} className="text-indigo-600 dark:text-indigo-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-950/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-xs font-semibold"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Mail size={12} className="text-indigo-600 dark:text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-950/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-xs font-semibold"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Briefcase size={12} className="text-indigo-600 dark:text-indigo-400" />
                Organization Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-950/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl transition-all duration-200 outline-none cursor-pointer text-xs font-semibold"
              >
                <option value="Store Manager" className="bg-white dark:bg-slate-950">Store Manager</option>
                <option value="Retail Analyst" className="bg-white dark:bg-slate-950">Retail Analyst</option>
                <option value="Marketing Manager" className="bg-white dark:bg-slate-950">Marketing Manager</option>
                <option value="Administrator" className="bg-white dark:bg-slate-950">Administrator</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Key size={12} className="text-indigo-600 dark:text-indigo-400" />
                Access Password
              </label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-950/60 border border-slate-200 focus:border-indigo-500/50 dark:border-slate-800 focus:dark:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/55 rounded-xl placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-xs font-semibold"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-6 cursor-pointer text-xs"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Create Profile'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
