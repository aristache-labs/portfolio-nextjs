import { expect, test as base } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

export type AnalyticsEvent = {
  name: string;
  location: string | null;
  title: string | null;
};

type AnalyticsTraffic = {
  events: AnalyticsEvent[];
  requests: { url: string; body: string | null }[];
  unexpectedRequests: string[];
  blockedDiagnostics: string[];
};

// Every browser spec uses this fixture, before any navigation or saved consent can load GA.
export const test = base.extend<{ analyticsTraffic: AnalyticsTraffic }>({
  serviceWorkers: "block",
  analyticsTraffic: [
    async ({ context }, use, testInfo) => {
      const traffic: AnalyticsTraffic = {
        events: [],
        requests: [],
        unexpectedRequests: [],
        blockedDiagnostics: [],
      };
      await context.route(
        /^https?:\/\/(?:[^/]+\.)?(?:google-analytics\.com|googletagmanager\.com|analytics\.google\.com|google\.[a-z.]+|doubleclick\.net|googleadservices\.com|googlesyndication\.com)\//,
        async (route) => {
          const request = route.request();
          const url = new URL(request.url());
          if (
            url.hostname === "www.googletagmanager.com" &&
            /^\/gtag\/(js|destination)$/.test(url.pathname) &&
            request.resourceType() === "script"
          ) {
            await route.fallback();
            return;
          }
          // The SDK occasionally samples its own diagnostics. Acknowledge locally and report it.
          if (url.hostname === "www.googletagmanager.com" && url.pathname === "/a") {
            traffic.blockedDiagnostics.push(request.url());
            testInfo.annotations.push({
              type: "blocked-google-diagnostic",
              description: `${url.origin}${url.pathname} was answered locally with 204`,
            });
            await route.fulfill({ status: 204 });
            return;
          }
          // Unknown Google endpoints never reach the network, even when the test fails.
          traffic.unexpectedRequests.push(request.url());
          await route.fulfill({ status: 204 });
        },
      );
      await context.route("**/g/collect**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const body = request.postData();
        traffic.requests.push({ url: request.url(), body });
        const lines = body?.split(/\r?\n/).filter(Boolean);
        for (const line of lines?.length ? lines : [""]) {
          const params = new URLSearchParams(url.search);
          new URLSearchParams(line).forEach((value, key) => params.set(key, value));
          const name = params.get("en");
          if (name) {
            traffic.events.push({ name, location: params.get("dl"), title: params.get("dt") });
          }
        }
        // Read locally, then acknowledge locally. Never forward real measurement traffic.
        await route.fulfill({ status: 204 });
      });
      await use(traffic);
      expect(traffic.unexpectedRequests, "Unexpected Google requests were blocked locally").toEqual(
        [],
      );
    },
    { auto: true },
  ],
});
