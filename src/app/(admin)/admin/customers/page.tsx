import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilters } from "@/components/admin/shared/list-filters";
import { ListPagination } from "@/components/admin/shared/list-pagination";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { ExportMenu } from "@/components/admin/shared/export-menu";
import { getAdminCustomers } from "@/server/queries/admin/customers";
import { formatPrice } from "@/lib/format";
import { formatDateIST } from "@/lib/orders";

export const metadata = { title: "Customers | WMart Admin" };

type SearchParams = Promise<{ q?: string; sort?: string; page?: string }>;

export default function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-brand" />
            <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          </div>
          <p className="text-sm text-muted-foreground">Everyone who has an account or has placed an order.</p>
        </div>
        <Suspense fallback={null}>
          <ExportMenu
            endpoint="/api/admin/export/customers"
            carry={["q", "sort"]}
            dateLabel="Joined between"
            allLabel="All customers"
            options={[{ label: "Customers (one row per customer)", primary: true }]}
          />
        </Suspense>
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
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Orders</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead className="hidden xl:table-cell">Last order</TableHead>
              <TableHead className="hidden xl:table-cell">Joined</TableHead>
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
                  <TableCell className="whitespace-normal">
                    <Link href={`/admin/customers/${c.id}`} className="block max-w-[16rem] font-medium text-brand hover:underline [overflow-wrap:anywhere]">
                      {c.name}
                    </Link>
                    <p className="max-w-[16rem] text-xs text-muted-foreground [overflow-wrap:anywhere]">{c.email}</p>
                    {/* Phones/tablets: phone and order count, since those columns are hidden there. */}
                    <p className="text-xs text-muted-foreground lg:hidden">
                      {c.phone && <span>{c.phone}</span>}
                      <span className="sm:hidden">
                        {c.phone ? " · " : ""}
                        {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                      </span>
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">{c.phone ?? "—"}</TableCell>
                  <TableCell className="hidden whitespace-normal text-sm md:table-cell">{c.location || "—"}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{c.orderCount}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(c.totalSpent)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground xl:table-cell">
                    {c.lastOrderAt ? formatDateIST(c.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs xl:table-cell">
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
