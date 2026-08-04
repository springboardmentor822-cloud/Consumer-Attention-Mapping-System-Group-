import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../lib/axios';
import { Search, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(2, 'Category must be specified'),
  sku: z.string().min(2, 'SKU must be specified'),
  price: z.preprocess((val) => Number(val), z.number().min(0.01, 'Price must be positive')),
  store_id: z.string().min(1, 'Please select a Store'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  store_id: string;
}

interface StoreItem {
  id: string;
  name: string;
}

export default function ProductsCRUD() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema)
  });

  const fetchData = async () => {
    try {
      const storesRes = await apiClient.get<StoreItem[]>('/api/stores/');
      setStores(storesRes.data);
      const productsRes = await apiClient.get<ProductItem[]>('/api/products/');
      setProducts(productsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, data);
      } else {
        await apiClient.post('/api/products/', data);
      }
      setModalOpen(false);
      setEditingProduct(null);
      reset();
      fetchData();
    } catch (err) {
      alert("Error saving product record");
    }
  };

  const handleEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setValue('name', product.name);
    setValue('category', product.category);
    setValue('sku', product.sku);
    setValue('price', product.price);
    setValue('store_id', product.store_id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.delete(`/api/products/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#121218] border border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-200">Retail SKU Catalog</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Manage product profiles, categories, pricing, and stock locations</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); reset(); setModalOpen(true); }}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add SKU Item</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
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
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4 text-center">Unit Price ($)</th>
                <th className="py-3 px-4">Store Location</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const store = stores.find(st => st.id === p.store_id);
                return (
                  <tr key={p.id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 font-bold text-slate-200">{p.name}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-400">{p.category}</span></td>
                    <td className="py-3 px-4 font-mono">{p.sku}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-200">${p.price.toFixed(2)}</td>
                    <td className="py-3 px-4">{store ? store.name : 'Unknown Store'}</td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button onClick={() => handleEdit(p)} className="p-1 hover:text-indigo-400 text-slate-500 transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-rose-455 text-slate-500 transition"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="text-sm font-bold text-white">{editingProduct ? 'Edit SKU Item' : 'Create SKU Item'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Product Name</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Potato Chips"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.name && <span className="text-[10px] text-rose-500">{errors.name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Category</label>
                <input
                  type="text"
                  {...register('category')}
                  placeholder="e.g. Snacks"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.category && <span className="text-[10px] text-rose-500">{errors.category.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">SKU Code</label>
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="e.g. SKU-9827"
                  className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {errors.sku && <span className="text-[10px] text-rose-500">{errors.sku.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price')}
                    placeholder="2.99"
                    className="w-full bg-[#1b1b24] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {errors.price && <span className="text-[10px] text-rose-500">{errors.price.message}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Store Location</label>
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
                Save Product Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
