import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const ROLES = [
  { value: "store_manager", label: "Store Manager" },
  { value: "retail_analyst", label: "Retail Analyst" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "administrator", label: "Administrator" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("retail_analyst");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        role,
      });
      // auto-login after register
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <div className="w-11 h-11 rounded-xl bg-[#14213d] text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
          C
        </div>
        <h1 className="text-lg font-semibold text-center">
          {mode === "login" ? "Sign in to CAMS" : "Create an account"}
        </h1>
        <p className="text-xs text-gray-500 text-center mb-6">
          Retail Attention Intelligence Platform
        </p>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="manager@retailstore.com"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5 mt-2 transition"
          >
            {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Register"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-5">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button className="text-blue-600 font-medium" onClick={() => setMode("register")}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button className="text-blue-600 font-medium" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
