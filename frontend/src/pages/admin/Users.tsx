import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, Select } from "../../components/ui";
import { usersApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import type { Role, User } from "../../types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "administrator", label: "Administrator" },
  { value: "store_manager", label: "Store Manager" },
  { value: "retail_analyst", label: "Retail Analyst" },
  { value: "marketing_manager", label: "Marketing Manager" },
];

export function UsersAdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    usersApi
      .list()
      .then(setUsers)
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleRoleChange(id: number, role: string) {
    setBusyId(id);
    setError(null);
    try {
      const updated = await usersApi.updateRole(id, role);
      setUsers((rows) => rows.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError("Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusToggle(id: number, isActive: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const updated = await usersApi.updateStatus(id, isActive);
      setUsers((rows) => rows.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError("Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this user? This cannot be undone.")) return;
    setBusyId(id);
    setError(null);
    try {
      await usersApi.remove(id);
      setUsers((rows) => rows.filter((r) => r.id !== id));
    } catch {
      setError("Could not remove user.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Manage users</h1>
          <p className="text-xs text-text-muted font-mono">{users.length} accounts</p>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {error && (
          <p className="text-sm text-critical border border-critical/30 bg-critical/10 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-text-muted">No users yet.</p>
        ) : (
          <div className="bg-panel border border-hairline rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted font-mono text-[11px] uppercase tracking-wide bg-panel-raised/40">
                  <th className="px-5 py-3 font-normal">Name</th>
                  <th className="px-5 py-3 font-normal">Email</th>
                  <th className="px-5 py-3 font-normal">Role</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-hairline">
                    <td className="px-5 py-3 text-text-primary">
                      {u.full_name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-text-muted">(you)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-muted">{u.email}</td>
                    <td className="px-5 py-3">
                      <Select
                        value={u.role}
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="w-44"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={u.is_active ? "ok" : "muted"}>
                        {u.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(u.id, !u.is_active)}
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        className="text-xs text-text-muted hover:text-signal transition-colors disabled:opacity-40 mr-4"
                      >
                        {u.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={busyId === u.id || u.id === currentUser?.id}
                        className="text-xs text-text-muted hover:text-critical transition-colors disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
