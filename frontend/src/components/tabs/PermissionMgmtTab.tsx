"use client";
import React, { useEffect, useState } from 'react';

interface ResourceEntry { resource: string; roles: string[]; }

const ALL_ROLES = ['Store Manager', 'Retail Analyst', 'Marketing Manager', 'Administrator'];

export default function PermissionMgmtTab() {
  const [matrix, setMatrix] = useState<ResourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/backend/v1/admin/permission-matrix', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 403) throw new Error("This screen is Administrator-only.");
        if (!res.ok) throw new Error(`Request failed (${res.status}).`);
        return res.json();
      })
      .then((json) => { if (isMounted && json.status === 'success') setMatrix(json.data || []); })
      .catch((err) => { if (isMounted) setError(err.message); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg animate-in fade-in">
      <h3 className="text-lg font-bold text-slate-200 mb-6">Permission Matrix</h3>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-rose-300">{error}</div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-xs text-emerald-300 flex items-start gap-2">
          <span>✅</span>
          <span>
            Enforced server-side — this table is fetched from the exact same list main.py&apos;s require_roles() checks
            against on every request. It can&apos;t drift from what&apos;s actually enforced, unlike a hand-maintained
            static table would.
          </span>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-center text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs">
            <tr>
              <th className="p-4 text-left">Resource</th>
              {ALL_ROLES.map((role) => <th key={role} className="p-4">{role}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-cyan-400 font-mono text-xs animate-pulse">Loading real permission matrix...</td></tr>
            ) : matrix.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-slate-500 text-xs">No protected resources found.</td></tr>
            ) : (
              matrix.map((entry, i) => (
                <tr key={i}>
                  <td className="p-4 text-left font-bold">{entry.resource}</td>
                  {ALL_ROLES.map((role) => (
                    <td key={role} className="p-4">
                      {entry.roles.includes(role) ? <span className="text-emerald-400">✔</span> : <span className="text-slate-600">✖</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-500 mt-4">
        Any resource not listed here requires only being signed in (any role) — see ADMIN_PROTECTED_RESOURCES in
        main.py for the exact same list this table renders.
      </p>
    </div>
  );
}
