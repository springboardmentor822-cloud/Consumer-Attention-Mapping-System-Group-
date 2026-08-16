"use client";
import React, { useState } from 'react';

// Unified Wrapper Tabs
import InventorySalesTab from '@/components/tabs/InventorySalesTab';
import LiveFloorTab from '@/components/tabs/LiveFloorTab';
import SystemToolsTab from '@/components/tabs/SystemToolsTab';
import AudienceIntelligenceTab from '@/components/tabs/AudienceIntelligenceTab';
import MerchandisingAnalyticsTab from '@/components/tabs/MerchandisingAnalyticsTab';
import BehavioralMetricsTab from '@/components/tabs/BehavioralMetricsTab';
import HardwareInfraTab from '@/components/tabs/HardwareInfraTab';
import IAMTab from '@/components/tabs/IAMTab';
import SecurityAuditTab from '@/components/tabs/SecurityAuditTab';
import GlobalSettingsTab from '@/components/tabs/GlobalSettingsTab';
import ExportTab from '@/components/tabs/ExportTab';

// Individual Tabs
import OverviewTab from '@/components/tabs/OverviewTab';
import ReportsTab from '@/components/tabs/ReportsTab';
import AiInsightsTab from '@/components/tabs/AiInsightsTab';
import CampaignTab from '@/components/tabs/CampaignTab';
import RecsTab from '@/components/tabs/RecsTab';
import JourneyTab from '@/components/tabs/JourneyTab';
import ShelvesTab from '@/components/tabs/ShelvesTab';
import CustomerHistoryTab from '@/components/tabs/CustomerHistoryTab';
import StoreLayoutTab from '@/components/tabs/StoreLayoutTab';

