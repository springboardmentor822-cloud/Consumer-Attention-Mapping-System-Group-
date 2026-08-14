import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLock, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { roles } from "../utils/permissions";

/** Turns any auth failure into a sentence a human can act on.
 *
 * FastAPI reports a 401 as `detail: "Invalid email or password"` (a string)
 * but a 422 as `detail: [{loc, msg, ...}]` (an array of objects). The form
 * previously rendered `detail` directly, so every validation failure - most
 * commonly a password under 8 characters - showed nothing useful and left
 * you guessing why registration was rejected. This formats the array into
 * "Password: String should have at least 8 characters" instead.
 */
function describeAuthError(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        // loc is like ["body", "password"] - the last entry is the field.
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
        const label = typeof field === "string" ? field.replace(/_/g, " ") : null;
        const message = item.msg ?? "is invalid";
        return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${message}` : message;
      })
      .join(". ");
  }
  if (typeof detail === "string") return detail;
  if (err?.response?.status === 401) return "Invalid email or password.";
  return fallback;
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { register: field, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { role: "Admin" },
  });

  async function onSubmit(values) {
    setError("");
    try {
      if (mode === "register") {
        await register(values);
        await login({ email: values.email, password: values.password });
      } else {
        await login(values);
      }
      navigate("/");
    } catch (err) {
      setError(describeAuthError(err, "Unable to complete authentication"));
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    reset({ role: "Admin" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-md border border-line bg-panel shadow-2xl md:grid md:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-blue-700 p-8 text-white md:p-10">
          <h1 className="mt-4 text-4xl font-semibold">Consumer Attention Mapping System</h1>

          <div className="mt-10 grid gap-3 text-sm text-blue-50">
            <span>JWT Authentication</span>
            <span>PostgreSQL Modules</span>
          </div>
        </section>
        <section className="p-8 md:p-10">
          <div className="mb-8 flex rounded-md border border-line bg-surface p-1">
            <button onClick={() => switchMode("login")} className={`flex-1 rounded px-3 py-2 text-sm ${mode === "login" ? "bg-blue-600 text-white" : "text-slate-300"}`}>Login</button>
            <button onClick={() => switchMode("register")} className={`flex-1 rounded px-3 py-2 text-sm ${mode === "register" ? "bg-blue-600 text-white" : "text-slate-300"}`}>Register</button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="text-sm text-slate-300">Full name</span>
                <input {...field("full_name", { required: mode === "register" })} className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-white focus-ring" />
              </label>
            )}
            <label className="block">
              <span className="text-sm text-slate-300">Email</span>
              <input type="email" {...field("email", { required: true })} className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-white focus-ring" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Password</span>
              <input type="password" {...field("password", { required: true, minLength: mode === "register" ? 8 : 1 })} className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-white focus-ring" />
              {/* States the backend's real rule up front - it used to be
                  discoverable only by submitting and getting a 422. */}
              {mode === "register" && (
                <span className="mt-1 block text-xs text-slate-500">At least 8 characters</span>
              )}
            </label>
            {mode === "register" && (
              <label className="block">
                <span className="text-sm text-slate-300">Role</span>
                <select {...field("role")} className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-white focus-ring">
                  {roles.map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
            )}
            {error && <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60">
              {mode === "login" ? <FiLock /> : <FiUserPlus />}
              {isSubmitting ? "Please wait" : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
