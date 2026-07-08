import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { StoresPage } from './pages/Stores';
import { ShelvesPage } from './pages/Shelves';
import { CamerasPage } from './pages/Cameras';
import { ProfilePage } from './pages/Profile';
import { UsersPage } from './pages/Users';
import { SettingsPage } from './pages/Settings';
import { AuditLogsPage } from './pages/AuditLogs';
import { ReportsPage } from './pages/Reports';
import { AlertsPage } from './pages/Alerts';
import { AnalyticsPage } from './pages/Analytics';
import { HeatmapsPage } from './pages/Heatmaps';
import { CampaignAnalyticsPage } from './pages/Marketing/CampaignAnalytics';
import { ProductVisibilityPage } from './pages/Marketing/ProductVisibility';
import { PromotionsPage } from './pages/Marketing/Promotions';
import { CustomerEngagementPage } from './pages/Marketing/CustomerEngagement';
import { RecommendationsPage } from './pages/Marketing/Recommendations';
import { useAuth } from './contexts/AuthContext';

function RootRedirect(): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  switch (user?.role) {
    case 'Administrator':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Store Manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'Retail Analyst':
      return <Navigate to="/analyst/dashboard" replace />;
    case 'Marketing Manager':
      return <Navigate to="/marketing/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function DashboardRedirect(): JSX.Element {
  const { user } = useAuth();
  switch (user?.role) {
    case 'Administrator':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Store Manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'Retail Analyst':
      return <Navigate to="/analyst/dashboard" replace />;
    case 'Marketing Manager':
      return <Navigate to="/marketing/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Shared Access Reports */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* Administrator Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Administrator & Store Manager Restricted Pages */}
          <Route element={<ProtectedRoute allowedRoles={['Administrator', 'Store Manager']} />}>
            <Route path="/stores" element={<StoresPage />} />
          </Route>

          {/* Store Manager Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['Store Manager']} />}>
            <Route path="/manager/dashboard" element={<DashboardPage />} />
            <Route path="/shelves" element={<ShelvesPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>

          {/* Retail Analyst Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['Retail Analyst']} />}>
            <Route path="/analyst/dashboard" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/heatmaps" element={<HeatmapsPage />} />
          </Route>

          {/* Marketing Manager Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['Marketing Manager']} />}>
            <Route path="/marketing/dashboard" element={<DashboardPage />} />
            <Route path="/marketing/campaign-analytics" element={<CampaignAnalyticsPage />} />
            <Route path="/marketing/product-visibility" element={<ProductVisibilityPage />} />
            <Route path="/marketing/promotions" element={<PromotionsPage />} />
            <Route path="/marketing/customer-engagement" element={<CustomerEngagementPage />} />
            <Route path="/marketing/recommendations" element={<RecommendationsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
