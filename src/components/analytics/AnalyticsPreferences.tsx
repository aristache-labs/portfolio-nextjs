"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  PREFERENCES_EVENT,
  saveAnalyticsConsent,
  useAnalyticsConsent,
} from "@/lib/analytics-consent";

const action =
  "min-h-[44px] rounded-full border border-brand-mid/30 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-brand-mid/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mid";

export function AnalyticsPreferences() {
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    const open = () => {
      setEnabled(consent === "accepted");
      setEditing(true);
    };
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, [consent]);

  if (
    (!process.env.NEXT_PUBLIC_GTAG_ID && !process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) ||
    !ready ||
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    (consent && !editing)
  )
    return null;

  const save = (accepted: boolean) => {
    saveAnalyticsConsent(accepted ? "accepted" : "rejected");
    setEditing(false);
  };

  return (
    <section
      aria-label="Analytics preferences"
      className="border-brand-mid/25 bg-background text-foreground fixed inset-x-3 bottom-3 z-[60] mx-auto max-h-[65dvh] max-w-[680px] overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-[0_12px_48px_rgb(0_0_0/0.35)] sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <h2 className="flex items-center gap-2 text-[17px] font-semibold">
        <SlidersHorizontal aria-hidden className="text-brand-bright size-4" />
        Your analytics preferences
      </h2>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">
        With your permission, Google Analytics and Statsig help me understand visits, clicks and
        navigation through session replay. The contact form is excluded from recordings. You can
        accept or reject analytics and change your choice in the footer.{" "}
        <Link href="/privacy" className="text-brand-bright underline underline-offset-4">
          Privacy policy
        </Link>
      </p>
      {editing && (
        <label className="border-brand-mid/20 mt-4 flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-xl border p-3 text-[14px]">
          Allow optional analytics
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-5 shrink-0 accent-(--brand-mid)"
          />
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button type="button" onClick={() => save(enabled)} className={action}>
              Save preferences
            </button>
            <button type="button" onClick={() => setEditing(false)} className={action}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => save(true)} className={action}>
              Accept
            </button>
            <button type="button" onClick={() => save(false)} className={action}>
              Reject
            </button>
            <button type="button" onClick={() => setEditing(true)} className={action}>
              Preferences
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export function AnalyticsPreferencesButton() {
  if (!process.env.NEXT_PUBLIC_GTAG_ID && !process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) return null;
  return (
    <>
      <span aria-hidden className="mx-1.5 text-white/30">
        |
      </span>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(PREFERENCES_EVENT))}
        className="text-brand-bright focus-visible:ring-brand-mid rounded-sm text-inherit underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        Analytics
      </button>
    </>
  );
}
