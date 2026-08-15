'use client';
import React, { useState } from 'react';

// Comes from the environment so this isn't hardcoded to localhost in
// staging/production builds. Set NEXT_PUBLIC_API_URL in .env.local.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // OAuth2 strictly requires form-urlencoded format, not JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Required so the browser stores/sends the httpOnly auth cookie the
        // backend sets on a successful login. Without this, the cookie is
        // dropped and the follow-up request to /api/telemetry will 401.
        credentials: 'include',
        body: formData,
      });

      // The backend no longer puts the JWT in the response body (it's set
      // as an httpOnly cookie instead, so JS never sees or stores it — that
      // keeps it safe from XSS in a way localStorage isn't). We still parse
      // the body for a status message / error detail.
      let data: { detail?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response (e.g. a proxy/502 page) — fall through to the
        // generic error message below instead of throwing here.
      }

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(data.detail || 'Authentication failed. Please try again.');
      }
    } catch{
      setError('Network error. Ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans">
      <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-400 mb-2">CAMS Security</h1>
          <p className="text-slate-400">Enterprise Retail Authentication</p>
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
              <label htmlFor="username" className="block text-slate-300 text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                placeholder="admin"
                autoComplete="username"
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
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
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
