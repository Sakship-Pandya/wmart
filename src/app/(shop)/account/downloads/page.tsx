import { Suspense } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountEmptyState } from "@/components/shop/account/empty-state";
import { getCustomerDownloads, type CustomerDownload } from "@/server/queries/account";
import { cn } from "@/lib/utils";

export const metadata = { title: "Downloads" };

// My account → Downloads: files from the customer's orders.
export default function DownloadsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-24 rounded-2xl" />}>
      <DownloadsList />
    </Suspense>
  );
}

async function DownloadsList() {
  const downloads = await getCustomerDownloads();
  if (downloads.length === 0) {
    return <AccountEmptyState message="No downloads available yet." />;
  }
  return <DownloadsTable downloads={downloads} />;
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function DownloadsTable({ downloads }: { downloads: CustomerDownload[] }) {
  return (
    <div className="rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Downloads remaining</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Download</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {downloads.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="whitespace-normal">
                <Link href={`/p/${d.productSlug}`} className="font-medium hover:underline">
                  {d.productTitle}
                </Link>
              </TableCell>
              <TableCell>{d.downloadsRemaining ?? "∞"}</TableCell>
              <TableCell>{d.expiresAt ? dateFormat.format(d.expiresAt) : "Never"}</TableCell>
              <TableCell className="text-right">
                <a href={d.url} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                  <Download data-icon="inline-start" />
                  {d.fileName}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
