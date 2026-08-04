import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Search, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const shelfSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  store_id: z.string().min(1, 'Please select a Store'),
  zone_id: z.string().min(1, 'Please select a Zone'),
});

type ShelfFormValues = z.infer<typeof shelfSchema>;

interface ShelfItem {
  id: string;
  name: string;
  store_id: string;
  zone_id: string;
}

interface StoreItem {
  id: string;
  name: string;
}

interface ZoneItem {
  id: string;
  name: string;
}

export default function ShelvesCRUD() {
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<ShelfItem | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ShelfFormValues>({
    resolver: zodResolver(shelfSchema)
  });

  const fetchData = async () => {
    try {
      const storesRes = await apiClient.get<StoreItem[]>('/api/stores/');
      setStores(storesRes.data);
      const zonesRes = await apiClient.get<ZoneItem[]>('/api/zones/');
      setZones(zonesRes.data);
      const shelvesRes = await apiClient.get<ShelfItem[]>('/api/shelves/');
      setShelves(shelvesRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ShelfFormValues) => {
    try {
      if (editingShelf) {
        await apiClient.put(`/api/shelves/${editingShelf.id}`, data);
      } else {
        await apiClient.post('/api/shelves/', data);
      }
      setModalOpen(false);
      setEditingShelf(null);
      reset();
      fetchData();
    } catch (err) {
      alert("Error saving shelf configuration");
    }
  };

  const handleEdit = (shelf: ShelfItem) => {
    setEditingShelf(shelf);
    setValue('name', shelf.name);
    setValue('store_id', shelf.store_id);
    setValue('zone_id', shelf.zone_id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shelf?")) return;
    try {
      await apiClient.delete(`/api/shelves/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting shelf");
    }
  };

  const filteredShelves = shelves.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Aisle Shelf Mappings</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Configure physical coordinate boundaries for gaze ray intersections</p>
        </div>
        <button
          onClick={() => { setEditingShelf(null); reset(); setModalOpen(true); }}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shelf Profile</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search shelves by name..."
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
                <th className="py-3 px-4">Shelf Name</th>
                <th className="py-3 px-4">Associated Store</th>
                <th className="py-3 px-4">Zone Target</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredShelves.map((s) => {
                const store = stores.find(st => st.id === s.store_id);
                const zone = zones.find(z => z.id === s.zone_id);
                return (
                  <tr key={s.id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 font-bold text-slate-200">{s.name}</td>
                    <td className="py-3 px-4">{store ? store.name : 'Unknown Store'}</td>
                    <td className="py-3 px-4">{zone ? zone.name : 'Unknown Zone'}</td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button onClick={() => handleEdit(s)} className="p-1 hover:text-indigo-400 text-slate-500 transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 hover:text-rose-455 text-slate-500 transition"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="text-sm font-bold text-white">{editingShelf ? 'Edit Shelf Profile' : 'Create Shelf Profile'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Shelf Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Snacks Shelf A"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <span className="text-[10px] text-rose-500">{errors.name.message}</span>}
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

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Zone Target</label>
                <select
                  {...register('zone_id')}
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Select Zone...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                {errors.zone_id && <span className="text-[10px] text-rose-500">{errors.zone_id.message}</span>}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded transition"
              >
                Save Shelf Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
