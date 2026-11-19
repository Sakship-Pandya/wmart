"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, ExternalLink, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandDialog } from "./brand-dialog";
import { deleteBrand } from "@/server/actions/admin/brands";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface BrandListProps {
  initialBrands: BrandItem[];
}

export function BrandList({ initialBrands }: BrandListProps) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Create/Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandItem | null>(null);

  const filteredBrands = initialBrands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  function handleOpenCreate() {
    setSelectedBrand(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(brand: BrandItem) {
    setSelectedBrand({ id: brand.id, name: brand.name, slug: brand.slug });
    setDialogOpen(true);
  }

  function handleOpenDelete(brand: BrandItem) {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!brandToDelete) return;

    startTransition(async () => {
      try {
        await deleteBrand(brandToDelete.id);
        toast.success(`Brand "${brandToDelete.name}" deleted`);
        setDeleteDialogOpen(false);
        setBrandToDelete(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete brand");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter brands..."
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="size-4 mr-1.5" />
          Add Brand
        </Button>
      </div>

      {/* Brands Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Brand Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Assigned Products</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No brands found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Tag className="size-3.5" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{brand.name}</span>
                      <Link
                        href={`/brand/${brand.slug}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {brand.slug}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products?brand=${brand.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs hover:underline text-foreground"
                    >
                      <Package className="size-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="font-normal">
                        {brand._count.products} products
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(brand)}
                        className="size-8"
                      >
                        <Edit className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(brand)}
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Brand Dialog (Create/Edit) */}
      <BrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={selectedBrand}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              {brandToDelete && brandToDelete._count.products > 0 ? (
                <span className="text-destructive font-medium block">
                  Cannot delete &ldquo;{brandToDelete.name}&rdquo; because it has{" "}
                  {brandToDelete._count.products} associated products. You must reassign or remove
                  those products first.
                </span>
              ) : (
                <>
                  Are you sure you want to delete brand &ldquo;{brandToDelete?.name}&rdquo;? This
                  action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            {brandToDelete && brandToDelete._count.products === 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete Brand"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
