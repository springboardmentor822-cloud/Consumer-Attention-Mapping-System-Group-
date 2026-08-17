import * as React from 'react';
import { Plus, Pencil, Trash2, Package, Map, LayoutGrid } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { listStores } from '../../services/store';
import { createShelf, deleteShelf, listShelves, updateShelf } from '../../services/shelf';
import type { Shelf } from '../../types/shelf';
import type { Store } from '../../types/store';
import { useToast } from '../../components/ui/toast';
import { parseJsonOrThrow } from '../../utils/json';

// Shelf Schema
const shelfSchema = z.object({
  store_id: z.string().uuid('Select a store'),
  shelf_name: z.string().min(2, 'Shelf name is required'),
  zone_coordinates: z.string().min(2, 'Enter zone coordinates JSON'),
});
type ShelfFormValues = z.infer<typeof shelfSchema>;

// Product Schema
const productSchema = z.object({
  product_name: z.string().min(2, 'Product name is required'),
  shelf_id: z.string().uuid('Select a shelf'),
  stock: z.coerce.number().min(0, 'Stock must be at least 0'),
  price: z.coerce.number().min(0, 'Price must be at least 0'),
});
type ProductFormValues = z.infer<typeof productSchema>;

interface ProductItem {
  id: string;
  product_name: string;
  shelf_id: string;
  stock: number;
  price: number;
}

