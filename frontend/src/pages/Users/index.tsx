import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ShieldAlert, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../components/ui/toast';
import { listAllUsers, toggleUserStatus, deleteUser, listRoles, updateUser } from '../../services/user';
import { listStores } from '../../services/store';
import type { UserManagementItem } from '../../services/user';

export function UsersPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingUserItem, setDeletingUserItem] = React.useState<UserManagementItem | null>(null);

  // Fetch all users list
  const { data: users = [], isLoading, error } = useQuery<UserManagementItem[]>({
    queryKey: ['users'],
    queryFn: listAllUsers,
  });

  // Fetch all stores
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: listStores,
  });

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  });

  // Mutator for user role/store assignment update
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { role_id?: number; store_id?: string | null } }) => updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated successfully', type: 'success' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update user';
      toast({ title: 'Operation failed', description: msg, type: 'error' });
    },
  });

  // Mutator for user toggle status
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => toggleUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User status updated successfully', type: 'success' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update user status';
      toast({ title: 'Operation failed', description: msg, type: 'error' });
    },
  });

  // Mutator for deleting users
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted successfully', type: 'success' });
      setDeletingUserItem(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to delete user';
      toast({ title: 'Operation failed', description: msg, type: 'error' });
      setDeletingUserItem(null);
    },
  });

  React.useEffect(() => {
    if (error) {
      toast({ title: 'Failed to load users', description: 'Make sure you are logged in as Administrator.', type: 'error' });
    }
  }, [error, toast]);

  const handleToggle = (userItem: UserManagementItem) => {
    toggleMutation.mutate({ id: userItem.id, is_active: !userItem.is_active });
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Administrator':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200';
      case 'Store Manager':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200';
      case 'Marketing Manager':
        return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200';
      default:
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    }
  };

  return (
    <div>
      <PageHeader
        title="User & Access Management"
        description="Administer enterprise workspace roles, review user details, assign location scopes, and toggle active states."
      />

      {isLoading ? (
        <LoadingState label="Loading users..." />
      ) : (
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>System Accounts</CardTitle>
            <CardDescription>Assign roles and stores dynamically. Changes apply immediately upon selection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Assigned Store Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem) => {
                  const isStoreLinked = userItem.role.role_name === 'Store Manager' || userItem.role.role_name === 'Marketing Manager';
                  return (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">{userItem.email}</TableCell>
                      <TableCell>
                        {userItem.email === 'admin@consumerattention.com' ? (
                          <Badge className={getRoleBadgeColor(userItem.role.role_name)}>
                            {userItem.role.role_name}
                          </Badge>
                        ) : (
                          <select
                            className="h-9 w-40 rounded-xl border border-border bg-background px-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={userItem.role.id}
                            onChange={(e) => updateMutation.mutate({ id: userItem.id, payload: { role_id: Number(e.target.value) } })}
                            disabled={updateMutation.isPending}
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.role_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </TableCell>
                      <TableCell>
                        {isStoreLinked ? (
                          <select
                            className="h-9 w-52 rounded-xl border border-border bg-background px-3 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={(userItem as any).store_id || ''}
                            onChange={(e) => updateMutation.mutate({ id: userItem.id, payload: { store_id: e.target.value || null } })}
                            disabled={updateMutation.isPending}
                          >
                            <option value="">Unassigned (Platform scope)</option>
                            {stores.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.store_name} ({s.location}){s.is_approved ? '' : ' (Pending)'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Platform Scope</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                          {userItem.is_active ? 'Active' : 'Deactivated'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(userItem.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {userItem.email === 'admin@consumerattention.com' ? (
                          <span className="text-xs text-muted-foreground italic">Protected</span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggle(userItem)}
                              disabled={toggleMutation.isPending}
                            >
                              {userItem.is_active ? <ShieldAlert className="h-4 w-4 mr-1 text-amber-500" /> : <UserCheck className="h-4 w-4 mr-1 text-emerald-500" />}
                              {userItem.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingUserItem(userItem)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(deletingUserItem)}
        onOpenChange={(open) => !open && setDeletingUserItem(null)}
        title="Delete User"
        description={`Are you sure you want to delete the account for "${deletingUserItem?.email}"? This action cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={async () => {
          if (deletingUserItem) {
            deleteMutation.mutate(deletingUserItem.id);
          }
        }}
      />
    </div>
  );
}
