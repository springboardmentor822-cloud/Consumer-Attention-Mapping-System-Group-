import * as React from 'react';
import { BarChart3, TrendingUp, Users, Percent, ArrowUpRight, Megaphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

import { exportReportAsPDF } from '../../utils/export';

export function CampaignAnalyticsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaign Analytics</h1>
          <p className="text-muted-foreground">Monitor real-time customer engagement and sales conversion of live campaigns.</p>
        </div>
        <Button 
          className="w-full sm:w-auto" 
          onClick={() => exportReportAsPDF('Campaign Analytics Overview', 'Marketing', new Date().toISOString().split('T')[0])}
        >
          Export PDF Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">04</div>
            <p className="text-xs text-muted-foreground mt-1">Across 3 categories</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Attention Rate</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.4%</div>
            <p className="flex items-center text-xs text-emerald-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +4.2% since yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promo Conversion</CardTitle>
            <Percent className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.8%</div>
            <p className="flex items-center text-xs text-emerald-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +1.5% this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Promo Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42.5K</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated dwell reach</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Campaigns Table */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Live Performance Console</CardTitle>
          <CardDescription>Direct breakdown of customer attention mapped to current promo structures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="pb-3 font-medium">Campaign Name</th>
                  <th className="pb-3 font-medium">Target Zone</th>
                  <th className="pb-3 font-medium">Attention Score</th>
                  <th className="pb-3 font-medium">Dwell Threshold</th>
                  <th className="pb-3 font-medium">Conversion</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr className="group">
                  <td className="py-4 font-medium">Summer Beverage Fest</td>
                  <td className="py-4">Endcap A - Cooler Row</td>
                  <td className="py-4 text-emerald-500 font-semibold">86/100</td>
                  <td className="py-4">12.4s avg</td>
                  <td className="py-4">14.8%</td>
                  <td className="py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Active</span>
                  </td>
                </tr>
                <tr className="group">
                  <td className="py-4 font-medium">Gourmet Snacks Promo</td>
                  <td className="py-4">Shelf Area C - Island</td>
                  <td className="py-4 text-emerald-500 font-semibold">82/100</td>
                  <td className="py-4">9.8s avg</td>
                  <td className="py-4">11.2%</td>
                  <td className="py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Active</span>
                  </td>
                </tr>
                <tr className="group">
                  <td className="py-4 font-medium">Organic Skincare Intro</td>
                  <td className="py-4">Beauty Counter B</td>
                  <td className="py-4 text-amber-500 font-semibold">68/100</td>
                  <td className="py-4">5.6s avg</td>
                  <td className="py-4">6.4%</td>
                  <td className="py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Active</span>
                  </td>
                </tr>
                <tr className="group">
                  <td className="py-4 font-medium">Eco Clean Launch</td>
                  <td className="py-4">Household Aisle 4</td>
                  <td className="py-4 text-red-500 font-semibold">44/100</td>
                  <td className="py-4">2.2s avg</td>
                  <td className="py-4">2.8%</td>
                  <td className="py-4">
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">Underperforming</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
