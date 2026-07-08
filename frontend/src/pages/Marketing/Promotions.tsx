import * as React from 'react';
import { Tag, TrendingUp, Sparkles, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export function PromotionsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Promotion Performance</h1>
        <p className="text-muted-foreground">Track the effectiveness of active promotional spaces, banners, and discounts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Tag className="h-5 w-5 text-amber-500" />
              Promo Space Allocation
            </CardTitle>
            <CardDescription>Percent of retail space dedicated to promotional activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">14.6%</div>
            <p className="text-xs text-muted-foreground">Optimal balance target is 12% - 15%.</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Promotion Lift Rate
            </CardTitle>
            <CardDescription>Sales growth lift compared to baseline product placement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">+24.8%</div>
            <p className="text-xs text-emerald-500 font-medium">Outperforming baseline target by 4%</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-sky-500" />
              Gaze Duration lift
            </CardTitle>
            <CardDescription>Average boost in visual dwell time on promo materials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">3.8s</div>
            <p className="text-xs text-muted-foreground">Average dwell was 1.1s before promo markers.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Top Performing Promotions</CardTitle>
            <CardDescription>Promotions generating highest engagement and sales lift.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Buy 1 Get 1 Coffee Endcap", lift: "+42%", engagement: "89/100" },
              { name: "Healthy Snack Checkout Tray", lift: "+31%", engagement: "82/100" },
              { name: "Organic Cosmetics Endcap B", lift: "+18%", engagement: "64/100" },
            ].map((promo, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div>
                  <h3 className="font-medium text-sm">{promo.name}</h3>
                  <p className="text-xs text-muted-foreground">Engagement Index: {promo.engagement}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                    {promo.lift} Lift
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Underperforming Promotions
            </CardTitle>
            <CardDescription>Promos with low visual attention and low conversion lift.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Kitchen Cleaning Spray Banner", lift: "+2%", engagement: "24/100", recommendation: "Reposition to eye level or update creative banner." },
              { name: "Discount Canned Goods Endcap", lift: "-1%", engagement: "19/100", recommendation: "Low visibility zone. Move to Aisle Entryway." },
            ].map((promo, idx) => (
              <div key={idx} className="space-y-1 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">{promo.name}</h3>
                  <span className="inline-flex items-center rounded bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500">
                    {promo.lift} Lift
                  </span>
                </div>
                <p className="text-xs text-muted-foreground"><strong>Fix Recommendation:</strong> {promo.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
