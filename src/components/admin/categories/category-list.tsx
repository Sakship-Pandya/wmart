"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, ExternalLink, Package, Layers } from "lucide-react";
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
import { CategoryDialog } from "./category-dialog";
import { deleteCategory } from "@/server/actions/admin/categories";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface CategoryListProps {
  initialCategories: CategoryItem[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Create/Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const filteredCategories = initialCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  function handleOpenCreate() {
    setSelectedCategory(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(category: CategoryItem) {
    setSelectedCategory({ id: category.id, name: category.name, slug: category.slug });
    setDialogOpen(true);
  }

  function handleOpenDelete(category: CategoryItem) {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!categoryToDelete) return;

    startTransition(async () => {
      try {
        await deleteCategory(categoryToDelete.id);
        toast.success(`Category "${categoryToDelete.name}" deleted`);
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete category");
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
            placeholder="Filter categories..."
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="size-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="hidden w-10 sm:table-cell"></TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead className="hidden lg:table-cell">Slug</TableHead>
              <TableHead>Assigned Products</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/30">
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Layers className="size-3.5" />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal font-medium text-foreground [overflow-wrap:anywhere]">
                    <div className="flex items-center gap-2">
                      <span>{category.name}</span>
                      <Link
                        href={`/c/${category.slug}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products?category=${category.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs hover:underline text-foreground"
                    >
                      <Package className="size-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="font-normal">
                        {category._count.products} products
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(category)}
                        className="size-8"
                      >
                        <Edit className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(category)}
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

      {/* Category Dialog (Create/Edit) */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {categoryToDelete && categoryToDelete._count.products > 0 ? (
                <span className="text-destructive font-medium block">
                  Cannot delete &ldquo;{categoryToDelete.name}&rdquo; because it has{" "}
                  {categoryToDelete._count.products} associated products. You must reassign or remove
                  those products first.
                </span>
              ) : (
                <>
                  Are you sure you want to delete category &ldquo;{categoryToDelete?.name}&rdquo;?
                  This action cannot be undone.
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
            {categoryToDelete && categoryToDelete._count.products === 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete Category"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
