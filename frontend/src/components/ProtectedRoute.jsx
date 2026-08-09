import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-surface"><Spinner label="Loading workspace" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
