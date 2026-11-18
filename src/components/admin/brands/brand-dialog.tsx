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
import { createBrand, updateBrand } from "@/server/actions/admin/brands";

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: { id: string; name: string; slug: string } | null;
  onSuccess?: (brand: { id: string; name: string; slug: string }) => void;
}

export function BrandDialog({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: BrandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <BrandFormContent
            key={brand?.id ?? "new"}
            brand={brand}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BrandFormContent({
  brand,
  onOpenChange,
  onSuccess,
}: {
  brand?: { id: string; name: string; slug: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (brand: { id: string; name: string; slug: string }) => void;
}) {
  const [name, setName] = useState(brand?.name ?? "");
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(brand?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Brand name is required");
      return;
    }

    const slug = generateSlug(trimmed);

    startTransition(async () => {
      try {
        if (isEditing && brand) {
          await updateBrand(brand.id, { name: trimmed, slug });
          toast.success("Brand updated successfully");
          onSuccess?.({ id: brand.id, name: trimmed, slug });
        } else {
          const res = await createBrand({ name: trimmed, slug });
          toast.success("Brand created successfully");
          onSuccess?.(res.brand);
        }
        onOpenChange(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to save brand");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update brand or manufacturer name."
            : "Enter a manufacturer or brand name (e.g. Dell, HP, Lenovo)."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">
            Brand Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lenovo, Dell, Asus, Apple"
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
          {isEditing ? "Save Changes" : "Create Brand"}
        </Button>
      </DialogFooter>
    </form>
  );
}
