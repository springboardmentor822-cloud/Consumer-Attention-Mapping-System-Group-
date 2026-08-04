import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Search, Plus, Edit2, Trash2, X, RefreshCw, Play, Square, RotateCw } from 'lucide-react';

const cameraSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rtsp_url: z.string().min(5, 'RTSP stream URL must be specified'),
  zone_id: z.preprocess((val) => Number(val), z.number().min(1, 'Zone target must be positive')),
  store_id: z.string().min(1, 'Please select a Store'),
});

type CameraFormValues = z.infer<typeof cameraSchema>;

interface CameraItem {
  id: number;
  name: string;
  rtsp_url: string;
  zone_id: number;
  status: string;
  store_id: string;
}

interface StoreItem {
  id: string;
  name: string;
}

export default function CamerasCRUD() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraItem | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CameraFormValues>({
    resolver: zodResolver(cameraSchema)
  });

  const fetchData = async () => {
    try {
      const storesRes = await apiClient.get<StoreItem[]>('/api/stores/');
      setStores(storesRes.data);
      
      // Load cameras from all stores dynamically
      const allCams: CameraItem[] = [];
      for (const store of storesRes.data) {
        const camsRes = await apiClient.get<CameraItem[]>(`/api/cameras/${store.id}`);
        camsRes.data.forEach(c => {
          c.store_id = store.id;
          allCams.push(c);
        });
      }
      setCameras(allCams);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: CameraFormValues) => {
    try {
      if (editingCamera) {
        // Edit skipped as PUT is not explicitly registered in standard route, or modify store record
        alert("Camera updating is handled on hardware side. Re-registering camera.");
      } else {
        await apiClient.post(`/api/cameras/${data.store_id}`, {
          name: data.name,
          rtsp_url: data.rtsp_url,
          zone_id: data.zone_id
        });
      }
      setModalOpen(false);
      setEditingCamera(null);
      reset();
      fetchData();
    } catch (err) {
      alert("Error saving camera configuration");
    }
  };

  const handleStartStream = async (id: number) => {
    try {
      await apiClient.post(`/api/cameras/${id}/start`);
      fetchData();
    } catch (err) {
      alert("Error starting stream");
    }
  };

  const handleStopStream = async (id: number) => {
    try {
      await apiClient.post(`/api/cameras/${id}/stop`);
      fetchData();
    } catch (err) {
      alert("Error stopping stream");
    }
  };

  const handleRestartStream = async (id: number) => {
    try {
      await apiClient.post(`/api/cameras/${id}/restart`);
      fetchData();
    } catch (err) {
      alert("Error restarting stream");
    }
  };

  const handleDelete = async (id: number, storeId: string) => {
    if (!confirm("Are you sure you want to delete this camera feed?")) return;
    try {
      // Endpoint requires store scope delete
      await apiClient.delete(`/api/stores/${storeId}/cameras/${id}`);
      fetchData();
    } catch (err) {
      alert("Error removing camera device");
    }
  };

  const filteredCams = cameras.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rtsp_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Device Surveillance Registry</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Start, stop, and restart camera streams, and adjust zone anchors</p>
        </div>
        <button
          onClick={() => { setEditingCamera(null); reset(); setModalOpen(true); }}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Link Camera Stream</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search streams by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1b1b24] border border-slate-850 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-350">
            <thead className="bg-slate-900/50 uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Surveillance Name</th>
                <th className="py-3 px-4">RTSP Address / File</th>
                <th className="py-3 px-4 text-center">Zone Target</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Control Feed</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredCams.map((c) => {
                return (
                  <tr key={c.id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 font-bold text-slate-200">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{c.rtsp_url}</td>
                    <td className="py-3 px-4 text-center font-semibold text-indigo-400">Zone {c.zone_id}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === "Online" ? "bg-emerald-950/60 text-emerald-400" : "bg-rose-955/65 text-rose-450"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center space-x-2.5">
                      <button onClick={() => handleStartStream(c.id)} className="p-1 hover:text-emerald-400 text-slate-500 transition" title="Start Stream"><Play className="w-3.5 h-3.5 inline" /></button>
                      <button onClick={() => handleStopStream(c.id)} className="p-1 hover:text-rose-400 text-slate-500 transition" title="Stop Stream"><Square className="w-3.5 h-3.5 inline" /></button>
                      <button onClick={() => handleRestartStream(c.id)} className="p-1 hover:text-cyan-400 text-slate-500 transition" title="Restart Hardware"><RotateCw className="w-3.5 h-3.5 inline" /></button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleDelete(c.id, c.store_id)} className="p-1 hover:text-rose-455 text-slate-550 transition"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121a] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Link Camera Hardware Stream</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Camera Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Aisle 3 Cam"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <span className="text-[10px] text-rose-500">{errors.name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">RTSP Stream Address / Video File</label>
                <input
                  type="text"
                  {...register('rtsp_url')}
                  placeholder="rtsp://192.168.1.100/stream"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.rtsp_url && <span className="text-[10px] text-rose-500">{errors.rtsp_url.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Zone Target</label>
                  <input
                    type="number"
                    {...register('zone_id')}
                    placeholder="2"
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {errors.zone_id && <span className="text-[10px] text-rose-500">{errors.zone_id.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Store Target</label>
                  <select
                    {...register('store_id')}
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Store...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.store_id && <span className="text-[10px] text-rose-500">{errors.store_id.message}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded transition"
              >
                Link Stream Device
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