const getSidebarForRole = (role: string) => {
  if (role === 'Administrator') return [
    { title: "System Admin", tabs: ['Overview', 'Executive Reports', 'Hardware & Infrastructure', 'Security & Audit Logs'] },
    { title: "Governance", tabs: ['Identity & Access (IAM)'] },
    { title: "Spatial Vision", tabs: ['Live Floor Operations', 'Customer Journey'] },
    { title: "System Config", tabs: ['Global Settings'] }
  ];
  if (role === 'Retail Analyst') return [
    { title: "Core Dashboard", tabs: ['Overview', 'Executive Reports', 'AI Insights'] },
    { title: "Analytics Engine", tabs: ['Audience Intelligence', 'Merchandising Analytics', 'Behavioral Metrics'] },
    { title: "Spatial Engagement", tabs: ['Customer Journey'] },
    { title: "Data & Tools", tabs: ['System Tools'] }
  ];
  if (role === 'Marketing Manager') return [
    { title: "Core Dashboard", tabs: ['Overview', 'Executive Reports', 'AI Insights'] },
    { title: "Audience & Campaigns", tabs: ['Audience Intelligence', 'Campaign A/B', 'Recommendations'] },
    { title: "Spatial Engagement", tabs: ['Customer Journey', 'Micro-Level Shelves'] },
    { title: "Data & Tools", tabs: ['System Tools'] }
  ];
  return [ // Default Store Manager
    { title: "Core Dashboard", tabs: ['Overview', 'Executive Reports', 'AI Insights'] },
    { title: "Store Operations", tabs: ['Inventory & Sales', 'Customer History'] },
    { title: "Spatial Vision", tabs: ['Live Floor Operations'] },
    { title: "System", tabs: ['System Tools'] }
  ];
};

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Store Manager'); 
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeFilter, setTimeFilter] = useState('all');
  
  const [authError, setAuthError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setAuthError('');

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
    try {
      // Relative proxy path to ensure cookies are attached properly
      const proxyEndpoint = endpoint.replace('/api/', '/api/backend/');
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: isLoginMode ? 'unassigned' : role })
      });
      const data = await response.json();
      if (response.ok && (data.status === 'authenticated' || data.status === 'created')) {
        setRole(data.role);
        setIsAuthenticated(true);
        setActiveTab('Overview');
      } else {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          setAuthError(`Validation Error: ${data.detail[0].msg}`);
        } else if (typeof data.detail === 'string') {
          setAuthError(data.detail);
        } else {
          setAuthError('Authentication failed. Please try again.');
        }
      }
    } catch (error) {
      console.error(error);
      setAuthError('Cannot connect to backend server. Is FastAPI running on port 9000?');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-slate-200">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Consumer Attention Mapping</h1>
            <p className="text-sm text-slate-400 mt-2">CAMS Intelligent Platform</p>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-100">{isLoginMode ? 'Sign In' : 'Create Account'}</h2>
            <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} className="text-cyan-400 text-xs hover:underline font-semibold transition-colors">
              {isLoginMode ? 'Need an account?' : 'Already have an account?'}
            </button>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" placeholder="user@cams.ai" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" placeholder="••••••••" required />
            </div>

            {!isLoginMode && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 text-slate-200 cursor-pointer">
                  <option value="Store Manager">Store Manager</option>
                  <option value="Retail Analyst">Retail Analyst</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            )}
            
            {authError && <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">{authError}</p>}
            
            <button type="submit" disabled={isProcessing} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg mt-4 shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-colors">
              {isProcessing ? 'Processing...' : (isLoginMode ? 'Secure Login' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sidebarGroups = getSidebarForRole(role);

  return (
    <div className="h-screen bg-[#020617] text-slate-300 font-sans flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}} />

      {/* Top Navigation */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] shrink-0">CA</div>
          <span className="font-bold text-lg text-slate-100 tracking-wide whitespace-nowrap">Consumer Attention <span className="text-cyan-400">Mapping System</span></span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 border-r border-slate-800 pr-6">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range:</span>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              title="Relative to the dataset's latest recorded date"
              className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarterly">This Quarter</option>
              <option value="yearly">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <span className="text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 border border-slate-700">{role}</span>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full overflow-y-auto relative">
          <div className="p-4 space-y-4 flex-1">
            {sidebarGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-2">{group.title}</p>
                <div className="space-y-1">
                  {group.tabs.map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)} 
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-900'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Moved Sign Out button to bottom left corner */}
          <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950 sticky bottom-0 z-10 shrink-0">
            <button 
              onClick={handleLogout} 
              className="w-full flex justify-center items-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 h-full overflow-y-auto bg-[#050b14]">
          {activeTab === 'Overview' && <OverviewTab role={role} timeFilter={timeFilter} />}
          {activeTab === 'Executive Reports' && <ReportsTab role={role} />}
          {activeTab === 'Data Export' && <ExportTab />}
          {activeTab === 'AI Insights' && <AiInsightsTab timeFilter={timeFilter} />}
          
          {activeTab === 'Inventory & Sales' && <InventorySalesTab timeFilter={timeFilter} />}
          {activeTab === 'Live Floor Operations' && <LiveFloorTab timeFilter={timeFilter} />}
          {activeTab === 'Store Layout' && <StoreLayoutTab />}
          {activeTab === 'System Tools' && <SystemToolsTab />}
          {activeTab === 'Customer History' && <CustomerHistoryTab timeFilter={timeFilter} />}
          
          {activeTab === 'Audience Intelligence' && <AudienceIntelligenceTab timeFilter={timeFilter} />}
          {activeTab === 'Merchandising Analytics' && <MerchandisingAnalyticsTab timeFilter={timeFilter} />}
          {activeTab === 'Behavioral Metrics' && <BehavioralMetricsTab timeFilter={timeFilter} />}
          {activeTab === 'Campaign A/B' && <CampaignTab />}
          {activeTab === 'Customer Journey' && <JourneyTab />}
          {activeTab === 'Micro-Level Shelves' && <ShelvesTab />}
          {activeTab === 'Recommendations' && <RecsTab />}

          {activeTab === 'Hardware & Infrastructure' && <HardwareInfraTab />}
          {activeTab === 'Identity & Access (IAM)' && <IAMTab />}
          {activeTab === 'Security & Audit Logs' && <SecurityAuditTab />}
          {activeTab === 'Global Settings' && <GlobalSettingsTab />}
        </main>
      </div>
    </div>
  );
}