import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RolePortalRouter from "./pages/common/RolePortalRouter";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* ─── Authentication ──────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ─── Administrator Portal ─────────────────────────────────────── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRoleKey="admin">
            <RolePortalRouter role="Administrator" />
          </ProtectedRoute>
        }
      />

      {/* ─── Store Manager Portal ─────────────────────────────────────── */}
      <Route
        path="/store-manager/*"
        element={
          <ProtectedRoute requiredRoleKey="store">
            <RolePortalRouter role="Store Manager" />
          </ProtectedRoute>
        }
      />

      {/* ─── Retail Analyst Portal ────────────────────────────────────── */}
      <Route
        path="/retail-analyst/*"
        element={
          <ProtectedRoute requiredRoleKey="analyst">
            <RolePortalRouter role="Retail Analyst" />
          </ProtectedRoute>
        }
      />

      {/* ─── Marketing Manager Portal ─────────────────────────────────── */}
      <Route
        path="/marketing-manager/*"
        element={
          <ProtectedRoute requiredRoleKey="marketing">
            <RolePortalRouter role="Marketing Manager" />
          </ProtectedRoute>
        }
      />

      {/* ─── Catch-all → Login ───────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}