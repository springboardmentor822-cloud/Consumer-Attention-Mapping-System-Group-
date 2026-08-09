import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { storesApi } from "../../api/resources";
import { useProductAnalysis } from "../../hooks/useAnalyticsDashboard";
import type { ProductStockItem } from "../../api/analyticsDashboard";

const CHART_TOOLTIP_STYLE = {
  background: "#111827",
  border: "1px solid #263244",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
};

interface StoreOption {
  id: number;
  store_name: string;
}

function ProductTable({ items, emptyMessage }: { items: ProductStockItem[]; emptyMessage: string }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="px-3 py-2 font-medium">SKU</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Shelf</th>
            <th className="px-3 py-2 text-right font-medium">Stock</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.product_id} className="border-b border-white/5 text-slate-300 hover:bg-white/5">
              <td className="px-3 py-2 font-medium text-white">{p.product_name}</td>
              <td className="px-3 py-2 text-slate-500">{p.sku}</td>
              <td className="px-3 py-2">{p.category}</td>
              <td className="px-3 py-2">{p.shelf_name}</td>
              <td className="px-3 py-2 text-right">{p.stock_quantity}</td>
              <td className="px-3 py-2 text-right">₹{p.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductAnalysisPage() {
  const storesQuery = useQuery({
    queryKey: ["stores", "picker"],
    queryFn: () => storesApi.list().then((r) => r.data as StoreOption[]),
  });
  const [storeId, setStoreId] = useState<number | undefined>(undefined);
  const analysis = useProductAnalysis(storeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Analysis</h1>
          <p className="text-sm text-slate-400">Real stock and pricing data - no sales/demand data exists yet</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Store:</label>
          <select
            value={storeId ?? ""}
            onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-white/10 bg-panel px-3 py-2 text-sm text-white focus-ring"
          >
            <option value="">All Stores</option>
            {storesQuery.data?.map((store) => (
              <option key={store.id} value={store.id}>
                {store.store_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Summary</CardTitle>
          <span className="text-xs text-slate-500">Inventory value by category (price x stock)</span>
        </CardHeader>
        {analysis.isLoading ? (
          <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        ) : !analysis.data?.categories.length ? (
          <p className="text-sm text-slate-500">No products yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.data.categories} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263244" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={12} width={110} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: unknown) => `₹${Number(v as number).toLocaleString()}`}
                />
                <Bar dataKey="inventory_value" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Highest Stock</CardTitle>
            <ArrowUp size={16} className="text-emerald-400" />
          </CardHeader>
          {analysis.isLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <ProductTable items={analysis.data?.highest_stock ?? []} emptyMessage="No products yet." />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lowest Stock</CardTitle>
            <ArrowDown size={16} className="text-rose-400" />
          </CardHeader>
          {analysis.isLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <ProductTable items={analysis.data?.lowest_stock ?? []} emptyMessage="No products yet." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products to Restock</CardTitle>
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle size={14} /> Below 10 units
          </span>
        </CardHeader>
        {analysis.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-white/5" />
        ) : (
          <ProductTable items={analysis.data?.to_restock ?? []} emptyMessage="Nothing needs restocking right now." />
        )}
      </Card>
    </div>
  );
}
