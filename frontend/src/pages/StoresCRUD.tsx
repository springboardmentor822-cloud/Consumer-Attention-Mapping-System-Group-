import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Search, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const storeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  width: z.preprocess((val) => Number(val), z.number().min(1, 'Width must be positive')),
  height: z.preprocess((val) => Number(val), z.number().min(1, 'Height must be positive')),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreItem {
  id: string;
  name: string;
  code: string;
  address: string;
  width: number;
  height: number;
}

export default function StoresCRUD() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema)
  });

  const fetchStores = async () => {
    try {
      const res = await apiClient.get<StoreItem[]>('/api/stores/');
      setStores(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const onSubmit = async (data: StoreFormValues) => {
    try {
      if (editingStore) {
        await apiClient.put(`/api/stores/${editingStore.id}`, data);
      } else {
        await apiClient.post('/api/stores/', data);
      }
      setModalOpen(false);
      setEditingStore(null);
      reset();
      fetchStores();
    } catch (err) {
      alert("Error saving store record");
    }
  };

  const handleEdit = (store: StoreItem) => {
    setEditingStore(store);
    setValue('name', store.name);
    setValue('code', store.code);
    setValue('address', store.address);
    setValue('width', store.width);
    setValue('height', store.height);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return;
    try {
      await apiClient.delete(`/api/stores/${id}`);
      fetchStores();
    } catch (err) {
      alert("Error deleting store");
    }
  };

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Store Profile Nodes</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Store Layouts & Physical Boundaries</p>
        </div>
        <button
          onClick={() => { setEditingStore(null); reset(); setModalOpen(true); }}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Store Profile</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stores by name or code..."
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
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Width (m)</th>
                <th className="py-3 px-4 text-center">Height (m)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStores.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/30">
                  <td className="py-3 px-4 font-bold text-slate-200">{s.name}</td>
                  <td className="py-3 px-4 font-mono">{s.code}</td>
                  <td className="py-3 px-4">{s.address}</td>
                  <td className="py-3 px-4 text-center">{s.width}</td>
                  <td className="py-3 px-4 text-center">{s.height}</td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button onClick={() => handleEdit(s)} className="p-1 hover:text-indigo-400 text-slate-500 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1 hover:text-rose-450 text-slate-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#12121a] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">{editingStore ? 'Edit Store Profile' : 'Create Store Profile'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Store Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Flagship Store"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <span className="text-[10px] text-rose-500">{errors.name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Unique Code</label>
                <input
                  type="text"
                  {...register('code')}
                  placeholder="e.g. FLAG-01"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.code && <span className="text-[10px] text-rose-500">{errors.code.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="e.g. 100 Broadway, NY"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.address && <span className="text-[10px] text-rose-500">{errors.address.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Width (meters)</label>
                  <input
                    type="number"
                    step="any"
                    {...register('width')}
                    placeholder="15.0"
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {errors.width && <span className="text-[10px] text-rose-500">{errors.width.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Height (meters)</label>
                  <input
                    type="number"
                    step="any"
                    {...register('height')}
                    placeholder="20.0"
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {errors.height && <span className="text-[10px] text-rose-500">{errors.height.message}</span>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-2.5 rounded transition"
              >
                Save Store Layout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
