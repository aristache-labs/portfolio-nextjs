"use client";

import type { ReactNode } from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";
import { StatsigAutoCapture } from "@/components/analytics/StatsigAutoCapture";
import { StatsigSessionReplay } from "@/components/analytics/StatsigSessionReplay";

const user = { userID: "a-user" };
const options = { logLevel: LogLevel.Debug };

export default function MyStatsig({ children }: { children: ReactNode }) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  if (!sdkKey) return <>{children}</>;

  return (
    <StatsigProvider sdkKey={sdkKey} user={user} options={options}>
      <StatsigAutoCapture />
      <StatsigSessionReplay />
      {children}
    </StatsigProvider>
  );
}
