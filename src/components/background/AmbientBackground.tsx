"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BRAND, hexToRgb } from "@/lib/brand";
import styles from "./ambient-background.module.css";

// The site has one brand ramp, so the canvas takes it straight from brand.ts.
const RAMP = [hexToRgb(BRAND.deep), hexToRgb(BRAND.mid), hexToRgb(BRAND.bright)] as const;

const rgba = (c: readonly [number, number, number], a: number) => `rgba(${c.join(",")},${a})`;

// Orbits overshoot the viewport on purpose so the gradients light the corners. Radii stay
// under 0.42: at 1440px the old 0.46-0.55 spanned most of the screen, so the falloff never
// landed anywhere and the scene read as one flat field.
const BLOBS = [
  { c: 0, r: 0.42, sp: 0.1, sw: 0.42, ox: 0.25, oy: 0.25 },
  { c: 1, r: 0.38, sp: 0.08, sw: 0.48, ox: 0.75, oy: 0.4 },
  { c: 2, r: 0.34, sp: 0.12, sw: 0.4, ox: 0.5, oy: 0.8 },
] as const;

// Alphas tuned for `lighter` on the near-black ground, where additive light falls off fast.
const NEBULA = { core: 0.26, mid: 0.1 } as const;
const GLOW = { core: 0.16, mid: 0.09 } as const;

const IDLE_AFTER_MS = 3500;

/**
 * Three-blob gradient nebula (45% autonomous drift + 55% pointer pull) plus a glow on the
 * eased pointer, composited additively. After 3.5s idle the target
 * tours the viewport on a Lissajous path, which is also what animates it on touch devices.
 */
export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    // Capture as non-null locals so they stay narrowed inside the closures.
    const cv = canvas;
    const ctx = context;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ptr = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.42,
      tx: window.innerWidth / 2,
      ty: window.innerHeight * 0.42,
    };
    let lastInput = -Infinity;

    function resize() {
      const bounds = cv.getBoundingClientRect();
      w = bounds.width || window.innerWidth;
      h = bounds.height || window.innerHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ptr.x = ptr.tx = w / 2;
      ptr.y = ptr.ty = h * 0.42;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Resizing clears the bitmap; without a loop (reduced motion) the
      // canvas would stay blank until the next frame that never comes.
      draw(0);
    }

    function draw(t: number) {
      const m = Math.max(w, h);
      ctx.clearRect(0, 0, w, h);

      // Nebula (the slow layer).
      ctx.globalCompositeOperation = "lighter";
      BLOBS.forEach((b, i) => {
        const dx = b.ox + Math.cos(t * b.sp + i * 2.1) * b.sw;
        const dy = b.oy + Math.sin(t * b.sp * 0.9 + i * 2.1) * b.sw;
        const cx = (dx * 0.45 + (ptr.x / w) * 0.55) * w;
        const cy = (dy * 0.45 + (ptr.y / h) * 0.55) * h;
        const R = b.r * m;
        const col = RAMP[b.c];
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        // Three stops, not two: a linear 0 -> 0 ramp reads as a flat soft disc, while a
        // mid stop below half the core alpha concentrates colour near the centre and
        // lets the outer half fade to nothing, which is what makes the edges breathe.
        g.addColorStop(0, rgba(col, NEBULA.core));
        g.addColorStop(0.5, rgba(col, NEBULA.mid));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      });

      // Pointer glow (the sharp layer) - still additive.
      const GR = Math.min(260, m * 0.28);
      const g1 = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, GR);
      const [deep, mid, bright] = RAMP;
      // Projects light: brightest hue at the core, fading through the ramp.
      g1.addColorStop(0, rgba(bright, GLOW.core));
      g1.addColorStop(0.55, rgba(mid, GLOW.mid));
      g1.addColorStop(1, rgba(deep, 0));
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(ptr.x, ptr.y, GR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    resize();
    window.addEventListener("resize", resize);
    // Safari can settle its viewport after the orientation resize event.
    // Observe the CSS-sized canvas so its bitmap follows the final dimensions.
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(cv);
    window.visualViewport?.addEventListener("resize", resize);

    // Reduced motion: one static frame, no tracking, no loop.
    if (reduced) {
      draw(0);
      return () => {
        window.removeEventListener("resize", resize);
        sizeObserver.disconnect();
        window.visualViewport?.removeEventListener("resize", resize);
      };
    }

    const onInput = (e: PointerEvent) => {
      ptr.tx = e.clientX;
      ptr.ty = e.clientY;
      lastInput = performance.now();
    };
    window.addEventListener("pointermove", onInput, { passive: true });
    window.addEventListener("pointerdown", onInput, { passive: true });

    let raf = 0;
    let running = true;
    let start = 0;
    const loop = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;
      // Idle wander: without input the target tours the whole viewport
      // (corners included) on a slow Lissajous path - this is also what
      // animates the scene on touch devices.
      const idle = now - lastInput > IDLE_AFTER_MS;
      if (idle) {
        ptr.tx = w * (0.5 + 0.46 * Math.sin(t * 0.31));
        ptr.ty = h * (0.5 + 0.44 * Math.cos(t * 0.23));
      }
      const k = idle ? 0.03 : 0.09;
      ptr.x += (ptr.tx - ptr.x) * k;
      ptr.y += (ptr.ty - ptr.y) * k;
      draw(t);
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      sizeObserver.disconnect();
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onInput);
      window.removeEventListener("pointerdown", onInput);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  // Admin keeps a plain ground. The homepage plays section videos instead of this canvas.
  if (pathname?.startsWith("/admin") || pathname === "/") return null;

  return (
    <>
      <div aria-hidden="true" className={styles.mobile} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="ambient-bg"
        className={`${styles.canvas} pointer-events-none fixed inset-0 -z-10 h-full w-full`}
      />
    </>
  );
}
