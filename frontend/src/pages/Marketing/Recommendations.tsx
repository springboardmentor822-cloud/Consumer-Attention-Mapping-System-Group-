import * as React from 'react';
import { Cpu, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export function RecommendationsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Recommendation Engine</h1>
        <p className="text-muted-foreground">Automated recommendations for optimal product placement, layout configurations, and promotional placement boosts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5 text-indigo-500" />
              Active Placement Suggestions
            </CardTitle>
            <CardDescription>AI-generated layout optimization guides based on weekly customer traffic maps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Promote Organic Snacks to Eye-Level",
                description: "Organic Snacks current placement is on Shelf 4 (Bottom). Moving it to Shelf 2 (Eye-Level) is predicted to lift sales by 18% based on high visual attention scores in Aisle 3.",
                impact: "High Lift (+18%)",
                type: "Re-Layout"
              },
              {
                title: "Swap Beverage Endcap A with Endcap B",
                description: "Traffic mapping shows Endcap A receives 34% more foot traffic than Endcap B, but current Endcap A products have lower engagement. Swapping high attraction drinks will boost conversion.",
                impact: "Medium Lift (+12%)",
                type: "Swap Placements"
              },
              {
                title: "Bundle Premium Coffee with Tea Tray Promo",
                description: "Shopper attention patterns show a 68% overlap in gaze paths between tea and coffee sections. Bundling them in a checkout promo tray will capture quick impulse buys.",
                impact: "High Lift (+15%)",
                type: "Bundle"
              }
            ].map((rec, idx) => (
              <div key={idx} className="rounded-xl border border-border/50 p-4 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-500">{rec.type}</span>
                  <span className="text-xs font-bold text-emerald-500">{rec.impact}</span>
                </div>
                <h3 className="font-semibold text-sm">{rec.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Engine Metrics
            </CardTitle>
            <CardDescription>AI efficiency index.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Prediction Accuracy</div>
              <div className="text-3xl font-bold">92.4%</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Recommendations Applied</div>
              <div className="text-3xl font-bold">14 / 16</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Average Revenue Lift</div>
              <div className="text-3xl font-bold text-emerald-500">+14.2%</div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider">Last Sync Time</h4>
              <p className="text-xs text-muted-foreground">Today at 10:14 AM (Auto Sync enabled)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
