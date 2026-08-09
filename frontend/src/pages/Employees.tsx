import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Pencil, Plus, Trash2, UserCheck, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { canWrite } from "../utils/permissions";
import { EMPLOYEE_ROLES, type AttendanceRecord, type Employee, type EmployeePayload, employeesApi } from "../api/employees";

function describeError(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { detail?: string } } };
  const status = e?.response?.status;
  const detail = e?.response?.data?.detail;
  if (status === 401) return "Session expired - please log in again.";
  if (detail) return `${detail}${status ? ` (HTTP ${status})` : ""}`;
  if (status) return `${fallback} (HTTP ${status})`;
  return `${fallback} - check your network connection.`;
}

function statusBadge(status: string) {
  switch (status) {
    case "Present":
      return "bg-emerald-500/15 text-emerald-300";
    case "Late":
      return "bg-amber-500/15 text-amber-300";
    case "Pending":
      return "bg-slate-500/15 text-slate-400";
    default:
      return "bg-rose-500/15 text-rose-300";
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

const emptyForm = (storeId: number): EmployeePayload => ({
  store_id: storeId,
  full_name: "",
  role: EMPLOYEE_ROLES[0],
  phone: "",
  email: "",
  shift_start: "09:00",
  shift_end: "17:00",
  is_active: true,
});

export default function Employees() {
  const { user } = useAuth();
  const writable = canWrite(user);
  const queryClient = useQueryClient();
  const storeId = user?.store_id ?? undefined;

  const [editing, setEditing] = useState<(EmployeePayload & { id?: number }) | null>(null);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees", storeId ?? null],
    queryFn: () => employeesApi.list(storeId).then((r) => r.data),
  });
  const attendanceQuery = useQuery({
    queryKey: ["employees", "attendance", storeId ?? null],
    queryFn: () => employeesApi.attendance(storeId).then((r) => r.data),
    refetchInterval: 30000,
  });

  const attendanceByEmployee = useMemo(() => {
    const map = new Map<number, AttendanceRecord>();
    for (const record of attendanceQuery.data?.records ?? []) {
      map.set(record.employee_id, record);
    }
    return map;
  }, [attendanceQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: EmployeePayload) => employeesApi.create(payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to create employee")),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeePayload> }) => employeesApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to update employee")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: () => {
      setListError("");
      invalidate();
    },
    onError: (err) => setListError(describeError(err, "Failed to delete employee")),
  });
  const checkInMutation = useMutation({
    mutationFn: (id: number) => employeesApi.checkIn(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to check in")),
  });
  const checkOutMutation = useMutation({
    mutationFn: (id: number) => employeesApi.checkOut(id),
    onSuccess: invalidate,
    onError: (err) => setListError(describeError(err, "Failed to check out")),
  });

  const openCreate = () => {
    setFormError("");
    setListError("");
    setEditing(emptyForm(storeId ?? 0));
  };
  const openEdit = (emp: Employee) => {
    setFormError("");
    setListError("");
    setEditing({
      id: emp.id,
      store_id: emp.store_id,
      full_name: emp.full_name,
      role: emp.role,
      phone: emp.phone ?? "",
      email: emp.email ?? "",
      shift_start: emp.shift_start.slice(0, 5),
      shift_end: emp.shift_end.slice(0, 5),
      is_active: emp.is_active,
    });
  };
  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...rest } = editing;
    const payload: EmployeePayload = {
      ...rest,
      phone: rest.phone || null,
      email: rest.email || null,
    };
    if (id) {
      updateMutation.mutate({ id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (emp: Employee) => {
    if (window.confirm(`Remove ${emp.full_name}? This can't be undone.`)) {
      deleteMutation.mutate(emp.id);
    }
  };

  const employees = employeesQuery.data ?? [];
  const attendance = attendanceQuery.data;
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Monitoring</h1>
          <p className="text-sm text-slate-400">Staff, shifts, and today's attendance</p>
        </div>
        {writable && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus size={16} /> Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Present Today" value={attendance?.present_count ?? 0} icon={UserCheck} accent="emerald" loading={attendanceQuery.isLoading} />
        <KpiCard label="Late" value={attendance?.late_count ?? 0} icon={UserCheck} accent="amber" loading={attendanceQuery.isLoading} />
        <KpiCard label="Absent" value={attendance?.absent_count ?? 0} icon={UserCheck} accent="rose" loading={attendanceQuery.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>

        {listError && <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{listError}</p>}

        {employeesQuery.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label="Loading employees" />
          </div>
        ) : employeesQuery.isError ? (
          <p className="text-sm text-rose-400">{describeError(employeesQuery.error, "Couldn't load employees")}</p>
        ) : !employees.length ? (
          <p className="text-sm text-slate-500">No employees yet - add one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Shift</th>
                  <th className="px-3 py-2 font-medium">First Seen</th>
                  <th className="px-3 py-2 font-medium">Last Seen</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Working Duration</th>
                  <th className="px-3 py-2 font-medium">Check-in / out</th>
                  {writable && <th className="px-3 py-2 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const record = attendanceByEmployee.get(emp.id);
                  return (
                    <tr key={emp.id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
                      <td className="px-3 py-2 font-medium text-white">{emp.full_name}</td>
                      <td className="px-3 py-2">{emp.role}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {emp.shift_start.slice(0, 5)} - {emp.shift_end.slice(0, 5)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">{formatTime(record?.first_seen ?? null)}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">{formatTime(record?.last_seen ?? null)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(record?.status ?? "Absent")}`}>
                          {record?.status ?? "Absent"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">{formatDuration(record?.working_duration_seconds ?? null)}</td>
                      <td className="px-3 py-2">
                        {writable && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => checkInMutation.mutate(emp.id)}
                              disabled={!!record?.check_in_time}
                              className="flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 disabled:opacity-30"
                              title="Check in"
                            >
                              <LogIn size={14} />
                            </button>
                            <button
                              onClick={() => checkOutMutation.mutate(emp.id)}
                              disabled={!record?.check_in_time || !!record?.check_out_time}
                              className="flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 disabled:opacity-30"
                              title="Check out"
                            >
                              <LogOut size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      {writable && (
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(emp)} className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(emp)} className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeForm}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing.id ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={closeForm} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Full Name</label>
                <input
                  value={editing.full_name}
                  onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Role</label>
                <select
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                >
                  {EMPLOYEE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Shift Start</label>
                  <input
                    type="time"
                    value={editing.shift_start}
                    onChange={(e) => setEditing({ ...editing, shift_start: e.target.value })}
                    required
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Shift End</label>
                  <input
                    type="time"
                    value={editing.shift_end}
                    onChange={(e) => setEditing({ ...editing, shift_end: e.target.value })}
                    required
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Phone (optional)</label>
                <input
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email (optional)</label>
                <input
                  type="email"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                />
              </div>

              {formError && <p className="text-sm text-rose-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing.id ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
