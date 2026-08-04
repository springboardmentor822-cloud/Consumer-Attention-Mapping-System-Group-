import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface PageProps {
  storeId: string;
  token: string | null;
}

const shoppingBehaviorData = [
  { category: 'Electronics', Visited: 8500, Interacted: 4800, Purchased: 2400 },
  { category: 'Apparel', Visited: 7200, Interacted: 5200, Purchased: 1800 },
  { category: 'Home & Living', Visited: 6800, Interacted: 4100, Purchased: 1200 },
  { category: 'Personal Care', Visited: 5400, Interacted: 4400, Purchased: 2100 },
  { category: 'Groceries', Visited: 9200, Interacted: 6100, Purchased: 4800 }
];

const productMetricsTable = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', views: '4,521', interactions: '2,845', rate: '24.3%', dwell: '34.6s', revenue: '₹ 2.48L' },
  { id: 2, name: "Men's Casual Shirt", category: 'Apparel', views: '3,897', interactions: '2,134', rate: '18.7%', dwell: '26.2s', revenue: '₹ 1.86L' },
  { id: 3, name: 'Aroma Diffuser', category: 'Home & Living', views: '3,201', interactions: '1,874', rate: '21.6%', dwell: '31.8s', revenue: '₹ 1.24L' },
  { id: 4, name: 'Face Moisturizer', category: 'Personal Care', views: '2,987', interactions: '1,623', rate: '19.4%', dwell: '24.7s', revenue: '₹ 0.98L' },
  { id: 5, name: 'Running Shoes', category: 'Footwear', views: '2,654', interactions: '1,453', rate: '17.9%', dwell: '29.3s', revenue: '₹ 1.35L' }
];

export default function ShoppingBehaviour({ storeId, token }: PageProps) {
  return (
    <div className="space-y-6 text-slate-100">
      {/* Behavior Bar Chart */}
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Shopping Behaviour</span>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shoppingBehaviorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2d" />
              <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} />
              <YAxis stroke="#94a3b8" fontSize={9} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="Visited" fill="#3b82f6" />
              <Bar dataKey="Interacted" fill="#10b981" />
              <Bar dataKey="Purchased" fill="#818cf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-[#0c0c14] border border-slate-850 rounded-xl p-5 shadow-lg space-y-4">
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">Top Performing Products</span>
        <div className="overflow-x-auto text-xs font-semibold text-slate-350">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-[8px] uppercase tracking-wider pb-2">
                <th className="pb-2">Product Name</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-center">Views</th>
                <th className="pb-2 text-center">Interactions</th>
                <th className="pb-2 text-center">Purchase Rate</th>
                <th className="pb-2 text-center">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {productMetricsTable.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 text-slate-200">{p.name}</td>
                  <td className="py-2.5 text-slate-450">{p.category}</td>
                  <td className="py-2.5 text-center">{p.views}</td>
                  <td className="py-2.5 text-center text-indigo-400">{p.interactions}</td>
                  <td className="py-2.5 text-center text-emerald-450">{p.rate}</td>
                  <td className="py-2.5 text-center text-slate-300 font-bold">{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
