import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { camerasApi, storesApi } from "../api/resources";
import type { Camera, Store } from "../types";
import { Button, Field, Input, Select, StatusPill } from "../components/ui";

const CAMERA_TYPES = [
  { value: "ip_camera", label: "IP Camera" },
  { value: "rtsp", label: "RTSP Stream" },
  { value: "cctv", label: "CCTV" },
  { value: "webcam", label: "Webcam" },
  { value: "uploaded_video", label: "Uploaded Video" },
];

export function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    store_id: "",
    name: "",
    camera_type: "ip_camera",
    stream_url: "",
  });

  function refresh() {
    setLoading(true);
    Promise.all([camerasApi.list(), storesApi.list()])
      .then(([cams, sts]) => {
        setCameras(cams);
        setStores(sts);
        if (sts.length > 0 && !form.store_id) {
          setForm((f) => ({ ...f, store_id: String(sts[0].id) }));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await camerasApi.create({
        store_id: Number(form.store_id),
        name: form.name,
        camera_type: form.camera_type,
        stream_url: form.stream_url || undefined,
      });
      setForm({ ...form, name: "", stream_url: "" });
      setShowForm(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not link camera.");
    } finally {
      setSubmitting(false);
    }
  }

  const storeName = (id: number) => stores.find((s) => s.id === id)?.name ?? `Store ${id}`;

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Camera hardware</h1>
          <p className="text-xs text-text-muted font-mono">{cameras.length} linked</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} disabled={stores.length === 0}>
          {showForm ? "Cancel" : "+ Link camera"}
        </Button>
      </div>

      <div className="p-8 max-w-4xl">
        {stores.length === 0 && !loading && (
          <p className="text-sm text-text-muted mb-6 border border-hairline rounded-md px-4 py-3">
            Register a store first before linking camera hardware.
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 bg-panel border border-hairline rounded-lg p-6 blueprint-grid-fine"
          >
            <h2 className="font-display font-semibold mb-4">Link new camera</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Store">
                <Select
                  value={form.store_id}
                  onChange={(e) => setForm({ ...form, store_id: e.target.value })}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Camera name">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Aisle 3 Overhead"
                />
              </Field>
              <Field label="Camera type">
                <Select
                  value={form.camera_type}
                  onChange={(e) => setForm({ ...form, camera_type: e.target.value })}
                >
                  {CAMERA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Stream URL" hint="RTSP/IP address, or blank for local webcam.">
                <Input
                  value={form.stream_url}
                  onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
                  placeholder="rtsp://192.168.1.50:554/stream1"
                  className="font-mono text-xs"
                />
              </Field>
            </div>

            {error && <p className="text-sm text-critical mt-4">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-5">
              {submitting ? "Linking…" : "Link camera"}
            </Button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-text-muted font-mono">Loading…</p>
        ) : cameras.length === 0 ? (
          <p className="text-sm text-text-muted">No cameras linked yet.</p>
        ) : (
          <div className="border border-hairline rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-panel border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Camera</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((cam) => (
                  <tr key={cam.id} className="border-b border-hairline last:border-0 bg-panel/40">
                    <td className="px-4 py-3">{cam.name}</td>
                    <td className="px-4 py-3 text-text-muted">{storeName(cam.store_id)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {CAMERA_TYPES.find((t) => t.value === cam.camera_type)?.label ?? cam.camera_type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={cam.status} />
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
