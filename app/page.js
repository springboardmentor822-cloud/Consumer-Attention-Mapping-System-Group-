'use client';

import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AdminDashboardView from '@/components/AdminDashboardView';
import StoreManagerDashboardView from '@/components/StoreManagerDashboardView';
import RetailAnalystDashboardView from '@/components/RetailAnalystDashboardView';
import MarketingManagerDashboardView from '@/components/MarketingManagerDashboardView';
import ReportsModal from '@/components/ReportsModal';
import { STORES } from '@/lib/cams-data';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStore, setSelectedStore] = useState(STORES[0]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState('Daily Executive Report');

  // Load saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cams_user');
    const savedToken = localStorage.getItem('cams_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setJwtToken(savedToken);
      } catch (e) {
        localStorage.removeItem('cams_user');
        localStorage.removeItem('cams_token');
      }
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setJwtToken(token);
    setActiveTab('overview');
    localStorage.setItem('cams_user', JSON.stringify(user));
    localStorage.setItem('cams_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setJwtToken(null);
    localStorage.removeItem('cams_user');
    localStorage.removeItem('cams_token');
  };

  const handleOpenReport = (type) => {
    setReportModalType(type || 'Daily Analytics Report');
    setIsReportModalOpen(true);
  };

  // Render Login Form if user is not authenticated
  if (!currentUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation - Strictly isolated to current user's role */}
      <Sidebar
        currentUser={currentUser}
        activeRole={currentUser.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          selectedStore={selectedStore}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Role Dashboard Viewport - Strictly isolated by currentUser.role */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950">
          {currentUser.role === 'Admin' && (
            <AdminDashboardView activeTab={activeTab} />
          )}
          {currentUser.role === 'Store Manager' && (
            <StoreManagerDashboardView
              activeTab={activeTab}
              selectedStore={selectedStore}
              onExportReport={handleOpenReport}
            />
          )}
          {currentUser.role === 'Retail Analyst' && (
            <RetailAnalystDashboardView activeTab={activeTab} />
          )}
          {currentUser.role === 'Marketing Manager' && (
            <MarketingManagerDashboardView activeTab={activeTab} />
          )}
        </main>
      </div>

      {/* Analytical PDF Export Modal */}
      <ReportsModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportType={reportModalType}
      />
    </div>
  );
}
