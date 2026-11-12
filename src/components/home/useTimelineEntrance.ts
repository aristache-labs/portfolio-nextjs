"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { MOBILE_REVEAL_DEPTH, REVEAL_DEPTH, revealInset } from "@/lib/reveal-depth";
import { createTravelGate, sectionNavigationPending } from "@/lib/section-navigation";

/** The entrance plus the dots' short delay, after which the attribute is dropped so that the rail
 *  fill, which mounts and unmounts as the list nears the screen, never replays it. */
const ENTRANCE_MS = 1500;
/** How long the page is given to settle before an on-screen timeline at scroll 0 is believed. */
const SETTLE_MS = 1500;

/**
 * Marks the timeline `data-spine="armed"` until it first comes properly into view, then `"play"`
 * for one entrance and `"done"`. CSS hides the rail lines and the dots while armed and lets them
 * vanish in on play. It observes the list itself, a stationary box, never the animated parts.
 * A timeline already on screen, or passed unseen by an ordinary fast scroll, just appears.
 */
export function useTimelineEntrance(listRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const { mode, ready } = useAnimationPolicy();
  const played = useRef(false);
  const navigation = useSectionNavigation(listRef, () => !played.current);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!enabled || !list || !ready || mode === "static" || played.current) return;
    if (typeof IntersectionObserver !== "function") return;
    // A menu jump is on its way here: keep it hidden until the page lands, then let it play.
    if (navigation.pending) {
      list.dataset.spine = "armed";
      return () => {
        if (!played.current) delete list.dataset.spine;
      };
    }
    const inset = revealInset(mode === "expressive" ? REVEAL_DEPTH : MOBILE_REVEAL_DEPTH);
    list.dataset.spine = "armed";
    let settle: number | undefined;
    const play = () => {
      window.clearTimeout(settle);
      played.current = true;
      observer.disconnect();
      list.dataset.spine = "play";
      window.setTimeout(() => {
        list.dataset.spine = "done";
      }, ENTRANCE_MS);
    };
    // A jump that only passes through must not spend the entrance unseen.
    const gate = createTravelGate(list, play, inset);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(list) || gate.passing()) return;
        if (entry?.isIntersecting) {
          // Sections above load in after the first render, so at the top of the page the list can
          // briefly sit on screen before it settles far below. Confirm once the page has settled.
          if (window.scrollY > 0 || navigation.replay > 0) play();
          else {
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
              const rect = list.getBoundingClientRect();
              if (!played.current && rect.top < window.innerHeight - inset && rect.bottom > 0) {
                play();
              }
            }, SETTLE_MS);
          }
        } else if (
          entry &&
          // Content the browser has not rendered (content-visibility) reports an empty box at the
          // origin, which is not the same as being scrolled past.
          entry.boundingClientRect.height > 0 &&
          entry.boundingClientRect.bottom <= 0 &&
          !gate.isSkipped()
        ) {
          // Scrolled past before it ever showed: no point animating what nobody can see.
          played.current = true;
          observer.disconnect();
          list.dataset.spine = "done";
        }
      },
      { rootMargin: `0px 0px -${inset}px 0px` },
    );
    observer.observe(list);
    return () => {
      window.clearTimeout(settle);
      gate.dispose();
      observer.disconnect();
      if (!played.current) delete list.dataset.spine;
    };
  }, [enabled, listRef, mode, ready, navigation.pending, navigation.replay]);
}
