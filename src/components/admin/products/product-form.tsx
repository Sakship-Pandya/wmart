"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Laptop,
  Tag,
  Package,
  Layers,
  IndianRupee,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/server/actions/admin/products";
import { BrandDialog } from "@/components/admin/brands/brand-dialog";
import { CategoryDialog } from "@/components/admin/categories/category-dialog";
import { getCategorySpecConfig } from "@/lib/category-specs";

interface BrandOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
  brands: BrandOption[];
  categories: CategoryOption[];
}

interface CustomSpec {
  id: string;
  key: string;
  value: string;
}

export function ProductForm({ initialData, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(initialData?.id);

  // Dynamic brand and category options
  const [brandsList, setBrandsList] = useState(brands);
  const [categoriesList, setCategoriesList] = useState(categories);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // 1. Classification
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? (categories[0]?.id || ""));
  const [brandId, setBrandId] = useState(initialData?.brandId ?? (brands[0]?.id || ""));
  const [isOriginal, setIsOriginal] = useState(initialData?.isOriginal ?? false);

  // 2. Product Name & Description
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");

  // 3. Pricing & Inventory (GST fixed to 18%)
  const [price, setPrice] = useState<string>(initialData?.price ? initialData.price.toString() : "");
  const [mrp, setMrp] = useState<string>(initialData?.mrp ? initialData.mrp.toString() : "");
  const [stock, setStock] = useState<string>(initialData?.stock !== undefined ? initialData.stock.toString() : "0");
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode ?? "");

  // 4. Dynamic Technical Specs according to category
  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    return (initialData?.specs as Record<string, string>) || {};
  });

  // Custom extra specs
  const [customSpecs, setCustomSpecs] = useState<CustomSpec[]>([]);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [customValInput, setCustomValInput] = useState("");

  // 5. Part Numbers & Compatible Models
  const [partNumbers, setPartNumbers] = useState<string[]>(initialData?.partNumbers ?? []);
  const [partInput, setPartInput] = useState("");

  const [compatibleWith, setCompatibleWith] = useState<string[]>(initialData?.compatibleWith ?? []);
  const [compatInput, setCompatInput] = useState("");

  // 6. Product Images & Visibility
  const [images, setImages] = useState<{ url: string; alt?: string }[]>(initialData?.images ?? []);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Determine active category name/slug to select dynamic spec config
  const selectedCategoryObj = useMemo(() => {
    return categoriesList.find((c) => c.id === categoryId);
  }, [categoriesList, categoryId]);

  const currentSpecConfig = useMemo(() => {
    return getCategorySpecConfig(selectedCategoryObj?.name || "");
  }, [selectedCategoryObj]);

  // Update dynamic spec field
  function handleSpecChange(fieldKey: string, value: string) {
    setSpecs((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  }

  // Add custom specification
  function handleAddCustomSpec() {
    if (!customKeyInput.trim() || !customValInput.trim()) return;

    setSpecs((prev) => ({
      ...prev,
      [customKeyInput.trim()]: customValInput.trim(),
    }));

    setCustomSpecs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        key: customKeyInput.trim(),
        value: customValInput.trim(),
      },
    ]);

    setCustomKeyInput("");
    setCustomValInput("");
  }

  function handleRemoveCustomSpec(keyToRemove: string) {
    setSpecs((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });
    setCustomSpecs((prev) => prev.filter((s) => s.key !== keyToRemove));
  }

  // Part Numbers handlers
  function addPartNumbers(text: string) {
    if (!text.trim()) return;
    const items = text
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...partNumbers, ...items]));
    setPartNumbers(merged);
    setPartInput("");
  }

  function removePartNumber(codeToRemove: string) {
    setPartNumbers(partNumbers.filter((p) => p !== codeToRemove));
  }

  // Compatible Models handlers
  function addCompatibleModels(text: string) {
    if (!text.trim()) return;
    const items = text
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...compatibleWith, ...items]));
    setCompatibleWith(merged);
    setCompatInput("");
  }

  function removeCompatibleModel(modelToRemove: string) {
    setCompatibleWith(compatibleWith.filter((m) => m !== modelToRemove));
  }

  // Images handlers
  function addImage() {
    if (!imageUrlInput.trim()) return;
    try {
      new URL(imageUrlInput.trim());
    } catch {
      toast.error("Please enter a valid image URL (e.g. https://...)");
      return;
    }

    setImages([...images, { url: imageUrlInput.trim(), alt: imageAltInput.trim() || undefined }]);
    setImageUrlInput("");
    setImageAltInput("");
  }

  function removeImage(indexToRemove: number) {
    setImages(images.filter((_, i) => i !== indexToRemove));
  }

  // Submit handler
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericPrice = parseFloat(price);
    const numericMrp = parseFloat(mrp);
    const numericStock = parseInt(stock, 10);

    if (!categoryId) {
      toast.error("Please select a category first");
      return;
    }
    if (!brandId) {
      toast.error("Please select a brand");
      return;
    }
    if (!title.trim()) {
      toast.error("Product name / title is required");
      return;
    }
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error("Please enter a valid Selling Price in ₹");
      return;
    }
    if (isNaN(numericMrp) || numericMrp < 0) {
      toast.error("Please enter a valid MRP in ₹");
      return;
    }

    // Filter out empty spec values
    const cleanSpecs: Record<string, string> = {};
    Object.entries(specs).forEach(([k, v]) => {
      if (v && v.trim()) cleanSpecs[k] = v.trim();
    });

    const payload: ProductFormValues = {
      title: title.trim(),
      slug: initialData?.slug || "",
      description: description.trim(),
      brandId,
      categoryId,
      mrp: numericMrp,
      price: numericPrice,
      stock: isNaN(numericStock) ? 0 : Math.max(0, numericStock),
      hsnCode: hsnCode.trim(),
      gstRate: 18, // Fixed to 18% automatically
      isOriginal,
      isActive,
      partNumbers,
      compatibleWith,
      images,
      specs: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : undefined,
    };

    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateProduct(initialData.id, payload);
          toast.success("Product updated successfully!");
        } else {
          await createProduct(payload);
          toast.success("Product created successfully!");
        }
        router.push("/admin/products");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to save product");
      }
    });
  }

  const numericMrp = parseFloat(mrp) || 0;
  const numericPrice = parseFloat(price) || 0;
  const discountPercent =
    numericMrp > 0 && numericPrice < numericMrp
      ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? `Updating "${initialData?.title}"`
                : "Fill in category, brand, details, pricing and dynamic specs."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Cancel
          </Link>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column (2/3 width) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Category & Brand (Classification) */}
          <Card className="border-brand/20 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-brand" />
                Product Classification
              </CardTitle>
              <CardDescription>
                Choose the product category and brand. Technical specs will adapt automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Product Category <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCategoryDialogOpen(true)}
                      className="text-[11px] text-brand hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="size-3" />
                      New Category
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring font-medium"
                    required
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Brand / Manufacturer <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBrandDialogOpen(true)}
                      className="text-[11px] text-brand hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="size-3" />
                      New Brand
                    </button>
                  </div>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring font-medium"
                    required
                  >
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OEM vs Compatible */}
              <div className="pt-2 border-t flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Authenticity Type</span>
                  <span className="text-xs text-muted-foreground">Is this an official OEM product or an aftermarket compatible?</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isOriginal"
                      checked={!isOriginal}
                      onChange={() => setIsOriginal(false)}
                      className="size-4"
                    />
                    <span>Compatible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isOriginal"
                      checked={isOriginal}
                      onChange={() => setIsOriginal(true)}
                      className="size-4"
                    />
                    <span className="font-semibold text-brand">OEM Original</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Name & Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="size-4 text-brand" />
                Product Details
              </CardTitle>
              <CardDescription>
                Enter the product name and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Title / Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Product Name / Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dell 65W Laptop Charger for Latitude 3490, 3590 or HP HS04 41Wh Battery"
                  className="font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description & Overview</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product overview, package contents, warranty terms, and authenticity notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="size-4 text-brand" />
                Pricing & Inventory
              </CardTitle>
              <CardDescription>
                Set selling price, MRP, and stock. GST is fixed at 18% automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Selling Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Selling Price (₹, GST included) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1799"
                      className="pl-7 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* MRP */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      MRP (₹) <span className="text-destructive">*</span>
                    </label>
                    {discountPercent > 0 && (
                      <span className="text-xs text-success font-semibold">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">₹</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="5099"
                      className="pl-7"
                      required
                    />
                  </div>
                </div>

                {/* Current Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Stock Quantity (Units)</label>
                  <Input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="25"
                  />
                </div>

                {/* HSN Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    HSN Code (for GST Invoices)
                  </label>
                  <Input
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="85076000 (Batteries) / 85044030 (Adapters)"
                  />
                </div>
              </div>

              {/* GST Notice Badge */}
              <div className="rounded-md bg-muted/60 p-2.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-success" />
                  <span>GST Rate: <strong>18% (Standard Electronics)</strong> applied automatically.</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="border-brand/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="size-4 text-brand" />
                {currentSpecConfig.title}
              </CardTitle>
              <CardDescription>{currentSpecConfig.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {currentSpecConfig.fields.map((field) => {
                  const currentValue = specs[field.key] ?? "";

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {field.label}
                      </label>
                      <Input
                        value={currentValue}
                        onChange={(e) => handleSpecChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                      {field.defaultSuggestions && field.defaultSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {field.defaultSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => handleSpecChange(field.key, suggestion)}
                              className="text-[10px] rounded border bg-muted/40 px-1.5 py-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Extra Custom Specifications added by Admin */}
              {customSpecs.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <span className="text-xs font-semibold text-foreground">Additional Custom Specs:</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {customSpecs.map((cs) => (
                      <div
                        key={cs.id}
                        className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-1.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold">{cs.key}:</span> <span>{cs.value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSpec(cs.key)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Spec Form Row */}
              <div className="pt-3 border-t">
                <span className="text-xs text-muted-foreground block mb-2 font-medium">
                  Need an extra spec? Add a custom field:
                </span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="Field name (e.g. Panel Brand, Pin Type)"
                    className="sm:w-1/3 text-xs"
                  />
                  <Input
                    value={customValInput}
                    onChange={(e) => setCustomValInput(e.target.value)}
                    placeholder="Value (e.g. BOE, 30 Pin Right)"
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomSpec}
                    className="shrink-0 text-xs"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Add Field
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Part Numbers & Laptop Compatibility */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Laptop className="size-4 text-brand" />
                Part Numbers & Laptop Compatibility
              </CardTitle>
              <CardDescription>
                Crucial for search: customers search by their part number (e.g. &ldquo;HS04&rdquo;) or laptop model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Part Numbers Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5 text-muted-foreground" />
                  Part Numbers / Model Codes (comma or newline separated)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={partInput}
                    onChange={(e) => setPartInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addPartNumbers(partInput);
                      }
                    }}
                    placeholder="e.g. HS04, 807956-001, N2L85AA, MGJN9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addPartNumbers(partInput)}
                    className="shrink-0"
                  >
                    <Plus className="size-4 mr-1" />
                    Add
                  </Button>
                </div>

                {partNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {partNumbers.map((code) => (
                      <Badge
                        key={code}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs font-mono"
                      >
                        {code}
                        <button
                          type="button"
                          onClick={() => removePartNumber(code)}
                          className="hover:text-destructive cursor-pointer rounded-full p-0.5"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Compatible Models Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Laptop className="size-3.5 text-muted-foreground" />
                  Compatible Laptop Models (paste comma or newline list)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={compatInput}
                    onChange={(e) => setCompatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addCompatibleModels(compatInput);
                      }
                    }}
                    placeholder="e.g. Dell Latitude 3490, HP Pavilion 15-ac, ASUS ROG-16"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addCompatibleModels(compatInput)}
                    className="shrink-0"
                  >
                    <Plus className="size-4 mr-1" />
                    Add
                  </Button>
                </div>

                {compatibleWith.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-48 overflow-y-auto">
                    {compatibleWith.map((model) => (
                      <Badge
                        key={model}
                        variant="outline"
                        className="gap-1 pr-1 text-xs"
                      >
                        {model}
                        <button
                          type="button"
                          onClick={() => removeCompatibleModel(model)}
                          className="hover:text-destructive cursor-pointer rounded-full p-0.5"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* STEP 6: Product Images & Visibility */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4 text-brand" />
                Product Images
              </CardTitle>
              <CardDescription>
                Provide direct image URLs. First image serves as the cover thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="flex gap-2">
                  <Input
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="Alt text (optional)"
                    className="text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addImage} className="shrink-0">
                    <Plus className="size-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-lg border bg-muted/20 p-2 flex flex-col items-center justify-center overflow-hidden"
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || `Product image ${index + 1}`}
                        fill
                        sizes="120px"
                        className="object-contain p-2"
                      />
                      {index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-foreground">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1.5 top-1.5 rounded bg-destructive/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                  No images added yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visibility Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Store Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="isActive"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  className="size-4"
                />
                <div>
                  <span className="font-semibold text-xs text-success block">Active (Published)</span>
                  <span className="text-[11px] text-muted-foreground">Visible to customers in the store catalogue</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="isActive"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  className="size-4"
                />
                <div>
                  <span className="font-semibold text-xs text-muted-foreground block">Draft (Hidden)</span>
                  <span className="text-[11px] text-muted-foreground">Saved in admin panel but hidden from customers</span>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Save / Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Inline Brand Dialog */}
      <BrandDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
        onSuccess={(newBrand) => {
          setBrandsList((prev) => [...prev, { id: newBrand.id, name: newBrand.name }]);
          setBrandId(newBrand.id);
        }}
      />

      {/* Inline Category Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={(newCategory) => {
          setCategoriesList((prev) => [...prev, { id: newCategory.id, name: newCategory.name }]);
          setCategoryId(newCategory.id);
        }}
      />
    </form>
  );
}
