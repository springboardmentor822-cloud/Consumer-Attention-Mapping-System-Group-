"use client";
import React, { useEffect, useState } from 'react';

interface RegisteredUser {
  email: string;
  role: string;
}

const roleBadge = (role: string) => {
  switch (role) {
    case 'Administrator': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'Store Manager': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    case 'Marketing Manager': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
};

export default function UsersTab() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/v1/admin/users', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.status === "success") setUsers(data.data || []);
      })
      .catch(err => console.error("Users fetch error:", err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-200">User Access Management</h3>
            <p className="text-slate-400 text-sm mt-1">Real accounts registered via the sign-up flow.</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 text-xs text-amber-300 flex items-start gap-2">
          <span>ℹ️</span>
          <span>
            The backend stores accounts in an in-memory dict (not a persistent database), so this list resets on
            server restart, and there&apos;s no real login-history tracking yet — that&apos;s why &quot;Last Login&quot; and session
            data aren&apos;t shown here. See the Active Sessions tab for the same limitation.
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Assigned Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/50">
              {loading ? (
                <tr><td colSpan={2} className="p-4 text-center text-cyan-400 font-mono text-xs animate-pulse">Loading accounts...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={2} className="p-4 text-center text-slate-500 text-xs">No registered accounts yet.</td></tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-slate-200">{u.email}</td>
                    <td className="p-4"><span className={`font-medium px-2.5 py-1 rounded-md border text-xs ${roleBadge(u.role)}`}>{u.role}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
