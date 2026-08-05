import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  // ==========================================
  // Authentication
  // ==========================================

  const token = localStorage.getItem("token");

  const storedUser = localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : {};

  // ==========================================
  // Normalize Role
  // ==========================================

  const role = (
    user.role ||
    localStorage.getItem("role") ||
    "guest"
  )
    .toLowerCase()
    .replace(/\s+/g, "_");

  // ==========================================
  // Not Logged In
  // ==========================================

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ==========================================
  // Role Check
  // ==========================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  // ==========================================
  // Render Children OR Nested Routes
  // ==========================================

  if (children) {
    return children;
  }

  return <Outlet />;
}

export default ProtectedRoute;