"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 5000;

/**
 * Rotating hero banner with smaller previous/next slides peeking in at the sides.
 * Slides are rendered on the server and passed as children.
 * - Changes slide every 5 s; pauses on hover, while a slide has keyboard focus, when the tab is
 *   hidden, and never auto-rotates with "reduce motion" switched on.
 * - Click/tap anywhere left of the card for the previous slide, right of it for the next one.
 * - Dots sit below the carousel; keyboard ←/→ and swipe also work.
 * - Loops: the last slide peeks to the left of the first one.
 * - All slides share one grid cell, so the banner never jumps in height between slides.
 */
export function HeroCarousel({ children, labels }: { children: ReactNode; labels: string[] }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Bumped on every manual change so the 5-second timer restarts from zero.
  const [tick, setTick] = useState(0);
  const touchStart = useRef<number | null>(null);
  const dragStartX = useRef<number | null>(null);
  const lastWheelTime = useRef<number>(0);

  const go = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      setTick((t) => t + 1);
    },
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const running = count > 1 && !hovering && !focused && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [running, count, tick]);

  if (count === 0) return null;

  /** Position relative to the current slide: 0 = centre, -1 = left peek, +1 = right peek, others hidden. */
  const offsetOf = (i: number) => {
    let d = (((i - index) % count) + count) % count;
    if (d > count / 2) d -= count;
    return d;
  };

  /** Horizontal scroll (trackpad two-finger swipe or Shift + mouse wheel). */
  const handleWheel = (e: React.WheelEvent) => {
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const delta = isHorizontal ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!delta) return;

    if (Math.abs(delta) > 18 && Date.now() - lastWheelTime.current > 350) {
      lastWheelTime.current = Date.now();
      go(index + (delta > 0 ? 1 : -1));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button, input")) return;
    dragStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current !== null) {
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 40) {
        go(index + (dx < 0 ? 1 : -1));
      }
    }
    dragStartX.current = null;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      className="space-y-3"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      // Only keyboard focus pauses rotation – a mouse click on a dot/arrow shouldn't stop it.
      onFocus={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocused(false)}
    >
      <div
        className="group/carousel relative -mx-4 overflow-hidden select-none cursor-grab active:cursor-grabbing [--w:88%] sm:mx-0 sm:[--w:calc(86%+95px)] lg:[--w:calc(84%+95px)]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          dragStartX.current = null;
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        {/* --w = width of the current slide; the space either side shows the smaller neighbours. */}
        {/* The mask fades the side previews out at the edges instead of a hard cut-off. */}
        <div
          className="grid [mask-image:linear-gradient(to_right,transparent,black_0.75%,black_99.25%,transparent)]"
          aria-live={running ? "off" : "polite"}>
          {slides.map((slide, i) => {
            const offset = count > 1 ? offsetOf(i) : 0;
            const active = offset === 0;
            const peeking = Math.abs(offset) === 1;
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}: ${labels[i] ?? ""}`}
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  "col-start-1 row-start-1 ml-[calc((100%-var(--w))/2)] w-(--w) transition-[transform,opacity,filter] duration-700 ease-out motion-reduce:transition-none",
                  active && "z-10",
                  peeking && "opacity-40 saturate-50",
                  !active && !peeking && "opacity-0",
                )}
                style={{
                  // Neighbours are scaled down towards the current card, so they stay close to it.
                  transform: `translateX(calc(${offset} * (100% + 1rem))) scale(${active ? 1 : 0.8})`,
                  transformOrigin: offset < 0 ? "right center" : offset > 0 ? "left center" : "center",
                }}
              >
                {slide}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            {/* Click/tap areas covering everything left and right of the current card. */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => go(index - 1)}
              className="absolute inset-y-0 left-0 z-10 w-[calc((100%-var(--w))/2)] cursor-pointer"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => go(index + 1)}
              className="absolute inset-y-0 right-0 z-10 w-[calc((100%-var(--w))/2)] cursor-pointer"
            />

            {/* Prominent arrow navigation buttons */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(index - 1);
              }}
              aria-label="Previous slide"
              className="absolute left-2 sm:left-4 top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-background/90 text-heading shadow-md border border-border/40 backdrop-blur-sm transition hover:bg-background hover:scale-105 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(index + 1);
              }}
              aria-label="Next slide"
              className="absolute right-2 sm:right-4 top-1/2 z-20 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-background/90 text-heading shadow-md border border-border/40 backdrop-blur-sm transition hover:bg-background hover:scale-105 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}: ${labels[i] ?? ""}`}
              aria-current={i === index ? "true" : undefined}
              className={cn("h-2 rounded-full transition-all", i === index ? "w-7 bg-brand" : "w-2 bg-heading/20 hover:bg-heading/40")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
