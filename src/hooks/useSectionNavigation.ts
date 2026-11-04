"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { subscribeSectionNavigation } from "@/lib/section-navigation";

/** Defer only the first entrance without remounting content, forms, filters or media. */
export function useSectionNavigation(
  ref: RefObject<HTMLElement | null>,
  shouldWait?: () => boolean,
) {
  const waitRef = useRef(shouldWait);
  useEffect(() => {
    waitRef.current = shouldWait;
  });
  const [navigation, setNavigation] = useState({ pending: false, replay: 0 });
  useEffect(() => {
    let waiting = false;
    return subscribeSectionNavigation(
      () => ref.current,
      (pending) => {
        if (pending) {
          const node = ref.current;
          const phase =
            node?.dataset.reveal ??
            node?.dataset.projectReveal ??
            node?.dataset.contactReveal ??
            node?.dataset.mobileReveal;
          waiting = waitRef.current ? waitRef.current() : phase !== "play" && phase !== "static";
        }
        if (!waiting) return;
        setNavigation((previous) => ({ pending, replay: previous.replay + 1 }));
        if (!pending) waiting = false;
      },
    );
  }, [ref]);
  return navigation;
}
