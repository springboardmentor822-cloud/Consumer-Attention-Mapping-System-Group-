import * as React from 'react';
import { Eye, TrendingUp, Sparkles, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export function ProductVisibilityPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Product Visibility</h1>
        <p className="text-muted-foreground">Analyze visual attention metrics and optimal placement configurations for high-attraction retail zones.</p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Eye className="h-5 w-5 text-sky-500" />
              Shelf Line-of-Sight Index
            </CardTitle>
            <CardDescription>Top shelf visibility score relative to average shopper height focus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">84%</span>
              <span className="text-sm font-medium text-emerald-500 flex items-center">
                <TrendingUp className="h-4 w-4 mr-0.5" /> +2.1%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: '84%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">Optimal attention window is between 1.2m and 1.6m high.</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Aesthetic Attraction Score
            </CardTitle>
            <CardDescription>Visual packaging appeal of promotional endcap placements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">72/100</span>
              <span className="text-sm font-medium text-emerald-500 flex items-center">
                <TrendingUp className="h-4 w-4 mr-0.5" /> +5.4
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-yellow-500" style={{ width: '72%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">Calculated using facial sentiment and quick gaze metrics.</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
              Product Engagement Rate
            </CardTitle>
            <CardDescription>Ratio of physical interactions compared to total shelf views.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">19.4%</span>
              <span className="text-sm font-medium text-red-500 flex items-center">
                -0.8%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-purple-500" style={{ width: '19.4%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">Engagement represents pick-up rate and cart additions.</p>
          </CardContent>
        </Card>
      </div>

      {/* Visibility Leaderboard */}
      <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Top Visual Attractors</CardTitle>
          <CardDescription>Most viewed items based on real-time gaze capture algorithms.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Premium Coffee Beans A", placement: "Eye-level Shelf 2", rate: "92%", color: "bg-sky-500" },
              { name: "Organic Protein Bar Box", placement: "Checkout Counter 1", rate: "87%", color: "bg-emerald-500" },
              { name: "Imported Sparkling Water", placement: "Cooler Endcap A", rate: "79%", color: "bg-purple-500" },
              { name: "Gourmet Dark Chocolate", placement: "Center Promo Island", rate: "75%", color: "bg-amber-500" },
            ].map((product, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">{product.rate} Attention</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>{product.placement}</span>
                    <div className="h-1.5 w-32 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-1.5 rounded-full ${product.color}`} style={{ width: product.rate }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
