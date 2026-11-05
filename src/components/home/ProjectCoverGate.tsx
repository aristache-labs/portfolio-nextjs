"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const CoverReady = createContext(false);
export const useProjectCoversReady = () => useContext(CoverReady);

export function ProjectCoverGate({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const section = ref.current?.closest("section") ?? ref.current;
    if (!section) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }
    let activated = false;
    let observer: IntersectionObserver;
    const watch = () => {
      if (activated) return;
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          activated = true;
          setReady(true);
          observer.disconnect();
        },
        { rootMargin: `${window.innerHeight}px 0px` },
      );
      observer.observe(section);
    };
    watch();
    window.addEventListener("resize", watch);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", watch);
    };
  }, []);
  return (
    <div ref={ref}>
      <CoverReady.Provider value={ready}>{children}</CoverReady.Provider>
    </div>
  );
}
