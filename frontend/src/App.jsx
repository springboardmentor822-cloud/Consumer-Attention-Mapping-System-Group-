import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analyse from "./pages/Analyse";
import Stores from "./pages/Stores";
import Shelves from "./pages/Shelves";
import Products from "./pages/Products";
import Zones from "./pages/Zones";
import Cameras from "./pages/Cameras";
import VideoUpload from "./pages/videoupload";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import AccessDenied from "./pages/AccessDenied";
import AdminDashboard from "./pages/AdminDashboard";

// Analytics Pages
import LiveAnalytics from "./pages/analytics/LiveAnalytics";
import AttentionAnalytics from "./pages/analytics/AttentionAnalytics";
import DwellTimeAnalytics from "./pages/analytics/DwellTimeAnalytics";
import HeatmapAnalytics from "./pages/analytics/HeatmapAnalytics";
import CustomerJourney from "./pages/analytics/CustomerJourney";
import ProductAnalytics from "./pages/analytics/ProductAnalytics";
import ShelfAnalytics from "./pages/analytics/ShelfAnalytics";

// System Pages
import Settings from "./pages/system/Settings";
import SystemLogs from "./pages/system/SystemLogs";
import Notifications from "./pages/system/Notifications";
import Profile from "./pages/system/Profile";
import MarketingDashboard from "./pages/MarketingDashboard";
import RetailAnalystDashboard from "./roles/retail-analyst/RetailAnalystDashboard";
import StoreManagerDashboard from "./roles/store-manager/StoreManagerDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                <MarketingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing-dashboard"
            element={
              <ProtectedRoute>
                <MarketingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyst"
            element={
              <ProtectedRoute>
                <RetailAnalystDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyst-dashboard"
            element={
              <ProtectedRoute>
                <RetailAnalystDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store-manager"
            element={
              <ProtectedRoute>
                <StoreManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store-manager-dashboard"
            element={
              <ProtectedRoute>
                <StoreManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Analytics Routes */}
          <Route path="/analyse" element={<ProtectedRoute><LiveAnalytics /></ProtectedRoute>} />
          <Route path="/attention" element={<ProtectedRoute><AttentionAnalytics /></ProtectedRoute>} />
          <Route path="/dwell" element={<ProtectedRoute><DwellTimeAnalytics /></ProtectedRoute>} />
          <Route path="/heatmaps" element={<ProtectedRoute><HeatmapAnalytics /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><CustomerJourney /></ProtectedRoute>} />
          <Route path="/product-analytics" element={<ProtectedRoute><ProductAnalytics /></ProtectedRoute>} />
          <Route path="/shelf-analytics" element={<ProtectedRoute><ShelfAnalytics /></ProtectedRoute>} />

          {/* Report Routes */}
          {["/reports", "/weekly-reports", "/monthly-reports", "/export"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Core Store & Inventory Routes */}
          <Route path="/store" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
          <Route path="/stores" element={<Navigate to="/store" replace />} />
          <Route path="/shelves" element={<ProtectedRoute><Shelves /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/zones" element={<ProtectedRoute><Zones /></ProtectedRoute>} />
          <Route path="/cameras" element={<ProtectedRoute><Cameras /></ProtectedRoute>} />
          <Route path="/video-upload" element={<ProtectedRoute><VideoUpload /></ProtectedRoute>} />

          {/* User Management Routes */}
          {["/users", "/managers", "/analysts", "/security"].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
          ))}

          {/* System & Settings Routes */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><SystemLogs /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}