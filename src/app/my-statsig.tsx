"use client";

import type { ReactNode } from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";

const user = { userID: "a-user" };
const options = { logLevel: LogLevel.Debug };

export default function MyStatsig({ children }: { children: ReactNode }) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  if (!sdkKey) return <>{children}</>;

  return (
    <StatsigProvider sdkKey={sdkKey} user={user} options={options}>
      {children}
    </StatsigProvider>
  );
}
