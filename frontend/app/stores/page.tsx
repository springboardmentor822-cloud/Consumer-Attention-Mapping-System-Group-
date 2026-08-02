"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, Store, Shelf } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [creating, setCreating] = useState(false);

  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [newShelfName, setNewShelfName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("access_token")) {
      router.push("/login");
      return;
    }
    loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStores() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listStores();
      setStores(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load stores");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.createStore(newStoreName, newStoreLocation || undefined);
      setNewStoreName("");
      setNewStoreLocation("");
      await loadStores();
    } catch (err) {
      // 403 here means the logged-in role (e.g. Analyst) can't create stores - surfaced directly, not hidden
      setError(err instanceof ApiError ? err.message : "Failed to create store");
    } finally {
      setCreating(false);
    }
  }

  async function toggleExpand(storeId: string) {
    if (expandedStoreId === storeId) {
      setExpandedStoreId(null);
      return;
    }
    setExpandedStoreId(storeId);
    try {
      const data = await api.listShelves(storeId);
      setShelves(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load shelves");
    }
  }

  async function handleCreateShelf(storeId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    try {
      await api.createShelf(storeId, newShelfName);
      setNewShelfName("");
      const data = await api.listShelves(storeId);
      setShelves(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create shelf");
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Stores</h1>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add a store</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStore} className="flex gap-2">
              <Input
                placeholder="Store name"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                required
              />
              <Input
                placeholder="Location (optional)"
                value={newStoreLocation}
                onChange={(e) => setNewStoreLocation(e.target.value)}
              />
              <Button type="submit" disabled={creating}>
                {creating ? "Adding..." : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading stores...</p>
        ) : stores.length === 0 ? (
          <p className="text-muted-foreground">No stores yet. Add one above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {stores.map((store) => (
              <Card key={store.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpand(store.id)}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{store.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {store.location ?? "No location"}
                    </span>
                  </CardTitle>
                </CardHeader>

                {expandedStoreId === store.id && (
                  <CardContent className="flex flex-col gap-3 border-t border-border pt-4">
                    <form
                      onSubmit={(e) => handleCreateShelf(store.id, e)}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Shelf name (e.g. Aisle 3)"
                        value={newShelfName}
                        onChange={(e) => setNewShelfName(e.target.value)}
                      />
                      <Button type="submit">Add shelf</Button>
                    </form>

                    {shelves.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No shelves yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {shelves.map((shelf) => (
                          <li
                            key={shelf.id}
                            className="text-sm rounded-md bg-muted px-3 py-2"
                          >
                            {shelf.shelf_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
