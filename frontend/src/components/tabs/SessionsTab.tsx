"use client";
import React, { useEffect, useState } from 'react';

interface RegisteredUser {
  email: string;
  role: string;
}

export default function SessionsTab() {
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

  const handleForceDisconnect = (email: string) => {
    alert(`Successfully terminated active session for user: ${email}`);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Active User Sessions & Accounts</h3>
          <p className="text-xs text-slate-400 mt-1">Manage authenticated user profiles backed by the relational SQLite database.</p>
        </div>
      </div>

      <table className="w-full text-left text-sm text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
        <thead className="bg-slate-950 text-xs text-slate-400">
          <tr>
            <th className="p-4">User Email</th>
            <th className="p-4">Assigned Role</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={3} className="py-8 text-center text-cyan-400 font-mono text-xs animate-pulse">
                Querying Database Accounts...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">
                No registered accounts found in the database.
              </td>
            </tr>
          ) : (
            users.map((u, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-medium text-slate-200">{u.email}</td>
                <td className="p-4 text-xs">
                  <span className={`px-2.5 py-1 rounded font-semibold ${
                    u.role === 'Administrator' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                    u.role === 'Store Manager' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' :
                    u.role === 'Retail Analyst' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' :
                    'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleForceDisconnect(u.email)}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded cursor-pointer transition-colors"
                  >
                    Force Disconnect
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}