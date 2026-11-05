import styles from "./intro-curtain.module.css";

const SEEN_KEY = "aristache:intro";

/*
 * Runs while the parser reaches the curtain, before first paint. A repeat visit in the same tab
 * session hides the curtain at once. A first visit marks itself seen just after the curtain has
 * lifted, so returning to the homepage through client navigation does not replay it.
 */
const SESSION_SCRIPT = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem("${SEEN_KEY}")){d.setAttribute("data-intro-seen","");return}sessionStorage.setItem("${SEEN_KEY}","1")}catch(e){d.setAttribute("data-intro-seen","");return}setTimeout(function(){d.setAttribute("data-intro-seen","")},900)})()`;

/**
 * First-visit intro: the monogram resolves inside a drawn ring, then the curtain lifts off the
 * already-rendered page. Pure CSS, so it never waits on hydration and never delays content
 * underneath. Skipped for reduced motion and on repeat visits within the session.
 */
export function IntroCurtain() {
  return (
    <>
      <div aria-hidden className={styles.curtain}>
        <div className={styles.mark}>
          <svg className={styles.ring} viewBox="0 0 100 100" focusable="false">
            <circle cx="50" cy="50" r="47" pathLength="1" />
          </svg>
          {/* Tiny eager asset; the curtain is decorative, so plain img avoids the optimiser. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-no-text.webp" alt="" width={128} height={128} decoding="async" />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: SESSION_SCRIPT }} />
    </>
  );
}
