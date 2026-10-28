"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, SlidersHorizontal } from "lucide-react";
import {
  PREFERENCES_EVENT,
  readConsent,
  saveAnalyticsConsent,
  useAnalyticsConsent,
} from "@/lib/analytics-consent";
import { setConsentInset } from "@/lib/consent-inset";
import styles from "./analytics-preferences.module.css";

// Accept and Reject share the same styling. Only Save uses the brand gradient.
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

  const checkbox = useRef<HTMLInputElement>(null);
  const preferencesButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const focusOnOpen = useRef(false);

  const close = useCallback(() => {
    setEditing(false);
    requestAnimationFrame(() => {
      const target = opener.current?.isConnected ? opener.current : preferencesButton.current;
      target?.focus({ preventScroll: true });
      opener.current = null;
    });
  }, []);

  useEffect(() => {
    if (editing && ready && focusOnOpen.current) {
      checkbox.current?.focus({ preventScroll: true });
      focusOnOpen.current = false;
    }
    if (!editing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, ready, close]);

  useEffect(() => {
    const open = (event: Event) => {
      const source = (event as CustomEvent<{ opener?: HTMLElement }>).detail?.opener;
      opener.current =
        source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      focusOnOpen.current = true;
      setEnabled(readConsent() === "accepted");
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
    const update = () => {
      const inset = panel.offsetHeight + (parseFloat(getComputedStyle(panel).bottom) || 0);
      setConsentInset(inset);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(panel);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      setConsentInset(0);
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
    close();
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
        <Link href="/privacy" prefetch={false} className={styles.privacyLink}>
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
            ref={checkbox}
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
            <button type="button" onClick={close} className={styles.manage}>
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
            <button
              ref={preferencesButton}
              type="button"
              onClick={() => setEditing(true)}
              className={styles.manage}
            >
              <SlidersHorizontal aria-hidden className={styles.manageIcon} />
              <span className={styles.manageLabel}>Preferences</span>
            </button>
            <button type="button" onClick={() => save(false)} className={action}>
              Reject
            </button>
            <button type="button" onClick={() => save(true)} className={action}>
              Accept
            </button>
          </>
        )}
      </div>
    </section>
  );
}
