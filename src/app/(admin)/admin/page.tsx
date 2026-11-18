import { Suspense } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Upload,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboardSummary } from "@/server/queries/admin/products";
import { formatPrice } from "@/lib/format";

export const metadata = {
  title: "Dashboard | WMart Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your product catalogue, stock levels, and store status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/import"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Upload className="size-4 mr-1.5" />
            Bulk Import
          </Link>
          <Link
            href="/admin/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="size-4 mr-1.5" />
            Add Product
          </Link>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const { metrics, recentProducts, lowStockProducts } = await getAdminDashboardSummary();

  return (
    <div className="space-y-6">
      {/* Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published / Active</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.activeProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Live in store front</p>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs inventory restocking</p>
          </CardContent>
        </Card>

        {/* Brands & Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Brands & Categories</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalBrands} <span className="text-sm font-normal text-muted-foreground">brands</span> /{" "}
              {metrics.totalCategories} <span className="text-sm font-normal text-muted-foreground">cats</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">HP, Dell, Batteries, Adapters</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row: Recent Products & Low Stock Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recently Added Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                Recently Added
              </CardTitle>
              <CardDescription>Latest products added to catalogue</CardDescription>
            </div>
            <Link
              href="/admin/products"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No products found.</p>
            ) : (
              <div className="divide-y text-sm">
                {recentProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium hover:underline truncate block"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{p.brand.name}</span>
                        <span>•</span>
                        <span>{p.category.name}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-xs">{formatPrice(p.price)}</div>
                      <Badge
                        variant={p.isActive ? "secondary" : "outline"}
                        className="text-[10px] h-4 py-0"
                      >
                        {p.isActive ? "Active" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Inventory Alerts
              </CardTitle>
              <CardDescription>Items with &le; 5 units in stock</CardDescription>
            </div>
            <Link
              href="/admin/products?status=out-of-stock"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Filter out of stock
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-6 text-emerald-600 mx-auto mb-2" />
                All products have healthy inventory levels (&gt; 5 units).
              </div>
            ) : (
              <div className="divide-y text-sm">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium hover:underline truncate block"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{p.brand.name}</div>
                    </div>
                    <div className="shrink-0">
                      {p.stock <= 0 ? (
                        <Badge variant="destructive" className="text-[10px] h-4 py-0">
                          Out of stock (0)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 py-0 border-amber-500/40 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                        >
                          {p.stock} left
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
