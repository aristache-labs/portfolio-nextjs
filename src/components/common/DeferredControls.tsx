"use client";

import dynamic from "next/dynamic";

// These controls appear after hydration. Keep their loaders out of the server entry.
const AnalyticsPreferences = dynamic(
  () =>
    import("@/components/analytics/AnalyticsPreferences").then(
      (module) => module.AnalyticsPreferences,
    ),
  { ssr: false },
);
const ScrollToTop = dynamic(() => import("./ScrollToTop"), { ssr: false });
const SmoothScroll = dynamic(() => import("@/components/motion/SmoothScroll"), { ssr: false });
const SectionSnap = dynamic(() => import("@/components/motion/SectionSnap"), { ssr: false });

export function DeferredControls() {
  return (
    <>
      <SmoothScroll />
      <SectionSnap />
      <ScrollToTop />
      <AnalyticsPreferences />
    </>
  );
}
