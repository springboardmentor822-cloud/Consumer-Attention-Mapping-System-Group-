import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { canWrite } from "../utils/permissions";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import Spinner from "../components/Spinner";

function emptyFormState(fields) {
  return fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {});
}

function singular(title) {
  return title.replace(/s$/, "");
}

function describeError(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  console.error(`[ResourcePage] request failed (status=${status ?? "network"}):`, err);
  if (status === 401) return "Session expired - please log in again.";
  if (detail) return `${detail}${status ? ` (HTTP ${status})` : ""}`;
  if (status) return `${fallback} (HTTP ${status})`;
  return `${fallback} - check your network connection.`;
}

export default function ResourcePage({ title, description, api, fields, columns, linkColumn, canWrite: canWriteOverride }) {
  const { user } = useAuth();
  const writable = canWriteOverride ? canWriteOverride(user) : canWrite(user);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");

  const listQuery = useQuery({
    queryKey: ["resource", title],
    queryFn: () => api.list().then((r) => r.data),
  });

  // Memoized for the same reason as the filter below depends on it: without a
  // stable identity the `filtered` useMemo recomputed on every render.
  const items = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      columns.some((col) => String(item[col.key] ?? "").toLowerCase().includes(q)),
    );
  }, [items, search, columns]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resource", title] });

  const createMutation = useMutation({
    mutationFn: (payload) => api.create(payload),
    onSuccess: () => {
      invalidate();
      setEditingItem(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to create")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.update(id, payload),
    onSuccess: () => {
      invalidate();
      setEditingItem(null);
    },
    onError: (err) => setFormError(describeError(err, "Failed to update")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => {
      setListError("");
      invalidate();
    },
    onError: (err) => setListError(describeError(err, "Failed to delete")),
  });

  const openCreate = () => {
    setFormError("");
    setListError("");
    setEditingItem({ __isNew: true, ...emptyFormState(fields) });
  };

  const openEdit = (item) => {
    setFormError("");
    setListError("");
    setEditingItem({ ...item });
  };

  const closeForm = () => {
    setEditingItem(null);
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { __isNew, id, ...rest } = editingItem;
    const payload = { ...rest };
    for (const f of fields) {
      if (f.type === "number") {
        payload[f.name] = payload[f.name] === "" || payload[f.name] == null ? null : Number(payload[f.name]);
      }
    }
    if (__isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id, payload });
    }
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete this ${singular(title).toLowerCase()}? This can't be undone.`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
        {writable && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus size={16} /> Add {singular(title)}
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All {title}</CardTitle>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-lg border border-white/10 bg-panel py-1.5 pl-8 pr-3 text-sm text-white focus-ring"
            />
          </div>
        </CardHeader>

        {listError && (
          <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{listError}</p>
        )}

        {listQuery.isLoading ? (
          <div className="grid h-32 place-items-center">
            <Spinner label={`Loading ${title.toLowerCase()}`} />
          </div>
        ) : listQuery.isError ? (
          <p className="text-sm text-rose-400">
            {describeError(listQuery.error, `Couldn't load ${title.toLowerCase()}`)}
          </p>
        ) : !filtered.length ? (
          <p className="text-sm text-slate-500">
            {items.length ? "No results match your search." : `No ${title.toLowerCase()} yet.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  {columns.map((col) => (
                    <th key={col.key} className="px-3 py-2 font-medium">
                      {col.label}
                    </th>
                  ))}
                  {linkColumn && <th className="px-3 py-2 font-medium">{linkColumn.label}</th>}
                  {writable && <th className="px-3 py-2 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        {String(item[col.key] ?? "-")}
                      </td>
                    ))}
                    {linkColumn && <td className="px-3 py-2">{linkColumn.render(item)}</td>}
                    {writable && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeForm}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingItem.__isNew ? `Add ${singular(title)}` : `Edit ${singular(title)}`}
              </h2>
              <button onClick={closeForm} className="rounded p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      value={editingItem[field.name] ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, [field.name]: e.target.value })}
                      required={field.required}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      step={field.step}
                      value={editingItem[field.name] ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, [field.name]: e.target.value })}
                      required={field.required}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-ring"
                    />
                  )}
                </div>
              ))}

              {formError && <p className="text-sm text-rose-400">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem.__isNew ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
