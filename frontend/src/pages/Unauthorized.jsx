import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <h1>403</h1>

      <h2>Access Denied</h2>

      <p>
        You are not authorized to access this page.
      </p>

      <Link to="/dashboard">
        Go Back
      </Link>
    </div>
  );
}

export default Unauthorized;