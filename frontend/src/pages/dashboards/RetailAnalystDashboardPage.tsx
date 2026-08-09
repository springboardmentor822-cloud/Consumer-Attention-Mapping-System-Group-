import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, Boxes, Building2, IndianRupee, LayoutGrid, Package, Users } from "lucide-react";
import KpiCard from "../../components/ui/KpiCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { useInventorySummary, useSegmentation } from "../../hooks/useAnalyticsDashboard";

export default function RetailAnalystDashboardPage() {
  const inventory = useInventorySummary();
  const segmentation = useSegmentation();

  const loading = inventory.isLoading || segmentation.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Retail Analyst Dashboard</h1>
        <p className="text-sm text-slate-400">Overview across all stores - read-only</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Products"
          value={inventory.data?.total_products ?? 0}
          icon={Package}
          accent="blue"
          loading={loading}
        />
        <KpiCard
          label="Total Customers Tracked"
          value={segmentation.data?.total_customers ?? 0}
          icon={Users}
          accent="emerald"
          loading={loading}
        />
        <KpiCard
          label="Total Inventory Items"
          value={inventory.data?.total_inventory_items ?? 0}
          icon={Boxes}
          accent="violet"
          loading={loading}
        />
        <KpiCard
          label="Inventory Value"
          value={inventory.data ? `₹${inventory.data.inventory_value.toLocaleString()}` : "₹0"}
          hint="Sum of price x stock - not a sales figure"
          icon={IndianRupee}
          accent="amber"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Low Stock Products"
          value={inventory.data?.low_stock_products ?? 0}
          hint="Below 10 units"
          icon={AlertTriangle}
          accent="rose"
          loading={loading}
        />
        <KpiCard
          label="Product Categories"
          value={inventory.data?.categories.length ?? 0}
          icon={LayoutGrid}
          accent="blue"
          loading={loading}
        />
        <KpiCard
          label="Multi-Zone Visitors"
          value={segmentation.data ? `${segmentation.data.multi_zone_visitor_pct}%` : "0%"}
          hint="Visited more than one zone"
          icon={BarChart3}
          accent="emerald"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Go to</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/analyst/analytics"
            className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white"
          >
            <BarChart3 size={18} className="text-blue-400" /> Analytics
          </Link>
          <Link
            to="/analyst/product-analysis"
            className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white"
          >
            <Package size={18} className="text-violet-400" /> Product Analysis
          </Link>
          <Link
            to="/analyst/shelf-analysis"
            className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white"
          >
            <LayoutGrid size={18} className="text-amber-400" /> Shelf Analysis
          </Link>
          <Link
            to="/analyst/store-reports"
            className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3 text-sm text-slate-300 transition hover:bg-black/50 hover:text-white"
          >
            <Building2 size={18} className="text-emerald-400" /> Store Reports
          </Link>
        </div>
      </Card>

      <p className="text-xs text-slate-600">
        Repeat Visitors and Inventory Accuracy aren't shown - no repeat-visit identity tracking or inventory-audit
        data exists in this schema yet, and this dashboard doesn't fabricate numbers for metrics that aren't real.
      </p>
    </div>
  );
}
