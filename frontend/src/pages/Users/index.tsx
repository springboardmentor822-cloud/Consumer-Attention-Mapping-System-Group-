import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Power, ShieldAlert, UserCheck } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../components/ui/toast';
import { listAllUsers, toggleUserStatus, deleteUser } from '../../services/user';
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
      toast({ title: 'Failed to load users', description: 'Make sure you are logged in as Super Admin.', type: 'error' });
    }
  }, [error, toast]);

  const handleToggle = (userItem: UserManagementItem) => {
    toggleMutation.mutate({ id: userItem.id, is_active: !userItem.is_active });
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'SuperAdmin':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-200';
      case 'StoreManager':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200';
      default:
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Administer enterprise workspace roles, review user details, and toggle account activation status."
      />

      {isLoading ? (
        <LoadingState label="Loading users..." />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>System Accounts</CardTitle>
            <CardDescription>Review and manage access levels for store operators and analysts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">{userItem.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(userItem.role.role_name)}>
                        {userItem.role.role_name}
                      </Badge>
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
                ))}
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
