"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

/**
 * Design note (why this doesn't use shadcn Card/Input/Button here):
 * The rest of the app's shadcn theme is a neutral light/dark utility
 * palette, fine for dashboards. The login page is the one screen where
 * the product gets to introduce itself, so this uses a bespoke dark
 * "camera-vision" surface instead — deliberately built around the
 * project's own real feature (YOLOv8 bounding boxes + tracking labels,
 * same visual language as the actual dashboard camera feeds) rather
 * than a generic auth-card template. Functionality (login/register/
 * forgot-password) is unchanged from the previous version.
 */

const TRACKING_LABELS = [
  "AI: TRACKING SHOPPER #104",
  "AI: GAZE AT SHELF A",
  "AI: DWELL 14s",
  "AI: ZONE — MAIN AISLE",
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("StoreManager");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [labelIndex, setLabelIndex] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password, roleName);
      localStorage.setItem("access_token", result.access_token);

      // Route to the role's own dashboard instead of a fixed page for
      // everyone. Previously this was router.push("/stores") unconditionally
      // - a SuperAdmin logging in landed on /stores same as everyone else,
      // with no path to /dashboard/admin unless they typed the URL manually.
      try {
        const me = await api.getMe();
        switch (me.role_name) {
          case "SuperAdmin":
            router.push("/dashboard/admin");
            break;
          case "StoreManager":
            router.push("/dashboard/store-manager");
            break;
          case "Analyst":
            router.push("/dashboard/retail-analyst");
            break;
          case "MarketingManager":
            router.push("/dashboard/marketing-manager");
            break;
          default:
            router.push("/stores");
        }
      } catch {
        // /me failed for some reason - fall back to the old behavior
        // rather than leaving the user stuck on the login page.
        router.push("/stores");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

        @keyframes scan-sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(2500%); opacity: 0; }
        }
        @keyframes bracket-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes fade-cycle {
          0%, 100% { opacity: 0; transform: translateY(2px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
        .cam-font { font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
        .body-font { font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
        .mono-font { font-family: "JetBrains Mono", ui-monospace, monospace; }

        @media (prefers-reduced-motion: reduce) {
          .scan-line, .bracket, .track-label { animation: none !important; }
        }
      `}</style>

      {/* Left panel — product identity, hidden below lg */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-[#1E293B] items-center justify-center">
        {/* dot-matrix ambient background */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(#22D3EE 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 px-12">
          <div className="text-center">
            <p className="mono-font text-[11px] tracking-[0.25em] text-[#64748B] uppercase mb-2">
              Consumer Attention Mapping
            </p>
            <h1 className="cam-font text-3xl font-semibold text-[#E2E8F0] leading-tight">
              See what shoppers<br />actually notice.
            </h1>
          </div>

          {/* Signature element: detection reticle around a shopper glyph,
              matching the real bounding-box + label overlay used on the
              live camera dashboards — not decorative, it's the product. */}
          <div className="relative w-56 h-72 rounded-md border border-[#1E293B] bg-[#0F1523] overflow-hidden">
            {/* scanning sweep line */}
            <div
              className="scan-line absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[#22D3EE]/20 to-transparent"
              style={{ animation: "scan-sweep 3.5s ease-in-out infinite" }}
            />

            {/* corner brackets */}
            {[
              "top-3 left-3 border-t-2 border-l-2",
              "top-3 right-3 border-t-2 border-r-2",
              "bottom-3 left-3 border-b-2 border-l-2",
              "bottom-3 right-3 border-b-2 border-r-2",
            ].map((pos, i) => (
              <div
                key={i}
                className={`bracket absolute ${pos} w-6 h-6 border-[#EC4899]`}
                style={{ animation: "bracket-pulse 2.2s ease-in-out infinite" }}
              />
            ))}

            {/* shopper glyph */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="52" height="88" viewBox="0 0 52 88" fill="none">
                <circle cx="26" cy="16" r="13" stroke="#22D3EE" strokeWidth="2" />
                <path
                  d="M8 86 L8 52 Q8 38 26 38 Q44 38 44 52 L44 86"
                  stroke="#22D3EE"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* cycling tracking label */}
            <div className="absolute bottom-3 left-3 right-3">
              <div
                key={labelIndex}
                className="track-label mono-font text-[10px] text-[#22D3EE] bg-[#0B0F19]/80 px-2 py-1 rounded border border-[#1E293B] inline-block"
                style={{ animation: "fade-cycle 3s ease-in-out" }}
                onAnimationEnd={() => setLabelIndex((i) => (i + 1) % TRACKING_LABELS.length)}
              >
                {TRACKING_LABELS[labelIndex]}
              </div>
            </div>
          </div>

          <p className="body-font text-sm text-[#64748B] text-center max-w-xs">
            Real-time gaze, dwell, and traffic signal from your existing
            store cameras.
          </p>
        </div>
      </div>

      {/* Right panel — the actual form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="mono-font text-[11px] tracking-[0.25em] text-[#64748B] uppercase mb-1">
              Consumer Attention Mapping
            </p>
          </div>

          {/* segmented mode switcher */}
          <div className="flex rounded-lg border border-[#1E293B] bg-[#0F1523] p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "flex-1 cam-font text-sm font-medium py-2 rounded-md transition-colors " +
                  (mode === m
                    ? "bg-[#22D3EE] text-[#0B0F19]"
                    : "text-[#64748B] hover:text-[#E2E8F0]")
                }
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <h2 className="cam-font text-xl font-semibold text-[#E2E8F0] mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="body-font text-sm text-[#64748B] mb-6">
            {mode === "login"
              ? "Sign in to view your store's attention data."
              : "Set up access for your role."}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mono-font text-[11px] tracking-wide text-[#64748B] uppercase block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="body-font w-full h-11 rounded-md bg-[#0F1523] border border-[#1E293B] px-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors"
              />
            </div>

            <div>
              <label className="mono-font text-[11px] tracking-wide text-[#64748B] uppercase block mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="body-font w-full h-11 rounded-md bg-[#0F1523] border border-[#1E293B] px-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors"
              />
            </div>

            {mode === "login" && (
              <a
                href="/forgot-password"
                className="body-font text-sm text-[#64748B] hover:text-[#22D3EE] transition-colors -mt-1"
              >
                Forgot password?
              </a>
            )}

            {mode === "register" && (
              <div>
                <label className="mono-font text-[11px] tracking-wide text-[#64748B] uppercase block mb-1.5">
                  Role
                </label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="body-font w-full h-11 rounded-md bg-[#0F1523] border border-[#1E293B] px-3 text-sm text-[#E2E8F0] outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-colors"
                >
                  <option value="StoreManager">Store Manager</option>
                  <option value="Analyst">Analyst</option>
                  <option value="SuperAdmin">Super Admin</option>
                </select>
              </div>
            )}

            {error && (
              <p className="body-font text-sm text-[#F87171]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cam-font mt-2 h-11 rounded-md bg-[#22D3EE] text-[#0B0F19] text-sm font-semibold hover:bg-[#67E3F4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
