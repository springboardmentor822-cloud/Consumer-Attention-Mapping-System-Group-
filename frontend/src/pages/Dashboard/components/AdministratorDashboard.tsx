import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import {
  Users,
  Store,
  Camera,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Settings,
  ClipboardList
} from 'lucide-react';

export function AdministratorDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stores Registered</p>
              <p className="text-3xl font-bold mt-1">4</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <Store className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Platform Users</p>
              <p className="text-3xl font-bold mt-1">6</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform Cameras Online</p>
              <p className="text-3xl font-bold mt-1">11 / 12</p>
              <p className="text-xs text-muted-foreground mt-1">1 stream alert</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <Camera className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>System Diagnostics & Host Health</CardTitle>
            <CardDescription>Real-time server connectivity and health metrics.</CardDescription>
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
                <span className="font-medium text-sm">Redis PubSub status</span>
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

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Platform Management Tasks</CardTitle>
            <CardDescription>Shortcut widgets to manage system resources.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/users" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Users className="h-4 w-4 mr-2" /> Users & Roles</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/stores" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Store className="h-4 w-4 mr-2" /> Stores Approval</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/audit-logs" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><ClipboardList className="h-4 w-4 mr-2" /> Audit Logs</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link to="/settings" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Settings className="h-4 w-4 mr-2" /> Settings & System</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
