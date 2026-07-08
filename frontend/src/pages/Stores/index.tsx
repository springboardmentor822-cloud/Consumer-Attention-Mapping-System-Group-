import * as React from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
import { createStore, deleteStore, listStores, updateStore } from '../../services/store';
import type { Store } from '../../types/store';
import { useToast } from '../../components/ui/toast';
import { parseJsonOrThrow } from '../../utils/json';

const storeSchema = z.object({
  store_name: z.string().min(2, 'Store name is required'),
  location: z.string().min(2, 'Location is required'),
  metadata: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

const pageSize = 5;

export function StoresPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = React.useState<Store[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingStore, setEditingStore] = React.useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = React.useState<Store | null>(null);

  const canMutate = user?.role === 'SuperAdmin' || user?.role === 'StoreManager';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: { store_name: '', location: '', metadata: '{}' },
  });

  const loadStores = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStores();
      setStores(data);
    } catch {
      toast({ title: 'Failed to load stores', description: 'Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadStores();
  }, [loadStores]);

  const openCreateDialog = (): void => {
    setEditingStore(null);
    reset({ store_name: '', location: '', metadata: '{}' });
    setDialogOpen(true);
  };

  const openEditDialog = (store: Store): void => {
    setEditingStore(store);
    reset({ store_name: store.store_name, location: store.location, metadata: JSON.stringify(store.metadata ?? {}, null, 2) });
    setDialogOpen(true);
  };

  const onSubmit = async (values: StoreFormValues): Promise<void> => {
    try {
      const payload = {
        store_name: values.store_name,
        location: values.location,
        metadata: values.metadata ? parseJsonOrThrow<Record<string, unknown>>(values.metadata, 'Metadata must be valid JSON.') : {},
      };

      if (editingStore) {
        await updateStore(editingStore.id, payload);
        toast({ title: 'Store updated', type: 'success' });
      } else {
        await createStore(payload);
        toast({ title: 'Store created', type: 'success' });
      }
      setDialogOpen(false);
      await loadStores();
    } catch (error) {
      toast({ title: 'Store save failed', description: error instanceof Error ? error.message : 'Please retry.', type: 'error' });
    }
  };

  const filteredStores = stores.filter((store) => `${store.store_name} ${store.location}`.toLowerCase().includes(query.toLowerCase()));
  const paginatedStores = filteredStores.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.max(Math.ceil(filteredStores.length / pageSize), 1);

  return (
    <div>
      <PageHeader
        title="Store Management"
        description="Manage retail store locations and operational intelligence configurations."
        actions={
          canMutate ? (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Store
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search stores..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Badge variant="secondary">{filteredStores.length} result(s)</Badge>
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : paginatedStores.length === 0 ? <EmptyState title="No stores found" description="Register a store location to begin configuring tracking layout details and cameras." actionLabel={canMutate ? 'Create Store' : undefined} onAction={canMutate ? openCreateDialog : undefined} /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.store_name}</TableCell>
                  <TableCell>{store.location}</TableCell>
                  <TableCell><Badge>Active</Badge></TableCell>
                  <TableCell className="text-right">
                    {canMutate ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(store)}><Pencil className="h-4 w-4" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingStore(store)}><Trash2 className="h-4 w-4" />Delete</Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Read only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-4 text-sm text-muted-foreground">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingStore ? 'Edit Store' : 'Create Store'}
        description="Define store details and custom operational metadata parameters."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>{editingStore ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="store_name">Store Name</Label>
            <Input id="store_name" {...register('store_name')} />
            {errors.store_name ? <p className="text-sm text-destructive">{errors.store_name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} />
            {errors.location ? <p className="text-sm text-destructive">{errors.location.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata JSON</Label>
            <textarea id="metadata" rows={5} className="w-full rounded-xl border border-border bg-background p-3 text-sm" {...register('metadata')} />
            {errors.metadata ? <p className="text-sm text-destructive">{errors.metadata.message}</p> : null}
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingStore)}
        onOpenChange={(open) => !open && setDeletingStore(null)}
        title="Delete store"
        description="This will remove the store and its linked shelves and cameras."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingStore) return;
          try {
            await deleteStore(deletingStore.id);
            toast({ title: 'Store deleted', type: 'success' });
            setDeletingStore(null);
            await loadStores();
          } catch {
            toast({ title: 'Delete failed', type: 'error' });
          }
        }}
      />
    </div>
  );
}
