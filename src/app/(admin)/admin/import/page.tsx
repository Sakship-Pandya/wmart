import { Upload } from "lucide-react";
import { ImportView } from "@/components/admin/import/import-view";

export const metadata = {
  title: "Bulk Import | WMart Admin",
};

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Upload className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Import products, prices, images, part numbers, and stock from Shopify, WooCommerce, or CSV files.
        </p>
      </div>

      <ImportView />
    </div>
  );
}
