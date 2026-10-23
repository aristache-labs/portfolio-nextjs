import { getProviderData as getStatsigProviderData } from "@flags-sdk/statsig";
import { mergeProviderData } from "flags";
import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import { myFeatureGate } from "@/lib/flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  const localFlags = getProviderData({ myFeatureGate });
  const consoleApiKey = process.env.STATSIG_CONSOLE_API_KEY;
  if (!consoleApiKey) return localFlags;

  return mergeProviderData([
    localFlags,
    getStatsigProviderData({
      consoleApiKey,
      projectId: process.env.STATSIG_PROJECT_ID,
    }),
  ]);
});
