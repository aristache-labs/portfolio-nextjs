"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Quote } from "lucide-react";
import { createTravelGate } from "@/lib/section-navigation";
import responsiveCss from "./skills-responsive.module.css";
import quoteCss from "./skills-quote.module.css";
import terminalCss from "./skills-terminal.module.css";

const printAt = (seconds: number) => ({ "--t": `${seconds}s` }) as CSSProperties;

/** Terminal prompt card. The typing starts once, when the card first scrolls into view. */
export function SkillsTerminalQuote() {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.live = "";
      return;
    }
    const play = () => {
      node.dataset.live = "";
      observer.disconnect();
    };
    const gate = createTravelGate(node, play);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (gate.passing() || !entry?.isIntersecting) return;
        play();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      gate.dispose();
      observer.disconnect();
    };
  }, []);

  return (
    <blockquote
      ref={ref}
      className={`${responsiveCss.quote} ${quoteCss.glass} ${terminalCss.terminal}`}
    >
      <div className={terminalCss.frame}>
        <div className={terminalCss.screen}>
          <div aria-hidden className={terminalCss.bar}>
            <i />
            <i />
            <i />
          </div>
          <div className={terminalCss.body}>
            <span className={`${terminalCss.line} ${terminalCss.command}`}>
              <span className={terminalCss.typed}>npm create quote</span>
              <span aria-hidden className={terminalCss.caret} />
            </span>
            <span className={`${terminalCss.line} ${terminalCss.out}`} style={printAt(2.3)}>
              Tools evolve.
            </span>
            <span className={`${terminalCss.line} ${terminalCss.out}`} style={printAt(2.8)}>
              Problem-solving endures.
            </span>
            <span aria-hidden className={`${terminalCss.line} ${terminalCss.prompt}`}>
              <span className={terminalCss.caret} />
            </span>
          </div>
        </div>
      </div>
      <Quote aria-hidden className={`${terminalCss.icon} ${terminalCss.openingIcon}`} />
      <Quote aria-hidden className={`${terminalCss.icon} ${terminalCss.closingIcon}`} />
    </blockquote>
  );
}
