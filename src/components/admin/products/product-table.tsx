"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  Laptop,
  AlertCircle,
  Trash2,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortenText } from "@/lib/text";
import { formatPrice, discountPercent } from "@/lib/format";
import { ProductRowActions } from "./product-row-actions";
import {
  deleteManyProducts,
  setManyProductsActive,
  deleteAllFilteredProducts,
  setAllFilteredProductsActive,
  type AdminProductFilterCriteria,
} from "@/server/actions/admin/products";
import type { getAdminProducts } from "@/server/queries/admin/products";

type ProductItem = Awaited<ReturnType<typeof getAdminProducts>>["products"][number];

interface ProductTableProps {
  products: ProductItem[];
  totalCount?: number;
  filters?: AdminProductFilterCriteria;
}

export function ProductTable({ products, totalCount, filters }: ProductTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset selection when products change (e.g., page or filter navigation)
  const [prevProducts, setPrevProducts] = useState(products);
  if (products !== prevProducts) {
    setPrevProducts(products);
    setSelectedIds(new Set());
    setSelectAllAcrossPages(false);
  }

  const effectiveTotal = totalCount ?? products.length;
  const isFiltered = Boolean(
    filters?.q?.trim() ||
    filters?.brand ||
    filters?.category ||
    (filters?.status && filters.status !== "all")
  );

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const someOnPageSelected =
    products.some((p) => selectedIds.has(p.id)) && !allOnPageSelected && !selectAllAcrossPages;

  const totalSelectedCount = selectAllAcrossPages ? effectiveTotal : selectedIds.size;
  const isAnySelected = selectAllAcrossPages || selectedIds.size > 0;

  function handleSelectAllOnPage() {
    setSelectedIds(new Set(products.map((p) => p.id)));
    setSelectAllAcrossPages(false);
  }

  function handleSelectAllAcrossPages() {
    setSelectedIds(new Set(products.map((p) => p.id)));
    setSelectAllAcrossPages(true);
  }

  function handleClearSelection() {
    setSelectedIds(new Set());
    setSelectAllAcrossPages(false);
  }

  function handleToggleHeader() {
    if (selectAllAcrossPages || allOnPageSelected) {
      handleClearSelection();
    } else {
      handleSelectAllOnPage();
    }
  }

  function handleToggleRow(id: string) {
    if (selectAllAcrossPages) {
      setSelectAllAcrossPages(false);
      const next = new Set(products.map((p) => p.id));
      next.delete(id);
      setSelectedIds(next);
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleBulkDelete() {
    if (!isAnySelected) return;

    startTransition(async () => {
      try {
        if (selectAllAcrossPages) {
          const res = await deleteAllFilteredProducts(filters);
          toast.success(`Deleted all ${res.count} products successfully.`);
        } else {
          const ids = Array.from(selectedIds);
          const res = await deleteManyProducts(ids);
          toast.success(`Deleted ${res.count} products successfully.`);
        }
        handleClearSelection();
        setShowBulkDeleteDialog(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete products");
      }
    });
  }

  function handleBulkStatus(isActive: boolean) {
    if (!isAnySelected) return;

    startTransition(async () => {
      try {
        if (selectAllAcrossPages) {
          const res = await setAllFilteredProductsActive(isActive, filters);
          toast.success(
            `Updated all ${res.count} products to ${isActive ? "Active" : "Draft"}.`
          );
        } else {
          const ids = Array.from(selectedIds);
          const res = await setManyProductsActive(ids, isActive);
          toast.success(
            `Updated ${res.count} products to ${isActive ? "Active" : "Draft"}.`
          );
        }
        handleClearSelection();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update products status");
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No products found</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          No products matched your current search and filter criteria. Try clearing some filters or add a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk Action Toolbar (appears when 1 or more items are selected) */}
      {isAnySelected && (
        <div className="flex flex-col gap-2 rounded-lg border border-brand/20 bg-brand/5 px-4 py-2.5 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                {totalSelectedCount}
              </span>
              <span className="text-xs font-medium text-foreground">
                {selectAllAcrossPages
                  ? `All ${effectiveTotal} products selected ${
                      isFiltered ? "(matching current filters)" : "(entire catalogue)"
                    }`
                  : totalSelectedCount === 1
                  ? "1 product selected"
                  : `${totalSelectedCount} products selected`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3 mr-1" />
                Clear
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(true)}
                disabled={isPending}
                className="h-8 text-xs gap-1 cursor-pointer"
              >
                <Eye className="size-3.5" />
                {selectAllAcrossPages ? `Publish all (${effectiveTotal})` : "Publish"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(false)}
                disabled={isPending}
                className="h-8 text-xs gap-1 cursor-pointer"
              >
                <EyeOff className="size-3.5" />
                {selectAllAcrossPages ? `Draft all (${effectiveTotal})` : "Draft"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isPending}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                {selectAllAcrossPages
                  ? `Delete all (${effectiveTotal})`
                  : `Delete (${selectedIds.size})`}
              </Button>
            </div>
          </div>

          {/* Cross-page Select All helper prompt (like Gmail / Shopify) */}
          {allOnPageSelected && !selectAllAcrossPages && effectiveTotal > products.length && (
            <div className="flex items-center gap-2 border-t border-brand/10 pt-2 text-xs text-muted-foreground">
              <span>All {products.length} products on this page are selected.</span>
              <button
                type="button"
                onClick={handleSelectAllAcrossPages}
                className="font-semibold text-brand underline underline-offset-2 hover:text-brand/80 cursor-pointer"
              >
                Select all {effectiveTotal} products {isFiltered ? "matching this filter" : "in your store"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        {/* table-fixed + w-full: columns keep their set widths and the table never grows
            wider than the page, so there is no horizontal scrollbar. */}
        <Table className="table-fixed">
          <TableHeader className="bg-muted/40">
            <TableRow>
              {/* Select All Checkbox & Dropdown */}
              <TableHead className="w-12 px-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleToggleHeader}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    title={
                      selectAllAcrossPages
                        ? "Deselect all products"
                        : allOnPageSelected
                        ? "Deselect all on this page"
                        : "Select all on this page"
                    }
                  >
                    {selectAllAcrossPages || allOnPageSelected ? (
                      <CheckSquare className="size-4 text-brand" />
                    ) : someOnPageSelected ? (
                      <div className="size-4 rounded border-2 border-brand bg-brand/20 flex items-center justify-center">
                        <div className="size-2 bg-brand rounded-xs" />
                      </div>
                    ) : (
                      <Square className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      title="Selection options"
                    >
                      <ChevronDown className="size-3" />
                      <span className="sr-only">Selection options</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuItem
                        onClick={handleSelectAllOnPage}
                        className="cursor-pointer text-xs"
                      >
                        Select this page ({products.length})
                      </DropdownMenuItem>
                      {effectiveTotal > products.length && (
                        <DropdownMenuItem
                          onClick={handleSelectAllAcrossPages}
                          className="cursor-pointer text-xs font-semibold text-brand"
                        >
                          Select all {effectiveTotal} products
                        </DropdownMenuItem>
                      )}
                      {isAnySelected && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleClearSelection}
                            className="cursor-pointer text-xs text-muted-foreground"
                          >
                            Deselect all
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>
              <TableHead className="hidden w-16 sm:table-cell">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="hidden w-32 whitespace-normal lg:table-cell">Category & Brand</TableHead>
              <TableHead className="hidden w-28 whitespace-normal md:table-cell">Price & MRP</TableHead>
              <TableHead className="hidden w-24 md:table-cell">Stock</TableHead>
              <TableHead className="hidden w-20 lg:table-cell">Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const image = product.images[0];
              const discount = discountPercent(product.mrp, product.price);
              const partCodes = product.partNumbers.map((p) => p.code);
              const isSelected = selectAllAcrossPages || selectedIds.has(product.id);

              return (
                <TableRow
                  key={product.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    isSelected ? "bg-brand/5 hover:bg-brand/10" : ""
                  }`}
                >
                  {/* Row Checkbox */}
                  <TableCell className="px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(product.id)}
                      className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4 text-brand" />
                      ) : (
                        <Square className="size-4 text-muted-foreground/60" />
                      )}
                    </button>
                  </TableCell>

                  {/* Thumbnail (hidden on phones) */}
                  <TableCell className="hidden sm:table-cell">
                    <div className="relative flex size-12 items-center justify-center rounded-md border bg-muted/30 overflow-hidden">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.alt ?? product.title}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <Package className="size-5 text-muted-foreground/50" />
                      )}
                    </div>
                  </TableCell>

                  {/* Title & Metadata */}
                  {/* Name cut to 50 characters + "..." (full name on hover). The table uses a
                      fixed layout, so nothing in this cell can make the page scroll sideways. */}
                  <TableCell className="whitespace-normal">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-start gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          title={product.title}
                          className="font-medium text-foreground hover:underline [overflow-wrap:anywhere]"
                        >
                          {shortenText(product.title)}
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {product.isOriginal ? (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 border-brand/40 text-brand">
                            OEM Original
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 text-muted-foreground">
                            Compatible
                          </Badge>
                        )}

                        {partCodes.length > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <span>PN:</span>
                            <span className="font-semibold text-foreground/80">
                              {partCodes.slice(0, 2).join(", ")}
                              {partCodes.length > 2 && ` +${partCodes.length - 2}`}
                            </span>
                          </span>
                        )}

                        {product._count.compatibleWith > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Laptop className="size-3" />
                            <span>{product._count.compatibleWith} models</span>
                          </span>
                        )}
                      </div>

                      {/* Phones / tablets: price, stock and status, since those columns are hidden there. */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs lg:hidden">
                        <span className="font-semibold text-foreground md:hidden">{formatPrice(product.price)}</span>
                        <span
                          className={`md:hidden ${product.stock <= 0 ? "text-destructive" : product.stock <= 10 ? "text-brand" : "text-muted-foreground"}`}
                        >
                          {product.stock <= 0 ? "Out of stock" : `${product.stock} in stock`}
                        </span>
                        <span className={product.isActive ? "text-success" : "text-muted-foreground"}>
                          {product.isActive ? "Active" : "Draft"}
                        </span>
                        <span className="text-muted-foreground sm:hidden">· {product.brand.name}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category & Brand (large screens) */}
                  <TableCell className="hidden whitespace-normal [overflow-wrap:anywhere] lg:table-cell">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-foreground">{product.brand.name}</div>
                      <div className="text-xs text-muted-foreground">{product.category.name}</div>
                    </div>
                  </TableCell>

                  {/* Price & MRP (tablets and up; phones see it under the title) */}
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm text-foreground">
                        {formatPrice(product.price)}
                      </div>
                      {product.mrp > product.price && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="line-through">{formatPrice(product.mrp)}</span>
                          {discount > 0 && (
                            <span className="font-semibold text-success dark:text-success">
                              -{discount}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Stock Badge (tablets and up; phones see it under the title) */}
                  <TableCell className="hidden md:table-cell">
                    {product.stock <= 0 ? (
                      <Badge variant="destructive" className="text-[11px] font-medium">
                        Out of stock
                      </Badge>
                    ) : product.stock <= 10 ? (
                      <Badge
                        variant="outline"
                        className="border-brand/40 text-brand bg-brand/5  text-[11px]"
                      >
                        Low: {product.stock}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {product.stock} units
                      </Badge>
                    )}
                  </TableCell>

                  {/* Active / Draft Status (large screens; smaller ones see it under the title) */}
                  <TableCell className="hidden lg:table-cell">
                    {product.isActive ? (
                      <Badge className="bg-success hover:bg-success text-white text-[11px] font-medium">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[11px]">
                        Draft
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <ProductRowActions product={product} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectAllAcrossPages
                ? `Delete all ${effectiveTotal} products?`
                : `Delete ${selectedIds.size} selected products?`}
            </DialogTitle>
            <DialogDescription>
              {selectAllAcrossPages ? (
                <>
                  Are you sure you want to permanently delete all{" "}
                  <strong>{effectiveTotal} products</strong> across all pages{" "}
                  {isFiltered ? "matching your active search and filters" : "in your entire catalogue"}? All
                  associated images, part numbers, and compatibility records will be removed.
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong>{selectedIds.size}</strong> selected products? All associated
                  images, part numbers, and compatibility records will be removed. This action
                  cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : selectAllAcrossPages ? (
                `Delete all ${effectiveTotal} Products`
              ) : (
                `Delete ${selectedIds.size} Products`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
