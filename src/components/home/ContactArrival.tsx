"use client";

import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { sectionNavigationPending } from "@/lib/section-navigation";

import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { m } from "framer-motion";
import {
  useProgressiveReveal,
  type ProgressiveRevealProps,
} from "@/components/motion/ProgressiveReveal";
import { RevealSequence } from "@/components/motion/RevealSequence";
import { useScrollEntrance } from "@/components/motion/ScrollEntrance";
import scrollCss from "@/components/motion/scroll-entrance.module.css";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import styles from "./contact-motion.module.css";
import { PORTRAIT_PHONE_QUERY } from "@/hooks/useMediaQuery";

export const CONTACT_PORTRAIT_QUERY = PORTRAIT_PHONE_QUERY;
export const CONTACT_LANDSCAPE_QUERY =
  "(orientation: landscape) and (pointer: coarse) and (max-width: 1023px) and (max-height: 500px)";

function ContactScrollDriver({
  element,
  lag,
}: {
  element: RefObject<HTMLDivElement | null>;
  lag?: number;
}) {
  useScrollEntrance(element, { enabled: true, lag });
  return null;
}

/** Each mobile surface reveals once; interacting with a form settles all its moving parts. */
export function ContactArrival({
  children,
  className,
  kind,
  order = 0,
  mobile = true,
  scrollFrom,
  scrollLag,
  plain = false,
  surfaceClassName,
  ...desktopProps
}: ProgressiveRevealProps & {
  kind: "heading" | "description" | "card" | "quote" | "form" | "list";
  order?: number;
  mobile?: boolean;
  scrollFrom?: "left" | "right";
  scrollLag?: number;
  plain?: boolean;
  surfaceClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = !!scrollFrom && !mobile;
  const timed = !mobile && !scroll && !plain;
  const { controls, sequence } = useProgressiveReveal({
    ...desktopProps,
    element: ref,
    enabled: timed,
  });
  useLayoutEffect(() => {
    if (!timed) controls.set({ opacity: "", x: 0, y: 0, scale: 1, scaleX: 1 });
  });
  const { mode, ready } = useAnimationPolicy();
  const navigation = useSectionNavigation(ref);
  useLayoutEffect(() => {
    const node = ref.current;
    if (mobile && navigation.pending && node && mode !== "static") {
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
    if (
      !mobile ||
      !node ||
      !ready ||
      mode === "static" ||
      typeof IntersectionObserver !== "function"
    )
      return;
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
  }, [mobile, mode, ready, kind, navigation.pending, navigation.replay]);
  const content = (
    <RevealSequence.Provider
      value={
        timed && (desktopProps.effect === "cascade" || desktopProps.effect === "zoom")
          ? sequence
          : null
      }
    >
      {children}
    </RevealSequence.Provider>
  );
  // The quote keeps its glass on the moving box except for the scroll-driven entrance,
  // whose direct child fades. The form always keeps its glass on the inner surface.
  const form = kind === "form";
  const quote = kind === "quote" && !!surfaceClassName;
  const driver = mobile ? styles.arrival : scroll ? scrollCss.entrance : "";
  const rootMotion = form || (plain && kind === "card") ? undefined : controls;
  const root = (
    <m.div
      ref={ref}
      className={`${driver} ${className ?? ""} ${quote && !scroll ? surfaceClassName : ""}`}
      data-contact-kind={mobile ? kind : undefined}
      data-from={scroll ? scrollFrom : undefined}
      style={
        mobile && order ? ({ "--contact-delay": `${order * 80}ms` } as CSSProperties) : undefined
      }
      initial={false}
      animate={rootMotion}
      transformTemplate={timed && !form ? undefined : () => ""}
      variants={
        timed && desktopProps.effect === "cascade"
          ? {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  duration: mode === "static" ? 0 : (desktopProps.duration ?? 1),
                  delay: mode === "static" ? 0 : (desktopProps.delay ?? 0.3),
                  staggerChildren: mode === "static" ? 0 : (desktopProps.staggerChildren ?? 0),
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }
          : undefined
      }
    >
      {form ? (
        <m.div
          className={`w-full min-w-0 ${surfaceClassName ?? ""}`}
          initial={false}
          animate={controls}
          transformTemplate={timed ? undefined : () => ""}
        >
          {content}
        </m.div>
      ) : quote ? (
        <div className={scroll ? surfaceClassName : "contents"}>{content}</div>
      ) : (
        content
      )}
    </m.div>
  );
  return (
    <>
      {scroll && <ContactScrollDriver element={ref} lag={scrollLag} />}
      {root}
    </>
  );
}
