(function () {
  try {
    var portrait = matchMedia(
      "(max-width: 767px) and (orientation: portrait) and (max-aspect-ratio: 3/4)",
    ).matches;
    var pending = [];
    var waiting = portrait;
    function apply(el) {
      var url = el.getAttribute("data-poster-src");
      if (!url) return;
      el.removeAttribute("data-poster-src");
      if (el.tagName === "LINK") el.setAttribute("href", url);
      else el.setAttribute("src", url);
    }
    function take(el) {
      if (!el || el.nodeType !== 1 || !el.hasAttribute("data-poster-src")) return;
      if (waiting) pending.push(el);
      else apply(el);
    }
    function scan(node) {
      take(node);
      if (node.querySelectorAll) node.querySelectorAll("[data-poster-src]").forEach(take);
    }
    function release() {
      if (!waiting) return;
      waiting = false;
      pending.forEach(apply);
      pending = [];
    }
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var nodes = records[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) scan(nodes[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
    if (!portrait) return;
    function finished(entry) {
      return entry.name.indexOf("/media/hero-portrait.webp") !== -1 && entry.responseEnd > 0;
    }
    var seen = performance.getEntriesByType("resource");
    for (var i = 0; i < seen.length; i++) {
      if (finished(seen[i])) {
        release();
        return;
      }
    }
    try {
      var observer = new PerformanceObserver(function (list) {
        var items = list.getEntries();
        for (var k = 0; k < items.length; k++) {
          if (finished(items[k])) {
            observer.disconnect();
            release();
          }
        }
      });
      observer.observe({ type: "resource", buffered: true });
    } catch (error) {
      release();
    }
    setTimeout(release, 4000);
  } catch (error) {}
})();
