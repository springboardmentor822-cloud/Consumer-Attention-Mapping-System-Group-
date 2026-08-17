import * as React from 'react';
import { Plus, Pencil, Trash2, Wifi, WifiOff, Video, Activity } from 'lucide-react';
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
import { createCamera, deleteCamera, listCameras, updateCamera } from '../../services/camera';
import { listStores } from '../../services/store';
import type { Camera } from '../../types/camera';
import type { Store } from '../../types/store';
import { useToast } from '../../components/ui/toast';
import { LiveVideoFeed } from '../Dashboard/components/LiveVideoFeed';

const cameraSchema = z.object({
  store_id: z.string().uuid('Select a store'),
  camera_name: z.string().min(2, 'Camera name is required'),
  camera_source: z.string().min(1, 'Camera source is required'),
  status: z.string().min(1, 'Status is required'),
});

type CameraFormValues = z.infer<typeof cameraSchema>;

export function CamerasPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const canMutate = user?.role === 'Administrator';
  const [stores, setStores] = React.useState<Store[]>([]);
  const [cameras, setCameras] = React.useState<Camera[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCamera, setEditingCamera] = React.useState<Camera | null>(null);
  const [deletingCamera, setDeletingCamera] = React.useState<Camera | null>(null);
  const [streamStatus, setStreamStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const { register, handleSubmit, reset } = useForm<CameraFormValues>({
    resolver: zodResolver(cameraSchema),
    defaultValues: { store_id: user?.store_id || '', camera_name: '', camera_source: '0', status: 'active' },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [storeData, cameraData] = await Promise.all([listStores(), listCameras()]);
      if (user?.role === 'Store Manager') {
        const assigned = storeData.filter((s) => s.id === user.store_id);
        setStores(assigned);
        setCameras(cameraData.filter((c) => c.store_id === user.store_id));
      } else {
        setStores(storeData);
        setCameras(cameraData);
      }
    } catch {
      toast({ title: 'Failed to load cameras', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateDialog = (): void => {
    setEditingCamera(null);
    reset({ store_id: user?.store_id || stores[0]?.id || '', camera_name: '', camera_source: '0', status: 'active' });
    setDialogOpen(true);
  };

  const openEditDialog = (camera: Camera): void => {
    setEditingCamera(camera);
    reset({ store_id: camera.store_id, camera_name: camera.camera_name, camera_source: camera.camera_source, status: camera.status });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CameraFormValues): Promise<void> => {
    try {
      if (editingCamera) {
        await updateCamera(editingCamera.id, values);
        toast({ title: 'Camera updated', type: 'success' });
      } else {
        await createCamera(values);
        toast({ title: 'Camera created', type: 'success' });
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      toast({ title: 'Camera save failed', type: 'error' });
    }
  };

  const activeCameras = cameras.filter(c => c.status === 'active');
  const selectedCamera = activeCameras.length > 0 ? activeCameras[0] : (cameras.length > 0 ? cameras[0] : null);
  const derivedStoreId = selectedCamera?.store_id ?? user?.store_id ?? null;
  const derivedCameraId = selectedCamera?.id ?? null;
  const derivedCameraName = selectedCamera?.camera_name ?? selectedCamera?.name ?? 'Live Webcam';

  return (
    <div>
      <PageHeader
        title={user?.role === 'Administrator' ? "Camera Management" : "Live Camera Monitoring"}
        description={user?.role === 'Administrator' ? "Configure and manage store cameras, AI streams, and YOLOv8 pipelines." : "Monitor connected camera streams assigned to your store."}
        actions={canMutate ? <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Create Camera</Button> : undefined}
      />

      {loading ? <LoadingState /> : cameras.length === 0 ? <EmptyState title="No cameras found" description="Register a camera stream and link it to an active store configuration." actionLabel={canMutate ? 'Create Camera' : undefined} onAction={canMutate ? openCreateDialog : undefined} /> : (
        <div className="space-y-6">

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Wifi className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Camera Status</p>
                  <p className="text-xl font-bold">{activeCameras.length} Connected</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Video className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stream Status</p>
                  <p className="text-xl font-bold">{activeCameras.length > 0 ? (streamStatus === 'connected' ? 'LIVE' : streamStatus.toUpperCase()) : 'OFFLINE'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/60">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-xl font-bold">YOLOv8 + ByteTrack</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live AI Tracking Feed — Single clean view */}
          <div className="w-full flex justify-center mb-6">
            <div className="w-full max-w-[900px] aspect-video">
              {derivedStoreId ? (
                <LiveVideoFeed 
                  storeId={derivedStoreId} 
                  onStatusChange={setStreamStatus}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 bg-black/50 rounded-xl border border-border/60 backdrop-blur">
                  <Video className="w-12 h-12 mb-4 opacity-50" />
                  <p>No active camera found. Waiting for configuration...</p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Camera Records</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Camera Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cameras.map((camera) => {
                  const storeName = stores.find(s => s.id === camera.store_id)?.store_name || camera.store_id;
                  return (
                    <TableRow key={camera.id}>
                      <TableCell className="font-medium">{camera.camera_name}</TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-xs">{camera.camera_source}</TableCell>
                      <TableCell>
                        <Badge className={camera.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}>
                          {camera.status === 'active' ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                          {camera.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{storeName}</TableCell>
                      <TableCell className="text-right">
                        {canMutate ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(camera)}><Pencil className="h-4 w-4" />Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => setDeletingCamera(camera)}><Trash2 className="h-4 w-4" />Delete</Button>
                          </div>
                        ) : <span className="text-sm text-muted-foreground">Read only</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCamera ? 'Edit Camera' : 'Create Camera'}
        description="Configure video input sources, name, and operational status for real-time monitoring."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>{editingCamera ? 'Update' : 'Create'}</Button>
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
            <Label htmlFor="camera_name">Camera Name</Label>
            <Input id="camera_name" {...register('camera_name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camera_source">Camera Source</Label>
            <Input id="camera_source" placeholder="0 for webcam, or URL/path" {...register('camera_source')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCamera)}
        onOpenChange={(open) => !open && setDeletingCamera(null)}
        title="Delete camera"
        description="This will remove the camera from the system."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingCamera) return;
          try {
            await deleteCamera(deletingCamera.id);
            toast({ title: 'Camera deleted', type: 'success' });
            setDeletingCamera(null);
            await loadData();
          } catch {
            toast({ title: 'Delete failed', type: 'error' });
          }
        }}
      />
    </div>
  );
}
