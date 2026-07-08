import * as React from 'react';
import { Sparkles, Hourglass, Eye, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export function CustomerEngagementPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Customer Engagement</h1>
        <p className="text-muted-foreground">Deep dive into dwell thresholds, gaze directions, and physical product interactions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Eye className="h-5 w-5 text-sky-500" />
              Gaze Mappings
            </CardTitle>
            <CardDescription>Average directions and focus times compared to target hot-zones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Top Shelf Focus</span>
                <span className="font-semibold">32% of total time</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-sky-500" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Eye-Level Focus (Hot Zone)</span>
                <span className="font-semibold">54% of total time</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: '54%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bottom Shelf Focus</span>
                <span className="font-semibold">14% of total time</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: '14%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Hourglass className="h-5 w-5 text-purple-500" />
              Dwell Time Distribution
            </CardTitle>
            <CardDescription>Breakdown of how long consumers stand in front of shelf monitors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Quick glance (0.5s - 2s)</span>
                <span className="font-semibold">45% of visitors</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Interested Dwell (2s - 5s)</span>
                <span className="font-semibold">38% of visitors</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: '38%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deep Engagement (&gt; 5s)</span>
                <span className="font-semibold">17% of visitors</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: '17%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Attention Scores by Product Segment</CardTitle>
          <CardDescription>Aggregate engagement metrics across product categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { category: "Beverages", score: "88/100", label: "High Interest" },
              { category: "Snacks", score: "82/100", label: "Stable Interest" },
              { category: "Personal Care", score: "61/100", label: "Moderate Interest" },
              { category: "Household", score: "42/100", label: "Low Gaze Ratio" },
            ].map((seg, idx) => (
              <div key={idx} className="rounded-xl border border-border/40 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-sm font-medium text-muted-foreground">{seg.category}</div>
                <div className="text-2xl font-bold mt-1">{seg.score}</div>
                <div className="text-xs text-sky-500 font-semibold mt-1">{seg.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
