'use useState';
'use useEffect';
'use client';

import React, { useState, useEffect } from 'react';
import StoreManagerDashboard from '../components/StoreManagerDashboard';
import RetailAnalystDashboard from '../components/RetailAnalystDashboard';
import MarketingManagerDashboard from '../components/MarketingManagerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import { Shield, Lock, Mail, LogOut, Loader2, Sparkles } from 'lucide-react';

export default function Home() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem("attention_token");
    const savedUser = localStorage.getItem("attention_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setLoginError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Authentication failed. Check credentials.");
      }

      const data = await res.json();
      
      // Save credentials
      localStorage.setItem("attention_token", data.access_token);
      const userPayload = { email: data.email, role: data.role };
      localStorage.setItem("attention_user", JSON.stringify(userPayload));

      setToken(data.access_token);
      setUser(userPayload);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("attention_token");
    localStorage.removeItem("attention_user");
    setToken(null);
    setUser(null);
    setEmail("");
    setPassword("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#07070a] text-white">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mb-2" />
        <span className="text-sm text-slate-400">Verifying session token...</span>
      </div>
    );
  }

  // Render Login Panel if not authenticated
  if (!token || !user) {
    return (
      <div className="relative min-h-screen bg-[#050508] flex items-center justify-center overflow-hidden px-4">
        {/* Abstract Glowing Backgrounds */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0d0d12]/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-black/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-2 text-indigo-400">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Attention Mapping System
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Enterprise Retail Analytics</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. manager@store.com"
                  className="w-full bg-[#14141c]/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#14141c]/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/50 p-3 rounded-lg leading-relaxed">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 rounded-lg text-sm transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-900/20"
            >
              {submitting ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Authenticate Operator</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Guide */}
          <div className="border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 space-y-2">
            <span className="font-bold uppercase tracking-wider block">Developer Sandbox Accounts (pwd: password123)</span>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div>Store Manager:<br/><span className="text-indigo-400 font-semibold">manager@store.com</span></div>
              <div>Retail Analyst:<br/><span className="text-indigo-400 font-semibold">analyst@store.com</span></div>
              <div>Marketing Manager:<br/><span className="text-indigo-400 font-semibold">marketing@store.com</span></div>
              <div>Administrator:<br/><span className="text-indigo-400 font-semibold">admin@store.com</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active workspace with global headers & strict client RBAC
  return (
    <div className="min-h-screen flex flex-col bg-[#07070a]">
      {/* Global Application Nav Control bar */}
      <header className="bg-[#0b0b10] border-b border-slate-800/80 px-6 py-3.5 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-900/30">
            A
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100 block leading-tight">Antigravity Attention System</span>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest leading-none">AI Surveillance Portal</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 font-medium block leading-none">{user.email}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded mt-1 inline-block">
              {user.role}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 rounded-lg transition-all duration-300"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Render Workspace Dashboard matching authenticated role */}
      <main className="flex-1 overflow-y-auto">
        {user.role === "Store Manager" && <StoreManagerDashboard storeId="flagship-store-001" token={token} />}
        {user.role === "Retail Analyst" && <RetailAnalystDashboard storeId="flagship-store-001" token={token} />}
        {user.role === "Marketing Manager" && <MarketingManagerDashboard storeId="flagship-store-001" token={token} />}
        {user.role === "Administrator" && <AdminDashboard token={token} />}
      </main>
    </div>
  );
}
