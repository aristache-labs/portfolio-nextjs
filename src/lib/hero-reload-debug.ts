// Temporary development-only measurements for the physical iPhone reload issue.
export const HERO_RELOAD_DEBUG = `(() => {
  if (!/iPhone/i.test(navigator.userAgent) || location.pathname !== '/') return;
  const frames = [];
  const events = [];
  const start = performance.now();
  const id = Date.now();
  let previous = '';
  const box = node => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return [rect.top, rect.height].map(value => Math.round(value * 10) / 10);
  };
  const report = () => navigator.sendBeacon('/api/dev/hero-reload-debug', JSON.stringify({
    id, agent: navigator.userAgent, hash: location.hash,
    navigation: performance.getEntriesByType('navigation')[0]?.type,
    lastEvent: events.at(-1)?.type,
    frames, events
  }));
  for (const type of ['load', 'pageshow', 'resize', 'scroll']) {
    window.addEventListener(type, () => {
      if (performance.now() - start < 8000) events.push({ type, t: Math.round(performance.now() - start), y: scrollY });
    });
  }
  for (const type of ['pagehide', 'beforeunload']) window.addEventListener(type, () => {
    events.push({ type, t: Math.round(performance.now() - start), y: scrollY });
    report();
  });
  function sample() {
    const hero = document.getElementById('hero');
    const title = hero?.querySelector('h1');
    const state = {
      y: scrollY, innerWidth, innerHeight, screenHeight: screen.height,
      viewport: window.visualViewport ? [visualViewport.height, visualViewport.offsetTop, visualViewport.pageTop, visualViewport.scale] : null,
      hero: box(hero), title: box(title), content: box(title?.parentElement?.parentElement),
      poster: box(hero?.querySelector('picture')), fonts: document.fonts?.status,
      floor: hero ? getComputedStyle(hero).getPropertyValue('--portrait-screen-height') : null,
      expressive: matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches,
      transforms: [hero, title, title?.parentElement, title?.parentElement?.parentElement, document.body].map(node => node ? getComputedStyle(node).transform : null),
      animations: hero ? [...hero.getAnimations({ subtree: true })].map(animation => ({
        name: animation.animationName ?? null,
        state: animation.playState,
        tag: animation.effect?.target?.tagName,
        effect: animation.effect?.target?.className?.toString().slice(0, 120)
      })) : []
    };
    const key = JSON.stringify(state);
    if (key !== previous && frames.length < 160) {
      frames.push({ t: Math.round(performance.now() - start), ...state });
      previous = key;
    }
    if (performance.now() - start < 8000) requestAnimationFrame(sample);
    else report();
  }
  requestAnimationFrame(sample);
  setTimeout(report, 2000);
  setTimeout(report, 5000);
})();`;
