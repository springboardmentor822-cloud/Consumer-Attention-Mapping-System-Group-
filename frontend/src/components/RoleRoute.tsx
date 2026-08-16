import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "../lib/roles";
import type { Role } from "../types";

export function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();

  // ProtectedRoute (which should always wrap this) already handles the
  // "not logged in" / "still loading" cases, so by the time we get here
  // user should be set. Guard anyway to keep this safe to use standalone.
  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
