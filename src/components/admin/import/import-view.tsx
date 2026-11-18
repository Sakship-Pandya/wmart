"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  ArrowRight,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { importProductsCsvAction, type ImportResult } from "@/server/actions/admin/import";

export function ImportView() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [previewRowsCount, setPreviewRowsCount] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }

    setFile(selected);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      setPreviewRowsCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(selected);
  }

  function handleImport() {
    if (!fileContent.trim()) {
      toast.error("Please select a valid CSV file first.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await importProductsCsvAction(fileContent);
        setResult(res);
        if (res.success) {
          toast.success(
            `Import complete! Created ${res.createdCount}, updated ${res.updatedCount} products.`
          );
        } else {
          toast.error("Import failed. See details below.");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  function handleReset() {
    setFile(null);
    setFileContent("");
    setPreviewRowsCount(0);
    setResult(null);
  }

  function downloadSampleTemplate(type: "standard" | "shopify" | "woocommerce") {
    let csv = "";
    let filename = "";

    if (type === "standard") {
      filename = "wmart-standard-sample.csv";
      csv = `Title,Brand,Category,Price,MRP,Stock,PartNumbers,CompatibleModels,Images,Description
HP HS04 41Wh 4 Cell Battery,HP,Laptop Batteries,1799,5099,25,"HS04, 807956-001, N2L85AA","HP 250 G4, HP Pavilion 15-ac",https://example.com/hs04.jpg,"Original replacement battery for HP."
Dell 65W Laptop Charger,Dell,Laptop Adapters,948,3349,40,MGJN9,"Dell Latitude 3490, Dell Latitude 3590",https://example.com/dell65w.jpg,"65W laptop adapter 19.5V 3.34A 4.5mm Blue Pin."`;
    } else if (type === "shopify") {
      filename = "shopify-products-sample.csv";
      csv = `Handle,Title,Body (HTML),Vendor,Type,Tags,Variant SKU,Variant Price,Variant Compare At Price,Variant Inventory Qty,Image Src
hp-hs04-battery,HP HS04 41Wh Battery,<p>Original battery</p>,HP,Laptop Batteries,"Battery, HS04",HS04,1799.00,5099.00,25,https://example.com/hs04.jpg
dell-65w-adapter,Dell 65W Laptop Charger,<p>Original charger</p>,Dell,Laptop Adapters,"Charger, Adapter",MGJN9,948.00,3349.00,40,https://example.com/dell65w.jpg`;
    } else {
      filename = "woocommerce-products-sample.csv";
      csv = `ID,Type,SKU,Name,Description,Regular price,Sale price,Categories,Images,Stock
101,simple,HS04,HP HS04 41Wh Battery,Original replacement battery,5099,1799,Laptop Batteries,https://example.com/hs04.jpg,25
102,simple,MGJN9,Dell 65W Laptop Charger,Genuine charger,3349,948,Laptop Adapters,https://example.com/dell65w.jpg,40`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Upload Product CSV
          </CardTitle>
          <CardDescription>
            Supports automatic detection for <strong>Shopify Product Exports</strong>,{" "}
            <strong>WooCommerce Product Exports</strong>, and <strong>WMart Standard CSV</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 bg-muted/10">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              disabled={isPending}
            />
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <FileText className="size-6" />
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB &bull; ~{previewRowsCount} product rows detected
                </p>
                <p className="text-[11px] text-primary pt-1 font-medium">
                  Click or drag another file to replace
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Drag and drop your .csv file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Shopify, WooCommerce, or Standard CSV format
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || isPending}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing & Importing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Start Bulk Import
                  </>
                )}
              </Button>

              {file && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isPending}
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Reset
                </Button>
              )}
            </div>

            {/* Template download buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground mr-1">Download templates:</span>
              <button
                type="button"
                onClick={() => downloadSampleTemplate("standard")}
                className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer"
              >
                <Download className="size-3" />
                Standard CSV
              </button>
              <button
                type="button"
                onClick={() => downloadSampleTemplate("shopify")}
                className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer"
              >
                <Download className="size-3" />
                Shopify Export
              </button>
              <button
                type="button"
                onClick={() => downloadSampleTemplate("woocommerce")}
                className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer"
              >
                <Download className="size-3" />
                WooCommerce
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Results Card */}
      {result && (
        <Card className="border-primary/20 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Import Summary
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Format: {result.formatDetected}
              </Badge>
            </div>
            <CardDescription>
              {result.success
                ? "Products, categories, brands, images, and part numbers were processed successfully."
                : "Import finished with some warnings or skipped items."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block">Total Records</span>
                <span className="text-xl font-bold">{result.totalParsed}</span>
              </div>
              <div className="rounded-lg border bg-emerald-500/10 p-3">
                <span className="text-xs text-emerald-600 font-medium block">Created New</span>
                <span className="text-xl font-bold text-emerald-600">+{result.createdCount}</span>
              </div>
              <div className="rounded-lg border bg-primary/10 p-3">
                <span className="text-xs text-primary font-medium block">Updated</span>
                <span className="text-xl font-bold text-primary">{result.updatedCount}</span>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground block">Skipped / Errors</span>
                <span className="text-xl font-bold text-muted-foreground">{result.skippedCount}</span>
              </div>
            </div>

            {/* Error logs */}
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertCircle className="size-4" />
                  <span>Items with issues ({result.errors.length}):</span>
                </div>
                <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <li key={i} className="font-mono text-[11px]">
                      &bull; {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/admin/products"
                className={buttonVariants({ size: "sm" })}
              >
                View Imported Products in Catalogue
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            How Bulk Import Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>
            &bull; <strong>Auto-Categorization & Brand creation:</strong> If a vendor (brand) or category in your CSV doesn&apos;t exist yet in the database, it will be automatically created on the fly.
          </p>
          <p>
            &bull; <strong>Safe Re-runs (Upsert):</strong> Products are matched by handle/slug. Re-running the import updates pricing, stock, part numbers, and images without duplicating products.
          </p>
          <p>
            &bull; <strong>SEO Redirection preservation:</strong> Original store URLs (e.g. <code className="bg-muted px-1 py-0.5 rounded">/products/hp-hs04-battery</code> from Shopify or <code className="bg-muted px-1 py-0.5 rounded">/product/hp-hs04/</code> from WooCommerce) are stored in the product record for automatic 301 redirects to maintain your Google rankings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

