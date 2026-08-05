import { Navigate } from "react-router-dom";

function RoleRoute({

  children,

  allowedRoles,

}) {

  const role = localStorage.getItem("role");

  if (!allowedRoles.includes(role)) {

    return <Navigate to="/dashboard" replace />;

  }

  return children;

}

export default RoleRoute;