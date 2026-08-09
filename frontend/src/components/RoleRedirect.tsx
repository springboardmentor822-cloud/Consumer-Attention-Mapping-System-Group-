import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME, type Role } from "../lib/roles";

/** Sends a logged-in user from `/` straight to their own role dashboard. */
export default function RoleRedirect() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  return <Navigate to={(role && ROLE_HOME[role]) || "/login"} replace />;
}
