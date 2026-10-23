import "server-only";

import { dedupe, flag } from "flags/next";
import type { Identify } from "flags";
import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";

// Match the current anonymous identity in the browser provider.
export const identify = dedupe((async () => ({
  userID: "a-user",
})) satisfies Identify<StatsigUser>);

export const myFeatureGate = flag<boolean, StatsigUser>({
  key: "my_feature_gate",
  description: "Example Statsig feature gate for server components and route handlers.",
  defaultValue: false,
  identify,
  adapter: statsigAdapter.featureGate((gate) => gate.value),
});
