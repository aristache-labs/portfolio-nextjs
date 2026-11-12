"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { useAnimationPolicy } from "@/hooks/useAnimationPolicy";
import { useSectionNavigation } from "@/hooks/useSectionNavigation";
import { MOBILE_REVEAL_DEPTH, REVEAL_DEPTH, revealInset } from "@/lib/reveal-depth";
import { createTravelGate, sectionNavigationPending } from "@/lib/section-navigation";

/** The entrance plus the longest stagger inside it, after which the state is set to `done` so
 *  parts that mount later, or remount, never replay it. */
const DEFAULT_PLAY_MS = 1500;
/** How long the page is given to settle before an on-screen box at scroll 0 is believed. */
const SETTLE_MS = 1500;

/**
 * Drives one timed entrance for a whole block through a data attribute on it. The block is marked
 * `armed` until it first comes properly into view, then `play` for one entrance, then `done`. CSS
 * keyed on the attribute hides the block's parts while armed and animates them on play.
 *
 * It observes the block itself, a stationary box, never the animated parts. A block passed by a
 * section jump keeps its entrance for the first real visit; one scrolled past unseen just appears.
 * `key` is the dataset name, so `"spine"` writes `data-spine`.
 */
export function useEntranceOnce(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  key: string,
  playMs = DEFAULT_PLAY_MS,
) {
  const { mode, ready } = useAnimationPolicy();
  const played = useRef(false);
  const navigation = useSectionNavigation(ref, () => !played.current);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!enabled || !node || !ready || mode === "static" || played.current) return;
    if (typeof IntersectionObserver !== "function") return;
    // A menu jump is on its way here: keep it hidden until the page lands, then let it play.
    if (navigation.pending) {
      node.dataset[key] = "armed";
      return () => {
        if (!played.current) delete node.dataset[key];
      };
    }
    const inset = revealInset(mode === "expressive" ? REVEAL_DEPTH : MOBILE_REVEAL_DEPTH);
    node.dataset[key] = "armed";
    let settle: number | undefined;
    const play = () => {
      window.clearTimeout(settle);
      played.current = true;
      observer.disconnect();
      node.dataset[key] = "play";
      window.setTimeout(() => {
        node.dataset[key] = "done";
      }, playMs);
    };
    // A jump that only passes through must not spend the entrance unseen.
    const gate = createTravelGate(node, play, inset);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (sectionNavigationPending(node) || gate.passing()) return;
        if (entry?.isIntersecting) {
          // Sections above load in after the first render, so at the top of the page the block can
          // briefly sit on screen before it settles far below. Confirm once the page has settled.
          if (window.scrollY > 0 || navigation.replay > 0) play();
          else {
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
              const rect = node.getBoundingClientRect();
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
          node.dataset[key] = "done";
        }
      },
      { rootMargin: `0px 0px -${inset}px 0px` },
    );
    observer.observe(node);
    return () => {
      window.clearTimeout(settle);
      gate.dispose();
      observer.disconnect();
      if (!played.current) delete node.dataset[key];
    };
  }, [enabled, ref, key, playMs, mode, ready, navigation.pending, navigation.replay]);
}
