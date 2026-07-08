import * as React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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

const shelfSchema = z.object({
  store_id: z.string().uuid('Select a store'),
  shelf_name: z.string().min(2, 'Shelf name is required'),
  zone_coordinates: z.string().min(2, 'Enter zone coordinates JSON'),
});

type ShelfFormValues = z.infer<typeof shelfSchema>;

export function ShelvesPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const canMutate = user?.role === 'SuperAdmin' || user?.role === 'StoreManager';
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>('');
  const [shelves, setShelves] = React.useState<Shelf[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingShelf, setEditingShelf] = React.useState<Shelf | null>(null);
  const [deletingShelf, setDeletingShelf] = React.useState<Shelf | null>(null);

  const { register, handleSubmit, reset } = useForm<ShelfFormValues>({
    resolver: zodResolver(shelfSchema),
    defaultValues: { store_id: '', shelf_name: '', zone_coordinates: '{"x":0,"y":0,"width":100,"height":60}' },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const storeData = await listStores();
      setStores(storeData);
      const initialStore = selectedStoreId || storeData[0]?.id || '';
      setSelectedStoreId(initialStore);
      if (initialStore) {
        const shelfData = await listShelves(initialStore);
        setShelves(shelfData);
      } else {
        setShelves([]);
      }
    } catch {
      toast({ title: 'Failed to load shelves', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId, toast]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

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

  return (
    <div>
      <PageHeader
        title="Shelf Management"
        description="Configure product shelf layouts and map target attention zones within store locations."
        actions={
          canMutate ? (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Shelf
            </Button>
          ) : undefined
        }
      />

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
    </div>
  );
}
