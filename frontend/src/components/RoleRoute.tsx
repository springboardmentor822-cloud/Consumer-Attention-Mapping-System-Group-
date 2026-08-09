import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME, type Role } from "../lib/roles";

interface RoleRouteProps {
  allow: Role[];
  children: ReactNode;
}

export default function RoleRoute({ allow, children }: RoleRouteProps) {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? "/login"} replace />;
  }
  return <>{children}</>;
}
