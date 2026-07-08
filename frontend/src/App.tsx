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
import { useAuth } from './contexts/AuthContext';

function RootRedirect(): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  switch (user?.role) {
    case 'SuperAdmin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'StoreManager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'Analyst':
      return <Navigate to="/analyst/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function DashboardRedirect(): JSX.Element {
  const { user } = useAuth();
  switch (user?.role) {
    case 'SuperAdmin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'StoreManager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'Analyst':
      return <Navigate to="/analyst/dashboard" replace />;
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

          {/* Super Admin Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Super Admin & Store Manager Restricted Pages */}
          <Route element={<ProtectedRoute allowedRoles={['SuperAdmin', 'StoreManager']} />}>
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/shelves" element={<ShelvesPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
          </Route>

          {/* Store Manager Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['StoreManager']} />}>
            <Route path="/manager/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>

          {/* Analyst Restricted Pages & Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={['Analyst']} />}>
            <Route path="/analyst/dashboard" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/heatmaps" element={<HeatmapsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
