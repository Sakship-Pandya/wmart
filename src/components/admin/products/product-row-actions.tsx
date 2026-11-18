"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, ExternalLink, Edit, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { toggleProductActive, deleteProduct } from "@/server/actions/admin/products";

interface ProductRowActionsProps {
  product: {
    id: string;
    slug: string;
    title: string;
    isActive: boolean;
  };
}

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleToggleActive() {
    startTransition(async () => {
      try {
        const result = await toggleProductActive(product.id);
        toast.success(
          result.isActive ? "Product published to store" : "Product marked as draft"
        );
      } catch {
        toast.error("Failed to update product status");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProduct(product.id);
        setShowDeleteDialog(false);
        toast.success("Product deleted successfully");
      } catch {
        toast.error("Failed to delete product");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Quick Edit link */}
        <Link
          href={`/admin/products/${product.id}/edit`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "h-8 px-2 text-xs" })}
        >
          <Edit className="size-3.5 mr-1" />
          Edit
        </Link>

        {/* Dropdown Menu for more actions */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: "ghost",
              size: "icon-sm",
              className: "size-8 p-0 cursor-pointer",
            })}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
            <span className="sr-only">Open menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => window.open(`/p/${product.slug}`, "_blank")}
              className="cursor-pointer"
            >
              <ExternalLink className="size-4 mr-2" />
              View in store
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleToggleActive} className="cursor-pointer">
              {product.isActive ? (
                <>
                  <EyeOff className="size-4 mr-2" />
                  Mark as Draft
                </>
              ) : (
                <>
                  <Eye className="size-4 mr-2" />
                  Publish to Store
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <Trash2 className="size-4 mr-2" />
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{product.title}&rdquo;? This will remove all associated
              images, part numbers, and compatibility links. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
