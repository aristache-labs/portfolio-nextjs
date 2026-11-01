"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useScroll } from "framer-motion";
import styles from "@/app/privacy/privacy.module.css";
import { ScrollEntrance } from "@/components/motion/ScrollEntrance";
import { GLASS_CARD } from "@/components/home/project-styles";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { PINNED_SCENE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { phaseProgress, smoothstep } from "@/lib/scroll-phase";

/** The extra real scroll the header stays pinned for on desktop. */
const PIN_SPACE = "35svh";
/** Motion is for expressive pinned-scene desktops only; everything else keeps plain markup. */
function useLegalScene() {
  const { mode } = useAnimationPolicy();
  const pinned = useMediaQuery(PINNED_SCENE_QUERY);
  return pinned && mode === "expressive";
}

/** How far the header scene has run: 0 at the top of the page, 1 once the panel covers it. */
export const legalSceneProgress = (scrolled: number, travel: number) =>
  Math.max(0, Math.min(1, scrolled / Math.max(1, travel)));

/**
 * Pins the header while the reading panel rises over it. The header eases up and fades as it is
 * covered, while the viewport-tall backdrop stays put behind the scrolling page.
 */
export function LegalHeaderScene({ children }: { children: ReactNode }) {
  const enabled = useLegalScene();
  const wrapper = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    const outer = wrapper.current;
    const inner = header.current;
    if (!enabled || !outer || !inner) return;
    const update = () => {
      const pinTop = parseFloat(getComputedStyle(inner).top) || 0;
      const absoluteTop = outer.getBoundingClientRect().top + window.scrollY;
      const travel = absoluteTop - pinTop + inner.offsetHeight * 0.9;
      const progress = legalSceneProgress(window.scrollY, travel);
      inner.style.opacity = String(1 - smoothstep(phaseProgress(progress, 0.15, 1)));
      inner.style.transform = `translateY(${(-progress * 36).toFixed(2)}px) scale(${(1 - progress * 0.04).toFixed(4)})`;
    };
    update();
    const unsubscribe = scrollY.on("change", update);
    window.addEventListener("resize", update);
    return () => {
      unsubscribe();
      window.removeEventListener("resize", update);
      inner.style.removeProperty("opacity");
      inner.style.removeProperty("transform");
    };
  }, [enabled, scrollY]);

  return (
    <div
      ref={wrapper}
      data-legal-scene={enabled ? "" : undefined}
      className={enabled ? "relative z-0" : undefined}
      style={enabled ? { marginBottom: `calc(${PIN_SPACE} * -1)` } : undefined}
    >
      <div ref={header} className={enabled ? "sticky top-24" : undefined}>
        {children}
      </div>
      {enabled && <div aria-hidden style={{ height: PIN_SPACE }} />}
    </div>
  );
}

/** One way scroll entrance for a section of the reading panel. */
export function LegalReveal({ children }: { children: ReactNode }) {
  const enabled = useLegalScene();
  return (
    <ScrollEntrance enabled={enabled} from="below">
      {children}
    </ScrollEntrance>
  );
}

const LINK =
  "text-muted hover:text-brand-bright focus-visible:ring-brand-mid relative inline-flex min-h-11 items-center rounded-md px-2 text-[15px] transition-colors focus-visible:ring-2 focus-visible:outline-none before:absolute before:top-1/2 before:-left-[13px] before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-(--brand-mid) before:opacity-0 before:transition-opacity aria-[current=location]:before:opacity-100";

/** The page contents. The section being read carries `aria-current="location"`. */
export function LegalContents({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string }[];
}) {
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const active = useScrollSpy(ids, 140);
  const list = (
    <ul className="grid gap-1 border-l border-white/10 pl-3">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={LINK}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav aria-label={label} className={`${styles.contentsNav} lg:sticky lg:top-8 lg:self-start`}>
      <div className={styles.contentsDesktop}>
        <p className="text-muted mb-4 text-[15px]">On this page</p>
        {list}
      </div>
      <details className={`${styles.contentsMobile} group ${GLASS_CARD} rounded-xl border`}>
        <summary className="text-foreground focus-visible:ring-brand-mid flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="px-4 pb-3">{list}</div>
      </details>
    </nav>
  );
}