export function ShelvesPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'shelves';

  const canMutate = user?.role === 'Store Manager';
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>('');
  const [shelves, setShelves] = React.useState<Shelf[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Shelf Dialogs State
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingShelf, setEditingShelf] = React.useState<Shelf | null>(null);
  const [deletingShelf, setDeletingShelf] = React.useState<Shelf | null>(null);

  // Products State
  const [products, setProducts] = React.useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('store_manager_products');
    return saved ? JSON.parse(saved) : [
      { id: '1', product_name: 'Premium Lipstick Red', shelf_id: '', stock: 45, price: 29.99 },
      { id: '2', product_name: 'Hydrating Face Cream', shelf_id: '', stock: 20, price: 45.00 },
      { id: '3', product_name: 'Organic Orange Juice', shelf_id: '', stock: 120, price: 4.50 },
      { id: '4', product_name: 'Whole Grain Bread', shelf_id: '', stock: 15, price: 3.20 },
    ];
  });
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductItem | null>(null);

  // Shelf Form Hook
  const { register, handleSubmit, reset } = useForm<ShelfFormValues>({
    resolver: zodResolver(shelfSchema),
    defaultValues: { store_id: user?.store_id || '', shelf_name: '', zone_coordinates: '{"x":0,"y":0,"width":100,"height":60}' },
  });

  // Product Form Hook
  const { register: registerProduct, handleSubmit: handleProductSubmit, reset: resetProduct } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const storeData = await listStores();
      if (['Store Manager', 'Retail Analyst', 'Marketing Manager'].includes(user?.role || '')) {
        const assigned = storeData.filter((s) => s.id === user?.store_id);
        setStores(assigned);
        setSelectedStoreId(user.store_id || '');
        if (user.store_id) {
          const shelfData = await listShelves(user.store_id);
          setShelves(shelfData);
        } else {
          setShelves([]);
        }
      } else {
        setStores(storeData);
        const initialStore = selectedStoreId || storeData[0]?.id || '';
        setSelectedStoreId(initialStore);
        if (initialStore) {
          const shelfData = await listShelves(initialStore);
          setShelves(shelfData);
        } else {
          setShelves([]);
        }
      }
    } catch {
      toast({ title: 'Failed to load shelves', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, user, toast]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Shelf Handlers
  const openCreateDialog = (): void => {
    setEditingShelf(null);
    reset({ store_id: selectedStoreId, shelf_name: '', zone_coordinates: '{"x":0,"y":0,"width":100,"height":60}' });
    setDialogOpen(true);
  };

  const openEditDialog = (shelf: Shelf): void => {
    setEditingShelf(shelf);
    reset({ store_id: shelf.store_id, shelf_name: shelf.shelf_name, zone_coordinates: JSON.stringify(shelf.zone_coordinates ?? {}, null, 2) });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ShelfFormValues): Promise<void> => {
    try {
      const payload = {
        shelf_name: values.shelf_name,
        zone_coordinates: parseJsonOrThrow<Record<string, unknown>>(values.zone_coordinates, 'Zone coordinates must be valid JSON.'),
      };

      if (editingShelf) {
        await updateShelf(editingShelf.id, payload);
        toast({ title: 'Shelf updated', type: 'success' });
      } else {
        await createShelf(values.store_id, payload);
        toast({ title: 'Shelf created', type: 'success' });
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      toast({ title: 'Shelf save failed', type: 'error' });
    }
  };

  // Product Handlers
  const openCreateProductDialog = (): void => {
    if (shelves.length === 0) {
      toast({ title: 'No shelves available', description: 'Create a shelf first before placing products.', type: 'error' });
      return;
    }
    setEditingProduct(null);
    resetProduct({ product_name: '', shelf_id: shelves[0].id, stock: 10, price: 9.99 });
    setProductDialogOpen(true);
  };

  const openEditProductDialog = (prod: ProductItem): void => {
    setEditingProduct(prod);
    resetProduct({ product_name: prod.product_name, shelf_id: prod.shelf_id, stock: prod.stock, price: prod.price });
    setProductDialogOpen(true);
  };

  const onProductSubmit = (values: ProductFormValues): void => {
    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map((p) => p.id === editingProduct.id ? { ...p, ...values } : p);
      toast({ title: 'Product updated successfully', type: 'success' });
    } else {
      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...values
      };
      updatedProducts = [...products, newProduct];
      toast({ title: 'Product registered successfully', type: 'success' });
    }
    setProducts(updatedProducts);
    localStorage.setItem('store_manager_products', JSON.stringify(updatedProducts));
    setProductDialogOpen(false);
  };

  const deleteProductItem = (id: string): void => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('store_manager_products', JSON.stringify(updated));
    toast({ title: 'Product deleted successfully', type: 'success' });
  };

  // Render Product Tab View
  const renderProductsTab = () => {
    return (
      <div>
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle>In-Store Products Placement</CardTitle>
              <CardDescription>Assign inventory items to specific mapped shelves for layout tracking.</CardDescription>
            </div>
            {canMutate && (
              <Button onClick={openCreateProductDialog}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState title="No products defined" description="Add a product to map it to your store layout." actionLabel={canMutate ? 'Add Product' : undefined} onAction={canMutate ? openCreateProductDialog : undefined} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Assigned Shelf</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Price</TableHead>
                    {canMutate && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod) => {
                    const shelf = shelves.find((s) => s.id === prod.shelf_id);
                    return (
                      <TableRow key={prod.id}>
                        <TableCell className="font-semibold text-foreground">{prod.product_name}</TableCell>
                        <TableCell>
                          {shelf ? (
                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                              {shelf.shelf_name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{prod.stock} units</TableCell>
                        <TableCell>${prod.price.toFixed(2)}</TableCell>
                        {canMutate && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditProductDialog(prod)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteProductItem(prod.id)}>
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Product Create/Edit Dialog */}
        <Dialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          description="Map products to specific shelving units to analyze localized consumer interests."
          footer={
            <>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleProductSubmit(onProductSubmit)}>{editingProduct ? 'Update' : 'Add'}</Button>
            </>
          }
        >
          <form className="space-y-4" onSubmit={handleProductSubmit(onProductSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input id="product_name" {...registerProduct('product_name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelf_id">Target Shelf</Label>
              <select id="shelf_id" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...registerProduct('shelf_id')}>
                {shelves.map((shelf) => <option key={shelf.id} value={shelf.id}>{shelf.shelf_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input type="number" id="stock" {...registerProduct('stock')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input type="number" step="0.01" id="price" {...registerProduct('price')} />
              </div>
            </div>
          </form>
        </Dialog>
      </div>
    );
  };

  // Render Visual Grid Map of Coordinates
  const renderStoreMap = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Zone Coordinates Map</CardTitle>
          <CardDescription>Visual representation of mapped shelf coordinates within the store layout.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Grid Pattern Removed as requested */}
            
            {shelves.length === 0 ? (
              <p className="text-muted-foreground text-sm z-10">No shelves configured to map zones.</p>
            ) : (
              <div className="relative w-full h-full p-8">
                {shelves.map((shelf) => {
                  let coords = { x: 10, y: 10, width: 100, height: 60 };
                  try {
                    coords = typeof shelf.zone_coordinates === 'string' 
                      ? JSON.parse(shelf.zone_coordinates)
                      : shelf.zone_coordinates;
                  } catch (e) {}
                  
                  // Normalize coordinates to percentage layout bounding boxes
                  const posX = Math.min(Math.max(coords.x_min ?? coords.x ?? 10, 0), 90);
                  const posY = Math.min(Math.max(coords.y_min ?? coords.y ?? 10, 0), 80);
                  const derivedWidth = (coords.x_max && coords.x_min) ? (coords.x_max - coords.x_min) : coords.width;
                  const derivedHeight = (coords.y_max && coords.y_min) ? (coords.y_max - coords.y_min) : coords.height;
                  const width = Math.min(Math.max(derivedWidth || 20, 10), 80);
                  const height = Math.min(Math.max(derivedHeight || 20, 10), 80);
                  
                  return (
                    <div
                      key={shelf.id}
                      className="absolute border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:scale-105 transition-all rounded-xl p-3 flex flex-col justify-between text-xs text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer"
                      style={{
                        left: `${posX}%`,
                        top: `${posY}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        maxWidth: '220px',
                        maxHeight: '140px',
                      }}
                    >
                      <div className="font-bold truncate">{shelf.shelf_name}</div>
                      <div className="text-[10px] text-emerald-400 opacity-80 mt-1">
                        X: {posX}%, Y: {posY}%
                        <br />
                        W: {width}%, H: {height}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title={
          activeTab === 'products'
            ? 'Product Placements'
            : activeTab === 'zones'
            ? 'Store Zone Layout'
            : 'Shelf Management'
        }
        description={
          activeTab === 'products'
            ? 'Manage inventory items and map them to retail shelves.'
            : activeTab === 'zones'
            ? 'Visual grid outlining mapped camera zones and hotzones.'
            : 'Configure product shelf layouts and map target attention zones within store locations.'
        }
        actions={
          activeTab === 'shelves' && canMutate ? (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Shelf
            </Button>
          ) : activeTab === 'products' && canMutate ? (
            <Button onClick={openCreateProductDialog}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          ) : undefined
        }
      />

      {user?.role === 'Store Manager' && (
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setSearchParams({ tab: 'shelves' })}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'shelves'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Shelves
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'products' })}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'zones' })}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'zones'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" />
            Zones
          </button>
        </div>
      )}

      {activeTab === 'products' ? (
        renderProductsTab()
      ) : activeTab === 'zones' ? (
        renderStoreMap()
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Label className="min-w-24">Store</Label>
              <select
                value={selectedStoreId}
                onChange={async (event) => {
                  setSelectedStoreId(event.target.value);
                  setLoading(true);
                  try {
                    setShelves(await listShelves(event.target.value));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.store_name}</option>
                ))}
              </select>
              <span className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {shelves.length} shelf(s)
              </span>
            </CardContent>
          </Card>

          {loading ? <LoadingState /> : shelves.length === 0 ? <EmptyState title="No shelves found" description="Define a shelf zone to begin mapping consumer attention." actionLabel={canMutate ? 'Create Shelf' : undefined} onAction={canMutate ? openCreateDialog : undefined} /> : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shelf Name</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Zone Coordinates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shelves.map((shelf) => (
                    <TableRow key={shelf.id}>
                      <TableCell className="font-medium">{shelf.shelf_name}</TableCell>
                      <TableCell>{shelf.store_id}</TableCell>
                      <TableCell className="max-w-md truncate">{JSON.stringify(shelf.zone_coordinates)}</TableCell>
                      <TableCell className="text-right">
                        {canMutate ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(shelf)}><Pencil className="h-4 w-4" />Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeletingShelf(shelf)}><Trash2 className="h-4 w-4" />Delete</Button>
                          </div>
                        ) : <span className="text-sm text-muted-foreground">Read only</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Shelf Dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title={editingShelf ? 'Edit Shelf' : 'Create Shelf'}
            description="Map specific shelving areas to a store and outline their spatial coordinates."
            footer={
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit(onSubmit)}>{editingShelf ? 'Update' : 'Create'}</Button>
              </>
            }
          >
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="store_id">Store</Label>
                <select id="store_id" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register('store_id')}>
                  {stores.map((store) => <option key={store.id} value={store.id}>{store.store_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf_name">Shelf Name</Label>
                <Input id="shelf_name" {...register('shelf_name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone_coordinates">Zone Coordinates JSON</Label>
                <textarea id="zone_coordinates" rows={5} className="w-full rounded-xl border border-border bg-background p-3 text-sm" {...register('zone_coordinates')} />
              </div>
            </form>
          </Dialog>

          <ConfirmDialog
            open={Boolean(deletingShelf)}
            onOpenChange={(open) => !open && setDeletingShelf(null)}
            title="Delete shelf"
            description="This will remove the selected shelf definition and its mapped attention zones."
            confirmLabel="Delete"
            onConfirm={async () => {
              if (!deletingShelf) return;
              try {
                await deleteShelf(deletingShelf.id);
                toast({ title: 'Shelf deleted', type: 'success' });
                setDeletingShelf(null);
                await loadData();
              } catch {
                toast({ title: 'Delete failed', type: 'error' });
              }
            }}
          />
        </>
      )}
    </div>
  );
}
