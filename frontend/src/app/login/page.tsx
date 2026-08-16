'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Relative path -> goes through the /api/backend/* rewrite in
      // next.config.js, NOT directly to the FastAPI backend's own port.
      // That keeps this request same-origin from the browser's point of
      // view, which is required for the httpOnly `access_token` cookie the
      // backend sets to actually be readable by middleware.ts on this app's
      // origin. Calling the backend's real port directly here would still
      // "work" (the login would succeed) but the cookie would be silently
      // scoped to the backend's origin instead, invisible to this app.
      const response = await fetch('/api/backend/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });


      let data: { detail?: string; role?: string; email?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response (proxy error page, etc.) — fall through to the
        // generic error message below instead of throwing here.
      }

      if (response.ok) {
        // The backend deliberately never returns the JWT itself — it's in
        // the httpOnly cookie, invisible to this code. role/email aren't
        // secrets, so it's fine to keep them in sessionStorage purely for
        // display (e.g. a "Welcome, Store Manager" header on the dashboard).
        // This is NOT the auth token — losing it doesn't compromise anything,
        // it just means the UI re-fetches or shows a generic greeting.
        if (data.role) sessionStorage.setItem('vr_role', data.role);
        if (data.email) sessionStorage.setItem('vr_email', data.email);

        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(data.detail || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans">
      <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-400 mb-2">VisionRetail AI</h1>
          <p className="text-slate-400">Consumer Attention Mapping System</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 text-sm text-center font-bold">
            Authentication Successful. Redirecting to Dashboard...
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                placeholder="manager@visionretail.ai"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center disabled:opacity-60"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Protected by JSON Web Tokens (JWT) & OAuth2
          </p>
        </div>
      </div>
    </div>
  );
}
