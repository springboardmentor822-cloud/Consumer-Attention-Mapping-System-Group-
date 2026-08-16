import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { productsApi, shelvesApi, storesApi } from "../api/resources";
import type { Product, Shelf, ShelfLevel, Store } from "../types";
import { Button, Field, Input, Select } from "../components/ui";

export function CatalogPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showShelfForm, setShowShelfForm] = useState(false);
  const [shelfForm, setShelfForm] = useState<{ name: string; aisle: string; shelf_level: ShelfLevel }>({
    name: "",
    aisle: "",
    shelf_level: "middle",
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ sku: "", name: "", brand: "", price: "", shelf_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    storesApi.list().then((s) => {
      setStores(s);
      if (s.length > 0) setStoreId(s[0].id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (storeId === null) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function refresh() {
    if (storeId === null) return;
    setLoading(true);
    Promise.all([shelvesApi.list(storeId), productsApi.list()])
      .then(([sh, pr]) => {
        setShelves(sh);
        setProducts(pr.filter((p: Product) => sh.some((s: Shelf) => s.id === p.shelf_id)));
        if (sh.length > 0 && !productForm.shelf_id) {
          setProductForm((f) => ({ ...f, shelf_id: String(sh[0].id) }));
        }
      })
      .finally(() => setLoading(false));
  }

  async function handleCreateShelf(e: FormEvent) {
    e.preventDefault();
    if (storeId === null) return;
    setError(null);
    setSubmitting(true);
    try {
      await shelvesApi.create({
        store_id: storeId,
        name: shelfForm.name,
        aisle: shelfForm.aisle || undefined,
        shelf_level: shelfForm.shelf_level,
      });
      setShelfForm({ name: "", aisle: "", shelf_level: "middle" });
      setShowShelfForm(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create shelf.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProduct(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await productsApi.create({
        sku: productForm.sku,
        name: productForm.name,
        brand: productForm.brand || undefined,
        price: productForm.price ? Number(productForm.price) : undefined,
        shelf_id: productForm.shelf_id ? Number(productForm.shelf_id) : undefined,
      });
      setProductForm({ ...productForm, sku: "", name: "", brand: "", price: "" });
      setShowProductForm(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create product.");
    } finally {
      setSubmitting(false);
    }
  }

  const shelfName = (id?: number | null) => shelves.find((s) => s.id === id)?.name ?? "—";

  return (
    <AppShell>
      <div className="h-16 border-b border-hairline flex items-center justify-between px-8">
        <div>
          <h1 className="font-display text-lg font-semibold">Shelves & products</h1>
          <p className="text-xs text-text-muted font-mono">
            {shelves.length} shelves · {products.length} products
          </p>
        </div>
        {stores.length > 0 && (
          <Select value={storeId ?? ""} onChange={(e) => setStoreId(Number(e.target.value))} className="w-56">
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="p-8 max-w-5xl space-y-8">
        {stores.length === 0 ? (
          <p className="text-sm text-text-muted">Register a store first.</p>
        ) : (
          <>
            {/* Shelves */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold">Shelves</h2>
                <Button variant="ghost" onClick={() => setShowShelfForm((s) => !s)}>
                  {showShelfForm ? "Cancel" : "+ New shelf"}
                </Button>
              </div>

              {showShelfForm && (
                <form onSubmit={handleCreateShelf} className="mb-4 bg-panel border border-hairline rounded-lg p-5">
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Shelf name">
                      <Input
                        required
                        value={shelfForm.name}
                        onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
                        placeholder="Shelf A1"
                      />
                    </Field>
                    <Field label="Aisle">
                      <Input
                        value={shelfForm.aisle}
                        onChange={(e) => setShelfForm({ ...shelfForm, aisle: e.target.value })}
                        placeholder="3"
                      />
                    </Field>
                    <Field label="Vertical placement">
                      <Select
                        value={shelfForm.shelf_level}
                        onChange={(e) => setShelfForm({ ...shelfForm, shelf_level: e.target.value as ShelfLevel })}
                      >
                        <option value="bottom">Bottom</option>
                        <option value="middle">Middle</option>
                        <option value="eye_level">Eye level</option>
                        <option value="top">Top</option>
                      </Select>
                    </Field>
                  </div>
                  {error && <p className="text-sm text-critical mt-3">{error}</p>}
                  <Button type="submit" disabled={submitting} className="mt-4">
                    {submitting ? "Saving…" : "Save shelf"}
                  </Button>
                </form>
              )}

              {loading ? (
                <p className="text-sm text-text-muted font-mono">Loading…</p>
              ) : shelves.length === 0 ? (
                <p className="text-sm text-text-muted">No shelves yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {shelves.map((shelf) => (
                    <div key={shelf.id} className="bg-panel border border-hairline rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{shelf.name}</p>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded ${
                            shelf.shelf_level === "eye_level"
                              ? "bg-ok/15 text-ok"
                              : shelf.shelf_level === "bottom"
                                ? "bg-warn/15 text-warn"
                                : "bg-panel-raised text-text-muted"
                          }`}
                        >
                          {shelf.shelf_level.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono mt-1">
                        Aisle {shelf.aisle || "—"} · ID {shelf.id}
                      </p>
                      <select
                        className="mt-2 w-full text-xs bg-panel-raised border border-hairline rounded px-2 py-1 text-text-primary"
                        value={shelf.shelf_level}
                        onChange={async (e) => {
                          const shelf_level = e.target.value as ShelfLevel;
                          await shelvesApi.update(shelf.id, { shelf_level });
                          refresh();
                        }}
                      >
                        <option value="bottom">Bottom</option>
                        <option value="middle">Middle</option>
                        <option value="eye_level">Eye level</option>
                        <option value="top">Top</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Products */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold">Products</h2>
                <Button variant="ghost" onClick={() => setShowProductForm((s) => !s)} disabled={shelves.length === 0}>
                  {showProductForm ? "Cancel" : "+ New product"}
                </Button>
              </div>

              {shelves.length === 0 && <p className="text-sm text-text-muted mb-4">Add a shelf first.</p>}

              {showProductForm && (
                <form
                  onSubmit={handleCreateProduct}
                  className="mb-4 bg-panel border border-hairline rounded-lg p-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="SKU">
                      <Input
                        required
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        placeholder="SKU-1001"
                        className="font-mono text-xs"
                      />
                    </Field>
                    <Field label="Product name">
                      <Input
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      />
                    </Field>
                    <Field label="Brand">
                      <Input
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      />
                    </Field>
                    <Field label="Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </Field>
                    <Field label="Shelf">
                      <Select
                        value={productForm.shelf_id}
                        onChange={(e) => setProductForm({ ...productForm, shelf_id: e.target.value })}
                      >
                        {shelves.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  {error && <p className="text-sm text-critical mt-3">{error}</p>}
                  <Button type="submit" disabled={submitting} className="mt-4">
                    {submitting ? "Saving…" : "Save product"}
                  </Button>
                </form>
              )}

              {products.length === 0 ? (
                <p className="text-sm text-text-muted">No products yet.</p>
              ) : (
                <div className="border border-hairline rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-panel border-b border-hairline text-left font-mono text-[11px] uppercase tracking-wide text-text-muted">
                        <th className="px-4 py-3 font-medium">SKU</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Brand</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">Shelf</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-hairline last:border-0 bg-panel/40">
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">{p.sku}</td>
                          <td className="px-4 py-3">{p.name}</td>
                          <td className="px-4 py-3 text-text-muted">{p.brand || "—"}</td>
                          <td className="px-4 py-3 text-text-muted">
                            {p.price != null ? `$${p.price.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{shelfName(p.shelf_id)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
