import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/resources";
import { Button, Field, Input, Reticle, Select } from "../components/ui";

const ROLES = [
  { value: "store_manager", label: "Store Manager" },
  { value: "retail_analyst", label: "Retail Analyst" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "administrator", label: "Administrator" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("store_manager");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.register({ full_name: fullName, email, password, role });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed. Try a different email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base blueprint-grid px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Reticle className="h-6 w-6 text-signal" />
          <span className="font-display font-semibold tracking-tight">
            ATTENTION<span className="text-signal">MAP</span>
          </span>
        </div>

        <div className="bg-panel border border-hairline rounded-lg p-7 shadow-2xl shadow-black/40">
          <h1 className="font-display text-xl font-semibold mb-1">Create account</h1>
          <p className="text-sm text-text-muted mb-6">Register as a store or marketing team member.</p>

          {success ? (
            <p className="text-sm text-ok border border-ok/30 bg-ok/10 rounded-md px-3 py-3">
              Account created. Redirecting to sign in…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full name">
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password" hint="At least 8 characters.">
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Role">
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {error && (
                <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="w-full mt-2">
                {submitting ? "Creating…" : "Create account"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
