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

export function DeferredControls() {
  return (
    <>
      <ScrollToTop />
      <AnalyticsPreferences />
    </>
  );
}
