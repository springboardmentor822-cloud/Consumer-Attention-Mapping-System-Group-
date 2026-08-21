import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { LoginPage } from '../components/common/LoginPage';
import { useAuthStore } from '../store/authStore';

// Role Dashboards
import { StoreManagerDashboard } from '../components/dashboards/StoreManagerDashboard';
import { RetailAnalystDashboard } from '../components/dashboards/RetailAnalystDashboard';
import { MarketingManagerDashboard } from '../components/dashboards/MarketingManagerDashboard';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';

// Dedicated View Components matching the exact screenshot design
import { VisitorsView } from '../components/views/VisitorsView';
import { TrafficView } from '../components/views/TrafficView';
import { ShelfPerformanceView } from '../components/views/ShelfPerformanceView';
import { ProductInteractionView } from '../components/views/ProductInteractionView';
import { StoreFloorMapHeatmap } from '../components/heatmaps/StoreFloorMapHeatmap';
import { AlertsLiveFeedView } from '../components/views/AlertsLiveFeedView';
import { ReportsView } from '../components/views/ReportsView';
import { ActivitiesView } from '../components/views/ActivitiesView';
import { AdminView } from '../components/views/AdminView';
import { SettingsView } from '../components/views/SettingsView';
import { HomographyCalibrationView } from '../components/views/HomographyCalibrationView';
import { DedicatedCameraPageView } from '../components/views/DedicatedCameraPageView';
import { CameraPreviewCard } from '../components/common/CameraPreviewCard';

import { ShieldAlert, Video } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [previousTab, setPreviousTab] = useState<string>('overview');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-01');

  // If user is not authenticated, render dedicated full-page Login Page
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const openCameraPage = (cameraId: string) => {
    setPreviousTab(activeTab);
    setSelectedCameraId(cameraId);
    setActiveTab('camera');
  };

  // Dedicated Full-Screen Camera Page View (100vw, 100vh, bg-[#030712])
  if (activeTab === 'camera') {
    return (
      <DedicatedCameraPageView
        cameraId={selectedCameraId}
        onBack={() => setActiveTab(previousTab || 'overview')}
      />
    );
  }

  const demoCameras = [
    { id: 'CAM-01', name: '1. Entrance', ip_address: '192.168.1.101', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-02', name: '2. Aisle A', ip_address: '192.168.1.102', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-03', name: '3. Aisle B', ip_address: '192.168.1.103', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-04', name: '4. Promotion Area', ip_address: '192.168.1.104', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-05', name: '5. Checkout', ip_address: '192.168.1.105', resolution: '1920x1080', status: 'ONLINE' },
    { id: 'CAM-06', name: '6. Exit', ip_address: '192.168.1.106', resolution: '1920x1080', status: 'ONLINE' }
  ];

  // Router for every single sidebar menu tab & standalone page view
  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'calibration':
        return <HomographyCalibrationView onBack={() => setActiveTab('overview')} />;

      case 'cameras':
        return (
          <div className="space-y-6">
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">Live Cameras - Synchronized Feeds</h2>
                <p className="text-xs text-slate-400">Watch live feeds from all cameras in the store</p>
              </div>
              <span className="status-pill-online px-3 py-1 rounded-full text-xs font-extrabold">
                6/6 Cameras Live
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoCameras.map((cam) => (
                <CameraPreviewCard
                  key={cam.id}
                  id={cam.id}
                  name={cam.name}
                  ipAddress={cam.ip_address}
                  resolution={cam.resolution}
                  status={cam.status}
                  onOpenDedicatedPage={openCameraPage}
                />
              ))}
            </div>
          </div>
        );

      case 'visitors':
        return <VisitorsView />;

      case 'traffic':
        return <TrafficView />;

      case 'shelf':
        return <ShelfPerformanceView />;

      case 'product_interaction':
        return <ProductInteractionView />;

      case 'heatmaps':
        return (
          <div className="space-y-6">
            <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
              <h2 className="text-base font-extrabold text-white">Spatial Heatmap Analytics Engine</h2>
              <p className="text-xs text-slate-400">Gaussian KDE 2D Store & Shelf heatmaps with layer toggles</p>
            </div>
            <StoreFloorMapHeatmap storeId="STORE-812" />
          </div>
        );

      case 'alerts':
        return <AlertsLiveFeedView onOpenDedicatedCameraPage={openCameraPage} />;

      case 'reports':
        return <ReportsView />;

      case 'activities':
        return <ActivitiesView />;

      case 'admin':
        // RBAC Enforcement: Administration & Security Logs tab is strictly restricted to ADMINISTRATOR
        if (user?.role !== 'ADMINISTRATOR') {
          return (
            <div className="bg-rose-950/40 border-2 border-rose-500 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto animate-bounce" />
              <h2 className="text-lg font-extrabold text-white">Access Restricted — Administrator Only</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                User account management, security audit logs, employee purge controls, and system telemetry are strictly restricted to Administrator accounts.
              </p>
            </div>
          );
        }
        return <AdminView />;


      case 'settings':
        return <SettingsView />;

      case 'overview':
      default:
        // Render Role-Tailored Dashboard for Overview tab
        switch (user?.role) {
          case 'STORE_MANAGER':
            return <StoreManagerDashboard onOpenDedicatedCameraPage={openCameraPage} />;
          case 'RETAIL_ANALYST':
            return <RetailAnalystDashboard onOpenCalibration={() => setActiveTab('calibration')} />;
          case 'MARKETING_MANAGER':
            return <MarketingManagerDashboard />;
          case 'ADMINISTRATOR':
            return <AdminDashboard />;
          default:
            return <StoreManagerDashboard onOpenDedicatedCameraPage={openCameraPage} />;
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Header />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
};
