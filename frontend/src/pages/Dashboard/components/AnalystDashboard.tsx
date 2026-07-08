import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Map,
  BarChart3,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export function AnalystDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Analytics Studio</span>
          <h2 className="text-2xl font-bold mt-1">Consumer Behavior & Attention Intelligence</h2>
        </div>
        <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200">
          Data Analyst Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Attention Zones</p>
              <p className="text-3xl font-bold mt-1">03</p>
              <p className="text-xs text-emerald-500 mt-1">🔥 Area density positive</p>
            </div>
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cold Zones</p>
              <p className="text-3xl font-bold mt-1">02</p>
              <p className="text-xs text-rose-500 mt-1">❄️ Layout review suggested</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attention conversion</p>
              <p className="text-3xl font-bold mt-1">44.8%</p>
              <p className="text-xs text-muted-foreground mt-1">Interaction relative index</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
              <BarChart3 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Shelf Zones</CardTitle>
            <CardDescription>Highest dwell times and product interaction counts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { rank: '1', zone: 'Cosmetics Sector A', index: '94.2' },
              { rank: '2', zone: 'Weekly Specials Display', index: '82.5' },
              { rank: '3', zone: 'Organic Produce Cooler', index: '78.1' },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between border-b border-border pb-3 text-sm">
                <span className="font-semibold text-muted-foreground">#{item.rank} {item.zone}</span>
                <Badge variant="secondary" className="font-bold">{item.index} score</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Least Visited Shelves</CardTitle>
            <CardDescription>Lowest visitor engagement rates indicating layout review required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { rank: '1', zone: 'Bakery Bottom Shelf', index: '15.4' },
              { rank: '2', zone: 'Cleaning Supplies Row 4', index: '22.8' },
              { rank: '3', zone: 'Stationery Side panel', index: '28.1' },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between border-b border-border pb-3 text-sm">
                <span className="font-semibold text-muted-foreground text-rose-500">#{item.rank} {item.zone}</span>
                <Badge variant="destructive" className="font-bold">{item.index} score</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior Analysis Quick Actions</CardTitle>
            <CardDescription>Direct navigation shortcuts to compiler workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/analytics" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><BarChart3 className="h-4 w-4 mr-2" /> Traffic Charts</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/heatmaps" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Map className="h-4 w-4 mr-2" /> Heatmaps Overlay</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/reports" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><FileSpreadsheet className="h-4 w-4 mr-2" /> Compilations & Exports</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
