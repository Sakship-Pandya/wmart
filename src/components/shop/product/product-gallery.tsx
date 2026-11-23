"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string | null };

/**
 * Product photos: large image that zooms where the mouse points, click to enlarge,
 * and thumbnails underneath – like the old site's gallery.
 */
export function ProductGallery({ images, title, badge }: { images: Img[]; title: string; badge?: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const current = images[index];

  if (!current) {
    return <div className="aspect-square rounded-2xl bg-muted" aria-label="No photo available" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-background">
        <button
          type="button"
          onClick={() => setOpen(true)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          aria-label="Click to enlarge"
          className="relative block size-full cursor-zoom-in"
        >
          <Image
            src={current.url}
            alt={current.alt ?? title}
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain p-6 transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        </button>
        {badge && (
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-sale-badge px-2.5 py-1 text-xs font-bold text-background">{badge}</span>
        )}
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
          <Expand className="size-3.5" /> Click to enlarge
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="listitem"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-xl border-2 bg-background transition",
                i === index ? "border-brand" : "border-transparent hover:border-border",
              )}
            >
              <Image src={img.url} alt="" fill sizes="72px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative aspect-square max-h-[80vh] w-full">
            <Image src={current.url} alt={current.alt ?? title} fill sizes="90vw" className="object-contain" />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn("size-2.5 rounded-full", i === index ? "bg-brand" : "bg-muted-foreground/30")}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
