import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export function ProfilePage(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account profile and security credentials for the intelligence platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Authorized Operator Session</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border p-4">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Role</p>
            <Badge className="mt-1">{user?.role}</Badge>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{user?.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <Button variant="destructive" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
