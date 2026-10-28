"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, SlidersHorizontal } from "lucide-react";
import {
  PREFERENCES_EVENT,
  saveAnalyticsConsent,
  useAnalyticsConsent,
} from "@/lib/analytics-consent";
import styles from "./analytics-preferences.module.css";

// Accept and Reject share one size and stay equally reachable; only the confirming action is
// filled with the brand gradient.
const action = styles.action;
const primary = `${styles.action} ${styles.primary}`;

export function AnalyticsPreferences() {
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const id = useId();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    const open = () => {
      setEnabled(false);
      setEditing(true);
    };
    window.addEventListener(PREFERENCES_EVENT, open);
    return () => window.removeEventListener(PREFERENCES_EVENT, open);
  }, []);

  // Publishes how far the panel reaches up from the viewport bottom, so other fixed controls
  // (Scroll to top) can sit above it instead of underneath. Measured without the entrance
  // transform, and cleared when the panel closes.
  const trackInset = useCallback((panel: HTMLElement | null) => {
    if (!panel) return;
    const root = document.documentElement;
    const update = () => {
      const inset = panel.offsetHeight + parseFloat(getComputedStyle(panel).bottom);
      root.style.setProperty("--consent-inset", `${inset}px`);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(panel);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty("--consent-inset");
    };
  }, []);

  if (
    !process.env.NEXT_PUBLIC_GTAG_ID ||
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
      ref={trackInset}
      role="region"
      aria-label="Cookie preferences"
      aria-describedby={`${id}-copy`}
      className={styles.panel}
    >
      <header className={styles.header}>
        <span aria-hidden className={styles.badge}>
          <Cookie className={styles.badgeIcon} />
        </span>
        <div className={styles.heading}>
          <p aria-hidden className={styles.eyebrow}>
            {"// Privacy"}
          </p>
          <h2 className={styles.title}>Your analytics choice</h2>
        </div>
      </header>

      <p id={`${id}-copy`} className={styles.copy}>
        Google Analytics cookies measure visits, only with your consent. Nothing loads until you
        choose; change it anytime from Cookie settings in the footer.{" "}
        <Link href="/privacy" className={styles.privacyLink}>
          Privacy policy
        </Link>
      </p>

      {editing && (
        // The whole row toggles; the name stays the title alone, with the hint as description.
        <label className={styles.option}>
          <span className={styles.optionText}>
            <span id={`${id}-analytics`} className={styles.optionTitle}>
              Optional analytics
            </span>
            <span id={`${id}-analytics-hint`} className={styles.optionHint}>
              Google Analytics 4 · visit measurement
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled}
            aria-labelledby={`${id}-analytics`}
            aria-describedby={`${id}-analytics-hint`}
            onChange={(event) => setEnabled(event.target.checked)}
            className={styles.switch}
          />
        </label>
      )}

      <div className={styles.actions}>
        {editing ? (
          <>
            <button type="button" onClick={() => setEditing(false)} className={styles.manage}>
              Cancel
            </button>
            <button type="button" onClick={() => save(false)} className={action}>
              Reject
            </button>
            <button
              type="button"
              aria-label="Save analytics preferences"
              onClick={() => save(enabled)}
              className={primary}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className={styles.manage}>
              <SlidersHorizontal aria-hidden className={styles.manageIcon} />
              <span className={styles.manageLabel}>Preferences</span>
            </button>
            <button type="button" onClick={() => save(false)} className={action}>
              Reject
            </button>
            <button type="button" onClick={() => save(true)} className={primary}>
              Accept
            </button>
          </>
        )}
      </div>
    </section>
  );
}
