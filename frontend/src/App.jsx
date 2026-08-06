import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerJourney from "./pages/CustomerJourney";
// Authentication
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Unauthorized from "./pages/Unauthorized";

// Dashboards
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StoreManagerDashboard from "./pages/StoreManagerDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import RetailDashboard from "./pages/RetailDashboard";
import AIDashboard from "./pages/AIDashboard";
import Heatmap from "./pages/Heatmap";
import StoreArchitecture from "./pages/StoreArchitecture";
// Main Pages
import Users from "./pages/Users";
import Stores from "./pages/Stores";
import Shelves from "./pages/Shelves";
import Products from "./pages/Products";
import Cameras from "./pages/Cameras";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import CustomerInsights from "./pages/CustomerInsights";
import DwellTime from "./pages/DwellTime";
import ProductPerformance from "./pages/ProductPerformance";
import AIInsights from "./components/AIInsights";
import AIInsightsPage from "./pages/AIInsightsPage";
import TrajectoryAnalysis from "./pages/TrajectoryAnalysis";
import ZoneTransition from "./pages/ZoneTransition";
import CustomerBehaviour from "./pages/CustomerBehaviour";
// ======================================
// ROLE BASED DASHBOARD ROUTER
// ======================================

function DashboardRouter() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const role = (
    localStorage.getItem("role") ||
    user.role ||
    "guest"
  )
    .toLowerCase()
    .replace(/\s+/g, "_");

  switch (role) {
    case "admin":
      return <AdminDashboard />;

    case "store_manager":
      return <StoreManagerDashboard />;

    case "marketing_manager":
      return <MarketingDashboard />;

    case "retail_analyst":
      return <RetailDashboard />;

    default:
      return <Dashboard />;
  }
}

// ======================================
// APP
// ======================================

function App() {
  return (
    <Router>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* =========================
            AUTHENTICATED ROUTES
        ========================== */}

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<DashboardRouter />}
          />

          {/* =========================
            ADMIN ONLY
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              />
            }
          >
            <Route path="/users" element={<Users />} />
            
            <Route path="/products" element={<Products />} />
            
          </Route>
          {/* =========================
              ADMIN + STORE MANAGER
          ========================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "store_manager",
                ]}
              />
            }
          >
            <Route path="/stores" element={<Stores />} />
            <Route path="/shelves" element={<Shelves />} />
            
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/customer-journey"
            element={<CustomerJourney />}
            />
            <Route
            path="/store-architecture"
            element={<StoreArchitecture />}
            />
          </Route>

          {/* =========================
              ADMIN + STORE MANAGER
              + MARKETING MANAGER
              + RETAIL ANALYST
          ========================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "store_manager",
                  "marketing_manager",
                  "retail_analyst",
                ]}
              />
            }
          >
            <Route
              path="/analytics"
              element={<Analytics />}
            />
            <Route
              path="/trajectory-analysis"
              element={<TrajectoryAnalysis />}
            />
            <Route
              path="/zone-transition"
              element={<ZoneTransition />}
            />
            <Route
              path="/customer-behaviour"
              element={<CustomerBehaviour />}
            />
            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/heatmap"
              element={<Heatmap />}
            />

            <Route
              path="/ai-dashboard"
              element={<AIDashboard />}
            />
            <Route
              path="/customer-insights"
              element={<CustomerInsights />}
            />

            <Route
              path="/dwell-time"
              element={<DwellTime />}
            />

            <Route
              path="/product-performance"
              element={<ProductPerformance />}
            />

            <Route
              path="/ai-insights"
              element={<AIInsightsPage />}
            />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* =========================
              ADMIN + STORE MANAGER
              + MARKETING MANAGER
              + RETAIL ANALYST
          ========================== */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "store_manager",
                  "marketing_manager",
                  "retail_analyst",
                ]}
              />
            }
          >
            <Route
              path="/notifications"
              element={<Notifications />}
            />
          </Route>

        </Route>

        {/* =========================
            INVALID ROUTES
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;