"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateSlug } from "@/lib/validations/product";
import { createCategory, updateCategory } from "@/server/actions/admin/categories";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: { id: string; name: string; slug: string } | null;
  onSuccess?: (category: { id: string; name: string; slug: string }) => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <CategoryFormContent
            key={category?.id ?? "new"}
            category={category}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormContent({
  category,
  onOpenChange,
  onSuccess,
}: {
  category?: { id: string; name: string; slug: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (category: { id: string; name: string; slug: string }) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(category?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Category name is required");
      return;
    }

    const slug = generateSlug(trimmed);

    startTransition(async () => {
      try {
        if (isEditing && category) {
          await updateCategory(category.id, { name: trimmed, slug });
          toast.success("Category updated successfully");
          onSuccess?.({ id: category.id, name: trimmed, slug });
        } else {
          const res = await createCategory({ name: trimmed, slug });
          toast.success("Category created successfully");
          onSuccess?.(res.category);
        }
        onOpenChange(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to save category");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update category name."
            : "Enter a store category (e.g. Laptop Batteries, Laptop Screens, Adapters)."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">
            Category Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Laptop Screens, Keyboards, Adapters"
            autoFocus
            required
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
