import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Eye,
  TrendingUp,
  Percent,
  Sparkles,
  Zap,
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';

export function MarketingManagerDashboard(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Marketing Hub</span>
          <h2 className="text-2xl font-bold mt-1">Campaign Analytics & Promotion Engagement</h2>
        </div>
        <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200">
          Marketing Manager Active
        </Badge>
      </div>

      {/* Grid Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attention Score</p>
              <p className="text-3xl font-bold mt-1">82.4%</p>
              <p className="text-xs text-emerald-500 mt-1">🔥 +3.4% lift</p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-500">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Campaign Conversion</p>
              <p className="text-3xl font-bold mt-1">14.8%</p>
              <p className="text-xs text-emerald-500 mt-1">📈 +1.2% this week</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Promo Performance</p>
              <p className="text-3xl font-bold mt-1">04 Active</p>
              <p className="text-xs text-muted-foreground mt-1">2 categories targeted</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Visibility</p>
              <p className="text-3xl font-bold mt-1">78.1%</p>
              <p className="text-xs text-muted-foreground mt-1">Line-of-sight tracking</p>
            </div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-500">
              <Eye className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Campaign Metrics */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Promo Lift Leaderboard</CardTitle>
            <CardDescription>Highest revenue lift margins from custom visual prompts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { rank: '1', name: 'Summer Beverage Endcap A', lift: '+42%', score: '94' },
              { rank: '2', name: 'Snack Checkout Tray 3', lift: '+31%', score: '82' },
              { rank: '3', name: 'Organic Cosmetics Shelf C', lift: '+18%', score: '68' },
            ].map((item) => (
              <div key={item.rank} className="flex items-center justify-between border-b border-border pb-3 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">#{item.rank} {item.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Attention Index: {item.score}/100</p>
                </div>
                <Badge variant="secondary" className="font-bold text-emerald-600 dark:text-emerald-300">{item.lift} Lift</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-500 animate-pulse" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Dynamic layout optimizations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: "Move organic bars to Shelf 2", impact: "High (+18%)" },
              { title: "Swap Aisle 3 drinks to Endcap A", impact: "Medium (+12%)" },
            ].map((rec, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border/40 text-xs">
                <div className="flex justify-between font-medium">
                  <span>{rec.title}</span>
                  <span className="text-emerald-500">{rec.impact}</span>
                </div>
              </div>
            ))}
            <Link to="/marketing/recommendations" className="block text-xs font-semibold text-indigo-500 hover:underline text-right mt-2">
              Open Recommendation Engine &rarr;
            </Link>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Console Shortcuts</CardTitle>
            <CardDescription>Direct navigation shortcuts to marketing features.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/marketing/campaign-analytics" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Megaphone className="h-4 w-4 mr-2" /> Campaign Performance</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/marketing/product-visibility" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Eye className="h-4 w-4 mr-2" /> Product Visibility</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/marketing/promotions" className="block w-full">
              <Button variant="outline" className="justify-between w-full">
                <span className="flex items-center"><Percent className="h-4 w-4 mr-2" /> Promo Effectiveness</span>
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
