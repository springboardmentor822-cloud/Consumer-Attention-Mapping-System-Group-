import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import RoleRedirect from "./components/RoleRedirect";
import Spinner from "./components/Spinner";

import Login from "./pages/Login";

const VideoProcessing = lazy(() => import("./pages/VideoProcessing"));
const CameraGrid = lazy(() => import("./pages/CameraGrid"));
const LiveTracking = lazy(() => import("./pages/LiveTracking"));
const Zones = lazy(() => import("./pages/Zones"));
const Cameras = lazy(() => import("./pages/Cameras"));
const Stores = lazy(() => import("./pages/Stores"));
const Shelves = lazy(() => import("./pages/Shelves"));
const Products = lazy(() => import("./pages/Products"));
const Users = lazy(() => import("./pages/Users"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

const AdminDashboardPage = lazy(() => import("./pages/dashboards/AdminDashboardPage"));
const StoreManagerDashboardPage = lazy(() => import("./pages/dashboards/StoreManagerDashboardPage"));
const RetailAnalystDashboardPage = lazy(() => import("./pages/dashboards/RetailAnalystDashboardPage"));
const MarketingDashboardPage = lazy(() => import("./pages/dashboards/MarketingDashboardPage"));
const SideBySideDashboardPage = lazy(() => import("./pages/dashboards/SideBySideDashboardPage"));
const AnalystAnalyticsPage = lazy(() => import("./pages/dashboards/AnalystAnalyticsPage"));
const ProductAnalysisPage = lazy(() => import("./pages/dashboards/ProductAnalysisPage"));
const ShelfAnalysisPage = lazy(() => import("./pages/dashboards/ShelfAnalysisPage"));
const StoreReportsPage = lazy(() => import("./pages/dashboards/StoreReportsPage"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Employees = lazy(() => import("./pages/Employees"));
const SecurityAlerts = lazy(() => import("./pages/SecurityAlerts"));

function PageFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleRedirect />} />

          <Route
            path="admin"
            element={
              <RoleRoute allow={["Admin"]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="store"
            element={
              <RoleRoute allow={["Store Manager"]}>
                <StoreManagerDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="analyst"
            element={
              <RoleRoute allow={["Retail Analyst"]}>
                <RetailAnalystDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="marketing"
            element={
              <RoleRoute allow={["Marketing Manager"]}>
                <MarketingDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/compare"
            element={
              <RoleRoute allow={["Admin"]}>
                <SideBySideDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="analyst/analytics"
            element={
              <RoleRoute allow={["Retail Analyst"]}>
                <AnalystAnalyticsPage />
              </RoleRoute>
            }
          />
          <Route
            path="analyst/product-analysis"
            element={
              <RoleRoute allow={["Retail Analyst"]}>
                <ProductAnalysisPage />
              </RoleRoute>
            }
          />
          <Route
            path="analyst/shelf-analysis"
            element={
              <RoleRoute allow={["Retail Analyst"]}>
                <ShelfAnalysisPage />
              </RoleRoute>
            }
          />
          <Route
            path="analyst/store-reports"
            element={
              <RoleRoute allow={["Retail Analyst"]}>
                <StoreReportsPage />
              </RoleRoute>
            }
          />
          <Route
            path="marketing/campaigns"
            element={
              <RoleRoute allow={["Marketing Manager"]}>
                <Campaigns />
              </RoleRoute>
            }
          />
          <Route
            path="marketing/promotions"
            element={
              <RoleRoute allow={["Marketing Manager"]}>
                <Promotions />
              </RoleRoute>
            }
          />
          <Route
            path="employees"
            element={
              <RoleRoute allow={["Store Manager"]}>
                <Employees />
              </RoleRoute>
            }
          />
          <Route
            path="security-alerts"
            element={
              <RoleRoute allow={["Store Manager"]}>
                <SecurityAlerts />
              </RoleRoute>
            }
          />

          <Route path="video" element={<VideoProcessing />} />
          <Route path="camera-grid" element={<CameraGrid />} />
          <Route path="live-tracking" element={<LiveTracking />} />
          <Route path="zones" element={<Zones />} />
          <Route path="cameras" element={<Cameras />} />
          <Route path="shelves" element={<Shelves />} />
          <Route path="products" element={<Products />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />

          <Route
            path="stores"
            element={
              <RoleRoute allow={["Admin"]}>
                <Stores />
              </RoleRoute>
            }
          />
          <Route
            path="users"
            element={
              <RoleRoute allow={["Admin"]}>
                <Users />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
