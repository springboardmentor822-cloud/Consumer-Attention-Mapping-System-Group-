"use client";
import React, { useEffect, useState } from 'react';

interface RegisteredUser {
  email: string;
  role: string;
}

const ROLES = ['Store Manager', 'Retail Analyst', 'Marketing Manager', 'Administrator'] as const;

const roleColor: Record<string, string> = {
  'Store Manager': 'text-cyan-400',
  'Retail Analyst': 'text-purple-400',
  'Marketing Manager': 'text-emerald-400',
  'Administrator': 'text-rose-400',
};

export default function RoleMgmtTab() {
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

  const handleEditRole = (roleName: string) => {
    alert(`Role permission editing isn't wired to real backend logic yet — this would open an access-control editor for: ${roleName}`);
  };

  const countForRole = (role: string) => users.filter(u => u.role === role).length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Role Management</h3>
          <p className="text-xs text-slate-400 mt-1">Real per-role account counts, from the same registered-accounts table Users shows.</p>
        </div>
      </div>

      <table className="w-full text-left text-sm text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
        <thead className="bg-slate-950 text-slate-400">
          <tr>
            <th className="p-4">Role Name</th>
            <th className="p-4">Active Users</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {ROLES.map((role) => (
            <tr key={role} className="hover:bg-slate-800/40 transition-colors">
              <td className={`p-4 font-bold ${roleColor[role]}`}>{role}</td>
              <td className="p-4">{loading ? "…" : countForRole(role)}</td>
              <td className="p-4 text-right">
                <button
                  onClick={() => handleEditRole(role)}
                  className="text-slate-400 hover:text-cyan-400 font-semibold cursor-pointer transition-colors"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
