import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { storesApi } from "../api/resources";
import type { Store } from "../types";
import { Button, Field, Input, Reticle } from "../components/ui";

export function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "",
    floor_width_m: "",
    floor_height_m: "",
  });

  function refresh() {
    setLoading(true);
    storesApi
      .list()
      .then(setStores)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await storesApi.create({
        name: form.name,
        city: form.city || undefined,
        country: form.country || undefined,
        floor_width_m: form.floor_width_m ? Number(form.floor_width_m) : undefined,
        floor_height_m: form.floor_height_m ? Number(form.floor_height_m) : undefined,
      });
      setForm({ name: "", city: "", country: "", floor_width_m: "", floor_height_m: "" });
      setShowForm(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create store.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Store profiles</h1>
          <p className="text-xs text-text-muted font-mono">{stores.length} registered</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New store"}
        </Button>
      </div>

      <div className="p-8 max-w-4xl">
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 bg-panel border border-hairline rounded-lg p-6 blueprint-grid-fine"
          >
            <h2 className="font-display font-semibold mb-4">New store profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Store name">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Downtown Flagship"
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </Field>
              <Field label="Country">
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </Field>
              <div />
              <Field label="Floor width (m)" hint="Used to scale shelf coordinates & heatmaps.">
                <Input
                  type="number"
                  step="0.1"
                  value={form.floor_width_m}
                  onChange={(e) => setForm({ ...form, floor_width_m: e.target.value })}
                />
              </Field>
              <Field label="Floor height (m)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.floor_height_m}
                  onChange={(e) => setForm({ ...form, floor_height_m: e.target.value })}
                />
              </Field>
            </div>

            {error && <p className="text-sm text-critical mt-4">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-5">
              {submitting ? "Saving…" : "Save store"}
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : stores.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-panel border border-hairline rounded-lg p-5 hover:border-signal/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold">{store.name}</h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      {[store.city, store.country].filter(Boolean).join(", ") || "No location set"}
                    </p>
                  </div>
                  <Reticle className="h-4 w-4 text-text-muted shrink-0" />
                </div>
                <div className="mt-4 pt-4 border-t border-hairline flex gap-4 font-mono text-xs text-text-muted">
                  <span>ID {store.id}</span>
                  {store.floor_width_m && store.floor_height_m && (
                    <span>
                      {store.floor_width_m}m × {store.floor_height_m}m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-dashed border-hairline rounded-lg p-12 text-center">
      <Reticle className="h-6 w-6 text-text-muted mx-auto mb-3" />
      <p className="text-text-primary font-medium">No stores yet</p>
      <p className="text-sm text-text-muted mt-1 mb-4">
        Register your first store to start linking cameras and shelves.
      </p>
      <Button variant="ghost" onClick={onAdd}>
        + New store
      </Button>
    </div>
  );
}
