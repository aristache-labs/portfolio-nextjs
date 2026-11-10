"use client";
import { useEffect, useRef } from "react";
import { INTRO_LINES, introFrame } from "./intro-timeline";
import styles from "./intro-curtain.module.css";

function dismissIntro() {
  const root = document.documentElement;
  root.removeAttribute("data-intro-active");
  root.removeAttribute("data-intro-start");
  root.setAttribute("data-intro-seen", "");
}

export function TerminalIntro() {
  const curtain = useRef<HTMLDivElement>(null);
  const terminal = useRef<HTMLDivElement>(null);
  const command = useRef<HTMLSpanElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const lines = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-intro-active")) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || location.hash) {
      dismissIntro();
      return;
    }
    const start = Number(root.getAttribute("data-intro-start")) || performance.now();
    let frame = 0;
    const draw = (now: number) => {
      if (!root.hasAttribute("data-intro-active")) return;
      const elapsed = (now - start) / 1000;
      const state = introFrame(elapsed);
      if (state.finished) {
        dismissIntro();
        return;
      }
      if (command.current) command.current.textContent = state.command;
      if (cursor.current) cursor.current.style.opacity = state.cursor ? "1" : "0";
      state.lines.forEach((opacity, index) => {
        const line = lines.current[index];
        if (line) {
          line.style.opacity = String(opacity);
          line.style.transform = `translateY(${(1 - opacity) * 5}px)`;
        }
      });
      if (terminal.current) {
        terminal.current.style.opacity = String(state.windowOpacity);
        terminal.current.style.transform = `translateY(${state.windowY}px) scale(${state.windowScale})`;
      }
      if (curtain.current) {
        curtain.current.style.opacity = String(state.curtainOpacity);
        curtain.current.style.clipPath = `inset(0 0 ${state.curtainClip}% 0)`;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") dismissIntro();
    };
    const onClick = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("a, button")) dismissIntro();
    };
    const onMotion = () => {
      if (motion.matches) dismissIntro();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    window.addEventListener("wheel", dismissIntro, { passive: true });
    window.addEventListener("touchmove", dismissIntro, { passive: true });
    window.addEventListener("hashchange", dismissIntro);
    motion.addEventListener("change", onMotion);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", dismissIntro);
      window.removeEventListener("touchmove", dismissIntro);
      window.removeEventListener("hashchange", dismissIntro);
      motion.removeEventListener("change", onMotion);
    };
  }, []);
  return (
    <>
      <div ref={curtain} aria-hidden="true" className={styles.curtain}>
        <div ref={terminal} className={styles.terminal}>
          <div className={styles.titlebar}>
            <span className={styles.dots}>
              <i />
              <i />
              <i />
            </span>
            <span>~/aristache/portfolio</span>
            <span className={styles.filetype}>TypeScript</span>
          </div>
          <div className={styles.body}>
            <div className={styles.prompt}>
              <span className={styles.path}>~/aristache</span>
              <span className={styles.chevron}>&#8250;</span>
              <span>
                <span ref={command} />
                <span ref={cursor} className={styles.cursor}>
                  &#9613;
                </span>
              </span>
            </div>
            <code className={styles.code}>
              {INTRO_LINES.map((line, index) => (
                <span
                  key={line}
                  ref={(node) => {
                    lines.current[index] = node;
                  }}
                  className={`${styles.line} ${index === INTRO_LINES.length - 1 ? styles.ready : ""}`}
                >
                  {index === INTRO_LINES.length - 1 && (
                    <span className={styles.check}>&#10003; </span>
                  )}
                  {line}
                </span>
              ))}
            </code>
          </div>
          <div className={styles.statusbar}>
            <span>ADRIAN CRISTACHE</span>
            <span>Infrastructure / Automation / Development</span>
          </div>
        </div>
      </div>
      <button type="button" className={styles.skip} onClick={dismissIntro}>
        Skip intro <span aria-hidden="true">&#8599;</span>
      </button>
    </>
  );
}
