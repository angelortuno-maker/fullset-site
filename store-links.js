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
  var buttons = document.querySelectorAll('a[data-store]');
  var anyShown = false;
  for (var i = 0; i < buttons.length; i++) {
    var url = LINKS[buttons[i].getAttribute('data-store')];
    if (url) {
      buttons[i].href = url;
      buttons[i].rel = 'noopener';
      // Change 334: a `data-hide-empty` button ships hidden (so with no JavaScript too) and shows once its store has a link.
      if (buttons[i].hasAttribute('data-hide-empty')) {
        buttons[i].hidden = false;
        anyShown = true;
      }
    }
  }
  // Change 334 (MSG-5711): "Get the app" stands in for the store buttons until one of them has a link.
  var fallbacks = document.querySelectorAll('[data-store-fallback]');
  for (var j = 0; j < fallbacks.length; j++) fallbacks[j].hidden = anyShown;
  var coachLinks = document.querySelectorAll('a[data-coach-web]');
  for (var k = 0; k < coachLinks.length; k++) {
    if (COACH_WEB_URL) {
      coachLinks[k].href = COACH_WEB_URL;
      coachLinks[k].hidden = false;
    }
  }
})();
