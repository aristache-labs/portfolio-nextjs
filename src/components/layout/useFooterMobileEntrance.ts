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
    const finish = () => {
      if (document.documentElement.scrollHeight - innerHeight - window.scrollY > 1) return;
      parts.forEach((part) => {
        part.dataset.footerReveal = "static";
      });
      observer.disconnect();
    };
    const focus = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const part = target.closest<HTMLElement>("[data-footer-part]");
      if (!part || !node.contains(part)) return;
      part.dataset.footerReveal = "static";
      observer.unobserve(part);
    };
    parts.forEach((part) => observer.observe(part));
    finish();
    const unsubscribe = scrollY.on("change", finish);
    node.addEventListener("focusin", focus);
    node.addEventListener("pointerdown", focus);
    window.addEventListener("resize", finish);
    return () => {
      observer.disconnect();
      unsubscribe();
      node.removeEventListener("focusin", focus);
      node.removeEventListener("pointerdown", focus);
      window.removeEventListener("resize", finish);
      parts.forEach((part) => {
        delete part.dataset.footerReveal;
      });
      items.forEach((item) => item.style.removeProperty("--footer-item-delay"));
    };
  }, [enabled, footer, scrollY]);
}
