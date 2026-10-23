"use client";

// Temporary development diagnostics. No form values, cookies or full URLs are collected.
export function mobileNavDebug(event: string, section = "", message = "") {
  if (process.env.NODE_ENV !== "development") return;
  const backdrop = document.querySelector("[data-mobile-menu-backdrop]");
  const payload = JSON.stringify({
    event,
    section,
    message: message.slice(0, 300),
    time: Math.round(performance.now()),
    scrollY: Math.round(window.scrollY),
    width: window.innerWidth,
    height: window.innerHeight,
    visualHeight: Math.round(window.visualViewport?.height ?? window.innerHeight),
    pageHeight: document.documentElement.scrollHeight,
    videos: document.querySelectorAll("video").length,
    playing: Array.from(document.querySelectorAll("video")).filter((video) => !video.paused).length,
    menuOpen:
      document
        .querySelector('[aria-controls="mobile-navigation"]')
        ?.getAttribute("aria-expanded") === "true",
    bodyOverflow: document.body.style.overflow,
    hidden: document.hidden,
    backdropFilter: backdrop ? getComputedStyle(backdrop).backdropFilter : "absent",
  });
  try {
    if (
      navigator.sendBeacon?.(
        "/api/debug/mobile-nav",
        new Blob([payload], { type: "application/json" }),
      )
    )
      return;
    void fetch("/api/debug/mobile-nav", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Diagnostics must never interfere with navigation.
  }
}

export function installMobileNavDebug() {
  if (process.env.NODE_ENV !== "development") return;
  const error = (event: ErrorEvent) => mobileNavDebug("error", "", event.message);
  const rejection = (event: PromiseRejectionEvent) =>
    mobileNavDebug(
      "rejection",
      "",
      event.reason instanceof Error ? event.reason.message : String(event.reason),
    );
  const hide = () => mobileNavDebug("pagehide");
  const show = () => mobileNavDebug("pageshow");
  const visibility = () => mobileNavDebug("visibility");
  const resize = () => mobileNavDebug("resize");
  window.addEventListener("error", error);
  window.addEventListener("unhandledrejection", rejection);
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", show);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("resize", resize);
  mobileNavDebug("ready");
  return () => {
    window.removeEventListener("error", error);
    window.removeEventListener("unhandledrejection", rejection);
    window.removeEventListener("pagehide", hide);
    window.removeEventListener("pageshow", show);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("resize", resize);
  };
}
