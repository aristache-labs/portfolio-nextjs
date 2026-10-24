"use client";

import { useLayoutEffect, useState } from "react";
import { LogLevel, StatsigClient, StatsigProvider } from "@statsig/react-bindings";
import { CHANGE_EVENT, readConsent } from "@/lib/analytics-consent";
import { StatsigAutoCapture } from "./StatsigAutoCapture";
import { StatsigSessionReplay } from "./StatsigSessionReplay";

function allowed() {
  const path = window.location.pathname;
  return readConsent() === "accepted" && !path.startsWith("/admin") && path !== "/login";
}

export default function StatsigAnalytics({ sdkKey }: { sdkKey: string }) {
  const [client, setClient] = useState<StatsigClient | null>(null);

  useLayoutEffect(() => {
    if (!allowed()) return;

    // An anonymous user uses the SDK's per-browser stable ID, created only after consent.
    let stopped = false;
    const instance = new StatsigClient(
      sdkKey,
      {},
      {
        logLevel: LogLevel.Error,
        networkConfig: {
          networkOverrideFunc: (url, args) => {
            // A pending initialization may retry after consent has been withdrawn.
            if (stopped || !allowed()) return Promise.resolve(new Response(null, { status: 204 }));
            return fetch(url, args);
          },
        },
      },
    );
    instance.updateRuntimeOptions({ disableStorage: false });
    const stop = () => {
      if (stopped) return;
      stopped = true;
      // Both shutdown and provider cleanup can flush. Disable logging before either runs.
      instance.updateRuntimeOptions({ loggingEnabled: "disabled", disableStorage: true });
      void instance.shutdown().catch(() => {});
    };
    const onConsentChange = () => {
      if (!allowed()) stop();
    };
    window.addEventListener(CHANGE_EVENT, onConsentChange);
    window.addEventListener("storage", onConsentChange);

    void instance.initializeAsync().then(() => {
      if (!stopped && allowed()) setClient(instance);
    }, stop);

    return () => {
      stop();
      window.removeEventListener(CHANGE_EVENT, onConsentChange);
      window.removeEventListener("storage", onConsentChange);
    };
  }, [sdkKey]);

  if (!client) return null;

  return (
    <StatsigProvider client={client}>
      <StatsigAutoCapture />
      <StatsigSessionReplay />
    </StatsigProvider>
  );
}
