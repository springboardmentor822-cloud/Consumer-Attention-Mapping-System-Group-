import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { homePathForRole } from "./lib/roles";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { StoresPage } from "./pages/Stores";
import { CamerasPage } from "./pages/Cameras";
import { CameraGridPage } from "./pages/CameraGrid";
import { CatalogPage } from "./pages/Catalog";
import { AnalyticsPage } from "./pages/Analytics";
import { StoreLayoutPage } from "./pages/StoreLayout";
import { LiveTrackingPage } from "./pages/tracking/LiveTracking";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UsersAdminPage } from "./pages/admin/Users";
import { MarketingDashboard } from "./pages/marketing/MarketingDashboard";
import { AnalystDashboard } from "./pages/analyst/AnalystDashboard";
import { StoreManagerDashboard } from "./pages/manager/StoreManagerDashboard";

// Roles that share the store-ops toolset (store profiles, cameras, catalog,
// analytics). Marketing managers and retail analysts get their own
// dedicated dashboards instead, so they're not in this list.
const STORE_OPS_ROLES = ["administrator", "store_manager"] as const;

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Store Manager + Administrator: store operations toolset */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRoute roles={[...STORE_OPS_ROLES]}>
                  <StoresPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cameras"
            element={
              <ProtectedRoute>
                <RoleRoute roles={[...STORE_OPS_ROLES]}>
                  <CamerasPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/camera-grid"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["administrator", "store_manager", "retail_analyst"]}>
                  <CameraGridPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <RoleRoute roles={[...STORE_OPS_ROLES]}>
                  <CatalogPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <RoleRoute roles={[...STORE_OPS_ROLES]}>
                  <AnalyticsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layout"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["administrator", "store_manager", "retail_analyst"]}>
                  <StoreLayoutPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          {/* Store Manager: role-spec'd dashboard (KPIs, live cameras, store
              traffic, shelf performance, product interaction, alerts,
              heatmap). Administrators can view it too, but their own home
              route stays /admin. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute roles={[...STORE_OPS_ROLES]}>
                  <StoreManagerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["administrator", "store_manager", "retail_analyst"]}>
                  <LiveTrackingPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Administrator only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["administrator"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["administrator"]}>
                  <UsersAdminPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Marketing Manager only */}
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["marketing_manager"]}>
                  <MarketingDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Retail Analyst only */}
          <Route
            path="/analyst"
            element={
              <ProtectedRoute>
                <RoleRoute roles={["retail_analyst"]}>
                  <AnalystDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <ProtectedRoute>
                <RootRedirect />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
