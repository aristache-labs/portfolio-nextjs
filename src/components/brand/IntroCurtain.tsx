import { TerminalIntro } from "./TerminalIntro";

// Runs before the first paint. A hard deadline also dismisses the curtain if hydration fails.
const SESSION_SCRIPT = `(function(){var d=document.documentElement;try{if(location.hash||window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("aristache:intro")){d.setAttribute("data-intro-seen","");return}sessionStorage.setItem("aristache:intro","1");d.setAttribute("data-intro-active","");d.setAttribute("data-intro-start",String(performance.now()));setTimeout(function(){d.removeAttribute("data-intro-active");d.removeAttribute("data-intro-start");d.setAttribute("data-intro-seen","")},6500)}catch(e){d.removeAttribute("data-intro-active");d.setAttribute("data-intro-seen","")}})()`;

/** One decorative introduction per tab session, over the already-rendered homepage. */
export function IntroCurtain() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SESSION_SCRIPT }} />
      <TerminalIntro />
    </>
  );
}
