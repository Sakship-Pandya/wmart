import Image from "next/image";
import Link from "next/link";
import { Package, Laptop, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, discountPercent } from "@/lib/format";
import { ProductRowActions } from "./product-row-actions";
import type { getAdminProducts } from "@/server/queries/admin/products";

type ProductItem = Awaited<ReturnType<typeof getAdminProducts>>["products"][number];

interface ProductTableProps {
  products: ProductItem[];
}

export function ProductTable({ products }: ProductTableProps) {
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
    <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            <TableHead className="min-w-[260px]">Product</TableHead>
            <TableHead className="w-36">Category & Brand</TableHead>
            <TableHead className="w-32">Price & MRP</TableHead>
            <TableHead className="w-28">Stock</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const image = product.images[0];
            const discount = discountPercent(product.mrp, product.price);
            const partCodes = product.partNumbers.map((p) => p.code);

            return (
              <TableRow key={product.id} className="hover:bg-muted/30">
                {/* Thumbnail */}
                <TableCell>
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
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-medium text-foreground hover:underline line-clamp-2"
                      >
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {product.isOriginal ? (
                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/40 text-primary">
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
                  </div>
                </TableCell>

                {/* Category & Brand */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-foreground">{product.brand.name}</div>
                    <div className="text-xs text-muted-foreground">{product.category.name}</div>
                  </div>
                </TableCell>

                {/* Price & MRP */}
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm text-foreground">
                      {formatPrice(product.price)}
                    </div>
                    {product.mrp > product.price && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="line-through">{formatPrice(product.mrp)}</span>
                        {discount > 0 && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Stock Badge */}
                <TableCell>
                  {product.stock <= 0 ? (
                    <Badge variant="destructive" className="text-[11px] font-medium">
                      Out of stock
                    </Badge>
                  ) : product.stock <= 10 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-[11px]"
                    >
                      Low: {product.stock}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      {product.stock} units
                    </Badge>
                  )}
                </TableCell>

                {/* Active / Draft Status */}
                <TableCell>
                  {product.isActive ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium">
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
  );
}

