import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Package, Search, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const ProductsView: React.FC = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  
  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', category: 'Beverages', price: 0, shelf_id: 'SHELF-01', position_on_shelf: 'EYE_LEVEL'
  });

  const loadProducts = () => {
    api.getProducts().then((res) => setProducts(res));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        ...newProduct,
        price: Number(newProduct.price)
      });
      setShowAddModal(false);
      setNewProduct({ sku: '', name: '', category: 'Beverages', price: 0, shelf_id: 'SHELF-01', position_on_shelf: 'EYE_LEVEL' });
      loadProducts();
    } catch (err) {
      console.error("Failed to create product", err);
      alert("Failed to add product. Ensure SKU is unique.");
    }
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const canAddProduct = user?.role === 'ADMINISTRATOR' || user?.role === 'STORE_MANAGER';

  return (
    <div className="space-y-6 relative">
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-white">Product SKU Catalog & Planogram Shelves</h2>
          <p className="text-xs text-slate-400">Inventory SKU lookup, prices, categories, and shelf assignments</p>
        </div>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search Product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white text-[#0f172a] font-bold text-xs px-3.5 py-2 rounded-xl focus:outline-none border-2 border-slate-300 w-64 shadow-sm"
          />
          {canAddProduct && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
        </div>
      </div>

      <div className="bi-card">
        <div className="bi-card-header">
          <h3 className="font-bold text-sm text-white">Catalog SKUs ({filtered.length} Items)</h3>
        </div>
        <div className="bi-card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e293b] text-slate-300 font-bold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Shelf ID</th>
                <th className="px-4 py-3">Shelf Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{p.sku}</td>
                  <td className="px-4 py-3 text-white font-bold">{p.name}</td>
                  <td className="px-4 py-3 text-slate-300">{p.category}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">${p.price}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{p.shelf_id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      {p.position_on_shelf}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" /> Add New Product
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4 text-sm font-medium text-slate-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs text-slate-400">SKU</label>
                  <input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="SKU-100" />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-slate-400">Price ($)</label>
                  <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs text-slate-400">Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="E.g., Organic Whole Milk" />
              </div>

              <div>
                <label className="block mb-1 text-xs text-slate-400">Category</label>
                <input required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Dairy" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs text-slate-400">Shelf ID</label>
                  <input required value={newProduct.shelf_id} onChange={e => setNewProduct({...newProduct, shelf_id: e.target.value})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="SHELF-01" />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-slate-400">Position Level</label>
                  <select value={newProduct.position_on_shelf} onChange={e => setNewProduct({...newProduct, position_on_shelf: e.target.value})} className="w-full bg-[#1e293b] border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                    <option value="EYE_LEVEL">Eye Level</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="BOTTOM">Bottom</option>
                    <option value="TOP">Top</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
