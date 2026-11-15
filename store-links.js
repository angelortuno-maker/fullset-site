// Change 285: the store buttons' one config. Every `a[data-store]` on the site takes its link from here; with no
// link (or no JavaScript) a button marked `data-hide-empty` stays hidden (no dead links, MSG-5951), and
// `data-store-fallback` ("Get the app") shows until one of the buttons has a link (334).
(function () {
  var LINKS = {
    // The App Store page (the official badge, MSG-5951 W3): Fullset 2.0.2 was approved on the App Store on Nov 14 and its
    // listing resolves publicly (MSG-6093; WL13). This one line shows the badge on every page.
    apple: 'https://apps.apple.com/app/fullset-workout-meal-log/id6818055502',
    // "Join the Android test": the Play closed test's opt-in link (MSG-5951 W3, MSG-5952), until Play production, then
    // the Play Store listing and its badge (WL1). This replaces Oct 19's "never a test track's join link": a non-tester
    // can't join, but the button says it's a test (the Architect, #597 6718723294).
    android: 'https://play.google.com/apps/testing/com.fullset.app',
  };
  // MSG-5951 W9: the coach web. Empty keeps "Coach login" and the /coaches dashboard button hidden. Set to the coach
  // web's production address once change 430's deploy is live (MSG-5977); app.thefullsetapp.com replaces it when its
  // DNS is set.
  var COACH_WEB_URL = 'https://fullset-coach.web.app';
  // W10 (layout shift): this file loads in <head>, not deferred, and fills each button the moment the parser adds it,
  // before the first paint. A deferred run unhid the badges after the page had painted, which pushed everything below
  // them down (Lighthouse CLS 0.18 on /, 0.26 on /coaches). Rules unchanged: a button with no link stays hidden.
  var SELECTOR = 'a[data-store], a[data-coach-web], [data-store-fallback]';
  var anyShown = false;
  function hideFallbacks() {
    // Change 334 (MSG-5711): "Get the app" stands in for the store buttons until one of them has a link.
    var fallbacks = document.querySelectorAll('[data-store-fallback]');
    for (var j = 0; j < fallbacks.length; j++) fallbacks[j].hidden = anyShown;
  }
  function apply(el) {
    if (el.hasAttribute('data-store')) {
      var url = LINKS[el.getAttribute('data-store')];
      if (!url) return;
      el.href = url;
      el.rel = 'noopener';
      // Change 334: a `data-hide-empty` button ships hidden (so with no JavaScript too) and shows once its store has a link.
      if (el.hasAttribute('data-hide-empty')) {
        el.hidden = false;
        if (!anyShown) {
          anyShown = true;
          hideFallbacks();
        }
      }
    } else if (el.hasAttribute('data-coach-web')) {
      if (COACH_WEB_URL) {
        el.href = COACH_WEB_URL;
        el.hidden = false;
      }
    } else if (el.hasAttribute('data-store-fallback')) {
      el.hidden = anyShown;
    }
  }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches(SELECTOR)) apply(node);
    var found = node.querySelectorAll(SELECTOR);
    for (var i = 0; i < found.length; i++) apply(found[i]);
  }
  // Observer callbacks run before the browser paints, so each button is filled as the page arrives.
  var observer = new MutationObserver(function (records) {
    for (var r = 0; r < records.length; r++) for (var n = 0; n < records[r].addedNodes.length; n++) scan(records[r].addedNodes[n]);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  // A last full pass once the page is parsed, then stop watching (also covers a page that loads this file late).
  function finish() {
    observer.disconnect();
    scan(document.body);
    hideFallbacks();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finish);
  else finish();
})();
