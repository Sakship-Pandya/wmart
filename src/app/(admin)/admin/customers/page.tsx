import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilters } from "@/components/admin/shared/list-filters";
import { ListPagination } from "@/components/admin/shared/list-pagination";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { getAdminCustomers } from "@/server/queries/admin/customers";
import { formatPrice } from "@/lib/format";
import { formatDateIST } from "@/lib/orders";

export const metadata = { title: "Customers | WMart Admin" };

type SearchParams = Promise<{ q?: string; sort?: string; page?: string }>;

export default function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        </div>
        <p className="text-sm text-muted-foreground">Everyone who has an account or has placed an order.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 rounded-lg" />}>
        <CustomersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CustomersContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);
  const data = await getAdminCustomers({ q: params.q, sort: params.sort, page: Number.isNaN(page) ? 1 : page, pageSize: 20 });

  return (
    <div className="space-y-4">
      <ListFilters
        placeholder="Search by name, email, phone, city or pincode"
        selects={[
          {
            param: "sort",
            label: "Sort customers",
            defaultValue: "newest",
            options: [
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "spent", label: "Top spenders" },
              { value: "orders", label: "Most orders" },
              { value: "name", label: "Name A–Z" },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead>Last order</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              data.customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm">{c.location || "—"}</TableCell>
                  <TableCell className="text-right">{c.orderCount}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(c.totalSpent)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {c.lastOrderAt ? formatDateIST(c.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className="text-muted-foreground">{formatDateIST(c.createdAt)}</span>
                    {!c.hasAccount && <StatusPill tone="neutral" label="Guest" className="ml-1.5" />}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination currentPage={data.currentPage} totalPages={data.totalPages} totalCount={data.totalCount} pageSize={data.pageSize} noun="customers" />
    </div>
  );
}
