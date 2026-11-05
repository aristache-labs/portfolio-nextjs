"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./contact-motion.module.css";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";

export const CONTACT_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
export const CONTACT_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

/** Each mobile surface reveals once; interacting with a form settles all its moving parts. */
export function ContactArrival({
  children,
  className,
  kind,
  order = 0,
}: {
  children: ReactNode;
  className?: string;
  kind: "heading" | "description" | "card" | "quote" | "form";
  order?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode, ready } = useAnimationPolicy();
  const navigation = useSectionNavigation(ref);
  useLayoutEffect(() => {
    const node = ref.current;
    if (navigation.pending && node && mode !== "static") {
      node.dataset.contactReveal = "armed";
      node.querySelectorAll<HTMLElement>("[data-contact-step]").forEach((step) => {
        step.dataset.contactReveal = "armed";
      });
      return () => {
        delete node.dataset.contactReveal;
        node.querySelectorAll<HTMLElement>("[data-contact-step]").forEach((step) => {
          delete step.dataset.contactReveal;
        });
      };
    }
    if (!node || !ready || mode === "static" || typeof IntersectionObserver !== "function") return;
    const targets = [node, ...node.querySelectorAll<HTMLElement>("[data-contact-step]")];
    if (node.contains(document.activeElement)) return;
    targets.forEach((target) => {
      target.dataset.contactReveal = "armed";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (sectionNavigationPending(node)) return;
        if (node.dataset.contactReveal === "static") return;
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
          (entry.target as HTMLElement).dataset.contactReveal = "play";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -24px 0px", threshold: 0.08 },
    );
    const settle = () => {
      targets.forEach((target) => {
        target.dataset.contactReveal = "static";
      });
      observer.disconnect();
    };
    targets.forEach((target) => observer.observe(target));
    node.addEventListener("focusin", settle);
    if (kind === "form") node.addEventListener("pointerdown", settle);
    return () => {
      observer.disconnect();
      node.removeEventListener("focusin", settle);
      node.removeEventListener("pointerdown", settle);
      targets.forEach((target) => {
        delete target.dataset.contactReveal;
      });
    };
  }, [mode, ready, kind, navigation.pending, navigation.replay]);
  return (
    <div
      ref={ref}
      className={`${styles.arrival} ${className ?? ""}`}
      data-contact-kind={kind}
      style={order ? ({ "--contact-delay": `${order * 80}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
