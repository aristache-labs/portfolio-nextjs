import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHANGE_EVENT, saveAnalyticsConsent } from "@/lib/analytics-consent";
import StatsigAnalytics from "@/components/analytics/StatsigAnalytics";
import MyStatsig from "./my-statsig";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  create: vi.fn(),
  initialize: vi.fn(),
  update: vi.fn(),
  shutdown: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("next/dynamic", () => ({ default: () => StatsigAnalytics }));
vi.mock("@statsig/react-bindings", () => ({
  LogLevel: { Error: "error" },
  StatsigClient: class {
    constructor(...args: unknown[]) {
      mocks.create(...args);
    }
    initializeAsync = mocks.initialize;
    updateRuntimeOptions = mocks.update;
    shutdown = mocks.shutdown;
  },
  StatsigProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/analytics/StatsigAutoCapture", () => ({
  StatsigAutoCapture: () => <span>Capture active</span>,
}));
vi.mock("@/components/analytics/StatsigSessionReplay", () => ({
  StatsigSessionReplay: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_STATSIG_CLIENT_KEY", "client-test");
  localStorage.clear();
  sessionStorage.clear();
  mocks.pathname = "/";
  mocks.initialize.mockResolvedValue({});
  mocks.shutdown.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Statsig consent boundary", () => {
  it("does not construct the SDK before consent or after rejection and removes legacy IDs", () => {
    localStorage.setItem("statsig.stable_id.old", "old-id");
    sessionStorage.setItem("statsig.session_id.old", "old-session");
    render(<MyStatsig>Page</MyStatsig>);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(localStorage.getItem("statsig.stable_id.old")).toBeNull();
    expect(sessionStorage.getItem("statsig.session_id.old")).toBeNull();
    act(() => saveAnalyticsConsent("rejected"));
    expect(mocks.create).not.toHaveBeenCalled();
    expect(screen.getByText("Page")).toBeVisible();
  });

  it("starts an anonymous client without debug logging after acceptance and preserves page state", async () => {
    render(
      <MyStatsig>
        <input aria-label="Draft" defaultValue="" />
      </MyStatsig>,
    );
    const draft = screen.getByRole("textbox", { name: "Draft" });
    fireEvent.change(draft, { target: { value: "Keep this draft" } });
    act(() => saveAnalyticsConsent("accepted"));
    await screen.findByText("Capture active");
    expect(mocks.create).toHaveBeenCalledWith(
      "client-test",
      {},
      expect.objectContaining({ logLevel: "error" }),
    );
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("Keep this draft");

    act(() => saveAnalyticsConsent("rejected"));
    expect(mocks.update).toHaveBeenLastCalledWith({
      loggingEnabled: "disabled",
      disableStorage: true,
    });
    expect(mocks.update.mock.invocationCallOrder.at(-1)).toBeLessThan(
      mocks.shutdown.mock.invocationCallOrder[0],
    );
    expect(mocks.shutdown).toHaveBeenCalledOnce();
    expect(screen.queryByText("Capture active")).not.toBeInTheDocument();
    expect(draft).toHaveValue("Keep this draft");
  });

  it("does not start capture if consent is withdrawn while initialization is pending", async () => {
    let finish!: () => void;
    mocks.initialize.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    render(<MyStatsig>Page</MyStatsig>);
    act(() => saveAnalyticsConsent("accepted"));
    act(() => saveAnalyticsConsent("rejected"));
    await act(async () => finish());
    expect(mocks.shutdown).toHaveBeenCalledOnce();
    expect(screen.queryByText("Capture active")).not.toBeInTheDocument();
  });

  it("stops when another tab withdraws consent", async () => {
    localStorage.setItem("analytics-consent-v1", "accepted");
    render(<MyStatsig>Page</MyStatsig>);
    await screen.findByText("Capture active");
    act(() => {
      localStorage.setItem("analytics-consent-v1", "rejected");
      window.dispatchEvent(new Event("storage"));
    });
    await waitFor(() => expect(mocks.shutdown).toHaveBeenCalledOnce());
    expect(screen.queryByText("Capture active")).not.toBeInTheDocument();
  });

  it("blocks pending network retries after withdrawal and can start again after new consent", async () => {
    const send = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    render(<MyStatsig>Page</MyStatsig>);
    act(() => saveAnalyticsConsent("accepted"));
    await screen.findByText("Capture active");
    const transport = mocks.create.mock.calls[0][2].networkConfig.networkOverrideFunc;
    await transport("https://featureassets.org/v1/initialize", {});
    expect(send).toHaveBeenCalledOnce();
    act(() => saveAnalyticsConsent("rejected"));
    await transport("https://featureassets.org/v1/initialize", {});
    expect(send).toHaveBeenCalledOnce();
    act(() => saveAnalyticsConsent("accepted"));
    await screen.findByText("Capture active");
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it.each(["/admin", "/admin/settings", "/login"])(
    "does not initialize on %s even with consent",
    (path) => {
      mocks.pathname = path;
      localStorage.setItem("analytics-consent-v1", "accepted");
      render(<MyStatsig>Page</MyStatsig>);
      window.dispatchEvent(new Event(CHANGE_EVENT));
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );
});
