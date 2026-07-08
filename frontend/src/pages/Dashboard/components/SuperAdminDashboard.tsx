import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Camera,
  ShoppingBag,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Settings,
  ClipboardList
} from 'lucide-react';

export function SuperAdminDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stores</p>
              <p className="text-3xl font-bold mt-1">4</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <Store className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold mt-1">5</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cameras Uptime</p>
              <p className="text-3xl font-bold mt-1">11 / 12</p>
              <p className="text-xs text-muted-foreground mt-1">1 stream offline</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <Camera className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Shelves</p>
              <p className="text-3xl font-bold mt-1">18</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System & Security Monitor</CardTitle>
            <CardDescription>Overall platform parameters, diagnostic states, and server health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-sm">PostgreSQL Connection</span>
              </div>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">Connected</Badge>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-sm">Redis Broker status</span>
              </div>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <span className="font-medium text-sm">Celery Background Workers</span>
              </div>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">Active (1 node)</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Administrative Actions</CardTitle>
            <CardDescription>Shortcut widgets to manage system resources.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/users" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Users className="h-4 w-4 mr-2" /> User Accounts</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/stores" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Store className="h-4 w-4 mr-2" /> Stores Setup</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/audit-logs" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><ClipboardList className="h-4 w-4 mr-2" /> System Logs</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/settings" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Settings className="h-4 w-4 mr-2" /> Platform Settings</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
