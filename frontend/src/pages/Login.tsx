import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL, homePathForRole } from "../lib/roles";
import type { Role } from "../types";
import { Button, Field, Input, Reticle, Select } from "../components/ui";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "store_manager", label: ROLE_LABEL.store_manager },
  { value: "retail_analyst", label: ROLE_LABEL.retail_analyst },
  { value: "marketing_manager", label: ROLE_LABEL.marketing_manager },
  { value: "administrator", label: ROLE_LABEL.administrator },
];

export function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("store_manager");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);

      // The dropdown is a real check, not decoration: an account's role
      // lives in the database, so if what they picked doesn't match what
      // the account actually is, we reject the login rather than silently
      // letting them in as the wrong role.
      if (user.role !== role) {
        logout();
        setError(
          `This account is registered as "${ROLE_LABEL[user.role]}", not "${ROLE_LABEL[role]}". Pick the correct role and try again.`
        );
        return;
      }

      navigate(homePathForRole(user.role));
    } catch {
      setError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base blueprint-grid relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-base via-base/70 to-base pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Reticle className="h-6 w-6 text-signal" />
          <span className="font-display font-semibold tracking-tight">
            ATTENTION<span className="text-signal">MAP</span>
          </span>
        </div>

        <div className="bg-panel border border-hairline rounded-lg p-7 shadow-2xl shadow-black/40">
          <h1 className="font-display text-xl font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-text-muted mb-6">
            Access your store's camera and shelf console.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Login as">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          New manager?{" "}
          <Link to="/register" className="text-signal hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
