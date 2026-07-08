import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { PageHeader } from '../../components/common/PageHeader';
import { BarChart3, TrendingUp, Clock, ShoppingCart } from 'lucide-react';

export function AnalyticsPage(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Behavior Analytics"
        description="Review customer trajectory models, dwell-time parameters, and product interaction rates."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Store Traffic Trend
            </CardTitle>
            <CardDescription>Average weekly visitor volume indexing.</CardDescription>
          </CardHeader>
          <CardContent className="h-48 flex items-end justify-between gap-2 pt-6">
            {[45, 60, 55, 70, 80, 65, 90].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-emerald-500/80 rounded-t-sm" style={{ height: `${val}%` }} />
                <span className="text-[10px] text-muted-foreground mt-1">Day {i + 1}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Dwell Time by Category
            </CardTitle>
            <CardDescription>Average duration spent in front of shelf sectors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { category: 'Cosmetics Shelf', time: '4.8 mins' },
              { category: 'Beverages Cooler', time: '3.2 mins' },
              { category: 'Snack Aisle', time: '2.5 mins' },
              { category: 'Bakery Display', time: '5.1 mins' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-border pb-2 text-sm">
                <span className="font-medium text-muted-foreground">{item.category}</span>
                <span className="font-semibold text-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-sky-500" />
              Conversion Index
            </CardTitle>
            <CardDescription>Correlation between shelf interaction and checkout conversions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Attention-to-Touch Rate</span>
                <span>72%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: '72%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Touch-to-Purchase Rate</span>
                <span>38%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '38%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
