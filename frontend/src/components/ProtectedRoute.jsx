import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_PAGE_ACCESS } from "../utils/roles";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <div className="text-xs font-bold text-slate-400 font-mono tracking-wider">Loading Application...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based page permissions if specified or inferred from ROLE_PAGE_ACCESS
  if (user?.role) {
    const userAllowedPages = ROLE_PAGE_ACCESS[user.role] || ["/dashboard"];
    const currentPath = location.pathname;
    
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/access-denied" replace />;
    }

    if (!userAllowedPages.includes(currentPath) && currentPath !== "/dashboard") {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children;
}
