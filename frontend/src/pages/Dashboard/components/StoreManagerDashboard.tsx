import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import {
  Camera,
  ShoppingBag,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Bell
} from 'lucide-react';

export function StoreManagerDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Operator Console</span>
          <h2 className="text-2xl font-bold mt-1">Assigned Store: Downtown Hypermarket</h2>
        </div>
        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
          Operator Access Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Shelves</p>
              <p className="text-3xl font-bold mt-1">6</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Streams</p>
              <p className="text-3xl font-bold mt-1">4 / 4</p>
              <p className="text-xs text-muted-foreground mt-1">All streams streaming</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <Camera className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Dwell Time</p>
              <p className="text-3xl font-bold mt-1">4.2m</p>
              <p className="text-xs text-muted-foreground mt-1">Based on last 24 hours</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Attention Performance</CardTitle>
            <CardDescription>Attention metrics indicating active engagement time across zones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Cosmetics Shelf A (Aisle 1)</span>
                <span>🔥 84% Attention Index</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: '84%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Beverages Cooler B (Aisle 3)</span>
                <span>⚡ 62% Attention Index</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '62%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Weekly Promotions Display</span>
                <span>❄️ 35% Attention Index</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: '35%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle>Active Store Alerts</CardTitle>
              <CardDescription>Attention required.</CardDescription>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 border-b border-border pb-3">
              <div className="mt-0.5 rounded-full bg-amber-500/10 p-1 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">High Congestion: Aisle 3</p>
                <p className="text-[11px] text-muted-foreground">Crowd index exceeds threshold.</p>
              </div>
            </div>

            <Link to="/alerts" className="block w-full mt-2">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center"><Bell className="h-4 w-4 mr-2" /> View Alert Center</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
