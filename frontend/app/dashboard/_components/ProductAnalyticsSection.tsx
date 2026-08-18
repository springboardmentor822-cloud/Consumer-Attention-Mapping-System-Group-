"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, ProductInteractionEntry } from "@/lib/api";

type Props = {
  storeId: string;
  cameraId: string;
};

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

function ProductRow({ product, rank }: { product: ProductInteractionEntry; rank: number }) {
  const shelves = product.shelves.map((s) => s.shelf_name).join(", ") || "—";
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-3 font-medium">{rank}</td>
      <td className="px-3 py-3">{product.product_name}</td>
      <td className="px-3 py-3 text-muted-foreground">{shelves}</td>
      <td className="px-3 py-3">{product.observed_track_count}</td>
      <td className="px-3 py-3">{product.observation_count}</td>
      <td className="px-3 py-3">{formatSeconds(product.estimated_visible_seconds)}</td>
      <td className="px-3 py-3">
        <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
          Visibility only
        </span>
      </td>
    </tr>
  );
}

export default function ProductAnalyticsSection({ storeId, cameraId }: Props) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getProductInteractions>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getProductInteractions(storeId, cameraId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load product analytics.");
    } finally {
      setLoading(false);
    }
  }, [storeId, cameraId]);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(() => data?.products ?? [], [data]);
  const topProducts = products.slice(0, 10);

  return (
    <section id="product-analytics" className="scroll-mt-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Product Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Product-level visibility derived from the existing product tracking pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="rounded-lg border border-border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Tracked products</p>
            <p className="mt-1 text-xl font-semibold">{products.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Product observations</p>
            <p className="mt-1 text-xl font-semibold">
              {products.reduce((sum, p) => sum + p.observation_count, 0)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Visibility status</p>
            <p className="mt-1 text-sm font-medium">Real tracking signal</p>
          </div>
          <div>
            <p className="text-muted-foreground">Interaction events</p>
            <p className="mt-1 text-sm font-medium">CV placeholder</p>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">Loading product analytics…</p>
      ) : topProducts.length ? (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Shelf</th>
                <th className="px-3 py-3">Tracks</th>
                <th className="px-3 py-3">Observations</th>
                <th className="px-3 py-3">Visible time</th>
                <th className="px-3 py-3">Interaction quality</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <ProductRow key={`${product.product_name}-${index}`} product={product} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
          No product-level tracking observations are available for this camera yet.
        </div>
      )}

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Data-quality disclosure</p>
        <p className="mt-1 text-muted-foreground">
          Product visibility is real and comes from product tracking observations mapped to shelf
          camera views. Pickup, return, comparison and purchase are intentionally not inferred from
          products appearing or disappearing in a frame. Those require dedicated person-product
          interaction detection and, for purchase, a transaction source.
        </p>
      </div>
    </section>
  );
}
