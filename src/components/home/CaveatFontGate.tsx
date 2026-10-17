"use client";

import { useEffect } from "react";
import { useHeroPosterReady } from "@/hooks/useHeroPosterReady";

/** Add the Caveat font variable only after the hero poster has loaded or failed. */
export function CaveatFontGate({ className }: { className: string }) {
  const heroReady = useHeroPosterReady();

  useEffect(() => {
    if (!heroReady) return;
    document.documentElement.classList.add(...className.split(/\s+/).filter(Boolean));
  }, [className, heroReady]);

  return null;
}
