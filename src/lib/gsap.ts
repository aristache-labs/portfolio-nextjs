"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { onSmoothScrollChange } from "./smooth-scroll";

/**
 * The single GSAP entry point. Import from here, never from "gsap" directly, so plugins are
 * registered once and ScrollTrigger follows Lenis whenever smooth scrolling is active.
 * Sections import this module lazily, which keeps GSAP out of the shared bundle.
 */
let registered = false;

function register() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);
  // Only transform, opacity and clip-path are animated, so lag smoothing would only add
  // catch-up jumps after a long frame.
  gsap.ticker.lagSmoothing(0);
  onSmoothScrollChange((lenis) => lenis?.on("scroll", ScrollTrigger.update));
}

register();

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
