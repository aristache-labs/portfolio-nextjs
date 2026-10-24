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
import styles from "./analytics-preferences.module.css";

const action = `${styles.control} rounded-full border border-brand-mid/30 px-3 text-[12px] font-medium text-foreground transition-colors hover:border-brand-mid/55 hover:bg-brand-mid/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mid`;

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
      className={`${styles.panel} border-brand-mid/25 bg-background/95 text-foreground fixed z-[60] overflow-y-auto overscroll-contain rounded-2xl border p-[14px] shadow-[0_8px_32px_rgb(var(--brand-deep-rgb)/0.16)] backdrop-blur-xl`}
    >
      <h2 className="flex items-center gap-2 text-[14px] leading-[20px] font-semibold tracking-tight">
        <SlidersHorizontal aria-hidden className="text-brand-bright size-[14px] shrink-0" />
        Your analytics preferences
      </h2>
      <p className="text-muted mt-1.5 text-[12px] leading-[18px]">
        Optional analytics and session replay via Google Analytics and Statsig. The contact form is
        excluded. Change your choice anytime in the footer.{" "}
        <Link
          href="/privacy"
          className="text-brand-bright focus-visible:ring-brand-mid hover:text-foreground rounded-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          Privacy policy
        </Link>
      </p>
      <div className="border-brand-mid/15 mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t pt-2">
        {editing ? (
          <>
            <label
              className={`${styles.control} flex cursor-pointer items-center gap-2 text-[12px]`}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="focus-visible:ring-brand-mid focus-visible:ring-offset-background size-[16px] shrink-0 accent-(--brand-mid) focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              Optional analytics
            </label>
            <div className="ml-auto flex gap-1.5">
              <button
                type="button"
                aria-label="Save analytics preferences"
                onClick={() => save(enabled)}
                className={action}
              >
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className={action}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => save(true)} className={action}>
              Accept
            </button>
            <button type="button" onClick={() => save(false)} className={action}>
              Reject
            </button>
            <button type="button" onClick={() => setEditing(true)} className={action}>
              Preferences
            </button>
          </div>
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
