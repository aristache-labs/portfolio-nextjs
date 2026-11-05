"use client";

import { useEffect, type RefObject } from "react";
import { useScroll } from "framer-motion";
import { COMPACT_TOUCH_QUERY } from "@/hooks/useMediaQuery";

export const FOOTER_MOBILE_QUERY = COMPACT_TOUCH_QUERY;

/** Reveal each mobile group once, with a page-end safeguard and immediate keyboard access. */
export function useFooterMobileEntrance(footer: RefObject<HTMLElement | null>, enabled: boolean) {
  const { scrollY } = useScroll();
  useEffect(() => {
    const node = footer.current;
    if (!node || !enabled || typeof IntersectionObserver !== "function") return;
    const parts = [...node.querySelectorAll<HTMLElement>("[data-footer-part]")];
    const items = [...node.querySelectorAll<HTMLElement>("[data-footer-part] nav li")];
    if (!parts.length) return;
    // Read the initial geometry before arming styles can invalidate layout.
    const atPageEnd = document.documentElement.scrollHeight - innerHeight - window.scrollY <= 1;
    const bounds = node.getBoundingClientRect();
    const proximityMargin = `${innerHeight}px 0px`;
    let nearby = bounds.top <= innerHeight * 2 && bounds.bottom >= -innerHeight;
    let settled = false;
    let unsubscribe = () => {};
    parts.forEach((part) => {
      part.dataset.footerReveal = "armed";
      part.querySelectorAll<HTMLElement>("nav li").forEach((item, index) => {
        item.style.setProperty("--footer-item-delay", `${(index + 1) * 60}ms`);
      });
    });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const part = entry.target as HTMLElement;
          if (part.dataset.footerReveal !== "armed") continue;
          if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
          part.dataset.footerReveal = "play";
          observer.unobserve(part);
        }
      },
      { rootMargin: "0px 0px -16px 0px", threshold: 0.08 },
    );
    const stop = () => {
      settled = true;
      observer.disconnect();
      proximity.disconnect();
      unsubscribe();
    };
    const finish = () => {
      if (settled || !nearby) return;
      if (document.documentElement.scrollHeight - innerHeight - window.scrollY > 1) return;
      showAll();
    };
    const showAll = () => {
      parts.forEach((part) => {
        part.dataset.footerReveal = "static";
      });
      stop();
    };
    const proximity = new IntersectionObserver(
      ([entry]) => {
        if (!entry || settled) return;
        nearby = entry.isIntersecting;
        if (nearby) finish();
      },
      { rootMargin: proximityMargin },
    );
    const resize = () => {
      if (settled) return;
      const bounds = node.getBoundingClientRect();
      nearby = bounds.top <= innerHeight * 2 && bounds.bottom >= -innerHeight;
      finish();
    };
    const focus = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const part = target.closest<HTMLElement>("[data-footer-part]");
      if (!part || !node.contains(part)) return;
      part.dataset.footerReveal = "static";
      observer.unobserve(part);
      if (parts.every((part) => part.dataset.footerReveal === "static")) stop();
    };
    if (atPageEnd) showAll();
    else {
      parts.forEach((part) => observer.observe(part));
      proximity.observe(node);
      unsubscribe = scrollY.on("change", finish);
    }
    node.addEventListener("focusin", focus);
    node.addEventListener("pointerdown", focus);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      proximity.disconnect();
      unsubscribe();
      node.removeEventListener("focusin", focus);
      node.removeEventListener("pointerdown", focus);
      window.removeEventListener("resize", resize);
      parts.forEach((part) => {
        delete part.dataset.footerReveal;
      });
      items.forEach((item) => item.style.removeProperty("--footer-item-delay"));
    };
  }, [enabled, footer, scrollY]);
}
